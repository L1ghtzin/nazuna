import { join } from 'path';
import { loadGroupData, persistGroupData, isUserWhitelisted as isUserWhitelistedCore } from '../utils/groupManager.js';
import { GRUPOS_DIR } from '../utils/paths.js';
import { NUMERODONO } from '../config.js';
import { MESSAGES } from '../utils/messages.js';
import { sendCleanChat } from '../utils/cleanChat.js';
import { extractParticipantId } from '../utils/messageHelpers.js';
import {
    getBotId,
    getLidFromJidCached,
    isValidJid,
    convertIdsToLid
} from '../utils/helpers.js';

const DEBUG_MODE = process.env.DEBUG_MODE === 'true';

// Helper de log para depuração silenciosa por padrão
function debugLog(...args) {
    if (DEBUG_MODE) {
        console.log(...args);
    }
}

// ── Constantes & Caches ──────────────────────────────────────────

const STEALTH_WINDOW_MS = 4_000; // 4 segundos
const DEFAULT_ACTION = 'banir';
const METADATA_CACHE_TTL_MS = 30_000;

const userStates = new Map(); // key -> { normalMessages: number, stealthTimestamps: number[] }
const metadataCache = new Map(); // groupJid -> { timestamp, data }
const metadataPromiseCache = new Map(); // groupJid -> Promise

function stateKey(groupId, sender) {
    return `${groupId}:${sender}`;
}

function getState(groupId, sender) {
    const key = stateKey(groupId, sender);
    const current = userStates.get(key);
    if (current) return current;

    const created = { normalMessages: 0, stealthTimestamps: [] };
    userStates.set(key, created);
    return created;
}

// ── Helpers ─────────────────────────────────────────────────────

function normalizeId(id) {
    return typeof id === 'string' ? id.replace(/:\d+(?=@)/, '') : '';
}

function getBaseId(id) {
    return normalizeId(id).split('@')[0];
}

function isNoSessionDecryptMessage(info) {
    // Se tem mensagem normal, não é stealth
    if (info.message && Object.keys(info.message).length > 0) {
        return false;
    }
    
    // Verifica se é messageStubType 2 (CIPHERTEXT)
    const isStubType2 = info.messageStubType === 2;
    
    // Verifica se messageStubParameters indica falha de decriptação
    const hasDecryptError = info.messageStubParameters?.some?.(param => 
        typeof param === 'string' && (
            param.toLowerCase().includes('decrypt') ||
            param.toLowerCase().includes('session') ||
            param.toLowerCase().includes('cipher') ||
            param.toLowerCase().includes('no session')
        )
    ) || false;
    
    return isStubType2 || hasDecryptError;
}

async function isAdmin(ChainySock, groupMetadata, participantLid) {
    if (!groupMetadata?.participants) return false;
    const adminParticipants = groupMetadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
    const adminIds = adminParticipants.map(extractParticipantId).filter(Boolean);
    const adminLids = await convertIdsToLid(ChainySock, adminIds);
    return adminLids.includes(participantLid);
}

async function isGroupOwner(ChainySock, groupMetadata, participantLid) {
    if (!groupMetadata?.owner) return false;
    const ownerLid = await getLidFromJidCached(ChainySock, groupMetadata.owner);
    return participantLid === ownerLid;
}

export function getStealthConfig(groupData) {
    if (!groupData.antistealthConfig) {
        groupData.antistealthConfig = {
            action: DEFAULT_ACTION,
            limit: 3,
            stats: { detected: 0, banned: 0, closed: 0 }
        };
    }
    const cfg = groupData.antistealthConfig;
    cfg.action = cfg.action || DEFAULT_ACTION;
    cfg.limit = Number.isInteger(cfg.limit) && cfg.limit > 0 ? cfg.limit : 3;
    cfg.stats = cfg.stats || { detected: 0, banned: 0, closed: 0 };
    return cfg;
}

function parseAction(actionStr, limitVal) {
    const action = (actionStr || DEFAULT_ACTION).toLowerCase();
    const result = { 
        banir: false, 
        fechar: false, 
        avisar: false, 
        tempo: 0, 
        limite: typeof limitVal === 'number' && limitVal > 0 ? limitVal : 3 
    };

    if (action === 'fechar' || action === '2') {
        result.fechar = true;
        result.tempo = 5;
    } else if (action === 'avisar' || action === '3') {
        result.avisar = true;
    } else {
        result.banir = true;
    }

    return result;
}

export function describeAction(actionStr) {
    const action = (actionStr || DEFAULT_ACTION).toLowerCase();
    if (action === 'fechar' || action === '2') return '🔒 Fechar o grupo por 5 minutos';
    if (action === 'avisar' || action === '3') return '📢 Apenas avisar o dono do bot';
    return '🚫 Banir o infrator imediatamente';
}

export function isValidAction(val) {
    return ['banir', '1', 'fechar', '2', 'avisar', '3'].includes(val.toLowerCase());
}

