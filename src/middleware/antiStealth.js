import { join } from 'path';
import { NUMERODONO } from '../config.js';
import config from '../config.js';
import { MESSAGES } from '../utils/messages.js';
import { sendCleanChat } from '../utils/cleanChat.js';
import { idsMatch } from '../utils/helpers.js';
import { GRUPOS_DIR } from '../utils/paths.js';
import db from '../utils/database/io.js';
import groupCache from '../utils/groupCache.js';

const STEALTH_WINDOW_MS = 4_000;
const DEFAULT_ACTION = 'banir';
const STATS_PERSIST_DEBOUNCE_MS = 5_000;

const userStates = new Map();
const recentlyPunished = new Map();
const PUNISHMENT_COOLDOWN_MS = 30_000;

function getState(groupId, sender) {
    const key = `${groupId}:${sender}`;
    let state = userStates.get(key);
    if (!state) {
        state = { normalMessages: 0, stealthTimestamps: [] };
        userStates.set(key, state);
    }
    return state;
}

export function isNoSessionDecryptMessage(info) {
    // 2 = CIPHERTEXT (Stealth padrão)
    if (info.messageStubType === 2) {
        const params = info.messageStubParameters || [];
        if (params.length === 0) return true;
        return params.some(p => typeof p === 'string' && /decrypt|session|cipher|no session/i.test(p));
    }
    // 34 = BROADCAST_CREATE, 35 = BROADCAST_ADD, 36 = BROADCAST_REMOVE (Injeções suspeitas em grupos)
    if (info.messageStubType === 34 || info.messageStubType === 35 || info.messageStubType === 36) {
        return true;
    }
    return false;
}

function getGroupDataSync(groupJid) {
    return db.read(join(GRUPOS_DIR, `${groupJid}.json`), {});
}

function persistGroupDataDebounced(groupJid, groupData) {
    db.debounced(join(GRUPOS_DIR, `${groupJid}.json`), groupData, STATS_PERSIST_DEBOUNCE_MS);
}

function getGroupOwner(groupJid) {
    const meta = groupCache.get(groupJid);
    return meta?.owner || meta?.participants?.find(p => p.admin === 'superadmin')?.id || null;
}

function isImmune(groupJid, participantLid) {
    const meta = groupCache.get(groupJid);
    if (!meta) return false;
    return meta.participants?.some(p => p.admin && idsMatch(p.id, participantLid)) || false;
}

export function getStealthConfig(groupData) {
    if (!groupData.antistealthConfig) {
        groupData.antistealthConfig = { action: DEFAULT_ACTION, limit: 3, stats: { detected: 0, banned: 0, closed: 0 } };
    }
    const cfg = groupData.antistealthConfig;
    cfg.action = cfg.action || DEFAULT_ACTION;
    cfg.limit = Number.isInteger(cfg.limit) && cfg.limit > 0 ? cfg.limit : 3;
    cfg.stats = cfg.stats || { detected: 0, banned: 0, closed: 0 };
    return cfg;
}

function parseAction(actionStr, limitVal) {
    const action = String(actionStr || DEFAULT_ACTION).toLowerCase();
    return {
        banir: action === 'banir' || action === '1' || (!action.includes('fechar') && !action.includes('avisar') && action !== '2' && action !== '3'),
        fechar: action === 'fechar' || action === '2',
        avisar: action === 'avisar' || action === '3',
        tempo: 5,
        limite: Number.isInteger(limitVal) && limitVal > 0 ? limitVal : 3
    };
}

export function describeAction(actionStr) {
    const action = String(actionStr || DEFAULT_ACTION).toLowerCase();
    if (action === 'fechar' || action === '2') return '🔒 Fechar o grupo por 5 minutos';
    if (action === 'avisar' || action === '3') return '📢 Apenas avisar o dono do bot';
    return '🚫 Banir o infrator imediatamente';
}

export function isValidAction(val) {
    return ['banir', '1', 'fechar', '2', 'avisar', '3'].includes(String(val).toLowerCase());
}

export function hasActiveStealthTimer() { return false; }
export function clearActiveStealthTimer() { return false; }

