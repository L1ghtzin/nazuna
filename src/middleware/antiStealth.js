import { join } from 'path';
import { loadGroupData, persistGroupData, isUserWhitelisted as isUserWhitelistedCore } from '../utils/groupManager.js';
import { writeJsonFileAsync } from '../utils/asyncFs.js';
import { loadLevelingSafe } from '../utils/database/leveling.js';
import { GRUPOS_DIR } from '../utils/paths.js';
import { NUMERODONO } from '../config.js';
import { MESSAGES } from '../utils/messages.js';
import { sendCleanChat } from '../utils/cleanChat.js';
import { resolveParticipant } from '../utils/resolveParticipant.js';

const DEBUG_MODE = process.env.DEBUG_MODE === 'true';

// ── Constantes & Caches ──────────────────────────────────────────

const BAN_COOLDOWN_MS = 10_000;
const CACHE_CLEANUP_INTERVAL_MS = 60_000;
const DEFAULT_ACTION = 'avisar';
const STEALTH_STUB_TYPES = new Set([2]); // messageStubType 2 = CIPHERTEXT
const GROUP_ACTION_COOLDOWN_MS = 30_000;
const STRIKE_TTL_MS = 10 * 60 * 1000;
const RETRY_GRACE_MS = 45_000; // Aumentado de 15s para 45s - conexões ruins precisam de mais tempo para retry
const RETRY_GRACE_MAC_MS = 15_000; // MAC = sessão corrompida, retry raramente resolve. Grace period reduzido.
const RETRY_GRACE_HIGH_RETRY_MS = 10_000; // 2+ retries sem sucesso = sessão provavelmente irrecuperável.
const METADATA_CACHE_TTL_MS = 30_000;
const DECRYPTED_MESSAGES_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos
// Detecção de flood de stealth - permite punição imediata sem esperar grace period
// Flood = N stealths do mesmo usuário dentro da janela = ataque claro (não lag)
const FLOOD_WINDOW_MS = 10_000; // 10 segundos de janela
const FLOOD_THRESHOLD = 3; // 3+ stealths em 10s = flood confirmado
const NON_CONTENT_MESSAGE_KEYS = new Set([
    'messageContextInfo',
    'senderKeyDistributionMessage'
]);

const recentBans = new Map();
const activeTimers = new Map();
const userStrikes = new Map(); // key -> { count: number, lastTime: number }
const pendingPunishments = new Map(); // pendingKey -> { timer, groupJid, participant, msgId, strikeKey, userName }
const lastGroupAction = new Map(); // groupJid -> timestamp
const metadataCache = new Map(); // groupJid -> { timestamp, data }
const decryptedMessagesCache = new Map(); // msgId -> { timestamp, groupJid, participant } - mensagens que falharam mas depois decriptaram
const recentStealths = new Map(); // strikeKey -> [timestamp, timestamp, ...] - usado para detectar flood de stealth

// Limpeza de cache periódica
const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of recentBans) {
        if (now - timestamp > BAN_COOLDOWN_MS) recentBans.delete(key);
    }
    for (const [key, data] of userStrikes) {
        if (now - data.lastTime > STRIKE_TTL_MS) userStrikes.delete(key);
    }
    for (const [key, timestamp] of lastGroupAction) {
        if (now - timestamp > GROUP_ACTION_COOLDOWN_MS * 2) lastGroupAction.delete(key);
    }
    for (const [key, cached] of metadataCache) {
        if (now - cached.timestamp > METADATA_CACHE_TTL_MS * 2) metadataCache.delete(key);
    }
    // Limpa cache de mensagens decriptadas
    for (const [key, cached] of decryptedMessagesCache) {
        if (now - cached.timestamp > DECRYPTED_MESSAGES_CACHE_TTL_MS) decryptedMessagesCache.delete(key);
    }
    // Limpa cache de stealths recentes (flood detection)
    for (const [key, timestamps] of recentStealths) {
        const recent = timestamps.filter(t => now - t < FLOOD_WINDOW_MS * 3);
        if (recent.length === 0) {
            recentStealths.delete(key);
        } else {
            recentStealths.set(key, recent);
        }
    }
}, CACHE_CLEANUP_INTERVAL_MS);
if (cleanupInterval.unref) cleanupInterval.unref();

// ── Parsers e Validadores ──────────────────────────────────────

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

function isValidAction(val) {
    return ['banir', '1', 'fechar', '2', 'avisar', '3'].includes(val.toLowerCase());
}

function describeAction(actionStr) {
    const action = (actionStr || DEFAULT_ACTION).toLowerCase();
    if (action === 'fechar' || action === '2') return '🔒 Fechar o grupo por 5 minutos';
    if (action === 'avisar' || action === '3') return '📢 Apenas avisar o dono do bot';
    return '🚫 Banir o infrator imediatamente';
}

function getStealthConfig(groupData) {
    if (!groupData.antistealthConfig) {
        groupData.antistealthConfig = {
            action: DEFAULT_ACTION,
            limit: 3,
            stats: { detected: 0, banned: 0, closed: 0 }
        };
    }

    const config = groupData.antistealthConfig;
    config.action = config.action || DEFAULT_ACTION;
    config.limit = Number.isInteger(config.limit) && config.limit > 0 ? config.limit : 3;
    config.stats = config.stats && typeof config.stats === 'object' ? config.stats : {};
    config.stats.detected = Number.isFinite(config.stats.detected) ? config.stats.detected : 0;
    config.stats.banned = Number.isFinite(config.stats.banned) ? config.stats.banned : 0;
    config.stats.closed = Number.isFinite(config.stats.closed) ? config.stats.closed : 0;

    return config;
}

