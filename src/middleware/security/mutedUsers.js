export async function handleMutedUsers(context) {
    const { isGroup, isMuted, isMuted2, isGroupAdmin, isOwner, bot, from, sender, reply, info, groupData, groupFile, optimizer, getUserName, isBotAdmin, MESSAGES } = context;
    if (!isGroup || isGroupAdmin || isOwner) return false;

    if (isMuted) {
        try {
            await bot.sendMessage(from, { text: MESSAGES.security.mutedUserAdmin(getUserName(sender)), mentions: [sender] }, { quoted: info });
            await bot.sendMessage(from, { delete: info.key });
            if (isBotAdmin) {
                await bot.groupParticipantsUpdate(from, [sender], 'remove');
            } else {
                await reply(MESSAGES.security.mutedUserCantRemove);
            }
            delete groupData.mutedUsers[sender];
            if (optimizer?.saveJsonWithCache && groupFile) {
                await optimizer.saveJsonWithCache(groupFile, groupData);
            }
            return true;
        } catch (error) {
            console.error("Erro ao processar usuário mutado:", error);
        }
    }

    if (isMuted2) {
        try {
            await bot.sendMessage(from, { delete: info.key });
        } catch (error) {
            console.error("Erro ao deletar mensagem de usuário mutado 2:", error);
        }
        return true;
    }
    return false;
}
