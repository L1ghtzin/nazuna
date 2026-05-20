export default {
  name: "dono",
  description: "Mostra as informações do dono do bot",
  commands: ["dono"],
  usage: `${global.prefixo}dono`,
  handle: async ({ 
    reply,
    nomedono,
    numerodono
  , MESSAGES }) => {
    try {
      const numeroDonoFormatado = numerodono ? String(numerodono).replace(/\D/g, '') : 'Não configurado';
      const TextinDonoInfo = `╔═══ ⚡ *DONO DO BOT* ⚡ ═════
║
║ 👤 *Nome:* ${nomedono}
║ 📞 *Contato:* wa.me/${numeroDonoFormatado}
║
╚══════════════════════════`;
      await reply(TextinDonoInfo);
    } catch (e) {
      console.error(e);
      await reply(MESSAGES.error.internal);
    }
  }
};