// ── Helpers de Detecção ─────────────────────────────────

function normalizeId(identifier) {
    return typeof identifier === 'string' ? identifier.replace(/:\d+(?=@)/, '') : '';
}

function getBaseId(identifier) {
    return normalizeId(identifier).split('@')[0];
}

function addIdentityCandidate(candidates, identifier) {
    const normalized = normalizeId(identifier);
    if (normalized) candidates.add(normalized);
}

function buildIdentity(participant, resolved = {}) {
    const candidates = new Set();
    addIdentityCandidate(candidates, participant);
    addIdentityCandidate(candidates, resolved.jid);
    addIdentityCandidate(candidates, resolved.lid);

    if (resolved.number) {
        addIdentityCandidate(candidates, `${resolved.number}@s.whatsapp.net`);
    }

    return {
        participant: normalizeId(participant),
        jid: normalizeId(resolved.jid),
        lid: normalizeId(resolved.lid),
        number: resolved.number || getBaseId(participant),
        resolved: Boolean(resolved.resolved),
        isLid: Boolean(resolved.isLid),
        candidates: [...candidates]
    };
}

async function resolveStealthIdentity(participant, ChainySock, groupMetadata) {
    const resolved = await resolveParticipant(participant, ChainySock, groupMetadata);
    return buildIdentity(participant, resolved);
}

function hasReadableMessageContent(message) {
    if (!message || typeof message !== 'object') return false;
    return Object.keys(message).some(key => !NON_CONTENT_MESSAGE_KEYS.has(key));
}

function hasCryptoFailureHint(info) {
    const params = [
        ...(Array.isArray(info.messageStubParameters) ? info.messageStubParameters : []),
        ...(Array.isArray(info.message?.messageStubParameters) ? info.message.messageStubParameters : [])
    ];

    return params.some(param => {
        const text = typeof param === 'string' ? param.toLowerCase() : '';
        return text.includes('decrypt') || text.includes('session') || text.includes('cipher') || text.includes('bad mac');
    });
}

/**
 * Extrai a classificação estruturada de falha de decriptação gerada pelo
 * patch do baileys (decode-wa-message.js). O patch escreve um JSON em
 * messageStubParameters[1] contendo category/code/isRecoverable/retryCount/messageAge.
 *
 * Esses dados permitem distinguir com precisão:
 * - NO_SESSION / NO_MESSAGE / BAD_KEY -> recuperação provável (lag)
 * - MAC -> sessão corrompida (potencial ataque stealth real)
 * - GENERIC -> tratado como recuperável por segurança
 *
 * @param {object} info mensagem/stub recebido do baileys
 * @returns {{category:string, isRecoverable:boolean, retryCount:number, messageAge:number, code:string} | null}
 */
function getStealthClassification(info) {
    const params = Array.isArray(info?.messageStubParameters)
        ? info.messageStubParameters
        : Array.isArray(info?.message?.messageStubParameters)
            ? info.message.messageStubParameters
            : null;
    if (!params || params.length < 2) return null;

    const raw = params[1];
    if (typeof raw !== 'string' || raw.charAt(0) !== '{') return null;

    try {
        const parsed = JSON.parse(raw);
        return {
            category: String(parsed.category || 'GENERIC').toUpperCase(),
            code: String(parsed.code || 'generic'),
            isRecoverable: typeof parsed.isRecoverable === 'boolean' ? parsed.isRecoverable : true,
            retryCount: Number.isFinite(parsed.retryCount) ? parsed.retryCount : 0,
            messageAge: Number.isFinite(parsed.messageAge) ? parsed.messageAge : 0
        };
    } catch {
        return null;
    }
}

function isDecryptionFailure(info) {
    if (info?.stealthMeta) return true;
    if (STEALTH_STUB_TYPES.has(info.messageStubType)) return true;
    if (info.messageStubType) return false;

    if (!hasReadableMessageContent(info.message)) {
        return hasCryptoFailureHint(info);
    }

    return false;
}

function findParticipantMetadata(groupMetadata, identity) {
    if (!groupMetadata?.participants?.length) return null;

    const candidateSet = new Set(identity.candidates);
    const baseSet = new Set(identity.candidates.map(getBaseId).filter(Boolean));

    return groupMetadata.participants.find(participantInfo => {
        const ids = [participantInfo.id, participantInfo.jid, participantInfo.lid]
            .map(normalizeId)
            .filter(Boolean);

        return ids.some(id => candidateSet.has(id) || baseSet.has(getBaseId(id)));
    }) || null;
}

function isAdminMetadata(participantInfo) {
    return participantInfo?.admin === 'admin' || participantInfo?.admin === 'superadmin';
}

function isGroupOwner(groupMetadata, identity) {
    const ownerId = normalizeId(groupMetadata?.owner);
    if (!ownerId) return false;

    const ownerBaseId = getBaseId(ownerId);
    return identity.candidates.some(candidate => candidate === ownerId || getBaseId(candidate) === ownerBaseId);
}

