export default {
  name: "eununca",
  description: "Cria uma enquete de Eu Nunca",
  commands: ["eununca"],
  usage: `${global.prefix}eununca`,
  handle: async ({  reply, isGroup, isModoBn, nazu, from, toolsJson , MESSAGES }) => {
    try {
      if (!isGroup) return reply(`💔 Isso só pode ser usado em grupo 💔`);
      if (!isModoBn) return reply(`💔 O modo brincadeira não está ativo nesse grupo`);
      
      const items = toolsJson().iNever;
      const pollQuestion = items[Math.floor(Math.random() * items.length)];
      
      await nazu.sendMessage(from, {
        poll: {
          name: `💭 EU NUNCA, EU JÁ 🌱\n\n${pollQuestion}`,
          values: [
            `💔 Eu nunca`,
            "✅ Eu já",
            "🤐 Prefiro não responder"
          ],
          selectableCount: 1  
        }
      });
    } catch (e) {
      console.error('Erro no comando eununca:', e);
      await reply(MESSAGES.error.internal);
    }
  }
};
