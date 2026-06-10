import { hasGroupStatusMessage } from '../../utils/securityHelpers.js';

export async function handleAntiStatus(context) {
    const { bot, info, isGroup, sender, groupData, isStatusMention, isGroupAdmin, isOwner, from, reply, getUserName, isUserWhitelisted, isBotAdmin, MESSAGES, idInArray, groupAdmins, botNumberLid } = context;
    if (!isGroup || !groupData.antistatus || !info.message) return false;

    const quotedMessage = info.message.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedParticipant = info.message.extendedTextMessage?.contextInfo?.participant;
    const isQuotedStatus = quotedMessage ? hasGroupStatusMessage(quotedMessage) : false;

    if (!isStatusMention && !isQuotedStatus) return false;

    const statusAction = groupData.antistatus_action || 'banir';
    let targetUser = sender;

    if (isQuotedStatus && !isStatusMention) {
        if (!quotedParticipant) return false;
        targetUser = quotedParticipant;
        
        // Imunidade para o alvo
        if (targetUser === botNumberLid || (bot.user?.id && targetUser.startsWith(bot.user.id.split(':')[0]))) return false;
        if (idInArray && groupAdmins && idInArray(targetUser, groupAdmins)) return false;
        if (isUserWhitelisted && isUserWhitelisted(targetUser, 'antistatus')) return false;
    } else {
        if (isGroupAdmin || isOwner || (isUserWhitelisted && isUserWhitelisted(sender, 'antistatus'))) return false;
    }

    try {
        await bot.sendMessage(from, { delete: info.key });
        if (statusAction === 'banir' && isBotAdmin) {
            await bot.groupParticipantsUpdate(from, [targetUser], 'remove');
            await reply(MESSAGES.security.antiStatusAdmin(getUserName(targetUser)), { mentions: [targetUser] });
        } else {
            const extraMsg = (statusAction === 'banir' && !isBotAdmin) ? MESSAGES.security.cantRemoveAdminSuffix : '';
            await reply(MESSAGES.security.antiStatusUser(getUserName(targetUser), extraMsg), { mentions: [targetUser] });
        }
    } catch (error) {
        console.error('Erro no AntiStatus:', error);
    }
    return true;
}
