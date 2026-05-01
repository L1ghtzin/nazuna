import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import CaptchaIndex, { loadCaptchaJson } from '../utils/captchaIndex.js';
import { getPerformanceOptimizer } from '../utils/performanceOptimizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATABASE_DIR = path.join(__dirname, '..', '..', 'database');
const GLOBAL_BLACKLIST_PATH = path.join(DATABASE_DIR, 'blacklist.json');

const DEBUG_MODE = process.env.DEBUG_MODE === 'true';
const performanceOptimizer = getPerformanceOptimizer();

async function loadGroupSettings(groupId) {
    const groupFilePath = path.join(DATABASE_DIR, 'grupos', `${groupId}.json`);
    try {
        return await performanceOptimizer.getCachedFile(groupFilePath, 30000, async (filePath) => {
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        });
    } catch (e) {
        console.error(`❌ Erro ao ler configurações do grupo ${groupId}: ${e.message}`);
        return {};
    }
}

async function loadGlobalBlacklist() {
    try {
        return await performanceOptimizer.getCachedFile(GLOBAL_BLACKLIST_PATH, 30000, async (filePath) => {
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data).users || {};
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

async function createGroupMessage(NazunaSock, groupMetadata, participants, settings, isWelcome = true) {
    const jsonGp = await loadGroupSettings(groupMetadata.id);
    const mentions = participants.map(p => p);
    const bannerName = participants.length === 1 ? participants[0].split('@')[0] : `${participants.length} Membros`;
    const replacements = {
        '#numerodele#': participants.map(p => `@${p.split('@')[0]}`).join(', '),
        '#nomedogp#': groupMetadata.subject,
        '#desc#': groupMetadata.desc || 'Nenhuma',
        '#membros#': groupMetadata.participants.length,
    };
    const defaultText = isWelcome ?
        (jsonGp.textbv ? jsonGp.textbv : "╭━━━⊱ 🌟 *BEM-VINDO(A/S)!* 🌟 ⊱━━━╮\n│\n│ 👤 #numerodele#\n│\n│ 🏠 Grupo: *#nomedogp#*\n│ 👥 Membros: *#membros#*\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n✨ *Seja bem-vindo(a/s) ao grupo!* ✨") :
        (jsonGp.exit?.text ? jsonGp.exit.text : "╭━━━⊱ 👋 *ATÉ LOGO!* 👋 ⊱━━━╮\n│\n│ 👤 #numerodele#\n│\n│ 🚪 Saiu do grupo\n│ *#nomedogp#*\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n💫 *Até a próxima!* 💫");
    
    const text = formatMessageText(settings.text || defaultText, replacements);
    const message = { text, mentions };
    
    if (settings.image) {
        let profilePicUrl = 'https://raw.githubusercontent.com/nazuninha/uploads/main/outros/1747053564257_bzswae.bin';
        if (participants.length === 1 && isWelcome) {
            profilePicUrl = await NazunaSock.profilePictureUrl(participants[0], 'image').catch(() => profilePicUrl);
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

export async function handleGroupParticipantsUpdate(NazunaSock, inf) {
    try {
        const from = inf.id || inf.jid || (inf.participants?.length ? inf.participants[0].split('@')[0] + '@s.whatsapp.net' : null);

        if (DEBUG_MODE) {
            console.log('🐛 [EVENTO]');
            console.log('📌 Grupo:', from);
            console.log('📌 Ação:', inf.action);
        }

        if (!from) return;
        if (!inf.participants?.length) return;

        const botId = NazunaSock.user.id.split(':')[0];

        inf.participants = inf.participants.map(isValidParticipant).filter(Boolean);
        if (inf.participants.some(p => p.startsWith(botId))) return;

        const groupMetadata = await NazunaSock.groupMetadata(from).catch(() => null);
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
                    const userId = participant.split('@')[0];

                    if (globalBlacklist?.[participant]) {
                        membersToRemove.push(participant);
                        removalReasons.push(`@${userId} (blacklist global)`);
                        continue;
                    }

                    if (groupSettings.blacklist?.[participant]) {
                        membersToRemove.push(participant);
                        removalReasons.push(`@${userId} (blacklist grupo)`);
                        continue;
                    }

                    const participantStripped = participant.replace(/@.*/, '');
                    let participantNumber = participantStripped;
                    let isLid = false;

                    if (participant.endsWith('@lid')) {
                        isLid = true;
                        try {
                            const resolved = await NazunaSock.onWhatsApp(participant);
                            if (resolved?.[0]?.jid) {
                                participantNumber = resolved[0].jid.replace(/@.*/, '');
                            }
                        } catch { }
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

                        await NazunaSock.sendMessage(from, {
                            text: `🔐 *VERIFICAÇÃO*\n\nOlá @${participantNumber}\n\n❓ ${num1} + ${num2} = ?\n\n⏱️ 5 minutos.`,
                            mentions: [`${participantNumber}@s.whatsapp.net`]
                        });

                        continue; 
                    }

                    if (groupSettings.bemvindo) {
                        console.log(`✅ Enviando welcome para ${participantNumber}`);
                        membersToWelcome.push(participant);
                    }
                }

                if (membersToRemove.length) {
                    await NazunaSock.groupParticipantsUpdate(from, membersToRemove, 'remove');
                    await NazunaSock.sendMessage(from, {
                        text: `🚫 Removidos:\n- ${removalReasons.join('\n- ')}`,
                        mentions: membersToRemove
                    });
                }

                if (membersToWelcome.length) {
                    const message = await createGroupMessage(
                        NazunaSock,
                        groupMetadata,
                        membersToWelcome,
                        groupSettings.welcome || { text: groupSettings.textbv }
                    );
                    await NazunaSock.sendMessage(from, message);
                }
                break;
            }

            case 'remove': {
                if (groupSettings.exit?.enabled) {
                    const message = await createGroupMessage(
                        NazunaSock,
                        groupMetadata,
                        inf.participants,
                        groupSettings.exit,
                        false
                    );
                    await NazunaSock.sendMessage(from, message).catch(err => console.log('❌ erro saída:', err.message));
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
                        ? `⬆️ @${userNum} virou ADM por @${autorNum}`
                        : `⬇️ @${userNum} deixou de ser ADM por @${autorNum}`;

                    await NazunaSock.sendMessage(from, {
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

export async function handleGroupJoinRequest(NazunaSock, inf) {
    try {
        const typeIds = { id: '', lid: '', participant: '' };
        const from = inf.id;
        let participantJid = inf.participantPn || inf.participant;

        if (!from || !participantJid) return;

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

        if (groupSettings.autoAcceptRequests) {
            if (DEBUG_MODE) console.log(`[Auto-Accept] Aceitando ${participantJid} no grupo ${from}`);
            await NazunaSock.groupRequestParticipantsUpdate(from, [participantJid], 'approve');
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
                nome = await NazunaSock.getName(participantJid);
            } catch { }

            CaptchaIndex.add(typeIds, from, answer, expiresAt, nome);

            await NazunaSock.sendMessage(from, {
                text: `🔐 *VERIFICAÇÃO DE SEGURANÇA*\n\n👋 Olá @${numero}!\n\nPara garantir que você não é um bot, resolva:\n❓ *${num1} + ${num2} = ?*\n\n⏱️ Você tem 5 minutos ou será removido.`,
                mentions: [participantJid]
            });
        }
    } catch (error) {
        console.error(`❌ Erro em handleGroupJoinRequest: ${error.message}`);
    }
}
