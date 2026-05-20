export default {
  name: "ppt",
  description: "Jogue Pedra, Papel ou Tesoura contra o bot",
  commands: ["ppt"],
  usage: `${global.prefix}ppt <pedra|papel|tesoura>`,
  handle: async ({  reply, q, prefix , MESSAGES }) => {
    try {
      if (!q) return reply(`🎮 *Pedra, Papel ou Tesoura*\n\n💡 *Como jogar:*\n• Escolha sua jogada após o comando\n• Ex: ${prefix}ppt pedra\n• Ex: ${prefix}ppt papel\n• Ex: ${prefix}ppt tesoura\n\n🎲 Vamos ver quem ganha!`);
      const escolhas = ['pedra', 'papel', 'tesoura'];
      if (!escolhas.includes(q.toLowerCase())) return reply('Escolha inválida! Use: pedra, papel ou tesoura.');
      
      const botEscolha = escolhas[Math.floor(Math.random() * 3)];
      const usuarioEscolha = q.toLowerCase();
      let resultado;
      
      if (usuarioEscolha === botEscolha) {
        resultado = 'Empate! 🤝';
      } else if ((usuarioEscolha === 'pedra' && botEscolha === 'tesoura') || 
                 (usuarioEscolha === 'papel' && botEscolha === 'pedra') || 
                 (usuarioEscolha === 'tesoura' && botEscolha === 'papel')) {
        resultado = 'Você ganhou! 🎉';
      } else {
        resultado = 'Eu ganhei! 😎';
      }
      
      await reply(`🖐️ *Pedra, Papel, Tesoura* 🖐️\n\nVocê: ${usuarioEscolha}\nEu: ${botEscolha}\n\n${resultado}`);
    } catch (e) {
      console.error('Erro no comando ppt:', e);
      await reply(MESSAGES.error.simple);
    }
  }
};
