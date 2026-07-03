import path from 'path';
import { fileURLToPath } from 'url';
import CaptchaIndex from '../utils/captchaIndex.js';
import { resolveParticipant } from '../utils/resolveParticipant.js';
import { checkAntifake, logAntifakeAction } from '../utils/antifakeGuard.js';
import { findInBlacklistMap, loadJsonFile } from '../utils/helpers.js';
import { MESSAGES } from '../utils/messages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATABASE_DIR = path.join(__dirname, '..', '..', 'dados', 'database');
const DONO_DIR = path.join(DATABASE_DIR, 'dono');
const GLOBAL_BLACKLIST_PATH = path.join(DONO_DIR, 'globalBlacklist.json');
const DEBUG_MODE = process.env.DEBUG_MODE === 'true';

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

function formatMessageText(template, replacements) {
    let text = template;
    for (const [key, value] of Object.entries(replacements)) {
        text = text.replaceAll(key, value);
    }
    return text;
}

async function createGroupMessage(ChainySock, groupMetadata, participants, settings, isWelcome = true) {
    const jsonGp = await loadGroupSettings(groupMetadata.id);
    const mentions = participants.map(p => p);
    const replacements = {
        '#numerodele#': participants.map(p => `@${p.split('@')[0]}`).join(', '),
        '#nomedogp#': groupMetadata.subject,
        '#desc#': groupMetadata.desc || 'Nenhuma',
        '#membros#': groupMetadata.participants.length,
    };
    const defaultText = isWelcome ?
        (jsonGp.textbv ? jsonGp.textbv : MESSAGES.handlers.groupEvents.welcomeDefault) :
        (jsonGp.exit?.text ? jsonGp.exit.text : MESSAGES.handlers.groupEvents.exitDefault);
    
    const text = formatMessageText(settings.text || defaultText, replacements);
    const message = { text, mentions };
    
    if (settings.image) {
        const image = settings.image !== 'banner' ? { url: settings.image } : null;
        if (image) {
            message.image = image;
            message.caption = text;
            delete message.text;
        }
    }
    return message;
}

function isValidParticipant(participant) {
    if (typeof participant === 'string') {
        if (participant.trim().length === 0) return false;
        return participant;
    }
    
    if (participant && typeof participant === 'object' && participant.hasOwnProperty('id')) {
        const id = participant.id;
        if (id === null || id === undefined || id === '') return false;
        if (typeof id === 'string' && id.trim().length === 0) return false;
        if (id === 0) return false;
        return id;
    }
    
    return false;
}

async function handleParticipantAdd(ChainySock, from, inf, groupMetadata, groupSettings, globalBlacklist) {
    const membersToWelcome = [];
    const membersToRemove = [];
    const removalReasons = [];
    const entradaPorLink = !inf.author || inf.participants.includes(inf.author);

    // Resolvendo participantes em paralelo para otimizar tempo de resposta (sem travar o event loop com onWhatsApp sequencial)
    const resolvedParticipants = await Promise.all(
        inf.participants.map(p => resolveParticipant(p, ChainySock, groupMetadata))
    );

    for (let i = 0; i < inf.participants.length; i++) {
        const participant = inf.participants[i];
        const resolved = resolvedParticipants[i];
        const participantNumber = resolved.number;
        const participantStripped = participant.replace(/@.*/, '');
        const isLid = resolved.isLid;
        const jid = resolved.jid || `${participantNumber}@s.whatsapp.net`;
        const lid = resolved.lid || (isLid ? participant : null);

        const inGlobalBlacklist = findInBlacklistMap(globalBlacklist, participant) || findInBlacklistMap(globalBlacklist, jid) || (lid && findInBlacklistMap(globalBlacklist, lid));
        if (inGlobalBlacklist) {
            membersToRemove.push(participant);
            removalReasons.push(MESSAGES.handlers.groupEvents.blacklistGlobalReason(participantNumber));
            continue;
        }

        const inGroupBlacklist = findInBlacklistMap(groupSettings.blacklist, participant) || findInBlacklistMap(groupSettings.blacklist, jid) || (lid && findInBlacklistMap(groupSettings.blacklist, lid));
        if (inGroupBlacklist) {
            membersToRemove.push(participant);
            removalReasons.push(MESSAGES.handlers.groupEvents.blacklistGroupReason(participantNumber));
            continue;
        }

        const antifakeResult = await checkAntifake(participant, groupSettings, ChainySock, groupMetadata);
        if (!antifakeResult.allowed) {
            membersToRemove.push(participant);
            
            // Se o grupo não tem modo de aprovação, envia uma mensagem direta
            if (!groupMetadata.approveNewParticipants && !groupMetadata.joinApprovalMode) {
                const msgAntiFake = MESSAGES.handlers.groupEvents.antifakeRemoved(antifakeResult.number, antifakeResult.reason);
                await ChainySock.sendMessage(from, { 
                    text: msgAntiFake, 
                    mentions: [participant] 
                }).catch(() => {});
            } else {
                // Se tiver modo de aprovação (e entraram por outro meio), acumula no aviso coletivo
                removalReasons.push(MESSAGES.handlers.groupEvents.antifakeReason(antifakeResult.number, antifakeResult.reason));
            }

            await logAntifakeAction(from, {
                number: antifakeResult.number,
                action: 'remove',
                reason: antifakeResult.reason,
                resolvedFrom: participant
            });
            continue;
        }

        // Verifica captchas pendentes a partir do estado em memória
        const stats = CaptchaIndex.stats();
        const captchaList = Object.values(stats.ids || {});
        const hasCaptchaJson = captchaList.find(c => {
            const l = c.lid?.replace(/@.*/, '');
            const id = c.id?.replace(/@.*/, '');
            const idOrigin = c.idOrigin?.replace(/@.*/, '');
            return (
                l === participantStripped ||
                id === participantStripped ||
                id === participantNumber ||
                idOrigin === participantStripped ||
                idOrigin === participantNumber
            );
        });

        const hasCaptchaLock = global.CAPTCHA_LOCK ? [...global.CAPTCHA_LOCK].some(x => {
            const xStripped = x.replace(/@.*/, '');
            return xStripped === participantNumber;
        }) : false;

        if (groupSettings.captchaEnabled) {
            if (hasCaptchaJson || hasCaptchaLock) continue;
            if (!entradaPorLink) continue;
            if (isLid && participantNumber === participantStripped) continue;

            if (global.CAPTCHA_LOCK) global.CAPTCHA_LOCK.add(`${participantNumber}@s.whatsapp.net`);

            const typeIds = {
                id: `${participantNumber}@s.whatsapp.net`,
                lid: isLid ? participant : '',
                participant
            };

            const num1 = Math.floor(Math.random() * 10) + 1;
            const num2 = Math.floor(Math.random() * 10) + 1;
            const answer = num1 + num2;
            const expiresAt = Date.now() + 5 * 60 * 1000;

            CaptchaIndex.add(typeIds, from, answer, expiresAt, participantNumber);

            await ChainySock.sendMessage(from, {
                text: MESSAGES.handlers.groupEvents.captchaVerification(participantNumber, num1, num2),
                mentions: [`${participantNumber}@s.whatsapp.net`]
            });

            continue; 
        }

        if (groupSettings.bemvindo) {
            membersToWelcome.push(resolved.lid || participant);
        }
    }

    if (membersToRemove.length) {
        await ChainySock.groupParticipantsUpdate(from, membersToRemove, 'remove').catch(() => {});
        
        if (removalReasons.length) {
            await ChainySock.sendMessage(from, {
                text: MESSAGES.handlers.groupEvents.removedList(removalReasons.join('\n- ')),
                mentions: membersToRemove
            }).catch(() => {});
        }
    }

    if (membersToWelcome.length) {
        const message = await createGroupMessage(
            ChainySock,
            groupMetadata,
            membersToWelcome,
            groupSettings.welcome || { text: groupSettings.textbv }
        );
        await ChainySock.sendMessage(from, message);
    }
}

