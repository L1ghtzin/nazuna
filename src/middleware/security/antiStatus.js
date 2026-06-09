export async function handleAntiStatus(context) {
    const { bot, info, isGroup, sender, groupData, isStatusMention, isGroupAdmin, from, reply, getUserName, isUserWhitelisted, isBotAdmin, MESSAGES } = context;
    if (!isGroup || !isStatusMention || !groupData.antistatus || isGroupAdmin || isUserWhitelisted(sender, 'antistatus')) return false;

    const statusAction = groupData.antistatus_action || 'banir';
    try {
        await bot.sendMessage(from, { delete: info.key });
        if (statusAction === 'banir' && isBotAdmin) {
            await bot.groupParticipantsUpdate(from, [sender], 'remove');
            await reply(MESSAGES.security.antiStatusAdmin(getUserName(sender)), { mentions: [sender] });
        } else {
            const extraMsg = (statusAction === 'banir' && !isBotAdmin) ? MESSAGES.security.cantRemoveAdminSuffix : '';
            await reply(MESSAGES.security.antiStatusUser(getUserName(sender), extraMsg), { mentions: [sender] });
        }
    } catch (error) {
        console.error('Erro no AntiStatus:', error);
    }
    return true;
}
