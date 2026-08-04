import { join } from 'path';
import { NUMERODONO } from '../config.js';
import config from '../config.js';
import { MESSAGES } from '../utils/messages.js';
import { idsMatch, removeDeviceId } from '../utils/helpers.js';
import { GRUPOS_DIR } from '../utils/paths.js';
import groupCache from '../utils/groupCache.js';
import { isWatcherInGroup } from '../services/watcherService.js';
import db from '../utils/database/io.js';

// ── CONSTANTES E ESTADO EM MEMÓRIA ────────────────────────────────
const STEALTH_WINDOW_MS = 4_000;
const DEFAULT_ACTION = 'banir';
const PUNISHMENT_COOLDOWN_MS = 30_000;

const userStates = new Map();
const recentlyPunished = new Map();
const mainBotReceivedKeys = new Set();

/**
 * Registra mensagem recebida e processada pelo bot principal.
 */
export function registerMainBotReceivedMsg(msgId) {
    if (!msgId) return;
    mainBotReceivedKeys.add(msgId);
    if (mainBotReceivedKeys.size > 2000) {
        const firstKey = mainBotReceivedKeys.values().next().value;
        mainBotReceivedKeys.delete(firstKey);
    }
}

export function hasMainBotReceivedMsg(msgId) {
    if (!msgId) return false;
    return mainBotReceivedKeys.has(msgId);
}

/**
 * Identifica se a mensagem é um Stub de falha de sessão/criptografia (StubType 2).
 */
export function isNoSessionDecryptMessage(info) {
    if (!info?.message && info?.messageStubType === 2) {
        const params = info.messageStubParameters || [];
        if (params.length === 0) return true;
        return params.some(p => typeof p === 'string' && /decrypt|session|cipher|no session/i.test(p));
    }
    return false;
}

function getState(groupId, sender) {
    const key = `${groupId}:${sender}`;
    let state = userStates.get(key);
    if (!state) {
        if (userStates.size > 1000) {
            const firstKey = userStates.keys().next().value;
            userStates.delete(firstKey);
        }
        state = { normalMessages: 0, stealthTimestamps: [] };
        userStates.set(key, state);
    }
    return state;
}

export function countNormalGroupMessage(groupId, sender) {
    const state = getState(groupId, sender);
    state.normalMessages += 1;
    state.stealthTimestamps = [];
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

function isImmune(groupJid, participantLid) {
    const meta = groupCache.get(groupJid);
    if (!meta) return false;
    return meta.participants?.some(p => p.admin && idsMatch(p.id, participantLid)) || false;
}

// ── PROCESSAMENTO PRINCIPAL ANTI-STEALTH ──────────────────────────
export async function processAntiStealth(ChainySock, m) {
    if (m.type !== 'notify' && m.type !== 'append') return;
    if (!m.messages || !Array.isArray(m.messages)) return;

    const botId = ChainySock?.user?.id?.split(':')[0];
    const ownerLid = config.lidowner;
    const ownerJid = NUMERODONO ? `${NUMERODONO}@s.whatsapp.net` : null;
    const now = Date.now();

    for (const info of m.messages) {
        const groupJid = info.key?.remoteJid;
        const rawParticipant = info.key?.participant || info.participant;
        const participant = rawParticipant ? removeDeviceId(rawParticipant) : null;
        const fromMe = info.key?.fromMe ?? false;
        const isGroup = groupJid?.endsWith('@g.us') ?? false;

        if (fromMe || !isGroup || !participant) continue;
        if (isWatcherInGroup(groupJid) && !m?.fromWatcher) continue;

        const isNoSession = isNoSessionDecryptMessage(info);
        if (!isNoSession) {
            if (info.message) countNormalGroupMessage(groupJid, participant);
            continue;
        }

        const groupData = db.read(join(GRUPOS_DIR, `${groupJid}.json`), {});
        if (!groupData?.antistealth) continue;

        if ((botId && idsMatch(participant, botId)) || (ownerLid && idsMatch(participant, ownerLid)) || (ownerJid && idsMatch(participant, ownerJid))) continue;
        if (isImmune(groupJid, participant)) continue;

        const punishKey = `${groupJid}:${participant}`;
        const lastPunishTime = recentlyPunished.get(punishKey);
        if (lastPunishTime && (now - lastPunishTime) < PUNISHMENT_COOLDOWN_MS) continue;

        const cfg = getStealthConfig(groupData);
        const state = getState(groupJid, participant);
        state.stealthTimestamps = [...state.stealthTimestamps, now].filter(t => now - t <= STEALTH_WINDOW_MS);

        const threshold = state.normalMessages === 0 ? 2 : Math.max(2, cfg.limit || 3);
        if (state.stealthTimestamps.length < threshold) continue;

        recentlyPunished.set(punishKey, now);
        cfg.stats.detected++;
        state.stealthTimestamps = [];

        // Punição: apagar mensagem, remover infrator e notificar no grupo
        const adminSock = global.sockAdmin || ChainySock;
        const userName = participant.split('@')[0].split(':')[0];

        try { if (info.key) await adminSock.sendMessage(groupJid, { delete: info.key }); } catch {}
        try { await adminSock.groupParticipantsUpdate(groupJid, [removeDeviceId(participant)], 'remove'); cfg.stats.banned++; } catch {}

        adminSock.sendMessage(groupJid, {
            text: MESSAGES.middleware.antiStealth.alert(userName, 'removido(a) do grupo por envio de mensagens Stealth/Criptografadas.'),
            mentions: [participant]
        }).catch(() => {});

        db.writeSafe(join(GRUPOS_DIR, `${groupJid}.json`), groupData);
    }
}

export async function processAntiStealthUpdate() {}
