export default {
  name: "viewonce",
  description: "Revela mensagens de visualização única",
  commands: ["open", "revelar", "rvisu"],
  handle: async ({ 
    nazu, from, info, reply, quotedMessageContent, getFileBuffer,
    MESSAGES
  }) => {
    const viewOnce = quotedMessageContent?.viewOnceMessageV2?.message || quotedMessageContent?.viewOnceMessage?.message;
    
    if (!viewOnce) return reply(MESSAGES.error.noMedia);

    const type = Object.keys(viewOnce)[0];
    const media = viewOnce[type];
    
    try {
      const buffer = await getFileBuffer(media, type === 'imageMessage' ? 'image' : 'video');
      
      if (type === 'imageMessage') {
        return nazu.sendMessage(from, { image: buffer, caption: "✅ Mensagem revelada!" }, { quoted: info });
      } else if (type === 'videoMessage') {
        return nazu.sendMessage(from, { video: buffer, caption: "✅ Vídeo revelado!" }, { quoted: info });
      }
    } catch (e) {
      return reply(MESSAGES.error.general);
    }
  }
};
