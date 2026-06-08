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
    const { nazu, info, isGroup, sender, groupData, isGroupAdmin, isOwner, from, getUserName, isUserWhitelisted, isBotAdmin } = context;
    if (!isGroup || !groupData.antipayment || !info.message || isGroupAdmin || isOwner || isUserWhitelisted(sender, 'antipayment')) return false;

    if (!hasPaymentMessage(info.message)) return false;

    if (isBotAdmin) {
        await runAntiPaymentStep(() => nazu.groupSettingUpdate(from, 'announcement'), 'Erro ao fechar o grupo.');
        await runAntiPaymentStep(() => nazu.groupParticipantsUpdate(from, [sender], 'remove'), 'Erro ao banir membro.');
    }
    await runAntiPaymentStep(() => sendCleanChat({ nazu, from }), 'Erro ao limpar o chat.');
    await runAntiPaymentStep(() => nazu.sendMessage(from, { text: `🛡️ *Anti-Payment:* Pagamento detectado!\n\n🚫 @${getUserName(sender)} foi removido e o grupo foi fechado temporariamente por segurança.`, mentions: [sender] }), 'Erro ao enviar notificação.');
    if (isBotAdmin) {
        await runAntiPaymentStep(() => nazu.groupSettingUpdate(from, 'not_announcement'), 'Erro ao reabrir o grupo.');
    }
    return true;
}
