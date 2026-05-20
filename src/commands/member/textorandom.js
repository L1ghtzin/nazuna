export default {
  name: "textorandom",
  description: "Envia textos aleatórios como conselhos, cantadas, piadas, etc.",
  commands: [
    "conselho", 
    "conselhobiblico", "versiculo", "biblia", 
    "cantada", "cantadas", 
    "piada", "piadas", 
    "charada", "enigma", 
    "motivacional", "motivacao", "frasemotivacional", 
    "elogio", "elogiar", 
    "reflexao", "pensamento", 
    "fato", "fatocurioso", "curiosidade"
  ],
  usage: `${global.prefix}<comando>`,
  handle: async ({  reply, command, toolsJson , MESSAGES }) => {
    try {
      const data = toolsJson();
      let msg = "";
      
      switch (command) {
        case 'conselho':
          msg = `💡 *Conselho do dia:*\n\n${data.Conselhos[Math.floor(Math.random() * data.Conselhos.length)]}`;
          break;
        case 'conselhobiblico':
        case 'versiculo':
        case 'biblia':
          msg = `📖 *Conselho Bíblico:*\n\n${data.ConselhosBiblicos[Math.floor(Math.random() * data.ConselhosBiblicos.length)]}`;
          break;
        case 'cantada':
        case 'cantadas':
          msg = `💘 *Cantada:*\n\n${data.Cantadas[Math.floor(Math.random() * data.Cantadas.length)]}`;
          break;
        case 'piada':
        case 'piadas':
          msg = `😂 *Piada:*\n\n${data.Piadas[Math.floor(Math.random() * data.Piadas.length)]}`;
          break;
        case 'charada':
        case 'enigma':
          msg = `🧩 *Charada:*\n\n${data.Charadas[Math.floor(Math.random() * data.Charadas.length)]}`;
          break;
        case 'motivacional':
        case 'motivacao':
        case 'frasemotivacional':
          msg = `🚀 *Frase Motivacional:*\n\n${data.FrasesMotivacionais[Math.floor(Math.random() * data.FrasesMotivacionais.length)]}`;
          break;
        case 'elogio':
        case 'elogiar':
          msg = `🌟 *Elogio:*\n\n${data.Elogios[Math.floor(Math.random() * data.Elogios.length)]}`;
          break;
        case 'reflexao':
        case 'pensamento':
          msg = `🤔 *Reflexão:*\n\n${data.Reflexoes[Math.floor(Math.random() * data.Reflexoes.length)]}`;
          break;
        case 'fato':
        case 'fatocurioso':
        case 'curiosidade':
          msg = `🔬 *Fato Curioso:*\n\n${data.curiousFacts[Math.floor(Math.random() * data.curiousFacts.length)]}`;
          break;
      }
      
      if (msg) {
        await reply(msg);
      }
    } catch (e) {
      console.error(`Erro no comando textorandom (${command}):`, e);
      await reply(MESSAGES.error.internal);
    }
  }
};
