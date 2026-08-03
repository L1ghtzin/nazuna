import staticData from '../../funcs/utils/staticDataLoader.js';

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
  handle: async ({ reply, command, MESSAGES }) => {
    try {
      const item = staticData.getRandom(command);
      if (!item) return reply(MESSAGES.error.general);
      
      let msg = "";
      switch (command) {
        case 'conselho':
          msg = MESSAGES.member.textorandom.conselho(item);
          break;
        case 'conselhobiblico':
        case 'versiculo':
        case 'biblia':
          msg = MESSAGES.member.textorandom.conselhobiblico(item);
          break;
        case 'cantada':
        case 'cantadas':
          msg = MESSAGES.member.textorandom.cantada(item);
          break;
        case 'piada':
        case 'piadas':
          msg = MESSAGES.member.textorandom.piada(item);
          break;
        case 'charada':
        case 'enigma':
          msg = MESSAGES.member.textorandom.charada(item);
          break;
        case 'motivacional':
        case 'motivacao':
        case 'frasemotivacional':
          msg = MESSAGES.member.textorandom.motivacional(item);
          break;
        case 'elogio':
        case 'elogiar':
          msg = MESSAGES.member.textorandom.elogio(item);
          break;
        case 'reflexao':
        case 'pensamento':
          msg = MESSAGES.member.textorandom.reflexao(item);
          break;
        case 'fato':
        case 'fatocurioso':
        case 'curiosidade':
          msg = MESSAGES.member.textorandom.fato(item);
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
