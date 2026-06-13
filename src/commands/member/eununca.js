export default {
  name: "eununca",
  description: "Cria uma enquete de Eu Nunca",
  commands: ["eununca"],
  usage: `${global.prefix}eununca`,
  handle: async ({  reply, isGroup, isModoBn, bot, from, toolsJson , MESSAGES, info }) => {
    try {
      if (!isGroup) return reply(MESSAGES.error.onlyGroup);
      if (!isModoBn) return reply(MESSAGES.error.modoBnDisabled);
      
      const items = toolsJson().iNever;
      const pollQuestion = items[Math.floor(Math.random() * items.length)];
      
      await bot.sendMessage(from, {
        poll: {
          name: MESSAGES.member.eununca.pollTitle(pollQuestion),
          values: MESSAGES.member.eununca.options,
          selectableCount: 1  
        }
      }, { quoted: info });
    } catch (e) {
      console.error('Erro no comando eununca:', e);
      await reply(MESSAGES.error.general);
    }
  }
};
