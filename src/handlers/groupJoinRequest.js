import path from 'path';
import { fileURLToPath } from 'url';
import CaptchaIndex from '../utils/captchaIndex.js';
import { checkAntifake, logAntifakeAction } from '../utils/antifakeGuard.js';
import { findInBlacklistMap, loadJsonFile } from '../utils/helpers.js';
import { MESSAGES } from '../utils/messages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATABASE_DIR = path.join(__dirname, '..', '..', 'dados', 'database');
const DONO_DIR = path.join(DATABASE_DIR, 'dono');
const GLOBAL_BLACKLIST_PATH = path.join(DONO_DIR, 'globalBlacklist.json');
const DEBUG_MODE = process.env.DEBUG_MODE === 'true';
const joinRequestCache = new Map();

async function loadGroupSettings(groupId) {
    const groupFilePath = path.join(DATABASE_DIR, 'grupos', `${groupId}.json`);
    try {
        return loadJsonFile(groupFilePath, {}, true);
    } catch (e) {
        console.error(`❌ Erro ao ler configurações do grupo ${groupId}: ${e.message}`);
        return {};
    }
}

async function loadGlobalBlacklist() {
    try {
        const data = loadJsonFile(GLOBAL_BLACKLIST_PATH, {}, true);
        return data.users || {};
    } catch (e) {
        console.error(`❌ Erro ao ler blacklist global: ${e.message}`);
        return {};
    }
}

export async function handleGroupJoinRequest(ChainySock, inf) {
    try {
        const typeIds = { id: '', lid: '', participant: '' };
        const from = inf.id;
        let participantJid = inf.participantPn || inf.participant;

        if (!from || !participantJid) return;

        // Deduplicação — Baileys dispara eventos duplicados
        const cacheKey = `${from}_${typeof participantJid === 'string' ? participantJid : JSON.stringify(participantJid)}`;
        const now = Date.now();
        if (joinRequestCache.has(cacheKey) && (now - joinRequestCache.get(cacheKey)) < 10000) return;
        joinRequestCache.set(cacheKey, now);
        if (joinRequestCache.size > 500) {
            for (const [key, ts] of joinRequestCache) {
                if (ts < now - 10000) joinRequestCache.delete(key);
            }
        }

        if (typeof participantJid === "object") {
            Object.assign(typeIds, {
                id: participantJid?.pn?.endsWith("s.whatsapp.net") ? participantJid?.pn : '',
                lid: participantJid?.pn?.endsWith("lid") ? participantJid?.pn : participantJid?.lid,
            });
            participantJid = participantJid.pn || participantJid.lid;
        } else {
            typeIds.lid = participantJid.endsWith("lid") ? participantJid : '';
            typeIds.id = participantJid.endsWith("s.whatsapp.net") ? participantJid : '';
        }

        typeIds.participant = participantJid;

        if (global.CAPTCHA_LOCK) {
            global.CAPTCHA_LOCK.add(participantJid);
            if (typeIds.lid) global.CAPTCHA_LOCK.add(typeIds.lid);
            if (typeIds.id) global.CAPTCHA_LOCK.add(typeIds.id);
        }

        const groupSettings = await loadGroupSettings(from);
        const globalBlacklist = await loadGlobalBlacklist();

        // Verificar blacklist global e do grupo antes de aceitar
        const participantNumberJR = participantJid.split('@')[0];
        const jidCheck = `${participantNumberJR}@s.whatsapp.net`;
        const lidCheck = typeIds.lid || null;
        const inGlobalBL = findInBlacklistMap(globalBlacklist, participantJid) || findInBlacklistMap(globalBlacklist, jidCheck) || (lidCheck && findInBlacklistMap(globalBlacklist, lidCheck));
        const inGroupBL = findInBlacklistMap(groupSettings.blacklist, participantJid) || findInBlacklistMap(groupSettings.blacklist, jidCheck) || (lidCheck && findInBlacklistMap(groupSettings.blacklist, lidCheck));
        if (inGlobalBL || inGroupBL) {
            const tipoBlacklist = inGlobalBL ? 'global' : 'grupo';
            if (DEBUG_MODE) console.log(`🚫 [Blacklist] Rejeitando pedido de ${participantJid} (blacklist ${tipoBlacklist})`);
            try {
                await ChainySock.groupRequestParticipantsUpdate(from, [participantJid], 'reject');
            } catch (err) {
                console.error(`❌ [Blacklist] Erro ao rejeitar ${participantJid}:`, err.message);
            }
            return;
        }

        const antifakeResult = await checkAntifake(participantJid, groupSettings, ChainySock);
        if (!antifakeResult.allowed) {
            console.log(`🛡️ [AntiFake] Rejeitando: ${participantJid} (${antifakeResult.number})`);
            try {
                await ChainySock.groupRequestParticipantsUpdate(from, [participantJid], 'reject');
            } catch (err) {
                console.error(`❌ [AntiFake] Erro ao rejeitar ${participantJid}:`, err.message);
            }
            await logAntifakeAction(from, {
                number: antifakeResult.number,
                action: 'reject',
                reason: antifakeResult.reason,
                resolvedFrom: participantJid
            });
            return;
        }

        if (groupSettings.autoAcceptRequests) {
            if (DEBUG_MODE) console.log(`[Auto-Accept] Aceitando ${participantJid} no grupo ${from}`);
            await ChainySock.groupRequestParticipantsUpdate(from, [participantJid], 'approve');
            if (!groupSettings.captchaEnabled) return;
        }

        if (groupSettings.captchaEnabled) {
            const num1 = Math.floor(Math.random() * 10) + 1;
            const num2 = Math.floor(Math.random() * 10) + 1;
            const answer = num1 + num2;
            const timeAt = 5 * 60 * 1000;
            const expiresAt = Date.now() + timeAt;
            const numero = participantJid.split('@')[0];

            let nome = inf.participant;
            try {
                nome = await ChainySock.getName(participantJid);
            } catch { }

            CaptchaIndex.add(typeIds, from, answer, expiresAt, nome);

            await ChainySock.sendMessage(from, {
                text: MESSAGES.handlers.groupEvents.captchaSecurityVerification(numero, num1, num2),
                mentions: [participantJid]
            });
        }
    } catch (error) {
        console.error(`❌ Erro em handleGroupJoinRequest: ${error.message}`);
    }
}
