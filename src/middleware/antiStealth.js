import { join } from 'path';
import { loadGroupData, persistGroupData } from '../utils/groupManager.js';
import { loadLevelingSafe, getLevelingUser } from '../utils/database/leveling.js';
import { GRUPOS_DIR } from '../utils/paths.js';
import { NUMERODONO } from '../config.js';
import { MESSAGES } from '../utils/messages.js';
import { hasPaymentMessage, getQuotedPaymentContext } from '../utils/paymentMessage.js';
import { verifyQuotedAuthor } from '../utils/messageEnvelopeRegistry.js';
import { sendCleanChat } from '../utils/cleanChat.js';

const DEBUG_MODE = process.env.DEBUG_MODE === 'true';

// ── Constantes & Caches ──────────────────────────────────────────

const BAN_COOLDOWN_MS = 10_000;
const CACHE_CLEANUP_INTERVAL_MS = 60_000;
const DEFAULT_ACTION = 'avisar';
const STEALTH_STUB_TYPES = new Set([2]); // messageStubType 2 = CIPHERTEXT
const GROUP_ACTION_COOLDOWN_MS = 30_000;

const recentBans = new Map();
const activeTimers = new Map();
const userStrikes = new Map(); // key -> { count: number, lastTime: number }
const pendingPunishments = new Map(); // messageId -> { timer, groupJid, participant }
const lastGroupAction = new Map(); // groupJid -> timestamp

// Limpeza de cache periódica
const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of recentBans) {
        if (now - timestamp > BAN_COOLDOWN_MS) recentBans.delete(key);
    }
    for (const [key, data] of userStrikes) {
        if (now - data.lastTime > 10 * 60 * 1000) userStrikes.delete(key);
    }
    for (const [key, timestamp] of lastGroupAction) {
        if (now - timestamp > GROUP_ACTION_COOLDOWN_MS * 2) lastGroupAction.delete(key);
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
    } else if (groupData.antistealthConfig.limit === undefined) {
        groupData.antistealthConfig.limit = 3;
    }
    return groupData.antistealthConfig;
}

// ── Helpers de Detecção ─────────────────────────────────

function isDecryptionFailure(info) {
    if (STEALTH_STUB_TYPES.has(info.messageStubType)) return true;
    if (info.messageStubType) return false;

    if (!info.message || Object.keys(info.message).length === 0) {
        const params = info.messageStubParameters;
        if (Array.isArray(params) && params.some(p => 
            typeof p === 'string' && (p.includes('decrypt') || p.includes('session') || p.includes('cipher'))
        )) return true;
        return false;
    }
    return false;
}

