export default {
  name: "ssweb",
  description: "Tira um print de uma página da web",
  commands: ["printsite", "ssweb"],
  usage: `${global.prefixo}ssweb <link>`,
  handle: async ({ 
    nazu,
    from,
    reply,
    q,
    info
  , MESSAGES }) => {
    try {
      if (!q) return reply(`Cade o link?`);
      
      await nazu.sendMessage(from, {
        image: {
          url: `https://image.thum.io/get/fullpage/${q}`
        }
      }, {
        quoted: info
      });
    } catch (e) {
      console.error(e);
      await reply(MESSAGES.error.internal);
    }
  }
};
