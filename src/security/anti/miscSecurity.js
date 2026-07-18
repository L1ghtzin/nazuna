const soadmBypassCommands = ['suporte', 'ticketsuporte', 'suporteticket', 'ticket'];

export async function handleMinMessage(context) {
    const { bot, info, isGroup, sender, groupData, isImage, isVideo, isVisuU, isVisuU2, isBotAdmin, isGroupAdmin, isOwner, from, reply, MESSAGES } = context;
    if (!isGroup || !groupData.minMessage || (!isImage && !isVideo && !isVisuU && !isVisuU2) || isGroupAdmin || isOwner) return false;

    let caption = '';
    if (isImage) caption = info.message.imageMessage?.caption || '';
    else if (isVideo) caption = info.message.videoMessage?.caption || '';
    else if (isVisuU) caption = info.message.viewOnceMessage?.message?.imageMessage?.caption || info.message.viewOnceMessage?.message?.videoMessage?.caption || '';
    else if (isVisuU2) caption = info.message.viewOnceMessageV2?.message?.imageMessage?.caption || info.message.viewOnceMessageV2?.message?.videoMessage?.caption || '';

    if (caption.length < groupData.minMessage.minDigits) {
        try {
            await bot.sendMessage(from, { delete: info.key });
            if (groupData.minMessage.action === 'ban') {
                if (isBotAdmin) {
                    await bot.groupParticipantsUpdate(from, [sender], 'remove');
                    await reply(MESSAGES.security.minMessageAdmin(groupData.minMessage.minDigits));
                } else {
                    await reply(MESSAGES.security.minMessageUser);
                }
            } else {
                await reply(MESSAGES.security.minMessageWarn(groupData.minMessage.minDigits));
            }
        } catch (error) {
            console.error('Erro ao processar minMessage:', error);
        }
        return true;
    }
    return false;
}

export async function handleAntiBtn(context) {
    const { bot, info, isGroup, sender, groupData, isButtonMessage, isGroupAdmin, from, reply, getUserName, isUserWhitelisted, isBotAdmin, MESSAGES } = context;
    if (!isGroup || !isButtonMessage || !groupData.antibtn || isGroupAdmin || isUserWhitelisted(sender, 'antibtn')) return false;

    try {
        await bot.sendMessage(from, { delete: info.key });
        if (isBotAdmin) {
            await bot.groupParticipantsUpdate(from, [sender], 'remove');
            await reply(MESSAGES.security.antiBtnAdmin(getUserName(sender)), { mentions: [sender] });
        } else {
            await reply(MESSAGES.security.antiBtnUser(getUserName(sender)), { mentions: [sender] });
        }
    } catch (error) {
        console.error('Erro no AntiBtn:', error);
    }
    return true;
}

export function handleSoAdmBypass(context) {
    const { isGroup, isCmd, groupData, isGroupAdmin, command } = context;
    if (isGroup && isCmd && groupData.soadm && !isGroupAdmin && !soadmBypassCommands.includes(command)) return true;
    return false;
}

export async function handleBlockedCommands(context) {
    const { isGroup, isCmd, isGroupAdmin, groupData, command, reply, MESSAGES } = context;
    if (isGroup && isCmd && !isGroupAdmin && groupData.blockedCommands && groupData.blockedCommands[command]) {
        await reply(MESSAGES.security.blockedCommand);
        return true;
    }
    return false;
}
