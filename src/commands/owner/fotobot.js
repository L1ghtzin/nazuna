export default {
  name: "fotobot",
  description: "Altera a foto de perfil do bot",
  commands: ["fotobot", "fotoperfil", "setppbot", "perfilbot", "avatarbot"],
  usage: `${global.prefixo}fotobot (marcando ou enviando imagem)`,
  handle: async ({ 
    nazu,
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
      if (!isQuotedImage && !isImage) return reply(`💔 Envie ou marque uma imagem para definir como foto de perfil do bot.\n\n📝 *Uso:* Envie uma imagem com o comando ou responda uma imagem com ${prefix}fotobot`);
      
      const messageToUse = isQuotedImage ? quotedMessageContent : info.message;
      const mediaInfo = getMediaInfo(messageToUse);
      if (!mediaInfo || mediaInfo.type !== 'image') return reply(`💔 Mídia inválida. Envie uma imagem.`);
      
      const imageBuffer = await getFileBuffer(mediaInfo.media, 'image');
      
      try {
        // Processa a imagem com ffmpeg antes de atualizar
        const processedBuffer = await processImageForProfile(imageBuffer);
        await nazu.updateProfilePicture(nazu.user.id, processedBuffer);
        reply('✅ Foto de perfil do bot alterada com sucesso!');
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
