import { saveMsgPrefix } from "../../utils/database.js";

export default {
  name: "msgprefix",
  description: "Configura a mensagem que o bot envia quando alguem digita apenas 'prefixo'",
  commands: ["msgprefix"],
  usage: `${global.prefix}msgprefix texto aqui #prefixo#\n${global.prefix}msgprefix off`,
  handle: async ({  reply, isOwner, q, prefix , MESSAGES }) => {
    try {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      if (!q) return reply(MESSAGES.owner.msgprefix.missingParams(prefix));
      
      const newMsg = q.trim().toLowerCase() === 'off' ? false : q;
      
      if (saveMsgPrefix(newMsg)) {
        await reply(newMsg ? MESSAGES.owner.msgprefix.success(newMsg, prefix) : MESSAGES.owner.msgprefix.disabled);
      } else {
        await reply(MESSAGES.owner.msgprefix.error);
      }
    } catch (e) {
      console.error('Erro no msgprefix:', e);
      await reply(MESSAGES.error.general);
    }
  }
};
