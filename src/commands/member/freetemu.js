export default {
  name: "freetemu",
  description: "Converte link da Temu para a versão do evento de produtos gratuitos",
  commands: ["freetemu"],
  usage: `${global.prefix}freetemu <link-temu>`,
  handle: async ({  reply, q, temuScammer , MESSAGES }) => {
    try {
      if (!q) return reply(MESSAGES.member.freetemu.missingLink);
      if (!q.includes('temu')) return reply(MESSAGES.member.freetemu.invalidLink);
      
      const KKMeMamaTemu = await temuScammer.convertTemuLink(q);
      
      await reply(MESSAGES.member.freetemu.success(KKMeMamaTemu));
    } catch (e) {
      await reply(MESSAGES.error.general);
      console.error(e);
    }
  }
};
