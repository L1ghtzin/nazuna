export default {
  name: "criador",
  description: "Mostra as informações do criador do bot",
  commands: ["criador"],
  usage: `${global.prefixo}criador`,
  handle: async ({ 
    reply
  , MESSAGES }) => {
    try {
      const TextinCriadorInfo = `╔═══ ⚡⚡⚡ *CRIADOR* ⚡⚡⚡ ═════
║
║ 👤 *Nome:* Hiudy
║ 📞 *WhatsApp:* wa.me/553391967445
║ 🐱 *GitHub:* github.com/hiudyy
║ 📷 *Instagram:* instagram.com/hiudyyy_
║
╚══════════════════════════`;
      await reply(TextinCriadorInfo);
    } catch (e) {
      console.error(e);
      await reply(MESSAGES.error.internal);
    }
  }
};
