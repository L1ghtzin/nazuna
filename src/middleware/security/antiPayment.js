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
    const { bot, info, isGroup, sender, groupData, isGroupAdmin, isOwner, from, getUserName, isUserWhitelisted, isBotAdmin, MESSAGES } = context;
    if (!isGroup || !groupData.antipayment || !info.message || isGroupAdmin || isOwner || isUserWhitelisted(sender, 'antipayment')) return false;

    if (!hasPaymentMessage(info.message)) return false;

    if (isBotAdmin) {
        await runAntiPaymentStep(() => bot.groupSettingUpdate(from, 'announcement'), 'Erro ao fechar o grupo.');
        await runAntiPaymentStep(() => bot.groupParticipantsUpdate(from, [sender], 'remove'), 'Erro ao banir membro.');
    }
    await runAntiPaymentStep(() => sendCleanChat({ bot, from }), 'Erro ao limpar o chat.');
    await runAntiPaymentStep(() => bot.sendMessage(from, { text: MESSAGES.security.antiPayment(getUserName(sender)), mentions: [sender] }), 'Erro ao enviar notificação.');
    if (isBotAdmin) {
        await runAntiPaymentStep(() => bot.groupSettingUpdate(from, 'not_announcement'), 'Erro ao reabrir o grupo.');
    }
    return true;
}
