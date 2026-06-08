export async function handleAFK(context) {
    const { isGroup, groupData, sender, writeJsonFile, groupFile, optimizer, from, reply } = context;
    if (!isGroup || !groupData.afkUsers || !groupData.afkUsers[sender]) return false;

    try {
        const afkSince = new Date(groupData.afkUsers[sender].since || Date.now()).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        delete groupData.afkUsers[sender];
        if (writeJsonFile && groupFile) writeJsonFile(groupFile, groupData);
        if (optimizer) optimizer.invalidateGroup(from);
        await reply(`👋 *Bem-vindo(a) de volta!*\nSeu status AFK foi removido.\nVocê estava ausente desde: ${afkSince}`);
    } catch (error) {
        console.error("Erro ao processar remoção de AFK:", error);
    }
    return false;
}

export async function handleAFKMention(context) {
    const { isGroup, groupData, info, reply, getUserName } = context;
    if (!isGroup || !groupData.afkUsers || !info.message?.extendedTextMessage?.contextInfo?.mentionedJid) return false;

    try {
        const mentioned = info.message.extendedTextMessage.contextInfo.mentionedJid;
        for (const jid of mentioned) {
            if (groupData.afkUsers[jid]) {
                const afkData = groupData.afkUsers[jid];
                const afkSince = new Date(afkData.since).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
                let afkMsg = `😴 @${getUserName(jid)} está AFK desde ${afkSince}.`;
                if (afkData.reason) afkMsg += `\nMotivo: ${afkData.reason}`;
                await reply(afkMsg, { mentions: [jid] });
            }
        }
    } catch (error) {
        console.error("Erro ao verificar menções AFK:", error);
    }
    return false;
}
