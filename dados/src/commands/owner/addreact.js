import { addCustomReact } from "../../utils/database.js";

export default {
  name: "addreact",
  description: "Adiciona uma reação automática do bot a uma palavra-chave",
  commands: ["addreact"],
  usage: `${global.prefix}addreact <trigger> <emoji>`,
  handle: async ({  reply, isOwner, args, prefix , MESSAGES }) => {
    try {
      if (!isOwner) return reply('Apenas o dono pode adicionar reacts.');
      if (args.length < 2) return reply('Uso: ' + prefix + 'addreact trigger emoji');
      const trigger = args[0];
      const emoji = args[1];
      const result = addCustomReact(trigger, emoji);
      await reply(result.message);
    } catch (e) {
      console.error('Erro no addreact:', e);
      await reply(MESSAGES.error.simple);
    }
  }
};
