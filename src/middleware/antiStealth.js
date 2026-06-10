import { join } from 'path';
import { loadGroupData, persistGroupData } from '../utils/groupManager.js';
import { loadLevelingSafe, getLevelingUser } from '../utils/database/leveling.js';
import { GRUPOS_DIR } from '../utils/paths.js';
import { NUMERODONO } from '../config.js';

// ── Constantes & Caches ──────────────────────────────────────────

const BAN_COOLDOWN_MS = 10_000;
const CACHE_CLEANUP_INTERVAL_MS = 60_000;
const DEFAULT_ACTION = 'avisar';
const STEALTH_STUB_TYPES = new Set([2]); // messageStubType 2 = CIPHERTEXT

const recentBans = new Map();
const activeTimers = new Map();
const userStrikes = new Map(); // key -> { count: number, lastTime: number }
const pendingPunishments = new Map(); // messageId -> { timer, groupJid, participant }

// Limpeza de cache periódica
const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of recentBans) {
        if (now - timestamp > BAN_COOLDOWN_MS) recentBans.delete(key);
    }
    for (const [key, data] of userStrikes) {
        if (now - data.lastTime > 10 * 60 * 1000) userStrikes.delete(key);
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
    
    let groupMsg = `🚨 *SISTEMA DE SEGURANÇA* 🚨\n\n@${userName} enviou uma mensagem na qual o bot não conseguiu ler o tipo ou conteúdo (Mensagem Criptografada/Stealth). Como resposta, ${actionText}.`;

    if (flags.avisar && groupOwner) {
        const ownerName = groupOwner.split('@')[0];
        mentions.push(groupOwner);
        groupMsg += `\n\n👑 @${ownerName}, atenção! Possível ataque Stealth detectado.`;
    }

    groupMsg += `\n\n_Se você acha que isso foi um engano, entre em contato com um administrador._`;
    
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
            text: `⚠️ *ALERTA ANTI-STEALTH* ⚠️\n\n` +
                  `🛡️ Ataque detectado!\n\n` +
                  `👥 *Grupo:* ${groupName}\n` +
                  `👤 *Infrator:* @${userName}\n` +
                  `⚡ *Ações:* ${acoesFeitas.join(' | ') || 'Nenhuma'}`,
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
                text: `✅ *O período de segurança de ${flags.tempo} minutos acabou.*\n\nO grupo foi reaberto e todos podem voltar a conversar livremente.`
            });
        } catch (e) {
            console.error(`[ANTI-STEALTH] Erro ao reabrir ${groupName}:`, e.message);
        }
    }, flags.tempo * 60 * 1000);

    if (timerId.unref) timerId.unref();
    activeTimers.set(groupJid, timerId);
}

async function executeAction(ChainySock, groupJid, participant, config) {
    const flags = parseAction(config.action, config.limit);
    const userName = participant.split('@')[0];
    
    const { groupName, groupOwner } = await fetchGroupMetadata(ChainySock, groupJid);
    const { groupMsg, mentions } = buildAlertMessage(flags, userName, participant, groupOwner);

    const promises = [ChainySock.sendMessage(groupJid, { text: groupMsg, mentions })];

    if (flags.fechar) {
        config.stats.closed++;
        promises.push(ChainySock.groupSettingUpdate(groupJid, 'announcement'));
    }

    if (flags.banir) {
        config.stats.banned++;
        promises.push(ChainySock.groupParticipantsUpdate(groupJid, [participant], 'remove'));
    }

    await Promise.allSettled(promises);
    await notifyBotOwner(ChainySock, flags, groupName, userName, participant);
    scheduleGroupReopening(ChainySock, groupJid, flags, groupName);

    console.log(`[ANTI-STEALTH] 🛡️ [${groupName}] Ação executada contra @${userName}`);
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
    
    console.log(`[ANTI-STEALTH] 🟢 Falso Positivo Evitado! Mensagem de @${participant.split('@')[0]} decriptada via retry (Era apenas Lag).`);
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
        console.log(`[ANTI-STEALTH] 🟢 Falso Positivo Evitado: @${userName} é membro ativo (${messageCount} msgs). Ignorando mensagem indecriptável.`);
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
        console.log(`[ANTI-STEALTH] 🔴 Ataque Stealth de conta suspeita: @${userName} tem apenas ${messageCount} mensagens. Punição Imediata!`);
        
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
        console.log(`[ANTI-STEALTH] ⚠️ Strike ${strikes.count}/${flags.limite} para @${userName} no grupo ${groupJid}`);
        persistGroupData(true, groupJid, groupFilePath, groupData, performanceOptimizer);
        return;
    }
    
    const isSpammingStealth = Array.from(pendingPunishments.values())
        .some(p => p.participant === participant && p.groupJid === groupJid);
    
    if (isSpammingStealth) {
        console.log(`[ANTI-STEALTH] 🔴 Ataque Stealth Múltiplo detectado de @${userName}. Punição Imediata!`);
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

    console.log(`[ANTI-STEALTH] ⏳ Punição pendente para @${userName}. Aguardando 15s por retry (Lag Detection)...`);
    
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

        if (!isDecryptionFailure(info) && info.message) {
            if (msgId) handleResolvedLag(msgId, groupJid, participant);
            continue;
        }

        if (!isDecryptionFailure(info)) continue;

        if (!participant || isOnCooldown(groupJid, participant)) continue;
        if (botIdPrefix && participant.startsWith(botIdPrefix)) continue;

        try {
            const groupFilePath = join(GRUPOS_DIR, `${groupJid}.json`);
            const groupData = await loadGroupData(true, groupJid, groupFilePath, 'Grupo', performanceOptimizer);
            
            if (!groupData?.antistealth) continue;
            if (shouldSkipParticipant(participant, botIdPrefix, groupData)) continue;
            
            const config = getStealthConfig(groupData);
            await processStealthDetection(ChainySock, msgId, groupJid, participant, config, groupData, groupFilePath, performanceOptimizer);

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
        ? `🛡️ *ANTI-STEALTH ATIVADO*\n\nO sistema irá proteger o grupo contra mensagens Stealth.\n\n📌 *Ação configurada:*\n${describeAction(config.action)}\n\n💡 Use _${prefix}antistealth acao_ para configurar.`
        : `✅ *ANTI-STEALTH DESATIVADO*\n\nA proteção contra mensagens Stealth foi desligada.`);
}

