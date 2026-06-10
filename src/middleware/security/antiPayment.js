import { hasPaymentMessage } from '../../utils/securityHelpers.js';
import { sendCleanChat } from '../../utils/cleanChat.js';

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
    if (!isGroup || !groupData.antipayment || !info.message) return false;

    const isPayment = hasPaymentMessage(info.message);
    const quotedMessage = info.message.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedParticipant = info.message.extendedTextMessage?.contextInfo?.participant;
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
    } else {
        // Se foi o próprio sender que enviou a trava
        if (isGroupAdmin || isOwner || (isUserWhitelisted && isUserWhitelisted(sender, 'antipayment'))) return false;
    }

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