function isWhitelistedForAntiStealth(groupData, identity) {
    for (const candidate of identity.candidates) {
        if (isUserWhitelistedCore(groupData, candidate, 'antistealth')) return true;

        const whitelistEntry = groupData?.adminWhitelist?.[candidate];
        if (!whitelistEntry) continue;
        if (!Array.isArray(whitelistEntry.antis)) return true;

        const normalizedAntis = whitelistEntry.antis.map(anti => String(anti).toLowerCase().trim());
        if (normalizedAntis.some(anti => ['antistealth', 'anti-stealth', '*', 'all', 'todos'].includes(anti))) {
            return true;
        }
    }

    return false;
}

function shouldSkipParticipant(identity, botIdPrefix, groupData, groupMetadata) {
    if (!identity?.participant) return true;
    if (botIdPrefix && identity.candidates.some(candidate => candidate.startsWith(botIdPrefix))) return true;
    if (isWhitelistedForAntiStealth(groupData, identity)) return true;

    const participantInfo = findParticipantMetadata(groupMetadata, identity);
    if (isAdminMetadata(participantInfo) || isGroupOwner(groupMetadata, identity)) return true;

    return false;
}

function isOnCooldown(groupJid, participant) {
    const banKey = `${groupJid}:${participant}`;
    const lastBan = recentBans.get(banKey);
    return lastBan && Date.now() - lastBan < BAN_COOLDOWN_MS;
}

function registerCooldown(groupJid, participant) {
    recentBans.set(`${groupJid}:${participant}`, Date.now());
}

function getIdentityActionId(identity) {
    return identity.jid || identity.lid || identity.participant;
}

function getIdentityDisplayName(identity) {
    return identity.number || getBaseId(identity.jid || identity.lid || identity.participant);
}

function buildStrikeKey(groupJid, identity) {
    return `${groupJid}:${getIdentityActionId(identity)}`;
}

function buildPendingKey(groupJid, msgId, identity) {
    if (msgId) return `${groupJid}:${msgId}`;
    return `${groupJid}:${getIdentityActionId(identity)}:sem-id`;
}

function getBestMessageCount(levelingData, identity) {
    const users = levelingData?.users || {};
    return identity.candidates.reduce((highestCount, candidate) => {
        const candidateCount = Number(users[candidate]?.messages || 0);
        return Number.isFinite(candidateCount) ? Math.max(highestCount, candidateCount) : highestCount;
    }, 0);
}

async function removeParticipantWithFallback(ChainySock, groupJid, identity) {
    const targets = [];
    for (const candidate of [identity.participant, identity.jid, identity.lid]) {
        const normalized = normalizeId(candidate);
        if (normalized && !targets.includes(normalized)) targets.push(normalized);
    }

    for (const target of targets) {
        try {
            await ChainySock.groupParticipantsUpdate(groupJid, [target], 'remove');
            return true;
        } catch (error) {
            if (DEBUG_MODE) {
                console.log(`[ANTI-STEALTH] Falha ao remover ${target}: ${error.message}`);
            }
        }
    }

    return false;
}

// ── Lógica de Punição ──────────────────────────────────────────

async function fetchGroupMetadata(ChainySock, groupJid) {
    const cached = metadataCache.get(groupJid);
    if (cached && Date.now() - cached.timestamp < METADATA_CACHE_TTL_MS) {
        return cached.data;
    }

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
    }
}

function buildAlertMessage(flags, userName, participant, groupOwner) {
    const actionParts = [];
    if (flags.banir) actionParts.push('removido(a) do grupo');
    if (flags.fechar) {
        actionParts.push(flags.tempo > 0 ? `o grupo foi fechado por ${flags.tempo} minutos` : 'o grupo foi fechado');
    }
    
    const actionText = actionParts.length > 0 ? actionParts.join(' e ') : 'uma ação de segurança foi tomada';
    const mentions = [participant];
    
    let groupMsg = MESSAGES.middleware.antiStealth.alert(userName, actionText);

    if (flags.avisar && groupOwner) {
        const ownerName = groupOwner.split('@')[0];
        mentions.push(groupOwner);
        groupMsg += MESSAGES.middleware.antiStealth.alertOwnerWarning(ownerName);
    }

    groupMsg += MESSAGES.middleware.antiStealth.alertFooter;
    
    return { groupMsg, mentions };
}

async function notifyBotOwner(ChainySock, flags, groupName, userName, participant) {
    if (!flags.avisar || !NUMERODONO) return;
    
    const donoJid = `${NUMERODONO}@s.whatsapp.net`;
    const acoesFeitas = [];
    if (flags.banir) acoesFeitas.push('🚫 Banido');
    if (flags.fechar) acoesFeitas.push(flags.tempo > 0 ? `🔒 Grupo fechado por ${flags.tempo}m` : '🔒 Grupo fechado');
    
    try {
        await ChainySock.sendMessage(donoJid, {
            text: MESSAGES.middleware.antiStealth.ownerNotification(groupName, userName, acoesFeitas.join(' | ') || 'Nenhuma'),
            mentions: [participant]
        });
    } catch (e) {
        console.warn('[ANTI-STEALTH] Falha ao notificar dono:', e.message);
    }
}

