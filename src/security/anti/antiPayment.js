import { hasPaymentMessage } from '../../utils/securityHelpers.js';
import { sendCleanChat } from '../../utils/cleanChat.js';
import { removeDeviceId } from '../../utils/helpers.js';

/**
 * Apaga uma mensagem de pagamento usando o trick do temp message + edit,
 * necessário pois o delete direto não funciona para esse tipo de mensagem.
 */
export async function deletePaymentMessage(bot, remoteJid, stanzaId, participant) {
    try {
        const msgTemp = await bot.sendMessage(remoteJid, { text: '' });
        const idTemp = msgTemp.key.id;

        await bot.sendMessage(remoteJid, {
            text: '💦',
            edit: { id: idTemp }
        }, { messageId: stanzaId });

        await new Promise(r => setTimeout(r, 400));

        await bot.sendMessage(remoteJid, {
            delete: { remoteJid, id: stanzaId, fromMe: false, participant }
        });

        await new Promise(r => setTimeout(r, 400));

        try {
            await bot.sendMessage(remoteJid, { delete: { remoteJid, id: idTemp, fromMe: true } });
        } catch {
            await bot.sendMessage(remoteJid, {
                delete: { remoteJid, id: idTemp, fromMe: false, participant: bot.user.id }
            }).catch(() => {});
        }
    } catch (err) {
        console.error(`[ANTI-PAYMENT] Erro ao apagar msg de pagamento: ${err.message}`);
    }
}

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

const processedPaymentMsgs = new Set();
const MAX_PROCESSED_PAYMENTS = 1000;

function isPaymentMsgProcessed(msgId) {
    if (!msgId) return false;
    if (processedPaymentMsgs.has(msgId)) return true;
    processedPaymentMsgs.add(msgId);
    if (processedPaymentMsgs.size > MAX_PROCESSED_PAYMENTS) {
        const firstKey = processedPaymentMsgs.values().next().value;
        processedPaymentMsgs.delete(firstKey);
    }
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
    const { bot, info, isGroup, sender, groupData, isGroupAdmin, isOwner, from, getUserName, isUserWhitelisted, isBotAdmin, MESSAGES } = context;
    if (!isGroup || !info.message || !groupData.antipayment) return false;

    const msgId = info.key?.id;
    if (msgId && isPaymentMsgProcessed(msgId)) return false;

    const isPayment = hasPaymentMessage(info.message);
    if (!isPayment) return false;

    // Se foi o próprio sender que enviou a trava e ele tem permissão/whitelist, ignorar
    if (isGroupAdmin || isOwner || (isUserWhitelisted && isUserWhitelisted(sender, 'antipayment'))) return false;

    // Apaga a mensagem de pagamento direta usando o trick
    if (isBotAdmin && msgId) {
        console.log(`[ANTI-PAYMENT] 🗑️ Tentando apagar msg de pagamento direta: ${msgId} de ${sender}`);
        // Delay inicial: dá tempo ao servidor WA processar a msg antes do trick
        await new Promise(r => setTimeout(r, 800));
        await runAntiPaymentStep(
            () => deletePaymentMessage(bot, from, msgId, sender),
            'Erro ao apagar mensagem de pagamento direta.'
        );
    }

    if (isOnCooldown(from, sender)) return false;
    registerCooldown(from, sender);

    if (isBotAdmin) {
        await runAntiPaymentStep(() => bot.groupSettingUpdate(from, 'announcement'), 'Erro ao fechar o grupo.');
        await runAntiPaymentStep(() => bot.groupParticipantsUpdate(from, [removeDeviceId(sender)], 'remove'), 'Erro ao banir membro.');
    }
    await runAntiPaymentStep(() => sendCleanChat({ socket: bot, remoteJid: from }), 'Erro ao limpar o chat.');
    await runAntiPaymentStep(() => bot.sendMessage(from, { text: MESSAGES.security.antiPayment(getUserName(sender)), mentions: [sender] }), 'Erro ao enviar notificação.');
    if (isBotAdmin) {
        await runAntiPaymentStep(() => bot.groupSettingUpdate(from, 'not_announcement'), 'Erro ao reabrir o grupo.');
    }
    return true;
}
