import { hasPaymentMessage } from '../../utils/securityHelpers.js';
import { unwrapMessage } from '../../utils/messageHelpers.js';
import { verifyQuotedAuthor } from '../../utils/messageEnvelopeRegistry.js';
import { sendCleanChat } from '../../utils/cleanChat.js';
import { loadLevelingSafe, getLevelingUser } from '../../utils/database/leveling.js';
import fs from 'fs';

const BAN_COOLDOWN_MS = 10_000;
const recentBans = new Map();
const CACHE_CLEANUP_INTERVAL_MS = 60_000;

const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of recentBans) {
        if (now - timestamp > BAN_COOLDOWN_MS) recentBans.delete(key);
    }
}, CACHE_CLEANUP_INTERVAL_MS);
if (cleanupInterval.unref) cleanupInterval.unref();

function isOnCooldown(groupJid, participant) {
    const banKey = `${groupJid}:${participant}`;
    const lastBan = recentBans.get(banKey);
    return lastBan && Date.now() - lastBan < BAN_COOLDOWN_MS;
}

function registerCooldown(groupJid, participant) {
    recentBans.set(`${groupJid}:${participant}`, Date.now());
}

/**
 * Executa um step do anti-payment com error handling isolado.
 * Se o step falhar, loga o erro mas permite que os próximos steps continuem.
 */
async function runAntiPaymentStep(step, errorMessage) {
    try {
        await step();
    } catch (error) {
        console.error(`[ANTI-PAYMENT] ${errorMessage} Detalhes: ${error.message}`);
    }
}

export async function handleAntiPayment(context) {
    const { bot, info, isGroup, sender, groupData, isGroupAdmin, isOwner, from, getUserName, isUserWhitelisted, isBotAdmin, MESSAGES, idInArray, groupAdmins, botNumberLid } = context;
    if (!isGroup || !info.message || !groupData.antipayment) return false;

    const isPayment = hasPaymentMessage(info.message);
    const actualMessage = unwrapMessage(info.message);
    const quotedMessage = actualMessage?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedParticipant = actualMessage?.extendedTextMessage?.contextInfo?.participant;
    const isQuotedPayment = quotedMessage ? hasPaymentMessage(quotedMessage) : false;

    if (!isPayment && !isQuotedPayment) return false;

    let targetUser = sender;

    if (isQuotedPayment && !isPayment) {
        if (!quotedParticipant) return false;
        targetUser = quotedParticipant;
        
        // Verifica se o alvo (remetente da mensagem marcada) tem imunidade
        if (targetUser === botNumberLid || (bot.user?.id && targetUser.startsWith(bot.user.id.split(':')[0]))) return false;
        if (idInArray && groupAdmins && idInArray(targetUser, groupAdmins)) return false;
        if (isUserWhitelisted && isUserWhitelisted(targetUser, 'antipayment')) return false;

        // Proteção Avançada Anti-Forja (Envelope Registry)
        const stanzaId = actualMessage?.extendedTextMessage?.contextInfo?.stanzaId;
        if (stanzaId) {
            const { corroborated, contradicted } = verifyQuotedAuthor({
                groupJid: from,
                stanzaId,
                participant: targetUser,
            });

            if (!corroborated) {
                console.log(`[ANTI-PAYMENT] ⚠️ Citação de pagamento não corroborada (${contradicted ? 'forja' : 'não vista'}). Autor @${targetUser.split('@')[0]} preservado.`);
                return false;
            }
            
            console.log(`[ANTI-PAYMENT] 🔴 Marcação de pagamento corroborada! Autor original: @${targetUser.split('@')[0]}`);
            
            if (isBotAdmin) {
                // Tenta apagar a mensagem original
                await runAntiPaymentStep(() => bot.sendMessage(from, {
                    delete: {
                        remoteJid: from,
                        fromMe: false,
                        id: stanzaId,
                        participant: targetUser,
                    }
                }), 'Erro ao apagar a mensagem original.');
            }
        }
    } else {
        // Se foi o próprio sender que enviou a trava
        if (isGroupAdmin || isOwner || (isUserWhitelisted && isUserWhitelisted(sender, 'antipayment'))) return false;
    }

    if (isOnCooldown(from, targetUser)) return false;
    registerCooldown(from, targetUser);

    if (isBotAdmin) {
        await runAntiPaymentStep(() => bot.groupSettingUpdate(from, 'announcement'), 'Erro ao fechar o grupo.');
        await runAntiPaymentStep(() => bot.groupParticipantsUpdate(from, [targetUser], 'remove'), 'Erro ao banir membro.');
    }
    await runAntiPaymentStep(() => sendCleanChat({ bot, from }), 'Erro ao limpar o chat.');
    await runAntiPaymentStep(() => bot.sendMessage(from, { text: MESSAGES.security.antiPayment(getUserName(targetUser)), mentions: [targetUser] }), 'Erro ao enviar notificação.');
    if (isBotAdmin) {
        await runAntiPaymentStep(() => bot.groupSettingUpdate(from, 'not_announcement'), 'Erro ao reabrir o grupo.');
    }
    return true;
}