function scheduleGroupReopening(ChainySock, groupJid, flags, groupName) {
    if (!flags.fechar || flags.tempo <= 0) return;
    
    if (activeTimers.has(groupJid)) clearTimeout(activeTimers.get(groupJid));

    const timerId = setTimeout(async () => {
        activeTimers.delete(groupJid);
        try {
            await ChainySock.groupSettingUpdate(groupJid, 'not_announcement');
            await ChainySock.sendMessage(groupJid, { 
                text: MESSAGES.middleware.antiStealth.periodEnded(flags.tempo)
            });
        } catch (e) {
            console.error(`[ANTI-STEALTH] Erro ao reabrir ${groupName}:`, e.message);
        }
    }, flags.tempo * 60 * 1000);

    if (timerId.unref) timerId.unref();
    activeTimers.set(groupJid, timerId);
}

function isGroupOnCooldown(groupJid) {
    const lastAction = lastGroupAction.get(groupJid);
    return lastAction && Date.now() - lastAction < GROUP_ACTION_COOLDOWN_MS;
}

function registerGroupAction(groupJid) {
    lastGroupAction.set(groupJid, Date.now());
}

async function executeAction(ChainySock, groupJid, identity, config, metadataInfo = null) {
    // Verifica cooldown do grupo para evitar spam de alertas
    const canRunGroupAction = !isGroupOnCooldown(groupJid);
    if (!canRunGroupAction) {
        if (DEBUG_MODE) {
            console.log(`[ANTI-STEALTH] ⏳ Grupo ${groupJid} em cooldown, pulando ação`);
        }
        // Continua para acoes individuais, como banimento, sem repetir alertas.
    }
    
    const flags = parseAction(config.action, config.limit);
    const userName = getIdentityDisplayName(identity);
    const mentionTarget = identity.jid || identity.lid || identity.participant;
    
    const { groupName, groupOwner } = metadataInfo || await fetchGroupMetadata(ChainySock, groupJid);
    const { groupMsg, mentions } = buildAlertMessage(flags, userName, mentionTarget, groupOwner);

    // Registra ação ANTES de executar para evitar race conditions
    if (canRunGroupAction) {
        registerGroupAction(groupJid);

        // Envia mensagem de alerta
        await ChainySock.sendMessage(groupJid, { text: groupMsg, mentions }).catch(() => {});

        if (flags.fechar) {
            config.stats.closed++;
            await ChainySock.groupSettingUpdate(groupJid, 'announcement').catch(() => {});
        }
    }

    if (flags.banir) {
        config.stats.banned++;
        await removeParticipantWithFallback(ChainySock, groupJid, identity);
        // Executa limpeza de chat após banimento por stealth
        await sendCleanChat({ socket: ChainySock, remoteJid: groupJid }).catch(() => {});
    }

    if (canRunGroupAction) {
        await notifyBotOwner(ChainySock, flags, groupName, userName, mentionTarget);
        scheduleGroupReopening(ChainySock, groupJid, flags, groupName);
    }

    if (DEBUG_MODE) {
        console.log(`[ANTI-STEALTH] 🛡️ [${groupName}] Ação executada contra @${userName}`);
    }
}

async function executePaymentAction(ChainySock, groupJid, participant) {
    try {
        const userName = participant.split('@')[0];
        const { groupName } = await fetchGroupMetadata(ChainySock, groupJid);

        // 1. Fecha o grupo
        await ChainySock.groupSettingUpdate(groupJid, 'announcement').catch(e => console.error('Erro ao fechar o grupo:', e.message));

        // 2. Remove o participante
        await ChainySock.groupParticipantsUpdate(groupJid, [participant], 'remove').catch(e => console.error('Erro ao banir:', e.message));

        // Envia mensagem de alerta
        const msg = MESSAGES.middleware.antiPaymentCmd.groupAlert(userName);
        await ChainySock.sendMessage(groupJid, { text: msg, mentions: [participant] }).catch(() => {});

        // 3. Executa a limpeza do chat
        await sendCleanChat({ socket: ChainySock, remoteJid: groupJid }).catch(e => console.error('Erro ao limpar chat:', e.message));

        // 4. Reabre o grupo
        await ChainySock.groupSettingUpdate(groupJid, 'not_announcement').catch(e => console.error('Erro ao abrir o grupo:', e.message));

        if (NUMERODONO) {
            const donoJid = `${NUMERODONO}@s.whatsapp.net`;
            const alertOwner = MESSAGES.middleware.antiPaymentCmd.ownerAlert(groupName, userName);
            await ChainySock.sendMessage(donoJid, { text: alertOwner, mentions: [participant] }).catch(() => {});
        }
    } catch (e) {
        console.error('[ANTI-PAYMENT] Erro ao executar ação de segurança:', e.message);
    }
}

// ── Controle de Eventos de Mensagem ─────────────────────────────

/**
 * Registra que uma mensagem foi decriptada com sucesso (veio via retry ou messages.update)
 * Isso permite cancelar punições pendentes mesmo que o evento chegue depois.
 */
function registerDecryptedMessage(msgId, groupJid, participant) {
    if (!msgId || !groupJid) return;
    decryptedMessagesCache.set(msgId, {
        timestamp: Date.now(),
        groupJid,
        participant
    });
}

/**
 * Verifica se uma mensagem já foi decriptada com sucesso anteriormente
 */
