import { deleteCustomReact } from "../../utils/database.js";

export default {
  name: "delreact",
  description: "Remove uma reação automática do bot pelo ID",
  commands: ["delreact"],
  usage: `${global.prefix}delreact <id>`,
  handle: async ({  reply, isOwner, q, prefix , MESSAGES }) => {
    try {
      if (!isOwner) return reply('Apenas o dono pode remover reacts.');
      if (!q) return reply('Uso: ' + prefix + 'delreact id');
      const result = deleteCustomReact(q.trim());
      await reply(result.message);
    } catch (e) {
      console.error('Erro no delreact:', e);
      await reply(MESSAGES.error.simple);
    }
  }
};