export function hasActiveStealthTimer(from) {
    return false;
}

export function clearActiveStealthTimer(from) {
    return false;
}

function isWhitelistedForAntiStealth(groupData, identityLid) {
    if (isUserWhitelistedCore(groupData, identityLid, 'antistealth')) return true;

    const whitelistEntry = groupData?.adminWhitelist?.[identityLid];
    if (!whitelistEntry) return false;
    if (!Array.isArray(whitelistEntry.antis)) return true;

    const normalizedAntis = whitelistEntry.antis.map(anti => String(anti).toLowerCase().trim());
    return normalizedAntis.some(anti => ['antistealth', 'anti-stealth', '*', 'all', 'todos'].includes(anti));
}

// ── Execução de Ações ───────────────────────────────────────────

async function fetchGroupMetadata(ChainySock, groupJid) {
    const cached = metadataCache.get(groupJid);
    if (cached && Date.now() - cached.timestamp < METADATA_CACHE_TTL_MS) {
        return cached.data;
    }

    if (metadataPromiseCache.has(groupJid)) {
        return metadataPromiseCache.get(groupJid);
    }

    const promise = (async () => {
        try {
            const metadata = await ChainySock.groupMetadata(groupJid);
            const owner = metadata?.owner 
                || metadata?.participants?.find(p => p.admin === 'superadmin')?.id
                || null;
            const data = {
                groupMetadata: metadata,
                groupName: metadata?.subject || groupJid,
                groupOwner: owner
            };
            metadataCache.set(groupJid, { timestamp: Date.now(), data });
            return data;
        } catch (e) {
            console.warn('[ANTI-STEALTH] Falha ao buscar metadata do grupo:', e.message);
            if (cached?.data) return cached.data;
            return { groupMetadata: null, groupName: groupJid, groupOwner: null };
        } finally {
            metadataPromiseCache.delete(groupJid);
        }
    })();

    metadataPromiseCache.set(groupJid, promise);
    return promise;
}

async function removeParticipantWithFallback(ChainySock, groupJid, participantLid) {
    try {
        await ChainySock.groupParticipantsUpdate(groupJid, [participantLid], 'remove');
        return true;
    } catch (error) {
        debugLog(`[ANTI-STEALTH] Falha ao remover ${participantLid}: ${error.message}`);
    }
    return false;
}

async function executeAction(ChainySock, groupJid, participantLid, config, metadataInfo) {
    debugLog(`[ANTI-STEALTH] === executeAction INICIADO ===`);
    debugLog(`[ANTI-STEALTH] participant: ${participantLid}, action: ${config.action}`);

    const flags = parseAction(config.action, config.limit);
    const userName = getBaseId(participantLid);
    
    const { groupName, groupOwner } = metadataInfo;
    const mentions = [participantLid];
    
    const actionParts = [];
    if (flags.banir) actionParts.push('removido(a) do grupo');
    if (flags.fechar) {
        actionParts.push(flags.tempo > 0 ? `o grupo foi fechado por ${flags.tempo} minutos` : 'o grupo foi fechado');
    }
    
    const actionText = actionParts.length > 0 ? actionParts.join(' e ') : 'uma ação de segurança foi tomada';
    
    let groupMsg = MESSAGES.middleware.antiStealth.alert(userName, actionText);

    if (flags.avisar && groupOwner) {
        const ownerName = groupOwner.split('@')[0];
        mentions.push(groupOwner);
        groupMsg += MESSAGES.middleware.antiStealth.alertOwnerWarning(ownerName);
    }
    groupMsg += MESSAGES.middleware.antiStealth.alertFooter;

    // Envia mensagem de alerta no grupo
    await ChainySock.sendMessage(groupJid, { text: groupMsg, mentions }).catch(() => {});

    if (flags.fechar) {
        config.stats.closed++;
        await ChainySock.groupSettingUpdate(groupJid, 'announcement').catch(() => {});

        // Reabertura automática após 5 minutos
        setTimeout(async () => {
            try {
                await ChainySock.groupSettingUpdate(groupJid, 'not_announcement');
                await ChainySock.sendMessage(groupJid, { 
                    text: MESSAGES.middleware.antiStealth.periodEnded(flags.tempo)
                });
            } catch (e) {
                console.error(`[ANTI-STEALTH] Erro ao reabrir ${groupName}:`, e.message);
            }
        }, flags.tempo * 60 * 1000);
    }

    if (flags.banir) {
        config.stats.banned++;
        await removeParticipantWithFallback(ChainySock, groupJid, participantLid);
        // Executa limpeza de chat após banimento por stealth
        await sendCleanChat({ socket: ChainySock, remoteJid: groupJid }).catch(() => {});
    }

    // Notifica dono do bot
    if (flags.avisar && NUMERODONO) {
        const donoJid = `${NUMERODONO}@s.whatsapp.net`;
        const acoesFeitas = [];
        if (flags.banir) acoesFeitas.push('🚫 Banido');
        if (flags.fechar) acoesFeitas.push(flags.tempo > 0 ? `🔒 Grupo fechado por ${flags.tempo}m` : '🔒 Grupo fechado');
        
        try {
            await ChainySock.sendMessage(donoJid, {
                text: MESSAGES.middleware.antiStealth.ownerNotification(groupName, userName, acoesFeitas.join(' | ') || 'Nenhuma'),
                mentions: [participantLid]
            });
        } catch (e) {
            console.warn('[ANTI-STEALTH] Falha ao notificar dono:', e.message);
        }
    }

    debugLog(`[ANTI-STEALTH] === executeAction CONCLUÍDO ===`);
}

