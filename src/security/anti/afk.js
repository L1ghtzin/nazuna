import { writeAsync } from '../../utils/database/io.js';

export async function handleAFK(context) {
    const { isGroup, groupData, sender, groupFile, reply, MESSAGES, command } = context;
    if (!isGroup || !groupData.afkUsers || !groupData.afkUsers[sender]) return false;
    
    // Ignora se o usuário está executando comandos relacionados a AFK
    if (command === 'afk' || command === 'voltei') return false;

    try {
        const afkSince = new Date(groupData.afkUsers[sender].since || Date.now()).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        delete groupData.afkUsers[sender];
        if (groupFile) {
            await writeAsync(groupFile, groupData);
        }
        await reply(MESSAGES.security.afkWelcome(afkSince));
    } catch (error) {
        console.error("Erro ao processar remoção de AFK:", error);
    }
    return false;
}

export async function handleAFKMention(context) {
    const { isGroup, groupData, info, reply, getUserName, MESSAGES } = context;
    if (!isGroup || !groupData.afkUsers || !info.message?.extendedTextMessage?.contextInfo?.mentionedJid) return false;

    try {
        const mentioned = info.message.extendedTextMessage.contextInfo.mentionedJid;
        for (const jid of mentioned) {
            if (groupData.afkUsers[jid]) {
                const afkData = groupData.afkUsers[jid];
                const afkSince = new Date(afkData.since).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
                await reply(MESSAGES.security.afkUser(getUserName(jid), afkSince, afkData.reason), { mentions: [jid] });
            }
        }
    } catch (error) {
        console.error("Erro ao verificar menções AFK:", error);
    }
    return false;
}