function shouldSkipParticipant(participant, botIdPrefix, groupData) {
    if (!participant) return true;
    if (botIdPrefix && participant.startsWith(botIdPrefix)) return true;
    if (groupData?.adminWhitelist?.[participant]) return true;
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

// ── Lógica de Punição ──────────────────────────────────────────

async function fetchGroupMetadata(ChainySock, groupJid) {
    try {
        const metadata = await ChainySock.groupMetadata(groupJid);
        const owner = metadata?.owner 
            || metadata?.participants?.find(p => p.admin === 'superadmin')?.id
            || null;
        return { groupName: metadata?.subject || groupJid, groupOwner: owner };
    } catch (e) {
        console.warn('[ANTI-STEALTH] Falha ao buscar metadata do grupo:', e.message);
        return { groupName: groupJid, groupOwner: null };
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

async function executeAction(ChainySock, groupJid, participant, config) {
    // Verifica cooldown do grupo para evitar spam de alertas
    if (isGroupOnCooldown(groupJid)) {
        if (DEBUG_MODE) {
            console.log(`[ANTI-STEALTH] ⏳ Grupo ${groupJid} em cooldown, pulando ação`);
        }
        return;
    }
    
    const flags = parseAction(config.action, config.limit);
    const userName = participant.split('@')[0];
    
    const { groupName, groupOwner } = await fetchGroupMetadata(ChainySock, groupJid);
    const { groupMsg, mentions } = buildAlertMessage(flags, userName, participant, groupOwner);

    // Registra ação ANTES de executar para evitar race conditions
    registerGroupAction(groupJid);

    // Envia mensagem de alerta
    await ChainySock.sendMessage(groupJid, { text: groupMsg, mentions }).catch(() => {});

    if (flags.fechar) {
        config.stats.closed++;
        await ChainySock.groupSettingUpdate(groupJid, 'announcement').catch(() => {});
    }

    if (flags.banir) {
        config.stats.banned++;
        await ChainySock.groupParticipantsUpdate(groupJid, [participant], 'remove').catch(() => {});
        // Executa limpeza de chat após banimento por stealth
        await sendCleanChat({ socket: ChainySock, remoteJid: groupJid }).catch(() => {});
    }

    await notifyBotOwner(ChainySock, flags, groupName, userName, participant);
    scheduleGroupReopening(ChainySock, groupJid, flags, groupName);

    if (DEBUG_MODE) {
        console.log(`[ANTI-STEALTH] 🛡️ [${groupName}] Ação executada contra @${userName}`);
    }
}

async function executePaymentAction(ChainySock, groupJid, participant, performanceOptimizer) {
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

function handleResolvedLag(msgId, groupJid, participant) {
    if (!pendingPunishments.has(msgId)) return;
    
    const pending = pendingPunishments.get(msgId);
    clearTimeout(pending.timer);
    pendingPunishments.delete(msgId);
    
    const strikeKey = `${groupJid}:${participant}`;
    const strikes = userStrikes.get(strikeKey);
    if (strikes && strikes.count > 0) strikes.count--;
    
    if (DEBUG_MODE) {
        console.log(`[ANTI-STEALTH] 🟢 Falso Positivo Evitado! Mensagem de @${participant.split('@')[0]} decriptada via retry (Era apenas Lag).`);
    }
}

async function processStealthDetection(ChainySock, msgId, groupJid, participant, config, groupData, groupFilePath, performanceOptimizer) {
    const flags = parseAction(config.action, config.limit);
    const strikeKey = `${groupJid}:${participant}`;
    const userName = participant.split('@')[0];
    
    // Leitura do contador de mensagens (Leveling)
    const levelingData = loadLevelingSafe();
    const userData = getLevelingUser(levelingData, participant);
    const messageCount = userData.messages || 0;

    // --- SISTEMA DE PREVENÇÃO DE FALSOS POSITIVOS ---
    // Membros que já conversam bastante costumam ter problemas reais de criptografia do WhatsApp.
    if (messageCount >= 30) {
        if (DEBUG_MODE) {
            console.log(`[ANTI-STEALTH] 🟢 Falso Positivo Evitado: @${userName} é membro ativo (${messageCount} msgs). Ignorando mensagem indecriptável.`);
        }
        for (const [id, p] of pendingPunishments.entries()) {
            if (p.participant === participant && p.groupJid === groupJid) {
                clearTimeout(p.timer);
                pendingPunishments.delete(id);
            }
        }
        return;
    }

    // Membros que mal conversaram e enviam stealth são quase 100% de chance de ser ataque.
    if (messageCount < 5) {
        if (DEBUG_MODE) {
            console.log(`[ANTI-STEALTH] 🔴 Ataque Stealth de conta suspeita: @${userName} tem apenas ${messageCount} mensagens. Punição Imediata!`);
        }
        
        // Remove qualquer timer pendente para esse usuário/grupo, se houver
        for (const [id, p] of pendingPunishments.entries()) {
            if (p.participant === participant && p.groupJid === groupJid) {
                clearTimeout(p.timer);
                pendingPunishments.delete(id);
            }
        }
        
        config.stats.detected++;
        userStrikes.delete(strikeKey);
        registerCooldown(groupJid, participant);
        await executeAction(ChainySock, groupJid, participant, config);
        persistGroupData(true, groupJid, groupFilePath, groupData, performanceOptimizer);
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
        persistGroupData(true, groupJid, groupFilePath, groupData, performanceOptimizer);
        return;
    }
    
    const isSpammingStealth = Array.from(pendingPunishments.values())
        .some(p => p.participant === participant && p.groupJid === groupJid);
    
    if (isSpammingStealth) {
        if (DEBUG_MODE) {
            console.log(`[ANTI-STEALTH] 🔴 Ataque Stealth Múltiplo detectado de @${userName}. Punição Imediata!`);
        }
        for (const [id, p] of pendingPunishments.entries()) {
            if (p.participant === participant && p.groupJid === groupJid) {
                clearTimeout(p.timer);
                pendingPunishments.delete(id);
            }
        }
        
        config.stats.detected++;
        userStrikes.delete(strikeKey);
        registerCooldown(groupJid, participant);
        await executeAction(ChainySock, groupJid, participant, config);
        persistGroupData(true, groupJid, groupFilePath, groupData, performanceOptimizer);
        return;
    }

    if (DEBUG_MODE) {
        console.log(`[ANTI-STEALTH] ⏳ Punição pendente para @${userName}. Aguardando 15s por retry (Lag Detection)...`);
    }
    
    const timer = setTimeout(async () => {
        pendingPunishments.delete(msgId);
        
        config.stats.detected++;
        userStrikes.delete(strikeKey);
        registerCooldown(groupJid, participant);
        
        await executeAction(ChainySock, groupJid, participant, config);
        persistGroupData(true, groupJid, groupFilePath, groupData, performanceOptimizer);
    }, 15000);
    
    if (timer.unref) timer.unref();
    pendingPunishments.set(msgId, { timer, groupJid, participant });
}

export async function processAntiStealth(ChainySock, m, performanceOptimizer) {
    if (m.type !== 'notify' && m.type !== 'append') return;
    
    const botIdPrefix = ChainySock.user?.id?.split(':')[0];
    
    for (const info of m.messages) {
        if (info.key?.fromMe || !info.key?.remoteJid?.endsWith('@g.us')) continue;
        
        const participant = info.key.participant || info.participant;
        const groupJid = info.key.remoteJid;
        const msgId = info.key.id;

        try {
            const groupFilePath = join(GRUPOS_DIR, `${groupJid}.json`);
            const groupData = await loadGroupData(true, groupJid, groupFilePath, 'Grupo', performanceOptimizer);

            // --- DETECÇÃO DE ANTI-STEALTH (Ciphertext / Falha de Decifragem) ---
            // Nota: Se uma trava de pagamento chegar ofuscada/criptografada, ela falhará na decriptação
            // e cairá perfeitamente aqui nesta proteção de Stealth!
            if (groupData?.antistealth) {
                if (!isDecryptionFailure(info) && info.message) {
                    if (msgId) handleResolvedLag(msgId, groupJid, participant);
                    continue;
                }

                if (!isDecryptionFailure(info)) continue;

                if (!participant || isOnCooldown(groupJid, participant)) continue;
                if (botIdPrefix && participant.startsWith(botIdPrefix)) continue;
                if (shouldSkipParticipant(participant, botIdPrefix, groupData)) continue;

                const config = getStealthConfig(groupData);
                await processStealthDetection(ChainySock, msgId, groupJid, participant, config, groupData, groupFilePath, performanceOptimizer);
            }

        } catch (e) {
            console.error(`[ANTI-STEALTH] Erro ao processar ${participant}:`, e?.message || e);
        }
    }
}

// ── Handlers de Comando ──────────────────────────────────

async function toggleAntiStealthStatus(sub, groupData, groupFilePath, optimizer, reply, prefix, config) {
    if (sub === 'on') groupData.antistealth = true;
    else if (sub === 'off') groupData.antistealth = false;
    else groupData.antistealth = !groupData.antistealth;

    await optimizer.saveJsonWithCache(groupFilePath, groupData);
    
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

async function configureAntiStealthAction(val, from, groupData, groupFilePath, optimizer, reply, ChainySock, prefix, config) {
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
    await optimizer.saveJsonWithCache(groupFilePath, groupData);
    
    return reply(MESSAGES.middleware.antiStealth.actionConfigured(val, describeAction(val)));
}

async function configureAntiStealthStrikes(val, groupData, groupFilePath, optimizer, reply, prefix, config) {
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 1 || num > 10) {
        return reply(MESSAGES.middleware.antiStealth.configStrikesMenu(prefix, config.limit || 3));
    }

    config.limit = num;
    await optimizer.saveJsonWithCache(groupFilePath, groupData);

    return reply(MESSAGES.middleware.antiStealth.strikesConfigured(num));
}

export async function handleAntistealthCommand({ 
    reply, args, isGroup, isGroupAdmin, isBotAdmin, from, 
    groupData, DATABASE_DIR, optimizer, MESSAGES, prefix, ChainySock 
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
            return await toggleAntiStealthStatus(sub, groupData, groupFilePath, optimizer, reply, prefix, config);
        case 'status':
            return showAntiStealthStatus(groupData, config, from, reply);
        case 'acao':
        case 'ação':
        case 'action':
            return await configureAntiStealthAction(val, from, groupData, groupFilePath, optimizer, reply, ChainySock, prefix, config);
        case 'strikes':
        case 'limite':
        case 'limit':
            return await configureAntiStealthStrikes(val, groupData, groupFilePath, optimizer, reply, prefix, config);
        default:
            return reply(MESSAGES.middleware.antiStealth.commandsMenu(prefix));
    }
}

export async function handleAntipaymentCommand({ 
    reply, args, isGroup, isGroupAdmin, isBotAdmin, from, 
    groupData, DATABASE_DIR, optimizer, MESSAGES, prefix, ChainySock 
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

    await optimizer.saveJsonWithCache(groupFilePath, groupData);
    
    return reply(groupData.antipayment 
        ? MESSAGES.middleware.antiPaymentCmd.activated
        : MESSAGES.middleware.antiPaymentCmd.deactivated);
}