function wasMessageDecrypted(msgId) {
    if (!msgId) return false;
    return decryptedMessagesCache.has(msgId);
}

/**
 * Registra um evento stealth recente e detecta padrão de flood
 * Retorna true se detectar flood (N stealths em X segundos do mesmo usuário)
 * Flood = ataque claro, não precisa esperar grace period
 */
function recordStealthAndDetectFlood(strikeKey) {
    const now = Date.now();
    let timestamps = recentStealths.get(strikeKey) || [];
    
    // Filtra apenas eventos dentro da janela de flood
    timestamps = timestamps.filter(t => now - t < FLOOD_WINDOW_MS);
    timestamps.push(now);
    recentStealths.set(strikeKey, timestamps);
    
    const isFlood = timestamps.length >= FLOOD_THRESHOLD;
    if (isFlood && DEBUG_MODE) {
        console.log(`[ANTI-STEALTH] 🌊 FLOOD DETECTADO: ${timestamps.length} stealths em ${FLOOD_WINDOW_MS/1000}s`);
    }
    return isFlood;
}

/**
 * Cancela punição pendente quando uma mensagem é decriptada via retry
 * CORREÇÃO: Agora busca por msgId em vez de chave composta incorreta
 */
function handleResolvedLag(msgId, groupJid) {
    if (!msgId || !groupJid) return;
    
    // Registra que esta mensagem foi decriptada
    registerDecryptedMessage(msgId, groupJid, null);
    
    // Busca pending punishment por msgId (não por chave composta)
    let foundPending = null;
    let foundKey = null;
    
    for (const [key, pending] of pendingPunishments.entries()) {
        if (pending.msgId === msgId && pending.groupJid === groupJid) {
            foundPending = pending;
            foundKey = key;
            break;
        }
    }
    
    if (!foundPending) {
        if (DEBUG_MODE) {
            console.log(`[ANTI-STEALTH] 🟢 Mensagem ${msgId.slice(-6)} decriptada (sem punição pendente)`);
        }
        return;
    }
    
    // Cancela o timer e remove a punição pendente
    clearTimeout(foundPending.timer);
    pendingPunishments.delete(foundKey);
    
    // Reduz strike se existir
    const strikes = userStrikes.get(foundPending.strikeKey);
    if (strikes && strikes.count > 0) {
        strikes.count = Math.max(0, strikes.count - 1);
        if (strikes.count === 0) {
            userStrikes.delete(foundPending.strikeKey);
        }
    }
    
    const participant = foundPending.participant || foundPending.userName || '';
    
    if (DEBUG_MODE) {
        console.log(`[ANTI-STEALTH] 🟢 FALSO POSITIVO EVITADO! Mensagem de @${participant.split('@')[0]} decriptada via retry (Era apenas Lag). Punição cancelada.`);
    }
}

