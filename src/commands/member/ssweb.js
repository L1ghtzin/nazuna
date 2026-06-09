export default {
  name: "ssweb",
  description: "Tira um print de uma página da web",
  commands: ["printsite", "ssweb"],
  usage: `${global.prefixo}ssweb <link>`,
  handle: async ({ 
    bot,
    from,
    reply,
    q,
    info
  , MESSAGES }) => {
    try {
      if (!q) return reply(`Cade o link?`);
      
      await bot.sendMessage(from, {
        image: {
          url: `https://image.thum.io/get/fullpage/${q}`
        }
      }, {
        quoted: info
      });
    } catch (e) {
      console.error(e);
      await reply(MESSAGES.error.general);
    }
  }
};
