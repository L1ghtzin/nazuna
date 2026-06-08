const soadmBypassCommands = ['suporte', 'ticketsuporte', 'suporteticket', 'ticket'];

export async function handleMinMessage(context) {
    const { nazu, info, isGroup, sender, groupData, isImage, isVideo, isVisuU, isVisuU2, isBotAdmin, isGroupAdmin, isOwner, from, reply } = context;
    if (!isGroup || !groupData.minMessage || (!isImage && !isVideo && !isVisuU && !isVisuU2) || isGroupAdmin || isOwner) return false;

    let caption = '';
    if (isImage) caption = info.message.imageMessage?.caption || '';
    else if (isVideo) caption = info.message.videoMessage?.caption || '';
    else if (isVisuU) caption = info.message.viewOnceMessage?.message?.imageMessage?.caption || info.message.viewOnceMessage?.message?.videoMessage?.caption || '';
    else if (isVisuU2) caption = info.message.viewOnceMessageV2?.message?.imageMessage?.caption || info.message.viewOnceMessageV2?.message?.videoMessage?.caption || '';

    if (caption.length < groupData.minMessage.minDigits) {
        try {
            await nazu.sendMessage(from, { delete: info.key });
            if (groupData.minMessage.action === 'ban') {
                if (isBotAdmin) {
                    await nazu.groupParticipantsUpdate(from, [sender], 'remove');
                    await reply(`🚫 Usuário removido por enviar mídia sem legenda suficiente (mínimo: ${groupData.minMessage.minDigits} caracteres).`);
                } else {
                    await reply(`⚠️ Mídia sem legenda suficiente detectada, mas não sou admin para remover o usuário.`);
                }
            } else {
                await reply(`⚠️ Advertência: Envie mídias com pelo menos ${groupData.minMessage.minDigits} caracteres na legenda para evitar remoção.`);
            }
        } catch (error) {
            console.error('Erro ao processar minMessage:', error);
        }
    }
    return false;
}

export async function handleAntiBtn(context) {
    const { nazu, info, isGroup, sender, groupData, isButtonMessage, isGroupAdmin, from, reply, getUserName, isUserWhitelisted, isBotAdmin } = context;
    if (!isGroup || !isButtonMessage || !groupData.antibtn || isGroupAdmin || isUserWhitelisted(sender, 'antibtn')) return false;

    try {
        await nazu.sendMessage(from, { delete: info.key });
        if (isBotAdmin) {
            await nazu.groupParticipantsUpdate(from, [sender], 'remove');
            await reply(`⚠️ @${getUserName(sender)}, Mensagens com botões não são permitidas neste grupo. Você foi removido.`, { mentions: [sender] });
        } else {
            await reply(`⚠️ Atenção, @${getUserName(sender)}! Mensagens com botões não são permitidas. Não consigo remover você, mas evite usar esse tipo de mensagem.`, { mentions: [sender] });
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
    const { isGroup, isCmd, isGroupAdmin, groupData, command, reply } = context;
    if (isGroup && isCmd && !isGroupAdmin && groupData.blockedCommands && groupData.blockedCommands[command]) {
        await reply('⛔ Este comando foi bloqueado pelos administradores do grupo.');
        return true;
    }
    return false;
}