async function processStealthDetection(ChainySock, msgId, groupJid, identity, config, groupData, groupFilePath, metadataInfo, classification) {
    const flags = parseAction(config.action, config.limit);
    const strikeKey = buildStrikeKey(groupJid, identity);
    const participant = identity.participant;
    const userName = getIdentityDisplayName(identity);
    const pendingKey = buildPendingKey(groupJid, msgId, identity);
    
    // Leitura do contador de mensagens (Leveling)
    const levelingData = loadLevelingSafe();
    const messageCount = getBestMessageCount(levelingData, identity);

    // --- CLASSIFICAÇÃO ESTRUTURADA DE FALHA (patch baileys) ---
    // category MAC = sessão corrompida (potencial ataque stealth real)
    // category NO_SESSION/NO_MESSAGE/BAD_KEY/GENERIC = recuperável (lag)
    const stealthCategory = classification?.category || 'GENERIC';
    const stealthIsRecoverable = classification ? classification.isRecoverable : true;
    const stealthRetryCount = classification?.retryCount || 0;

    // MAC = verificação de integridade falhou. A mensagem NUNCA vai decriptar
    // via retry (a sessão está definitivamente fora de sincronia). Em contas
    // novas/suspeitas isso é ataque stealth clássico. Não há motivo para aguardar
    // grace period, pois o retry nunca resolverá.
    const isMacAttack = stealthCategory === 'MAC' && !stealthIsRecoverable;

    // Conta genuinamente nova sem sessão estabelecida = lag esperado na primeira
    // mensagem. Não deve ser tratada como ataque (evita banir quem acabou de entrar).
    const isNewAccountLag = stealthCategory === 'NO_SESSION' || stealthCategory === 'NO_MESSAGE';

    // Conta nova com falha NÃO classificada como lag (MAC, BAD_KEY ou GENERIC em
    // conta sem histórico) = alto risco. Reduz o grace period drasticamente pois
    // retries repetidos sem sucesso indicam sessão irrecuperável.
    const isSuspectNewAccount = messageCount < 5 && !isNewAccountLag;

    if (DEBUG_MODE && classification) {
        console.log(`[ANTI-STEALTH] 🔍 Falha classificada: category=${stealthCategory} recoverable=${stealthIsRecoverable} retryCount=${stealthRetryCount} age=${classification.messageAge}s @${userName}`);
    }

    // --- SISTEMA DE PREVENÇÃO DE FALSOS POSITIVOS ---
    // Membros que já conversam bastante costumam ter problemas reais de criptografia do WhatsApp.
    // Para falhas recuperáveis (NO_SESSION), membros ativos quase sempre resolvem via retry.
    if (!isMacAttack && messageCount >= 30) {
        if (DEBUG_MODE) {
            console.log(`[ANTI-STEALTH] 🟢 Falso Positivo Evitado: @${userName} é membro ativo (${messageCount} msgs, ${stealthCategory}). Ignorando mensagem indecriptável.`);
        }
        for (const [id, p] of pendingPunishments.entries()) {
            if (p.strikeKey === strikeKey && p.groupJid === groupJid) {
                clearTimeout(p.timer);
                pendingPunishments.delete(id);
            }
        }
        return;
    }

    // MAC attack (sessão corrompida) OU conta nova suspeita com falha não-lag.
    // Ambos os casos justificam punição imediata: integridade quebrada nunca
    // resolve via retry, e conta sem histórico com falha anômala é alto risco.
    if (isMacAttack && messageCount < 30) {
        if (DEBUG_MODE) {
            console.log(`[ANTI-STEALTH] 🔴 Ataque Stealth (MAC) de conta suspeita: @${userName} tem ${messageCount} msgs e falha de integridade. Punição Imediata!`);
        }
        
        for (const [id, p] of pendingPunishments.entries()) {
            if (p.strikeKey === strikeKey && p.groupJid === groupJid) {
                clearTimeout(p.timer);
                pendingPunishments.delete(id);
            }
        }
        
        config.stats.detected++;
        userStrikes.delete(strikeKey);
        registerCooldown(groupJid, getIdentityActionId(identity));
        await executeAction(ChainySock, groupJid, identity, config, metadataInfo);
        await persistGroupData(true, groupJid, groupFilePath, groupData);
        return;
    }

    // Conta nova (<5 msgs) com falha NÃO classificada como lag (BAD_KEY/GENERIC).
    // Sem histórico de conversa + erro anômalo = alto risco de ataque stealth.
    // Punição imediata para manter a proteção contra contas recém-criadas.
    if (isSuspectNewAccount) {
        if (DEBUG_MODE) {
            console.log(`[ANTI-STEALTH] 🔴 Conta suspeita sem histórico: @${userName} tem ${messageCount} msgs e falha ${stealthCategory}. Punição Imediata!`);
        }

        for (const [id, p] of pendingPunishments.entries()) {
            if (p.strikeKey === strikeKey && p.groupJid === groupJid) {
                clearTimeout(p.timer);
                pendingPunishments.delete(id);
            }
        }

        config.stats.detected++;
        userStrikes.delete(strikeKey);
        registerCooldown(groupJid, getIdentityActionId(identity));
        await executeAction(ChainySock, groupJid, identity, config, metadataInfo);
        await persistGroupData(true, groupJid, groupFilePath, groupData);
        return;
    }
    
    let strikes = userStrikes.get(strikeKey) || { count: 0, lastTime: 0 };
    strikes.count++;
    strikes.lastTime = Date.now();
    userStrikes.set(strikeKey, strikes);
    
    if (strikes.count < flags.limite) {
        if (DEBUG_MODE) {
            console.log(`[ANTI-STEALTH] ⚠️ Strike ${strikes.count}/${flags.limite} para @${userName} no grupo ${groupJid}`);
        }
        await persistGroupData(true, groupJid, groupFilePath, groupData);
        return;
    }
    
    const isSpammingStealth = Array.from(pendingPunishments.values())
        .some(p => p.strikeKey === strikeKey && p.groupJid === groupJid);
    
    // CORREÇÃO ANTI-FLOOD: Detecta padrão de flood por timestamp
    // Se o mesmo usuário mandar FLOOD_THRESHOLD+ stealths em FLOOD_WINDOW_MS, é ataque claro
    const isFloodingStealth = recordStealthAndDetectFlood(strikeKey);
    
    if (isSpammingStealth || isFloodingStealth) {
        const reason = isSpammingStealth ? 'Ataque Stealth Múltiplo' : `Flood de Stealth (${FLOOD_THRESHOLD}+ em ${FLOOD_WINDOW_MS/1000}s)`;
        if (DEBUG_MODE) {
            console.log(`[ANTI-STEALTH] 🔴 ${reason} detectado de @${userName}. Punição Imediata!`);
        }
        for (const [id, p] of pendingPunishments.entries()) {
            if (p.strikeKey === strikeKey && p.groupJid === groupJid) {
                clearTimeout(p.timer);
                pendingPunishments.delete(id);
            }
        }
        
        config.stats.detected++;
        userStrikes.delete(strikeKey);
        recentStealths.delete(strikeKey); // Limpa contador de flood
        registerCooldown(groupJid, getIdentityActionId(identity));
        await executeAction(ChainySock, groupJid, identity, config, metadataInfo);
        await persistGroupData(true, groupJid, groupFilePath, groupData);
        return;
    }

    // Grace period adaptativo baseado na classificação da falha:
    // - MAC (sessão corrompida): retry raramente resolve -> janela curta.
    // - Recuperável com 2+ retries sem sucesso: sessão provavelmente irrecuperável
    //   (stealthRetryCount conta quantos retry-receipts já foram trocados sem êxito).
    // - Recuperável normal (NO_SESSION/BAD_KEY sem histórico de retry): janela generosa.
    const computeGraceMs = () => {
        if (isMacAttack) return RETRY_GRACE_MAC_MS;
        if (stealthRetryCount >= 2) return RETRY_GRACE_HIGH_RETRY_MS;
        return RETRY_GRACE_MS;
    };
    const graceMs = computeGraceMs();

    if (DEBUG_MODE) {
        console.log(`[ANTI-STEALTH] ⏳ Punição pendente para @${userName}. Aguardando ${graceMs/1000}s por retry (${stealthCategory}, rc=${stealthRetryCount})...`);
    }
    
    // CORREÇÃO: Verifica se a mensagem já foi decriptada antes de criar o timer
    if (wasMessageDecrypted(msgId)) {
        if (DEBUG_MODE) {
            console.log(`[ANTI-STEALTH] 🟢 Mensagem ${msgId?.slice(-6)} já foi decriptada anteriormente. Ignorando.`);
        }
        return;
    }
    
    const timer = setTimeout(async () => {
        // Verificação final: se a mensagem foi decriptada durante o grace period, não pune
        if (wasMessageDecrypted(msgId)) {
            pendingPunishments.delete(pendingKey);
            if (DEBUG_MODE) {
                console.log(`[ANTI-STEALTH] 🟢 Mensagem decriptada durante grace period. Punição cancelada para @${userName}`);
            }
            return;
        }
        
        pendingPunishments.delete(pendingKey);
        
        config.stats.detected++;
        userStrikes.delete(strikeKey);
        registerCooldown(groupJid, getIdentityActionId(identity));
        
        await executeAction(ChainySock, groupJid, identity, config, metadataInfo);
        await persistGroupData(true, groupJid, groupFilePath, groupData);
    }, graceMs);
    
    if (timer.unref) timer.unref();
    
    // CORREÇÃO: Armazena msgId junto com o pending para poder buscar depois
    pendingPunishments.set(pendingKey, { 
        timer, 
        groupJid, 
        participant, 
        strikeKey, 
        userName,
        msgId  // <-- IMPORTANTE: permite buscar por msgId no handleResolvedLag
    });
}

