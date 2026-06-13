import { loadMsgBotOn, saveMsgBotOn } from "../../utils/database.js";

export default {
  name: "msgboton",
  description: "Ativa/desativa a mensagem de inicialização no privado do dono",
  commands: ["msgboton"],
  usage: `${global.prefix}msgboton`,
  handle: async ({ 
    reply, isOwner,
    MESSAGES
  }) => {
    try {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      
      const currentConfig = loadMsgBotOn();
      const newStatus = !currentConfig.enabled;
      
      if (saveMsgBotOn(newStatus)) {
        const statusText = newStatus ? '✅ ativada' : `💔 desativada`;
        await reply(MESSAGES.owner.msgboton.status(newStatus, statusText));
      } else {
        await reply(MESSAGES.error.general);
      }
    } catch (e) {
      console.error('Erro no msgboton:', e);
      await reply(MESSAGES.error.general);
    }
  }
};
