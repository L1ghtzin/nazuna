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
          msg = MESSAGES.member.textorandom.conselho(data.Conselhos[Math.floor(Math.random() * data.Conselhos.length)]);
          break;
        case 'conselhobiblico':
        case 'versiculo':
        case 'biblia':
          msg = MESSAGES.member.textorandom.conselhobiblico(data.ConselhosBiblicos[Math.floor(Math.random() * data.ConselhosBiblicos.length)]);
          break;
        case 'cantada':
        case 'cantadas':
          msg = MESSAGES.member.textorandom.cantada(data.Cantadas[Math.floor(Math.random() * data.Cantadas.length)]);
          break;
        case 'piada':
        case 'piadas':
          msg = MESSAGES.member.textorandom.piada(data.Piadas[Math.floor(Math.random() * data.Piadas.length)]);
          break;
        case 'charada':
        case 'enigma':
          msg = MESSAGES.member.textorandom.charada(data.Charadas[Math.floor(Math.random() * data.Charadas.length)]);
          break;
        case 'motivacional':
        case 'motivacao':
        case 'frasemotivacional':
          msg = MESSAGES.member.textorandom.motivacional(data.FrasesMotivacionais[Math.floor(Math.random() * data.FrasesMotivacionais.length)]);
          break;
        case 'elogio':
        case 'elogiar':
          msg = MESSAGES.member.textorandom.elogio(data.Elogios[Math.floor(Math.random() * data.Elogios.length)]);
          break;
        case 'reflexao':
        case 'pensamento':
          msg = MESSAGES.member.textorandom.reflexao(data.Reflexoes[Math.floor(Math.random() * data.Reflexoes.length)]);
          break;
        case 'fato':
        case 'fatocurioso':
        case 'curiosidade':
          msg = MESSAGES.member.textorandom.fato(data.curiousFacts[Math.floor(Math.random() * data.curiousFacts.length)]);
          break;
      }
      
      if (msg) {
        await reply(msg);
      }
    } catch (e) {
      console.error(`Erro no comando textorandom (${command}):`, e);
      await reply(MESSAGES.error.general);
    }
  }
};
