export default {
  name: "viewonce",
  description: "Revela mensagens de visualização única",
  commands: ["open", "revelar", "rvisu"],
  handle: async ({ 
    nazu, from, info, reply, quotedMessageContent, getFileBuffer,
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
      return reply("❌ Não foi possível extrair as chaves de mídia desta mensagem. Ela pode ser muito antiga ou não é uma visualização única válida.");
    }
    
    try {
      await reply("⏳ Revelando mídia...");
      const buffer = await getFileBuffer(media, type === 'imageMessage' ? 'image' : 'video');
      
      if (type === 'imageMessage') {
        return nazu.sendMessage(from, { image: buffer, caption: "✅ *Imagem Revelada!*" }, { quoted: info });
      } else if (type === 'videoMessage') {
        return nazu.sendMessage(from, { video: buffer, caption: "✅ *Vídeo Revelado!*" }, { quoted: info });
      }
    } catch (e) {
      return reply(MESSAGES.error.general);
    }
  }
};
