export default {
  name: "viewonce",
  description: "Revela mensagens de visualização única",
  commands: ["open", "revelar", "rvisu"],
  handle: async ({ 
    bot, from, info, reply, quotedMessageContent, getFileBuffer,
    MESSAGES
  }) => {
    // Tenta capturar a mensagem de visualização única de várias estruturas possíveis
    const rawMsg = quotedMessageContent?.viewOnceMessageV2?.message 
                  || quotedMessageContent?.viewOnceMessage?.message
                  || quotedMessageContent;

    const type = rawMsg.imageMessage ? 'imageMessage' : (rawMsg.videoMessage ? 'videoMessage' : null);
    const media = rawMsg[type];
    
    // Verifica se temos as chaves de mídia necessárias
    if (!type || !media || !media.mediaKey) {
      return reply(MESSAGES.member.viewonce.missingMediaKeys);
    }
    
    try {
      await reply(MESSAGES.member.viewonce.revealing);
      const buffer = await getFileBuffer(media, type === 'imageMessage' ? 'image' : 'video');
      
      if (type === 'imageMessage') {
        return bot.sendMessage(from, { image: buffer, caption: MESSAGES.member.viewonce.imageRevealed }, { quoted: info });
      } else if (type === 'videoMessage') {
        return bot.sendMessage(from, { video: buffer, caption: MESSAGES.member.viewonce.videoRevealed }, { quoted: info });
      }
    } catch (e) {
      return reply(MESSAGES.error.general);
    }
  }
};