/**
 * Processa eventos de messages.update do Baileys
 * Isso captura quando uma mensagem que falhou ao decriptar é finalmente decriptada via retry
 */
export async function processAntiStealthUpdate(ChainySock, updates) {
    if (!Array.isArray(updates)) return;
    
    for (const update of updates) {
        const msgId = update?.key?.id;
        const groupJid = update?.key?.remoteJid;
        
        if (!msgId || !groupJid?.endsWith('@g.us')) continue;
        
        // Se o update tem conteúdo de mensagem (decriptou com sucesso), cancela punição pendente
        if (update?.update?.message && hasReadableMessageContent(update.update.message)) {
            handleResolvedLag(msgId, groupJid);
        }
    }
}

export async function processAntiStealth(ChainySock, m) {
    if (m.type !== 'notify' && m.type !== 'append') return;
    
    const botIdPrefix = ChainySock.user?.id?.split(':')[0];
    
    for (const info of m.messages) {
        if (info.key?.fromMe || !info.key?.remoteJid?.endsWith('@g.us')) continue;
        
        const participant = info.key.participant || info.participant;
        const groupJid = info.key.remoteJid;
        const msgId = info.key.id;
        const hasDecryptionFailure = isDecryptionFailure(info);

        if (!hasDecryptionFailure) {
            // Mensagem decriptou com sucesso - registra e cancela qualquer punição pendente
            if (info.message && msgId) {
                registerDecryptedMessage(msgId, groupJid, participant);
                handleResolvedLag(msgId, groupJid);
            }
            continue;
        }
        
        // CORREÇÃO: Se a mensagem já foi decriptada anteriormente (veio via update), ignora
        if (wasMessageDecrypted(msgId)) {
            if (DEBUG_MODE) {
                console.log(`[ANTI-STEALTH] 🟢 Mensagem ${msgId?.slice(-6)} já decriptada via update. Ignorando stub.`);
            }
            continue;
        }

        try {
            const groupFilePath = join(GRUPOS_DIR, `${groupJid}.json`);
            const groupData = await loadGroupData(true, groupJid, groupFilePath, 'Grupo');

            // --- DETECÇÃO DE ANTI-STEALTH (Ciphertext / Falha de Decifragem) ---
            // Nota: Se uma trava de pagamento chegar ofuscada/criptografada, ela falhará na decriptação
            // e cairá perfeitamente aqui nesta proteção de Stealth!
            if (groupData?.antistealth) {
                if (!participant) continue;

                const metadataInfo = await fetchGroupMetadata(ChainySock, groupJid);
                const identity = await resolveStealthIdentity(participant, ChainySock, metadataInfo.groupMetadata);
                const actionId = getIdentityActionId(identity);

                if (isOnCooldown(groupJid, actionId)) continue;
                if (shouldSkipParticipant(identity, botIdPrefix, groupData, metadataInfo.groupMetadata)) continue;

                // Extrai a classificação estruturada gerada pelo patch do baileys.
                // Permite distinguir "No session found" (lag, recuperável) de
                // "Bad MAC" (sessão corrompida, ataque stealth real).
                const classification = getStealthClassification(info);

                const config = getStealthConfig(groupData);
                await processStealthDetection(ChainySock, msgId, groupJid, identity, config, groupData, groupFilePath, metadataInfo, classification);
            }

        } catch (e) {
            console.error(`[ANTI-STEALTH] Erro ao processar ${participant}:`, e?.message || e);
        }
    }
}

