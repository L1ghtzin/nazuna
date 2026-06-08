export async function handleMutedUsers(context) {
    const { isGroup, isMuted, isMuted2, isGroupAdmin, isOwner, nazu, from, sender, reply, info, groupData, writeJsonFile, groupFile, optimizer, getUserName, isBotAdmin } = context;
    if (!isGroup || isGroupAdmin || isOwner) return false;

    if (isMuted) {
        try {
            await nazu.sendMessage(from, { text: `🤫 *Usuário mutado detectado*\n\n@${getUserName(sender)}, você está tentando falar enquanto está mutado neste grupo. Você será removido conforme as regras.`, mentions: [sender] }, { quoted: info });
            await nazu.sendMessage(from, { delete: info.key });
            if (isBotAdmin) {
                await nazu.groupParticipantsUpdate(from, [sender], 'remove');
            } else {
                await reply("⚠️ Não posso remover o usuário porque não sou administrador.");
            }
            delete groupData.mutedUsers[sender];
            if (writeJsonFile && groupFile) writeJsonFile(groupFile, groupData);
            if (optimizer) optimizer.invalidateGroup(from);
            return true;
        } catch (error) {
            console.error("Erro ao processar usuário mutado:", error);
        }
    }

    if (isMuted2) {
        try {
            await nazu.sendMessage(from, { delete: info.key });
        } catch (error) {
            console.error("Erro ao deletar mensagem de usuário mutado 2:", error);
        }
        return true;
    }
    return false;
}
