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
      if (!isOwner) return reply('🚫 Apenas o dono pode alterar esta configuração!');
      
      const currentConfig = loadMsgBotOn();
      const newStatus = !currentConfig.enabled;
      
      if (saveMsgBotOn(newStatus)) {
        const statusText = newStatus ? '✅ ativada' : `💔 desativada`;
        await reply(`🔔 *Mensagem de inicialização ${statusText}!*\n\nAgora, quando o bot ligar, ${newStatus ? 'você receberá' : 'NÃO receberá'} uma mensagem de boas-vindas no seu privado.`);
      } else {
        await reply(MESSAGES.error.general);
      }
    } catch (e) {
      console.error('Erro no msgboton:', e);
      await reply(MESSAGES.error.general);
    }
  }
};
