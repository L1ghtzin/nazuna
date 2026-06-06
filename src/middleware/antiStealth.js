import { join } from 'path';
import { loadGroupData, persistGroupData } from '../utils/groupManager.js';
import { GRUPOS_DIR } from '../utils/paths.js';
import config, { NUMERODONO } from '../config.js';
import { idsMatch } from '../utils/helpers.js';
import { getBotNumber } from '../utils/messageHelpers.js';

// ── Constantes ──────────────────────────────────────────
const BAN_COOLDOWN_MS = 5 * 60 * 1000;
const CACHE_CLEANUP_INTERVAL_MS = 60_000;
const DEFAULT_ACTION = 'banir';

const REPEAT_WINDOW_MS = 2 * 60 * 1000;
const REPEAT_THRESHOLD = 3;

// messageStubType 2 = CIPHERTEXT (falha de E2E real)
const STEALTH_STUB_TYPES = new Set([2]);

// Stubs que são ações legítimas do WhatsApp e NUNCA devem ser confundidos com stealth
// Ref: WebMessageInfo.StubType no protobuf do Baileys
const SAFE_STUB_TYPES = new Set([
    1,   // REVOKE (mensagem apagada)
    12,  // GROUP_PARTICIPANT_ADD
    13,  // GROUP_PARTICIPANT_REMOVE
    14,  // GROUP_PARTICIPANT_PROMOTE
    15,  // GROUP_PARTICIPANT_DEMOTE
    20,  // GROUP_CHANGE_SUBJECT
    21,  // GROUP_CHANGE_ICON
    22,  // GROUP_CHANGE_INVITE_LINK
    24,  // GROUP_CHANGE_ANNOUNCE
    25,  // GROUP_CHANGE_RESTRICT
    27,  // GROUP_PARTICIPANT_LEAVE
    28,  // GROUP_CREATE
    32,  // E2E_IDENTITY_CHANGED
    33,  // BROADCAST_CREATE
    34,  // BROADCAST_ADD
    35,  // BROADCAST_REMOVE
    36,  // GENERIC_NOTIFICATION
    39,  // E2E_ENCRYPTED
    40,  // CALL_MISSED_VOICE
    41,  // CALL_MISSED_VIDEO
    46,  // INDIVIDUAL_CHANGE_NUMBER
    54,  // GROUP_PARTICIPANT_LINKED_GROUP_JOIN
    60,  // EPHEMERAL_SETTING
    67,  // GROUP_MEMBER_ADD_MODE
    71,  // GROUP_MEMBERSHIP_JOIN_APPROVAL_MODE
    72,  // GROUP_MEMBERSHIP_JOIN_APPROVAL_REQUEST
    78,  // COMMUNITY_LINK_PARENT_GROUP
    79,  // COMMUNITY_UNLINK_PARENT_GROUP
    80,  // COMMUNITY_PARENT_GROUP_SUBJECT
    83,  // PINNED_MESSAGE_IN_CHAT
    87,  // LID_MIGRATION_NOTIFICATION
]);

// Flags de ação válidas (qualquer combinação dessas)
const VALID_FLAGS = new Set(['banir', 'fechar', 'avisar']);

// ── Caches ──────────────────────────────────────────────
const recentBans = new Map();
const activeTimers = new Map();
const userStrikes = new Map(); // key -> { count: number, lastTime: number }

const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of recentBans) {
        if (now - timestamp > BAN_COOLDOWN_MS) recentBans.delete(key);
    }
    for (const [key, data] of userStrikes) {
        if (now - data.lastTime > REPEAT_WINDOW_MS) userStrikes.delete(key);
    }
}, CACHE_CLEANUP_INTERVAL_MS);
if (cleanupInterval.unref) cleanupInterval.unref();

// ── Parser de ação ──────────────────────────────────────

/**
 * Interpreta a string de ação composta e retorna um objeto de flags.
 * Ex: "avisar fechar banir 30 limite 3" → { avisar: true, fechar: true, banir: true, tempo: 30, limite: 3 }
 * Ex: "banir"                  → { banir: true, fechar: false, avisar: false, tempo: 0, limite: 1 }
 */
