import { loadCustomReacts } from "../../utils/database.js";

export default {
  name: "listreact",
  description: "Lista todas as reações automáticas configuradas no bot",
  commands: ["listreact"],
  usage: `${global.prefix}listreact`,
  handle: async ({  reply, isOwner , MESSAGES }) => {
    try {
      if (!isOwner) return reply('Apenas o dono pode listar reacts.');
      const reacts = loadCustomReacts();
      if (reacts.length === 0) return reply('Nenhum react configurado.');
      let listMsg = '📋 Lista de Reacts:\n\n';
      reacts.forEach(r => {
        listMsg += `ID: ${r.id} | Trigger: ${r.trigger} | Emoji: ${r.emoji}\n`;
      });
      await reply(listMsg);
    } catch (e) {
      console.error('Erro no listreact:', e);
      await reply(MESSAGES.error.simple);
    }
  }
};
