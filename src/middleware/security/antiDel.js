export async function handleAntiDel(context) {
    const { nazu, info, isGroup, groupData, messagesCache, from, MESSAGES } = context;
    if (!isGroup || !info.message?.protocolMessage || info.message.protocolMessage.type !== 0 || !groupData.antidel) return false;

    const deletedMsgKey = info.message.protocolMessage.key;
    const cacheKey = `${deletedMsgKey.remoteJid || from}_${deletedMsgKey.id}`;
    const cachedInfo = messagesCache?.get(cacheKey);
    
    if (!cachedInfo || !cachedInfo.message) return false;

    const msgOriginal = cachedInfo.message;
    const clone = JSON.parse(JSON.stringify(msgOriginal).replaceAll('conversation', 'text').replaceAll('Message', ''));
    
    for (const key in clone) {
        const media = clone[key];
        if (media && typeof media === 'object' && media.url) {
            clone[key] = { url: media.url };
            for (const subkey in media) {
                if (subkey !== 'url') clone[subkey] = media[subkey];
            }
        }
    }
    
    const participant = cachedInfo.key.participant || info.message.protocolMessage.key.participant; 
    const fromGroup = cachedInfo.key.remoteJid; 
    
    if (participant) {
        let userName = MESSAGES.general.unknownUser;
        let profilePic = 'https://telegra.ph/file/b5427ea4b8701bc47e751.jpg';
        const pushNameFromMsg = cachedInfo?.pushName || ''; 
        
        if (pushNameFromMsg) {
            userName = pushNameFromMsg;
        } else {
            try {
                const fetchedName = await nazu.getName(fromGroup, participant); 
                const numeroLimpoFallback = participant.split('@')[0];
                userName = (fetchedName && fetchedName !== numeroLimpoFallback) ? fetchedName : numeroLimpoFallback;
            } catch (e) {
                userName = participant.split('@')[0];
            }
        }
        
        try {
            profilePic = await nazu.profilePictureUrl(participant, 'image');
        } catch (e) {}
        
        clone.contextInfo = {
            isForwarded: false,
            mentionedJid: [participant],
            externalAdReply: {
                title: MESSAGES.security.antiDelTitle(userName),      
                body: MESSAGES.security.antiDelBody(participant.split("@")[0]), 
                thumbnailUrl: profilePic,
                sourceUrl: '',
                mediaType: 1,
                renderLargerThumbnail: false,
            },
        };
        
        try {
            await nazu.sendMessage(fromGroup, clone);
        } catch (err) {
            console.error('ERRO CRÍTICO AO REENVIAR MENSAGEM:', err);
        }
    }
    return false;
}