function showAntiStealthStatus(groupData, config, from, reply) {
    const status = groupData.antistealth ? '✅ Ativado' : '❌ Desativado';
    const timerAtivo = activeTimers.has(from) ? '\n⏱️ Timer de reabertura ativo' : '';
    
    return reply(
        `🛡️ *ANTI-STEALTH — STATUS*\n\n` +
        `📌 Status: ${status}\n` +
        `⚡ Ação: ${config.action}${timerAtivo}\n` +
        `🎯 Limite de Strikes: ${config.limit || 1}\n\n` +
        `📋 *O que vai acontecer:*\n${describeAction(config.action)}\n\n` +
        `📊 *Estatísticas:*\n` +
        `• Detectadas: ${config.stats.detected}\n` +
        `• Bans: ${config.stats.banned}\n` +
        `• Fechamentos: ${config.stats.closed}`
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
            return reply(`✅ O grupo foi *ABERTO* novamente.`);
        } catch (e) {
            return reply(`❌ Erro ao abrir o grupo: ${e.message}`);
        }
    }

    if (!val || !isValidAction(val)) {
        return reply(
            `🛡️ *ANTI-STEALTH — CONFIGURAR AÇÃO*\n\n` +
            `Escolha o que o bot deve fazer ao detectar um ataque:\n\n` +
            `1️⃣ *banir* — Remove o infrator do grupo na hora\n` +
            `2️⃣ *fechar* — Fecha o grupo por 5 minutos para conter o ataque\n` +
            `3️⃣ *avisar* — Apenas avisa o dono do bot no PV (não pune o usuário)\n\n` +
            `💡 *Como usar:*\n` +
            `• _${prefix}antistealth acao 1_ (ou banir)\n` +
            `• _${prefix}antistealth acao 2_ (ou fechar)\n` +
            `• _${prefix}antistealth acao 3_ (ou avisar)\n\n` +
            `🔧 Use _${prefix}antistealth acao abrir_ para destrancar o grupo caso tenha fechado.`
        );
    }

    config.action = val;
    await optimizer.saveJsonWithCache(groupFilePath, groupData);
    
    return reply(
        `🛡️ *ANTI-STEALTH — AÇÃO CONFIGURADA*\n\n` +
        `⚡ Ação: *${val}*\n\n` +
        `📋 *O que vai acontecer ao detectar stealth:*\n${describeAction(val)}`
    );
}

async function configureAntiStealthStrikes(val, groupData, groupFilePath, optimizer, reply, prefix, config) {
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 1 || num > 10) {
        return reply(
            `🛡️ *ANTI-STEALTH — CONFIGURAR STRIKES*\n\n` +
            `Defina a quantidade de mensagens Stealth/Ciphertext que um usuário pode enviar antes de ser punido (entre 1 e 10).\n\n` +
            `💡 *Como usar:*\n` +
            `• _${prefix}antistealth strikes 3_ (padrão)\n` +
            `• _${prefix}antistealth strikes 1_ (punição imediata)\n\n` +
            `📌 *Limite atual:* ${config.limit || 3} strike(s)`
        );
    }

    config.limit = num;
    await optimizer.saveJsonWithCache(groupFilePath, groupData);

    return reply(
        `🛡️ *ANTI-STEALTH — STRIKES CONFIGURADOS*\n\n` +
        `🎯 Limite de strikes definido para: *${num}*\n` +
        `O usuário será punido na *${num}ª* ocorrência de stealth.`
    );
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
            return reply(
                `🛡️ *ANTI-STEALTH — COMANDOS*\n\n` +
                `• _${prefix}antistealth_ — Ativar/desativar\n` +
                `• _${prefix}antistealth on/off_ — Ativar/desativar\n` +
                `• _${prefix}antistealth status_ — Ver status e estatísticas\n` +
                `• _${prefix}antistealth acao_ — Configurar ação\n` +
                `• _${prefix}antistealth strikes_ — Configurar limite de strikes\n` +
                `• _${prefix}antistealth acao abrir_ — Abre o grupo`
            );
    }
}
