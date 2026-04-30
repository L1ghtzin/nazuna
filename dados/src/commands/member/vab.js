export default {
  name: "vab",
  description: "Cria uma enquete de 'Você Prefere'",
  commands: ["vab"],
  usage: `${global.prefix}vab`,
  handle: async ({  reply, isGroup, isModoBn, nazu, from, vabJson , MESSAGES }) => {
    try {
      if (!isGroup) return reply(`💔 Isso só pode ser usado em grupo 💔`);
      if (!isModoBn) return reply(`💔 O modo brincadeira não está ativo nesse grupo`);
      
      const items = vabJson();
      const vabs = items[Math.floor(Math.random() * items.length)];
      
      await nazu.sendMessage(from, {
        poll: {
          name: `🤔 *QUAL VOCÊ PREFERE?* 🤔\n\n${vabs.option1}\nvs\n${vabs.option2}`,
          values: [
            `✅ ${vabs.option1}`,
            `✅ ${vabs.option2}`,
            `🤷‍♂️ Nenhuma das duas`
          ],
          selectableCount: 1
        }
      });
    } catch (e) {
      console.error('Erro no comando vab:', e);
      await reply(MESSAGES.error.internal);
    }
  }
};