function parseAction(actionStr) {
    const parts = (actionStr || DEFAULT_ACTION).toLowerCase().split(/\s+/);
    const result = { banir: false, fechar: false, avisar: false, tempo: 0 };

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (VALID_FLAGS.has(part)) {
            result[part] = true;
        } else {
            const num = parseInt(part);
            if (!isNaN(num) && num >= 1 && num <= 1440) {
                result.tempo = num;
            }
        }
    }

    // Se nenhuma flag foi setada, usa ban como fallback
    if (!result.banir && !result.fechar && !result.avisar) {
        result.banir = true;
    }

    return result;
}

/**
 * Valida se a string de ação contém pelo menos uma flag válida.
 */
function isValidAction(val) {
    const parts = val.toLowerCase().split(/\s+/);
    let hasFlag = false;
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (VALID_FLAGS.has(part)) {
            hasFlag = true;
        } else {
            const num = parseInt(part);
            if (isNaN(num) || num < 1 || num > 1440) {
                return false; // palavra desconhecida
            }
        }
    }
    return hasFlag;
}

/**
 * Gera uma descrição legível da ação configurada.
 */
function describeAction(actionStr) {
    const flags = parseAction(actionStr);
    const parts = [];
    if (flags.avisar) parts.push('📢 Avisar o dono');
    if (flags.fechar) {
        parts.push(flags.tempo > 0 
            ? `🔒 Fechar o grupo por ${flags.tempo} minutos` 
            : '🔒 Fechar o grupo');
    }
    if (flags.banir) parts.push('🚫 Banir o infrator');
    return parts.join('\n');
}

// ── Helpers de detecção ─────────────────────────────────

