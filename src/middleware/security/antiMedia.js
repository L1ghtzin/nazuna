export async function handleAntiMedia(context) {
    const { nazu, info, isGroup, sender, groupData, isGroupAdmin, isOwner, type, from, reply, getUserName, isBotAdmin } = context;
    if (!isGroup || isGroupAdmin || isOwner) return false;

    const isViewOnce = info.message?.viewOnceMessage?.message || info.message?.viewOnceMessageV2?.message || info.message?.viewOnceMessageV2Extension?.message;
    const hasNormalImage = type === 'imageMessage';
    const hasViewOnceImage = !!(isViewOnce && isViewOnce.imageMessage);
    const hasNormalVideo = type === 'videoMessage';
    const hasViewOnceVideo = !!(isViewOnce && isViewOnce.videoMessage);
    const hasNormalAudio = type === 'audioMessage';
    const hasViewOnceAudio = !!(isViewOnce && isViewOnce.audioMessage);
    const hasDoc = type === 'documentMessage' || type === 'documentWithCaptionMessage' || info.message?.documentWithCaptionMessage?.message?.documentMessage;
    const hasEvent = type === 'eventMessage';
    const hasProduct = type === 'productMessage' || type === 'catalogMessage' || type === 'orderMessage';

    let isMediaRestricted = false;
    let restrictedTypeLabel = '';
    let mediaActionKey = '';

    if (groupData.antiimage && (hasNormalImage || (groupData.antiimage_vizu && hasViewOnceImage))) {
        isMediaRestricted = true; restrictedTypeLabel = hasViewOnceImage ? 'Imagens (Vizu Única)' : 'Imagens'; mediaActionKey = 'antiimage_action';
    } else if (groupData.antivideo && (hasNormalVideo || (groupData.antivideo_vizu && hasViewOnceVideo))) {
        isMediaRestricted = true; restrictedTypeLabel = hasViewOnceVideo ? 'Vídeos (Vizu Única)' : 'Vídeos'; mediaActionKey = 'antivideo_action';
    } else if (groupData.antiaudio && (hasNormalAudio || (groupData.antiaudio_vizu && hasViewOnceAudio))) {
        isMediaRestricted = true; restrictedTypeLabel = hasViewOnceAudio ? 'Áudios (Vizu Única)' : 'Áudios'; mediaActionKey = 'antiaudio_action';
    } else if (groupData.antidoc && hasDoc) {
        isMediaRestricted = true; restrictedTypeLabel = 'Documentos'; mediaActionKey = 'antidoc_action';
    } else if (groupData.antievento && hasEvent) {
        isMediaRestricted = true; restrictedTypeLabel = 'Eventos'; mediaActionKey = 'antievento_action';
    } else if (groupData.antiproduto && hasProduct) {
        isMediaRestricted = true; restrictedTypeLabel = 'Produtos/Catálogos'; mediaActionKey = 'antiproduto_action';
    }

    if (!isMediaRestricted) return false;

    const mediaAction = groupData[mediaActionKey] || 'apagar';
    try {
        await nazu.sendMessage(from, { delete: info.key });
        if (mediaAction === 'banir' && isBotAdmin) {
            await nazu.groupParticipantsUpdate(from, [sender], 'remove');
            await reply(`🚫 @${getUserName(sender)}, o envio de *${restrictedTypeLabel}* é proibido neste grupo. Você foi removido!`, { mentions: [sender] });
        } else {
            const extraMsg = (mediaAction === 'banir' && !isBotAdmin) ? ' (não sou admin para remover)' : '';
            await reply(`⚠️ @${getUserName(sender)}, o envio de *${restrictedTypeLabel}* está proibido neste grupo!${extraMsg}`, { mentions: [sender] });
        }
    } catch (error) {
        console.error(`Erro ao deletar mídia restrita (${restrictedTypeLabel}):`, error);
    }
    return true;
}
