export default {
  name: "freetemu",
  description: "Converte link da Temu para a versão do evento de produtos gratuitos",
  commands: ["freetemu"],
  usage: `${global.prefix}freetemu <link-temu>`,
  handle: async ({  reply, q, temuScammer , MESSAGES }) => {
    try {
      if (!q) return reply(`💔 Por favor, digite um link da Temu.`);
      if (!q.includes('temu')) return reply(`💔 Link inválido.`);
      
      const KKMeMamaTemu = await temuScammer.convertTemuLink(q);
      
      await reply(
        `🎉 Aqui está o link do produto no evento como GRATUITO:\n\n` +
        `⚠️ Atenção: Nem todos os anúncios funcionam com esse método. Se não funcionar com este link, tente outro.\n\n` +
        `💡 Esse sistema foi criado por mim (Hiudy) e, até hoje, não vi ninguém oferecendo algo assim. Aproveite!\n\n` +
        `${KKMeMamaTemu}`
      );
    } catch (e) {
      await reply(MESSAGES.error.unexpected);
      console.error(e);
    }
  }
};
