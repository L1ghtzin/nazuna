import modules from "../../funcs/exports.js";
const { upload } = modules;

export default {
  name: "upload",
  description: "Faz upload de mídia (imagem, vídeo, áudio, documento) e retorna o link temporário",
  commands: ["upload", "imgpralink", "videopralink", "gerarlink"],
  usage: `${global.prefix}upload <marque a mídia>`,
  handle: async ({  
    reply, 
    info, 
    nazu, 
    from, 
    isQuotedImage, 
    isQuotedVideo, 
    isQuotedDocument, 
    isQuotedAudio,
    getFileBuffer
  , MESSAGES }) => {
    try {
      if (!isQuotedImage && !isQuotedVideo && !isQuotedDocument && !isQuotedAudio) {
        return reply(`Marque um video, uma foto, um audio ou um documento`);
      }
      
      var foto1 = isQuotedImage ? info.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage : {};
      var video1 = isQuotedVideo ? info.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage : {};
      var docc1 = isQuotedDocument ? info.message.extendedTextMessage.contextInfo.quotedMessage.documentMessage : {};
      var audio1 = isQuotedAudio ? info.message.extendedTextMessage.contextInfo.quotedMessage.audioMessage : "";
      
      let media = {};
      if (isQuotedDocument) {
        media = await getFileBuffer(docc1, "document");
      } else if (isQuotedVideo) {
        media = await getFileBuffer(video1, "video");
      } else if (isQuotedImage) {
        media = await getFileBuffer(foto1, "image");
      } else if (isQuotedAudio) {
        media = await getFileBuffer(audio1, "audio");
      }
      
      let linkz = await upload(media);
      await reply(`${linkz}`);
    } catch (e) {
      console.error('Erro no comando upload:', e);
      await reply(MESSAGES.error.internal);
    }
  }
};
