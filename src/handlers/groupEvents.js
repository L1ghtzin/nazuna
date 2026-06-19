import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import CaptchaIndex, { loadCaptchaJson } from '../utils/captchaIndex.js';
import { getPerformanceOptimizer } from '../utils/performanceOptimizer.js';
import { resolveParticipant } from '../utils/resolveParticipant.js';
import { checkAntifake, logAntifakeAction } from '../utils/antifakeGuard.js';
import { MESSAGES } from '../utils/messages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATABASE_DIR = path.join(__dirname, '..', '..', 'dados', 'database');
const DONO_DIR = path.join(DATABASE_DIR, 'dono');
const GLOBAL_BLACKLIST_PATH = path.join(DONO_DIR, 'globalBlacklist.json');
const DEBUG_MODE = process.env.DEBUG_MODE === 'true';
const performanceOptimizer = getPerformanceOptimizer();
const joinRequestCache = new Map();

async function loadGroupSettings(groupId) {
    const groupFilePath = path.join(DATABASE_DIR, 'grupos', `${groupId}.json`);
    try {
        return await performanceOptimizer.getCachedFile(groupFilePath, 30000, async (filePath) => {
            try {
                const data = await fs.readFile(filePath, 'utf-8');
                return JSON.parse(data);
            } catch (err) {
                return {};
            }
        });
    } catch (e) {
        console.error(`❌ Erro ao ler configurações do grupo ${groupId}: ${e.message}`);
        return {};
    }
}

async function loadGlobalBlacklist() {
    try {
        return await performanceOptimizer.getCachedFile(GLOBAL_BLACKLIST_PATH, 30000, async (filePath) => {
            try {
                const data = await fs.readFile(filePath, 'utf-8');
                return JSON.parse(data).users || {};
            } catch (err) {
                return {};
            }
        });
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
        let profilePicUrl = 'https://raw.githubusercontent.com/nazuninha/uploads/main/outros/1747053564257_bzswae.bin';
        if (participants.length === 1 && isWelcome) {
            profilePicUrl = await ChainySock.profilePictureUrl(participants[0], 'image').catch(() => profilePicUrl);
        }
           
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
        const captchaData = await loadCaptchaJson();

        switch (inf.action) {
            case 'add': {
                const membersToWelcome = [];
                const membersToRemove = [];
                const removalReasons = [];
                const entradaPorLink = !inf.author || inf.participants.includes(inf.author);

                for (const participant of inf.participants) {
                    const resolved = await resolveParticipant(participant, ChainySock, groupMetadata);
                    const participantNumber = resolved.number;
                    const participantStripped = participant.replace(/@.*/, '');
                    const isLid = resolved.isLid;
                    const jid = resolved.jid || `${participantNumber}@s.whatsapp.net`;
                    const lid = resolved.lid || (isLid ? participant : null);

                    const inGlobalBlacklist = globalBlacklist?.[participant] || globalBlacklist?.[jid] || (lid && globalBlacklist?.[lid]);
                    if (inGlobalBlacklist) {
                        membersToRemove.push(participant);
                        removalReasons.push(`@${participantNumber} (blacklist global)`);
                        continue;
                    }

                    const inGroupBlacklist = groupSettings.blacklist?.[participant] || groupSettings.blacklist?.[jid] || (lid && groupSettings.blacklist?.[lid]);
                    if (inGroupBlacklist) {
                        membersToRemove.push(participant);
                        removalReasons.push(`@${participantNumber} (blacklist grupo)`);
                        continue;
                    }

                    const antifakeResult = await checkAntifake(participant, groupSettings, ChainySock);
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
                            removalReasons.push(`@${antifakeResult.number} (número estrangeiro / antifake)`);
                        }

                        await logAntifakeAction(from, {
                            number: antifakeResult.number,
                            action: 'remove',
                            reason: antifakeResult.reason,
                            resolvedFrom: participant
                        });
                        continue;
                    }

                    const hasCaptchaJson = Object.values(captchaData || {}).find(c => {
                        const lid = c.lid?.replace(/@.*/, '');
                        const id = c.id?.replace(/@.*/, '');
                        const idOrigin = c.idOrigin?.replace(/@.*/, '');
                        return (
                            lid === participantStripped ||
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
                        membersToWelcome.push(participant);
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
                break;
            }

            case 'remove': {
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
                break;
            }

            case 'promote':
            case 'demote': {
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
                break;
            }
        }
    } catch (error) {
        console.error('❌ ERRO GERAL:', error);
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