function isDecryptionFailure(info) {
    // ── Filtros de Falso Positivo ──
    
    // Se tem um stub legítimo do WhatsApp (reações, saídas, promoções, etc.), NUNCA é stealth
    if (info.messageStubType && SAFE_STUB_TYPES.has(info.messageStubType)) return false;
    
    // Reações são mensagens legítimas — o Baileys às vezes não descriptografa o conteúdo mas é normal
    if (info.message?.reactionMessage || info.message?.protocolMessage || info.message?.senderKeyDistributionMessage) return false;
    
    // Poll updates e ephemeral settings são legítimos
    if (info.message?.pollUpdateMessage || info.message?.pollCreationMessage) return false;

    // Messages com key.id que começam com "status" ou de @broadcast são atualizações de status
    if (info.key?.remoteJid === 'status@broadcast') return false;

    // ── STEALTH ANTIDOTE (Detecta a variável injetada pelo nosso patch) ──
    if (info.stealthMeta) {
        // Se a meta foi injetada, é falha de decriptação (independentemente do decryptFail ser 'hide' ou não)
        return true;
    }

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

function cleanUserId(id) {
    if (!id || typeof id !== 'string') return null;
    if (!id.includes(':')) return id;

    const suffix = id.includes('@lid') ? '@lid' : '@s.whatsapp.net';
    return `${id.split(':')[0]}${suffix}`;
}

function sameUser(idA, idB) {
    const cleanA = cleanUserId(idA);
    const cleanB = cleanUserId(idB);
    if (!cleanA || !cleanB) return false;
    return cleanA === cleanB || idsMatch(cleanA, cleanB);
}

function getParticipantId(participant) {
    return cleanUserId(participant?.lid || participant?.id || participant);
}

function isWhitelistedParticipant(participant, groupData) {
    const whitelist = groupData?.adminWhitelist;
    if (!whitelist || typeof whitelist !== 'object') return false;

    return Object.keys(whitelist).some(whitelistedId => sameUser(whitelistedId, participant));
}

function isBotOrOwner(NazunaSock, participant, botIdPrefix) {
    if (!participant) return true;
    if (botIdPrefix && participant.startsWith(botIdPrefix)) return true;

    const ownerJid = NUMERODONO ? `${NUMERODONO}@s.whatsapp.net` : null;
    const candidates = [
        getBotNumber(NazunaSock),
        NazunaSock.user?.id,
        NazunaSock.user?.lid,
        NazunaSock.authState?.creds?.me?.id,
        NazunaSock.authState?.creds?.me?.lid,
        ownerJid,
        config?.lidowner
    ].filter(Boolean);

    return candidates.some(candidate => sameUser(candidate, participant));
}

function shouldSkipParticipant(NazunaSock, participant, botIdPrefix, groupData) {
    if (!participant) return true;
    if (isBotOrOwner(NazunaSock, participant, botIdPrefix)) return true;
    if (isWhitelistedParticipant(participant, groupData)) return true;
    return false;
}

async function isProtectedGroupAdmin(NazunaSock, groupJid, participant) {
    try {
        const metadata = await NazunaSock.groupMetadata(groupJid);
        const groupOwner = getParticipantId(metadata?.owner);
        if (groupOwner && sameUser(groupOwner, participant)) return true;

        const member = metadata?.participants?.find(p => sameUser(getParticipantId(p), participant));
        return member?.admin === 'admin' || member?.admin === 'superadmin';
    } catch (e) {
        console.warn('[ANTI-STEALTH] Falha ao buscar metadata para isencao:', e.message);
        return false;
    }
}

function classifyConfidence(info, strikesCount) {
    // Se stealthMeta for diretamente a string 'hide', ou tiver a propriedade decryptFail === 'hide'
    const isHide = info.stealthMeta === 'hide' || info.stealthMeta?.decryptFail === 'hide';
    
    // Análise de atributos e childTags injetados pelo nosso patch-baileys
    const nodeType = info.stealthMeta?.rawNodeAttrs?.type;
    const childTags = info.stealthMeta?.childTags || [];
    
    // Detecta se a mensagem possui tags comuns de pagamento (mesmo que corrompida)
    const isPayment = nodeType === 'payment' || 
                      nodeType === 'request_payment' || 
                      nodeType === 'send_payment' || 
                      childTags.includes('pay') || 
                      childTags.includes('payment');

    // Confiança ALTA (baniu direto): se a lib explicitamente injetou decryptFail = 'hide' ou detectou XML de pagamento
    if (isHide || isPayment) return 'high';

    // Confiança MÉDIA: Não tem flag 'hide', mas falhou e acumulou X strikes
    if (strikesCount >= REPEAT_THRESHOLD) return 'medium';
    return null;
}

function isOnCooldown(groupJid, participant) {
    const banKey = `${groupJid}:${participant}`;
    const lastBan = recentBans.get(banKey);
    return lastBan && Date.now() - lastBan < BAN_COOLDOWN_MS;
}

function registerCooldown(groupJid, participant) {
    recentBans.set(`${groupJid}:${participant}`, Date.now());
}

// ── Configuração ────────────────────────────────────────

function getStealthConfig(groupData) {
    if (!groupData.antistealthConfig || typeof groupData.antistealthConfig !== 'object') {
        groupData.antistealthConfig = {
            action: DEFAULT_ACTION,
            stats: { detected: 0, banned: 0, closed: 0 }
        };
    }
    if (!groupData.antistealthConfig.action) {
        groupData.antistealthConfig.action = DEFAULT_ACTION;
    }
    if (!groupData.antistealthConfig.stats || typeof groupData.antistealthConfig.stats !== 'object') {
        groupData.antistealthConfig.stats = { detected: 0, banned: 0, closed: 0 };
    }
    groupData.antistealthConfig.stats.detected ??= 0;
    groupData.antistealthConfig.stats.banned ??= 0;
    groupData.antistealthConfig.stats.closed ??= 0;
    return groupData.antistealthConfig;
}

// ── Execução da ação composta ───────────────────────────

/**
 * Executa todas as flags da ação de uma vez.
 */
async function executeAction(NazunaSock, groupJid, participant, config) {
    const flags = parseAction(config.action);
    const userName = participant.split('@')[0];

    // ── 1. Metadata ──
    let groupName = groupJid;
    let groupOwner = null;
    try {
        const metadata = await NazunaSock.groupMetadata(groupJid);
        groupName = metadata?.subject || groupJid;
        groupOwner = metadata?.owner 
            || metadata?.participants?.find(p => p.admin === 'superadmin')?.id
            || null;
    } catch (e) {
        console.warn('[ANTI-STEALTH] Falha ao buscar metadata do grupo:', e.message);
    }

    // ── 2. Monta mensagem de alerta ──
    const actionParts = [];
    if (flags.banir) actionParts.push('removido(a) do grupo');
    if (flags.fechar) {
        actionParts.push(flags.tempo > 0 
            ? `o grupo foi fechado por ${flags.tempo} minutos` 
            : 'o grupo foi fechado');
    }
    const actionText = actionParts.length > 0 
        ? actionParts.join(' e ') 
        : 'uma ação de segurança foi tomada';

    const mentions = [participant];
    let groupMsg = `🚨 *SISTEMA DE SEGURANÇA* 🚨\n\n@${userName} enviou uma mensagem na qual o bot não conseguiu ler o tipo ou conteúdo (Mensagem Criptografada/Stealth). Como resposta, ${actionText}.`;

    if (flags.avisar && groupOwner) {
        const ownerName = groupOwner.split('@')[0];
        mentions.push(groupOwner);
        groupMsg += `\n\n👑 @${ownerName}, atenção! Possível ataque Stealth detectado.`;
    }

    groupMsg += `\n\n_Se você acha que isso foi um engano, entre em contato com um administrador._`;

    // ── 3/4. Executa ações em paralelo ──
    const promises = [
        NazunaSock.sendMessage(groupJid, { text: groupMsg, mentions })
    ];

    if (flags.fechar) {
        config.stats.closed++;
        promises.push(NazunaSock.groupSettingUpdate(groupJid, 'announcement'));
    }

    if (flags.banir) {
        config.stats.banned++;
        promises.push(NazunaSock.groupParticipantsUpdate(groupJid, [participant], 'remove'));
    }

    await Promise.allSettled(promises);

    // ── 5. Notifica o dono do bot no PV ──
    if (flags.avisar && NUMERODONO) {
        const donoJid = `${NUMERODONO}@s.whatsapp.net`;
        const acoesFeitas = [];
        if (flags.banir) acoesFeitas.push('🚫 Banido');
        if (flags.fechar) acoesFeitas.push(flags.tempo > 0 ? `🔒 Grupo fechado por ${flags.tempo}m` : '🔒 Grupo fechado');
        
        NazunaSock.sendMessage(donoJid, {
            text: `⚠️ *ALERTA ANTI-STEALTH* ⚠️\n\n` +
                  `🛡️ Ataque detectado!\n\n` +
                  `👥 *Grupo:* ${groupName}\n` +
                  `👤 *Infrator:* @${userName}\n` +
                  `⚡ *Ações:* ${acoesFeitas.join(' | ') || 'Nenhuma'}`,
            mentions: [participant]
        }).catch(e => console.warn('[ANTI-STEALTH] Falha ao notificar dono:', e.message));
    }

    // ── 6. Timer de reabertura ──
    if (flags.fechar && flags.tempo > 0) {
        if (activeTimers.has(groupJid)) {
            clearTimeout(activeTimers.get(groupJid));
        }

        const timerId = setTimeout(async () => {
            activeTimers.delete(groupJid);
            try {
                await NazunaSock.groupSettingUpdate(groupJid, 'not_announcement');
                await NazunaSock.sendMessage(groupJid, { 
                    text: `✅ *O período de segurança de ${flags.tempo} minutos acabou.*\n\nO grupo foi reaberto e todos podem voltar a conversar livremente.`
                });
            } catch (e) {
                console.error(`[ANTI-STEALTH] Erro ao reabrir ${groupName}:`, e.message);
            }
        }, flags.tempo * 60 * 1000);

        if (timerId.unref) timerId.unref();
        activeTimers.set(groupJid, timerId);
    }

    console.log(`[ANTI-STEALTH] 🛡️ [${groupName}] Ação executada contra @${userName}`);
}

// ── Processamento principal ─────────────────────────────

export async function processAntiStealth(NazunaSock, m, performanceOptimizer) {
    if (m.type !== 'notify' && m.type !== 'append') return;
    
    const botIdPrefix = NazunaSock.user?.id?.split(':')[0];
    
    for (const info of m.messages) {
        if (info.key?.fromMe || !info.key?.remoteJid?.endsWith('@g.us')) continue;
        
        // Ignora mensagens de status/broadcast
        if (info.key?.remoteJid === 'status@broadcast') continue;
        
        const participant = info.key.participant || info.participant;
        const groupJid = info.key.remoteJid;

        // Daqui para baixo, apenas falhas de decriptação (Possível Stealth)
        if (!isDecryptionFailure(info)) continue;

        if (!participant || isOnCooldown(groupJid, participant)) continue;

        try {
            const groupFilePath = join(GRUPOS_DIR, `${groupJid}.json`);
            const groupData = await loadGroupData(true, groupJid, groupFilePath, 'Grupo', performanceOptimizer);
            
            if (!groupData?.antistealth) continue;
            if (shouldSkipParticipant(NazunaSock, participant, botIdPrefix, groupData)) continue;
            
            const config = getStealthConfig(groupData);
            
            // Controle de Strikes (Takeshi Logic)
            const strikeKey = `${groupJid}:${participant}`;
            let strikes = userStrikes.get(strikeKey) || { count: 0, lastTime: 0 };
            
            if (Date.now() - strikes.lastTime > REPEAT_WINDOW_MS) {
                strikes.count = 0;
            }
            
            strikes.count++;
            strikes.lastTime = Date.now();
            userStrikes.set(strikeKey, strikes);
            
            // Log detalhado para debug de detecção stealth
            console.log(`[ANTI-STEALTH DEBUG] Analisando @${participant.split('@')[0]} - Strikes: ${strikes.count}`);
            if (info.stealthMeta) {
                console.log(`[ANTI-STEALTH DEBUG] StealthMeta encontrada: tipo=${typeof info.stealthMeta}, isArray=${Array.isArray(info.stealthMeta)}, keys=${Object.keys(info.stealthMeta).join(',')}`);
                console.log(`[ANTI-STEALTH DEBUG] json:`, JSON.stringify(info.stealthMeta));
                console.log(`[ANTI-STEALTH DEBUG] decryptFail=${info.stealthMeta.decryptFail}, encType=${info.stealthMeta.encType}, failedToDecrypt=${info.stealthMeta.failedToDecrypt}`);
            } else {
                console.log(`[ANTI-STEALTH DEBUG] Sem StealthMeta. StubType: ${info.messageStubType}`);
            }

            const confidence = classifyConfidence(info, strikes.count);

            if (!confidence) {
                console.log(`[ANTI-STEALTH] ⚠️ Strike ${strikes.count}/${REPEAT_THRESHOLD} para @${participant.split('@')[0]} no grupo ${groupJid}`);
                continue;
            }
            
            if (await isProtectedGroupAdmin(NazunaSock, groupJid, participant)) {
                console.log(`[ANTI-STEALTH] Isencao aplicada para admin/dono @${participant.split('@')[0]} no grupo ${groupJid}`);
                continue;
            }

            if (confidence === 'high') {
                const isHide = info.stealthMeta === 'hide' || info.stealthMeta?.decryptFail === 'hide';
                const reason = isHide ? '(decrypt-fail=hide)' : '(Trava de Pagamento Oculta)';
                console.log(`[ANTI-STEALTH] 🔴 Ataque Stealth ALTA CONFIANÇA ${reason} detectado de @${participant.split('@')[0]}. Punição Imediata!`);
            } else {
                console.log(`[ANTI-STEALTH] 🔴 Ataque Stealth Múltiplo (${strikes.count}x em 2m) detectado de @${participant.split('@')[0]}. Punição Imediata!`);
            }
                
            config.stats.detected++;
            userStrikes.delete(strikeKey);
            registerCooldown(groupJid, participant);
            await executeAction(NazunaSock, groupJid, participant, config);
            persistGroupData(true, groupJid, groupFilePath, groupData, performanceOptimizer);

        } catch (e) {
            console.error(`[ANTI-STEALTH] Erro ao processar ${participant}:`, e?.message || e);
        }
    }
}

// ── Handler de comando ──────────────────────────────────

export async function handleAntistealthCommand({ 
    reply, args, isGroup, isGroupAdmin, isBotAdmin, from, 
    groupData, DATABASE_DIR, optimizer, MESSAGES, prefix, NazunaSock 
}) {
    if (!isGroup) return reply(MESSAGES.permission.groupOnly);
    if (!isGroupAdmin) return reply(MESSAGES.permission.userAdminOnly);
    if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);

    const sub = args[0]?.toLowerCase() || '';
    const val = args.slice(1).join(' ').toLowerCase().trim();
    const groupFilePath = join(DATABASE_DIR, `grupos/${from}.json`);

    // Toggle on/off
    if (!sub || sub === 'on' || sub === 'off') {
        if (sub === 'on') groupData.antistealth = true;
        else if (sub === 'off') groupData.antistealth = false;
        else groupData.antistealth = !groupData.antistealth;

        if (groupData.antistealth) getStealthConfig(groupData);

        await optimizer.saveJsonWithCache(groupFilePath, groupData);
        const config = getStealthConfig(groupData);
        return reply(groupData.antistealth 
            ? `🛡️ *ANTI-STEALTH ATIVADO*\n\nO sistema irá proteger o grupo contra mensagens Stealth.\n\n📌 *Ação configurada:*\n${describeAction(config.action)}\n\n💡 Use _${prefix}antistealth acao_ para configurar.`
            : `✅ *ANTI-STEALTH DESATIVADO*\n\nA proteção contra mensagens Stealth foi desligada.`);
    }

    // Status
    if (sub === 'status') {
        const config = getStealthConfig(groupData);
        const status = groupData.antistealth ? '✅ Ativado' : '❌ Desativado';
        const timerAtivo = activeTimers.has(from) ? '\n⏱️ Timer de reabertura ativo' : '';
        return reply(
            `🛡️ *ANTI-STEALTH — STATUS*\n\n` +
            `📌 Status: ${status}\n` +
            `⚡ Ação: ${config.action}${timerAtivo}\n\n` +
            `📋 *O que vai acontecer:*\n${describeAction(config.action)}\n\n` +
            `📊 *Estatísticas:*\n` +
            `• Detectadas: ${config.stats.detected}\n` +
            `• Bans: ${config.stats.banned}\n` +
            `• Fechamentos: ${config.stats.closed}`
        );
    }

    // Configurar ação
    if (sub === 'acao' || sub === 'ação' || sub === 'action') {
        if (val === 'abrir') {
            try {
                if (activeTimers.has(from)) {
                    clearTimeout(activeTimers.get(from));
                    activeTimers.delete(from);
                }
                await NazunaSock.groupSettingUpdate(from, 'not_announcement');
                return reply(`✅ O grupo foi *ABERTO* novamente.`);
            } catch (e) {
                return reply(`❌ Erro ao abrir o grupo: ${e.message}`);
            }
        }

        if (!val || !isValidAction(val)) {
            return reply(
                `🛡️ *ANTI-STEALTH — CONFIGURAR AÇÃO*\n\n` +
                `Monte sua ação combinando as peças:\n\n` +
                `🧩 *Peças disponíveis:*\n` +
                `• *banir* — Remove o infrator do grupo\n` +
                `• *fechar* — Fecha o grupo (só admins falam)\n` +
                `• *avisar* — Notifica o dono do bot no PV\n` +
                `• *[número]* — Tempo em minutos para reabrir (1-1440)\n\n` +
                `💡 *Exemplos de combinações:*\n` +
                `• _${prefix}antistealth acao banir_\n` +
                `• _${prefix}antistealth acao fechar_\n` +
                `• _${prefix}antistealth acao fechar banir_\n` +
                `• _${prefix}antistealth acao avisar fechar 30_\n\n` +
                `🔧 Use _${prefix}antistealth acao abrir_ para abrir o grupo.`
            );
        }

        const config = getStealthConfig(groupData);
        config.action = val;
        await optimizer.saveJsonWithCache(groupFilePath, groupData);
        return reply(
            `🛡️ *ANTI-STEALTH — AÇÃO CONFIGURADA*\n\n` +
            `⚡ Ação: *${val}*\n\n` +
            `📋 *O que vai acontecer ao detectar stealth:*\n${describeAction(val)}`
        );
    }

    // Ajuda
    return reply(
        `🛡️ *ANTI-STEALTH — COMANDOS*\n\n` +
        `• _${prefix}antistealth_ — Ativar/desativar\n` +
        `• _${prefix}antistealth on/off_ — Ativar/desativar\n` +
        `• _${prefix}antistealth status_ — Ver status e estatísticas\n` +
        `• _${prefix}antistealth acao_ — Configurar ação (monte sua combinação)\n` +
        `• _${prefix}antistealth acao abrir_ — Abre o grupo`
    );
}

