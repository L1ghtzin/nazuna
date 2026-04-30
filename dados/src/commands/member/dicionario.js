export default {
  name: "dicionario",
  description: "Procura o significado de uma palavra no dicionário",
  commands: ["dicionario", "dictionary"],
  usage: `${global.prefixo}dicionario <palavra>`,
  handle: async ({ 
    reply,
    q,
    prefix,
    command,
    Dicionary,
    MESSAGES
  }) => {
    try {
      if (!q) return reply(`📔 Qual palavra você quer procurar no dicionário? Me diga após o comando ${prefix}${command}! 😊`);

      await reply("📔 Procurando no dicionário... Aguarde um pouquinho! ⏳");

      const palavra = q.trim().toLowerCase();
      const resultado = await Dicionary(palavra);
      
      if (resultado && resultado.significados.length > 0) {
        let mensagem = `📘✨ *Significado de "${resultado.palavra || palavra.toUpperCase()}":*\n\n`;
        
        if (resultado.classe) {
          mensagem += `*📚 Classe:* ${resultado.classe}\n\n`;
        }
        
        if (resultado.separacao) {
          mensagem += `*🔤 Separação:* ${resultado.separacao}\n\n`;
        }
        
        if (resultado.significados.length > 0) {
          mensagem += `*📖 Significados:*\n`;
          const significadosMostrar = resultado.significados.slice(0, 3);
          significadosMostrar.forEach((significado, index) => {
            mensagem += `${index + 1}. ${significado}\n`;
          });
          if (resultado.significados.length > 3) {
            mensagem += `_...e mais ${resultado.significados.length - 3} significados_\n`;
          }
          mensagem += '\n';
        }
        
        if (resultado.exemplos.length > 0) {
          mensagem += `*💡 Exemplo:*\n${resultado.exemplos[0].texto}\n`;
          if (resultado.exemplos[0].fonte) {
            mensagem += `_Fonte: ${resultado.exemplos[0].fonte}_\n`;
          }
          mensagem += '\n';
        }
        
        if (resultado.etimologia) {
          mensagem += `*📜 Etimologia:*\n${resultado.etimologia.substring(0, 150)}...\n\n`;
        }
        
        if (resultado.frases.length > 0) {
          mensagem += `*✨ Frase:*\n"${resultado.frases[0].texto}"\n`;
          if (resultado.frases[0].autor !== 'Desconhecido') {
            mensagem += `_— ${resultado.frases[0].autor}_\n`;
          }
        }
        
        reply(mensagem);
      } else {
        throw new Error('Sem resultados');
      }
    } catch (error) {
      reply(`💔 Palavra não encontrada. Verifique a ortografia e tente novamente.`);
    }
  }
};