// ── Handlers de Comando ──────────────────────────────────

async function toggleAntiStealthStatus(sub, from, groupData, groupFilePath, reply, prefix, config) {
    if (sub === 'on') groupData.antistealth = true;
    else if (sub === 'off') groupData.antistealth = false;
    else groupData.antistealth = !groupData.antistealth;

    await writeJsonFileAsync(groupFilePath, groupData);
    
    return reply(groupData.antistealth 
        ? MESSAGES.middleware.antiStealth.activated(describeAction(config.action), prefix)
        : MESSAGES.middleware.antiStealth.desactivated);
}

function showAntiStealthStatus(groupData, config, from, reply) {
    const status = groupData.antistealth ? '✅ Ativado' : '❌ Desativado';
    const timerAtivo = activeTimers.has(from) ? '\n⏱️ Timer de reabertura ativo' : '';
    
    return reply(
        MESSAGES.middleware.antiStealth.statusTitle +
        MESSAGES.middleware.antiStealth.statusBody(status, config.action, timerAtivo, config.limit || 1, describeAction(config.action), config.stats)
    );
}

async function configureAntiStealthAction(val, from, groupData, groupFilePath, reply, ChainySock, prefix, config) {
    if (val === 'abrir') {
        try {
            if (activeTimers.has(from)) {
                clearTimeout(activeTimers.get(from));
                activeTimers.delete(from);
            }
            await ChainySock.groupSettingUpdate(from, 'not_announcement');
            return reply(MESSAGES.middleware.antiStealth.groupOpened);
        } catch (e) {
            return reply(MESSAGES.middleware.antiStealth.openError(e.message));
        }
    }

    if (!val || !isValidAction(val)) {
        return reply(MESSAGES.middleware.antiStealth.configActionMenu(prefix));
    }

    config.action = val;
    await writeJsonFileAsync(groupFilePath, groupData);
    
    return reply(MESSAGES.middleware.antiStealth.actionConfigured(val, describeAction(val)));
}

async function configureAntiStealthStrikes(val, from, groupData, groupFilePath, reply, prefix, config) {
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 1 || num > 10) {
        return reply(MESSAGES.middleware.antiStealth.configStrikesMenu(prefix, config.limit || 3));
    }

    config.limit = num;
    await writeJsonFileAsync(groupFilePath, groupData);

    return reply(MESSAGES.middleware.antiStealth.strikesConfigured(num));
}

export async function handleAntistealthCommand({ 
    reply, args, isGroup, isGroupAdmin, isBotAdmin, from, 
    groupData, DATABASE_DIR, MESSAGES, prefix, ChainySock 
}) {
    if (!isGroup) return reply(MESSAGES.permission.groupOnly);
    if (!isGroupAdmin) return reply(MESSAGES.permission.userAdminOnly);
    if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);

    const sub = args[0]?.toLowerCase() || '';
    const val = args.slice(1).join(' ').toLowerCase().trim();
    const groupFilePath = join(DATABASE_DIR, `grupos/${from}.json`);
    
    // Ensure config exists before reading/writing
    const config = getStealthConfig(groupData);

    switch (sub) {
        case '':
        case 'on':
        case 'off':
            return await toggleAntiStealthStatus(sub, from, groupData, groupFilePath, reply, prefix, config);
        case 'status':
            return showAntiStealthStatus(groupData, config, from, reply);
        case 'acao':
        case 'ação':
        case 'action':
            return await configureAntiStealthAction(val, from, groupData, groupFilePath, reply, ChainySock, prefix, config);
        case 'strikes':
        case 'limite':
        case 'limit':
            return await configureAntiStealthStrikes(val, from, groupData, groupFilePath, reply, prefix, config);
        default:
            return reply(MESSAGES.middleware.antiStealth.commandsMenu(prefix));
    }
}

export async function handleAntipaymentCommand({ 
    reply, args, isGroup, isGroupAdmin, isBotAdmin, from, 
    groupData, DATABASE_DIR, MESSAGES, prefix, ChainySock 
}) {
    if (!isGroup) return reply(MESSAGES.permission.groupOnly);
    if (!isGroupAdmin) return reply(MESSAGES.permission.userAdminOnly);
    if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);

    const sub = args[0]?.toLowerCase() || '';
    const groupFilePath = join(DATABASE_DIR, `grupos/${from}.json`);

    if (sub === 'on' || sub === '1') {
        groupData.antipayment = true;
    } else if (sub === 'off' || sub === '0') {
        groupData.antipayment = false;
    } else if (sub === '') {
        groupData.antipayment = !groupData.antipayment;
    } else {
        return reply(MESSAGES.middleware.antiPaymentCmd.invalidOption(prefix));
    }

    await writeJsonFileAsync(groupFilePath, groupData);
    
    return reply(groupData.antipayment 
        ? MESSAGES.middleware.antiPaymentCmd.activated
        : MESSAGES.middleware.antiPaymentCmd.deactivated);
}
