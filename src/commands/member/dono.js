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
      await reply(MESSAGES.member.dono.info(nomedono, numeroDonoFormatado));
    } catch (e) {
      console.error(e);
      await reply(MESSAGES.error.general);
    }
  }
};
