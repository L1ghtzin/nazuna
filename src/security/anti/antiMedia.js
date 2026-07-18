export async function handleAntiMedia(context) {
    const { bot, info, isGroup, sender, groupData, isGroupAdmin, isOwner, type, from, reply, getUserName, isBotAdmin, MESSAGES } = context;
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
        isMediaRestricted = true; restrictedTypeLabel = hasViewOnceImage ? MESSAGES.security.mediaTypes.imageViewOnce : MESSAGES.security.mediaTypes.image; mediaActionKey = 'antiimage_action';
    } else if (groupData.antivideo && (hasNormalVideo || (groupData.antivideo_vizu && hasViewOnceVideo))) {
        isMediaRestricted = true; restrictedTypeLabel = hasViewOnceVideo ? MESSAGES.security.mediaTypes.videoViewOnce : MESSAGES.security.mediaTypes.video; mediaActionKey = 'antivideo_action';
    } else if (groupData.antiaudio && (hasNormalAudio || (groupData.antiaudio_vizu && hasViewOnceAudio))) {
        isMediaRestricted = true; restrictedTypeLabel = hasViewOnceAudio ? MESSAGES.security.mediaTypes.audioViewOnce : MESSAGES.security.mediaTypes.audio; mediaActionKey = 'antiaudio_action';
    } else if (groupData.antidoc && hasDoc) {
        isMediaRestricted = true; restrictedTypeLabel = MESSAGES.security.mediaTypes.document; mediaActionKey = 'antidoc_action';
    } else if (groupData.antievento && hasEvent) {
        isMediaRestricted = true; restrictedTypeLabel = MESSAGES.security.mediaTypes.event; mediaActionKey = 'antievento_action';
    } else if (groupData.antiproduto && hasProduct) {
        isMediaRestricted = true; restrictedTypeLabel = MESSAGES.security.mediaTypes.product; mediaActionKey = 'antiproduto_action';
    }

    if (!isMediaRestricted) return false;

    const mediaAction = groupData[mediaActionKey] || 'apagar';
    try {
        await bot.sendMessage(from, { delete: info.key });
        if (mediaAction === 'banir' && isBotAdmin) {
            await bot.groupParticipantsUpdate(from, [sender], 'remove');
            await reply(MESSAGES.security.antiMediaAdmin(getUserName(sender), restrictedTypeLabel), { mentions: [sender] });
        } else {
            const extraMsg = (mediaAction === 'banir' && !isBotAdmin) ? MESSAGES.security.cantRemoveAdminSuffix : '';
            await reply(MESSAGES.security.antiMediaUser(getUserName(sender), restrictedTypeLabel, extraMsg), { mentions: [sender] });
        }
    } catch (error) {
        console.error(`Erro ao deletar mídia restrita (${restrictedTypeLabel}):`, error);
    }
    return true;
}
