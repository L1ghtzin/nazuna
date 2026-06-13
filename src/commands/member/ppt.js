export default {
  name: "ppt",
  description: "Jogue Pedra, Papel ou Tesoura contra o bot",
  commands: ["ppt"],
  usage: `${global.prefix}ppt <pedra|papel|tesoura>`,
  handle: async ({  reply, q, prefix , MESSAGES }) => {
    try {
      if (!q) return reply(MESSAGES.member.ppt.usage(prefix));
      const escolhas = ['pedra', 'papel', 'tesoura'];
      if (!escolhas.includes(q.toLowerCase())) return reply(MESSAGES.member.ppt.invalidChoice);
      
      const botEscolha = escolhas[Math.floor(Math.random() * 3)];
      const usuarioEscolha = q.toLowerCase();
      let resultado;
      
      if (usuarioEscolha === botEscolha) {
        resultado = MESSAGES.member.ppt.draw;
      } else if ((usuarioEscolha === 'pedra' && botEscolha === 'tesoura') || 
                 (usuarioEscolha === 'papel' && botEscolha === 'pedra') || 
                 (usuarioEscolha === 'tesoura' && botEscolha === 'papel')) {
        resultado = MESSAGES.member.ppt.win;
      } else {
        resultado = MESSAGES.member.ppt.lose;
      }
      
      await reply(MESSAGES.member.ppt.result(usuarioEscolha, botEscolha, resultado));
    } catch (e) {
      console.error('Erro no comando ppt:', e);
      await reply(MESSAGES.error.general);
    }
  }
};
