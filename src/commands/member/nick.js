export default {
  name: "nick",
  description: "Gera nicks estilizados a partir de um texto",
  commands: ["nick", "gerarnick", "nickgenerator"],
  usage: `${global.prefixo}nick <texto>`,
  handle: async ({ 
    reply,
    q,
    prefix,
    styleText
  , MESSAGES }) => {
    try {
      if (!q) return reply(`🎮 *GERADOR DE NICK*\n\n📝 *Como usar:*\n• Digite o nick após o comando\n• Ex: ${prefix}nick nazuna`);
      
      const datzn = await styleText(q);
      await reply(datzn.join('\n'));
    } catch (e) {
      console.error(e);
      await reply(MESSAGES.error.internal);
    }
  }
};