// ── Funções Públicas ─────────────────────────────────────────────

export function countNormalGroupMessage(groupId, sender) {
    const state = getState(groupId, sender);
    state.normalMessages += 1;
    state.stealthTimestamps = [];
}

export async function processAntiStealth(ChainySock, m) {
    if (m.type !== 'notify' && m.type !== 'append') return;
    
    const botIdPrefix = ChainySock.user?.id?.split(':')[0];
    
    for (const info of m.messages) {
        if (info.key?.fromMe || !info.key?.remoteJid?.endsWith('@g.us')) continue;
        
        const participant = info.key.participant || info.participant;
        const groupJid = info.key.remoteJid;
        
        if (!participant) continue;
        
        // Verifica se é stealth
        const hasDecryptionFailure = isNoSessionDecryptMessage(info);

        if (!hasDecryptionFailure) {
            // Mensagem decodificada com sucesso - conta como normal e reseta strikes
            if (info.message) {
                const participantLid = await getLidFromJidCached(ChainySock, participant);
                countNormalGroupMessage(groupJid, participantLid);
            }
            continue;
        }

        try {
            const groupFilePath = join(GRUPOS_DIR, `${groupJid}.json`);
            const groupData = await loadGroupData(true, groupJid, groupFilePath, 'Grupo');

            if (groupData?.antistealth) {
                const participantLid = await getLidFromJidCached(ChainySock, participant);
                
                // Pula bot
                if (botIdPrefix && participantLid.startsWith(botIdPrefix)) continue;

                // Pula dono do bot
                if (NUMERODONO) {
                    const ownerJid = `${NUMERODONO}@s.whatsapp.net`;
                    const ownerLid = await getLidFromJidCached(ChainySock, ownerJid);
                    if (participantLid === ownerLid || participantLid === ownerJid) continue;
                }

                const metadataInfo = await fetchGroupMetadata(ChainySock, groupJid);

                // Pula whitelist configurada no grupo
                if (isWhitelistedForAntiStealth(groupData, participantLid)) continue;

                // Pula admin do grupo
                const participantIsAdmin = await isAdmin(ChainySock, metadataInfo.groupMetadata, participantLid);
                if (participantIsAdmin) continue;

                // Pula dono do grupo
                const participantIsGroupOwner = await isGroupOwner(ChainySock, metadataInfo.groupMetadata, participantLid);
                if (participantIsGroupOwner) continue;

                // Threshold Check
                const config = getStealthConfig(groupData);
                const flags = parseAction(config.action, config.limit);
                const now = Date.now();
                const state = getState(groupJid, participantLid);

                // Filtra timestamps da janela de 4 segundos
                state.stealthTimestamps = state.stealthTimestamps.filter(t => now - t <= STEALTH_WINDOW_MS);
                state.stealthTimestamps.push(now);

                debugLog(`[ANTI-STEALTH DEBUG] Strikes na janela: ${state.stealthTimestamps.length}/${flags.limite}`);

                // Threshold: 2 se nunca mandou msg normal, ou o limite configurado (mínimo 2)
                const threshold = state.normalMessages === 0 ? 2 : Math.max(2, flags.limite);

                if (state.stealthTimestamps.length < threshold) {
                    continue; // Ainda não atingiu o limite para punir
                }

                // Punição Imediata!
                config.stats.detected++;
                state.stealthTimestamps = [];

                // Deleta a mensagem stealth
                if (info.key) {
                    await ChainySock.sendMessage(groupJid, { delete: info.key }).catch(() => {});
                }

                // Executa a punição
                await executeAction(ChainySock, groupJid, participantLid, config, metadataInfo);

                // Salva stats do grupo
                await persistGroupData(true, groupJid, groupFilePath, groupData);
            }
        } catch (e) {
            console.error(`[ANTI-STEALTH] Erro ao processar ${participant}:`, e?.message || e);
        }
    }
}

export async function processAntiStealthUpdate(ChainySock, updates) {
    // Com punições imediatas baseadas no fluxo simplificado (igual Misa),
    // não precisamos mais agendar e cancelar punições baseadas em retries atrasados.
}
