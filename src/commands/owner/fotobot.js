export default {
  name: "fotobot",
  description: "Altera a foto de perfil do bot",
  commands: ["fotobot", "fotoperfil", "setppbot", "perfilbot", "avatarbot"],
  usage: `${global.prefixo}fotobot (marcando ou enviando imagem)`,
  handle: async ({ 
    bot,
    reply,
    isOwner,
    isQuotedImage,
    isImage,
    prefix,
    quotedMessageContent,
    info,
    getMediaInfo,
    getFileBuffer,
    processImageForProfile
  , MESSAGES }) => {
    try {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      if (!isQuotedImage && !isImage) return reply(MESSAGES.owner.fotobot.missingImage(prefix));
      
      const messageToUse = isQuotedImage ? quotedMessageContent : info.message;
      const mediaInfo = getMediaInfo(messageToUse);
      if (!mediaInfo || mediaInfo.type !== 'image') return reply(MESSAGES.owner.fotobot.invalidMedia);
      
      const imageBuffer = await getFileBuffer(mediaInfo.media, 'image');
      
      try {
        // Processa a imagem com ffmpeg antes de atualizar
        const processedBuffer = await processImageForProfile(imageBuffer);
        await bot.updateProfilePicture(bot.user.id, processedBuffer);
        reply(MESSAGES.owner.fotobot.success);
      } catch (updateError) {
        console.error('Erro ao alterar foto de perfil:', updateError);
        reply(MESSAGES.error.general);
      }
    } catch (e) {
      console.error('Erro no comando fotobot:', e);
      reply(MESSAGES.error.general);
    }
  }
};