async function handleParticipantRemove(ChainySock, from, inf, groupMetadata, groupSettings) {
    if (groupSettings.exit?.enabled) {
        const message = await createGroupMessage(
            ChainySock,
            groupMetadata,
            inf.participants,
            groupSettings.exit,
            false
        );
        await ChainySock.sendMessage(from, message).catch(err => console.log('❌ erro saída:', err.message));
    }
}

async function handleParticipantPromoteDemote(ChainySock, from, inf, groupSettings) {
    if (!groupSettings?.x9) return;
    const autor = inf.author || '';

    for (const user of inf.participants) {
        const userNum = user.split('@')[0];
        const autorNum = autor ? autor.split('@')[0] : 'desconhecido';
        const texto = inf.action === 'promote'
            ? MESSAGES.handlers.groupEvents.promote(userNum, autorNum)
            : MESSAGES.handlers.groupEvents.demote(userNum, autorNum);

        await ChainySock.sendMessage(from, {
            text: texto,
            mentions: autor ? [user, autor] : [user]
        }).catch(() => { });
    }
}

export async function handleGroupParticipantsUpdate(ChainySock, inf) {
    try {
        const from = inf.id || inf.jid || (inf.participants?.length ? inf.participants[0].split('@')[0] + '@s.whatsapp.net' : null);

        if (DEBUG_MODE) {
            console.log('🐛 [EVENTO]');
            console.log('📌 Grupo:', from);
            console.log('📌 Ação:', inf.action);
        }

        if (!from) return;
        if (!inf.participants?.length) return;

        const botId = ChainySock.user.id.split(':')[0];

        inf.participants = inf.participants.map(isValidParticipant).filter(Boolean);
        if (inf.participants.some(p => p.startsWith(botId))) return;

        const groupMetadata = await ChainySock.groupMetadata(from).catch(() => null);
        if (!groupMetadata) return;

        const groupSettings = await loadGroupSettings(from);
        const globalBlacklist = await loadGlobalBlacklist();

        switch (inf.action) {
            case 'add':
                await handleParticipantAdd(ChainySock, from, inf, groupMetadata, groupSettings, globalBlacklist);
                break;

            case 'remove':
                await handleParticipantRemove(ChainySock, from, inf, groupMetadata, groupSettings);
                break;

            case 'promote':
            case 'demote':
                await handleParticipantPromoteDemote(ChainySock, from, inf, groupSettings);
                break;
        }
    } catch (error) {
        console.error('❌ ERRO GERAL EM PARTICIPANTS UPDATE:', error);
    }
}
