export default {
  name: "vab",
  description: "Cria uma enquete de 'Você Prefere'",
  commands: ["vab"],
  usage: `${global.prefix}vab`,
  handle: async ({  reply, isGroup, isModoBn, bot, from, info, vabJson , MESSAGES }) => {
    try {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isModoBn) return reply(MESSAGES.permission.botGameModeDisabled);
      
      const items = vabJson();
      const vabs = items[Math.floor(Math.random() * items.length)];
      
      await bot.sendMessage(from, {
        poll: {
          name: MESSAGES.member.vab.pollName(vabs.option1, vabs.option2),
          values: [
            MESSAGES.member.vab.pollOpt1(vabs.option1),
            MESSAGES.member.vab.pollOpt2(vabs.option2),
            MESSAGES.member.vab.pollOpt3
          ],
          selectableCount: 1
        }
      }, { quoted: info });
    } catch (e) {
      console.error('Erro no comando vab:', e);
      await reply(MESSAGES.error.general);
    }
  }
};
