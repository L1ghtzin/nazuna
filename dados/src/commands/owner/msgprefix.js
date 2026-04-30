import { saveMsgPrefix } from "../../utils/database.js";

export default {
  name: "msgprefix",
  description: "Configura a mensagem que o bot envia quando alguem digita apenas 'prefixo'",
  commands: ["msgprefix"],
  usage: `${global.prefix}msgprefix texto aqui #prefixo#\n${global.prefix}msgprefix off`,
  handle: async ({  reply, isOwner, q, prefix , MESSAGES }) => {
    try {
      if (!isOwner) return reply('Apenas o dono pode configurar isso.');
      if (!q) return reply('Uso: ' + prefix + 'msgprefix off ou ' + prefix + 'msgprefix texto aqui #prefixo#');
      
      const newMsg = q.trim().toLowerCase() === 'off' ? false : q;
      
      if (saveMsgPrefix(newMsg)) {
        await reply(newMsg ? `✅ Mensagem prefix configurada: ${newMsg.replace('#prefixo#', prefix)}` : '✅ Mensagem prefix desativada.');
      } else {
        await reply('Erro ao salvar.');
      }
    } catch (e) {
      console.error('Erro no msgprefix:', e);
      await reply(MESSAGES.error.simple);
    }
  }
};