async function executeAction(ChainySock, groupJid, participantLid, cfg) {
    const flags = parseAction(cfg.action, cfg.limit);
    const userName = participantLid.split('@')[0].split(':')[0];
    const groupName = groupCache.get(groupJid)?.subject || groupJid;
    const adminSock = global.sockAdmin || ChainySock;

    const mentions = [participantLid];
    let actionText = 'uma ação de segurança foi tomada';
    if (flags.banir && flags.fechar) {
        actionText = 'removido(a) do grupo e o grupo foi fechado por 5 minutos';
    } else if (flags.banir) {
        actionText = 'removido(a) do grupo';
    } else if (flags.fechar) {
        actionText = 'o grupo foi fechado por 5 minutos';
    }

    let groupMsg = MESSAGES.middleware.antiStealth.alert(userName, actionText);

    if (flags.avisar) {
        const groupOwnerLid = getGroupOwner(groupJid);
        if (groupOwnerLid) {
            mentions.push(groupOwnerLid);
            groupMsg += MESSAGES.middleware.antiStealth.alertOwnerWarning(groupOwnerLid.split('@')[0]);
        }
    }
    groupMsg += MESSAGES.middleware.antiStealth.alertFooter;

    await adminSock.sendMessage(groupJid, { text: groupMsg, mentions }).catch(() => {});

    if (flags.fechar) {
        cfg.stats.closed++;
        await adminSock.groupSettingUpdate(groupJid, 'announcement').catch(() => {});
        setTimeout(async () => {
            await adminSock.groupSettingUpdate(groupJid, 'not_announcement').catch(() => {});
            await adminSock.sendMessage(groupJid, { text: MESSAGES.middleware.antiStealth.periodEnded(flags.tempo) }).catch(() => {});
        }, flags.tempo * 60 * 1000).unref?.();
    }

    if (flags.banir) {
        cfg.stats.banned++;
        try {
            await adminSock.groupParticipantsUpdate(groupJid, [participantLid], 'remove');
        } catch (e) {
            // Silenciar erro ao remover
        }
        sendCleanChat({ socket: adminSock, remoteJid: groupJid }).catch(() => {});
    }

    if (flags.avisar && NUMERODONO) {
        const donoJid = `${NUMERODONO}@s.whatsapp.net`;
        const acoesFeitas = [];
        if (flags.banir) acoesFeitas.push('🚫 Banido');
        if (flags.fechar) acoesFeitas.push(`🔒 Grupo fechado por ${flags.tempo}m`);

        adminSock.sendMessage(donoJid, {
            text: MESSAGES.middleware.antiStealth.ownerNotification(groupName, userName, acoesFeitas.join(' | ') || 'Nenhuma'),
            mentions: [participantLid]
        }).catch(() => {});
    }
}

export function countNormalGroupMessage(groupId, sender) {
    const state = getState(groupId, sender);
    state.normalMessages += 1;
    state.stealthTimestamps = [];
}

export async function processAntiStealth(ChainySock, m) {
    if (m.type !== 'notify' && m.type !== 'append') {
        return;
    }

    const botId = ChainySock.user?.id?.split(':')[0];
    const ownerLid = config.lidowner;
    const ownerJid = NUMERODONO ? `${NUMERODONO}@s.whatsapp.net` : null;

    const punishedParticipants = new Set();
    const now = Date.now();

    if (recentlyPunished.size > 500) {
        const limitTime = now - PUNISHMENT_COOLDOWN_MS;
        for (const [key, val] of recentlyPunished.entries()) {
            if (val < limitTime) recentlyPunished.delete(key);
        }
    }

    for (const info of m.messages) {
        const groupJid = info.key?.remoteJid;
        const participant = info.key?.participant || info.participant;
        const fromMe = info.key?.fromMe ?? false;
        const isGroup = groupJid?.endsWith('@g.us') ?? false;

        if (fromMe || !isGroup) {
            continue;
        }

        if (!participant) {
            continue;
        }

        const punishKey = `${groupJid}:${participant}`;
        if (punishedParticipants.has(punishKey)) {
            continue;
        }

        const lastPunishTime = recentlyPunished.get(punishKey);
        if (lastPunishTime && (now - lastPunishTime) < PUNISHMENT_COOLDOWN_MS) {
            continue;
        }

        const isNoSession = isNoSessionDecryptMessage(info);

        if (!isNoSession) {
            if (info.message) {
                countNormalGroupMessage(groupJid, participant);
            }
            continue;
        }

        // ── É noSession ──────────────────────────────────────────────────────
        const groupData = getGroupDataSync(groupJid);

        if (!groupData?.antistealth) {
            continue;
        }

        if (botId && idsMatch(participant, botId)) {
            continue;
        }
        if ((ownerLid && idsMatch(participant, ownerLid)) || (ownerJid && idsMatch(participant, ownerJid))) {
            continue;
        }

        const cfg = getStealthConfig(groupData);
        const flags = parseAction(cfg.action, cfg.limit);
        const state = getState(groupJid, participant);

        state.stealthTimestamps = state.stealthTimestamps.filter(t => now - t <= STEALTH_WINDOW_MS);
        state.stealthTimestamps.push(now);

        const threshold = state.normalMessages === 0 ? 2 : Math.max(2, flags.limite);

        if (state.stealthTimestamps.length < threshold) {
            continue;
        }

        const immune = isImmune(groupJid, participant);
        if (immune) {
            continue;
        }

        // ── Punição ──────────────────────────────────────────────────────────
        punishedParticipants.add(punishKey);
        recentlyPunished.set(punishKey, now);

        cfg.stats.detected++;
        state.stealthTimestamps = [];

        if (info.key) {
            const adminSock = global.sockAdmin || ChainySock;
            await adminSock.sendMessage(groupJid, { delete: info.key }).catch(() => {});
        }

        await executeAction(ChainySock, groupJid, participant, cfg);
        persistGroupDataDebounced(groupJid, groupData);
    }
}

export async function processAntiStealthUpdate() {}
