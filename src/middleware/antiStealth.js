import { join } from 'path';
import { loadGroupData, persistGroupData } from '../utils/groupManager.js';
import { GRUPOS_DIR } from '../utils/paths.js';
import { NUMERODONO } from '../config.js';

// ── Constantes ──────────────────────────────────────────
const BAN_COOLDOWN_MS = 10_000;
const CACHE_CLEANUP_INTERVAL_MS = 60_000;
const DEFAULT_ACTION = 'banir';

// messageStubType 2 = CIPHERTEXT (falha de E2E real)
const STEALTH_STUB_TYPES = new Set([2]);

// Flags de ação válidas (qualquer combinação dessas)
const VALID_FLAGS = new Set(['banir', 'fechar', 'avisar']);

// ── Caches ──────────────────────────────────────────────
const recentBans = new Map();
const activeTimers = new Map();
const userStrikes = new Map(); // key -> { count: number, lastTime: number }

// Sistema de Punição Pendente (Delay para falso positivo de Lag)
const pendingPunishments = new Map(); // messageId -> { timer, groupJid, participant }

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

// ── Parser de ação ──────────────────────────────────────

/**
 * Interpreta a string de ação composta e retorna um objeto de flags.
 * Ex: "avisar fechar banir 30 limite 3" → { avisar: true, fechar: true, banir: true, tempo: 30, limite: 3 }
 * Ex: "banir"                  → { banir: true, fechar: false, avisar: false, tempo: 0, limite: 1 }
 */
function parseAction(actionStr) {
    const parts = (actionStr || DEFAULT_ACTION).toLowerCase().split(/\s+/);
    const result = { banir: false, fechar: false, avisar: false, tempo: 0, limite: 1 };

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (VALID_FLAGS.has(part)) {
            result[part] = true;
        } else if (part === 'limite' || part === 'vezes') {
            const num = parseInt(parts[i+1]);
            if (!isNaN(num) && num >= 1) {
                result.limite = num;
                i++; // Pula o número
            }
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
        } else if (part === 'limite' || part === 'vezes') {
            const num = parseInt(parts[i+1]);
            if (isNaN(num) || num < 1) return false;
            i++;
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
    if (flags.limite > 1) {
        parts.push(`⚖️ Tolerância: ${flags.limite} mensagens (depois disso a ação é tomada)`);
    } else {
        parts.push(`⚖️ Tolerância: Nenhuma (ação imediata)`);
    }
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

// ── Configuração ────────────────────────────────────────

function getStealthConfig(groupData) {
    if (!groupData.antistealthConfig) {
        groupData.antistealthConfig = {
            action: DEFAULT_ACTION,
            stats: { detected: 0, banned: 0, closed: 0 }
        };
    }
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
        
        const participant = info.key.participant || info.participant;
        const groupJid = info.key.remoteJid;
        const msgId = info.key.id;

        // Se recebemos uma mensagem válida (não falhou) e ela estava na lista de ban pendente (foi um Lag)
        if (!isDecryptionFailure(info) && info.message) {
            if (msgId && pendingPunishments.has(msgId)) {
                const pending = pendingPunishments.get(msgId);
                clearTimeout(pending.timer);
                pendingPunishments.delete(msgId);
                
                // Reduz um strike já que era falso positivo
                const strikeKey = `${groupJid}:${participant}`;
                let strikes = userStrikes.get(strikeKey);
                if (strikes && strikes.count > 0) strikes.count--;
                
                console.log(`[ANTI-STEALTH] 🟢 Falso Positivo Evitado! Mensagem de @${participant.split('@')[0]} decriptada via retry (Era apenas Lag).`);
            }
            continue;
        }

        // Daqui para baixo, apenas falhas de decriptação (Possível Stealth)
        if (!isDecryptionFailure(info)) continue;

        if (!participant || isOnCooldown(groupJid, participant)) continue;
        if (botIdPrefix && participant.startsWith(botIdPrefix)) continue;

        try {
            const groupFilePath = join(GRUPOS_DIR, `${groupJid}.json`);
            const groupData = await loadGroupData(true, groupJid, groupFilePath, 'Grupo', performanceOptimizer);
            
            if (!groupData?.antistealth) continue;
            if (shouldSkipParticipant(participant, botIdPrefix, groupData)) continue;
            
            const config = getStealthConfig(groupData);
            const flags = parseAction(config.action);
            
            // Controle de Limite / Strikes
            const strikeKey = `${groupJid}:${participant}`;
            let strikes = userStrikes.get(strikeKey) || { count: 0, lastTime: 0 };
            strikes.count++;
            strikes.lastTime = Date.now();
            userStrikes.set(strikeKey, strikes);
            
            if (strikes.count < flags.limite) {
                console.log(`[ANTI-STEALTH] ⚠️ Strike ${strikes.count}/${flags.limite} para @${participant.split('@')[0]} no grupo ${groupJid}`);
                persistGroupData(true, groupJid, groupFilePath, groupData, performanceOptimizer);
                continue;
            }
            
            // Bateu no limite. Ao invés de banir imediatamente, damos 15 segundos de chance.
            // Isso evita banir quem está apenas lagado (que envia a chave de decriptação via retry automático logo depois).
            // Se o infrator mandar mais de um stealth enquanto o timer roda, ele é banido na hora.
            
            const isSpammingStealth = pendingPunishments.size > 0 && Array.from(pendingPunishments.values()).some(p => p.participant === participant && p.groupJid === groupJid);
            
            if (isSpammingStealth) {
                console.log(`[ANTI-STEALTH] 🔴 Ataque Stealth Múltiplo detectado de @${participant.split('@')[0]}. Punição Imediata!`);
                // Cancela os timers pendentes desse usuário para não punir 2x
                for (const [id, p] of pendingPunishments.entries()) {
                    if (p.participant === participant && p.groupJid === groupJid) {
                        clearTimeout(p.timer);
                        pendingPunishments.delete(id);
                    }
                }
                
                config.stats.detected++;
                userStrikes.delete(strikeKey);
                registerCooldown(groupJid, participant);
                await executeAction(NazunaSock, groupJid, participant, config);
                persistGroupData(true, groupJid, groupFilePath, groupData, performanceOptimizer);
                continue;
            }

            // Agendando punição (Delay para tolerância a lag)
            console.log(`[ANTI-STEALTH] ⏳ Punição pendente para @${participant.split('@')[0]}. Aguardando 15s por retry (Lag Detection)...`);
            
            const timer = setTimeout(async () => {
                pendingPunishments.delete(msgId);
                
                // Se chegou aqui, a mensagem não foi decriptada a tempo. É stealth de verdade (ou um lag muito demorado).
                config.stats.detected++;
                userStrikes.delete(strikeKey);
                registerCooldown(groupJid, participant);
                
                await executeAction(NazunaSock, groupJid, participant, config);
                persistGroupData(true, groupJid, groupFilePath, groupData, performanceOptimizer);
                
            }, 15000); // 15 segundos
            
            if (timer.unref) timer.unref();
            pendingPunishments.set(msgId, { timer, groupJid, participant });

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
                `• *limite [N]* — Tolera N mensagens antes de punir\n` +
                `• *[número]* — Tempo em minutos para reabrir (1-1440)\n\n` +
                `💡 *Exemplos de combinações:*\n` +
                `• _${prefix}antistealth acao banir_\n` +
                `• _${prefix}antistealth acao fechar_\n` +
                `• _${prefix}antistealth acao fechar banir_\n` +
                `• _${prefix}antistealth acao avisar fechar 30 limite 3_\n` +
                `• _${prefix}antistealth acao banir limite 5_\n\n` +
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

