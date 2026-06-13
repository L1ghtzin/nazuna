import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "anagrama",
  description: "Descubra a palavra embaralhada",
  commands: ["anagrama"],
  usage: "{prefix}anagrama [palavra]",
  handle: async ({ 
    reply, 
    isGroup, 
    from, 
    sender, 
    args, 
    prefix, 
    normalizar,
    MESSAGES
  }) => {
    const anagramaPath = path.join(__dirname, '../../funcs/json/anagrama.json');
    let palavrasAnagrama = [];
    try {
      const anagramaData = JSON.parse(fs.readFileSync(anagramaPath, 'utf-8'));
      palavrasAnagrama = anagramaData.palavras || [];
    } catch (e) {
      console.error('Erro ao carregar anagrama.json:', e);
      palavrasAnagrama = [{ palavra: 'computador', dica: 'Máquina eletrônica' }];
    }

    if (!global.anagramaGames) global.anagramaGames = {};
    const gameKey = isGroup ? from : sender;

    const embaralhar = (p) => p.split('').sort(() => Math.random() - 0.5).join('');

    if (global.anagramaGames[gameKey] && args.length > 0) {
      const game = global.anagramaGames[gameKey];
      const resp = normalizar(args.join(' ').toLowerCase());
      if (resp === normalizar(game.palavra.toLowerCase())) {
        const pontos = Math.max(100 - (game.tentativas * 10), 10);
        delete global.anagramaGames[gameKey];
        return reply(MESSAGES.member.anagrama.win(game.palavra.toUpperCase(), pontos));
      }
      game.tentativas++;
      if (game.tentativas >= 5) {
        const p = game.palavra;
        delete global.anagramaGames[gameKey];
        return reply(MESSAGES.member.anagrama.gameOver(p.toUpperCase()));
      }
      return reply(MESSAGES.member.anagrama.wrong(game.embaralhada, game.dica, game.tentativas));
    }

    if (global.anagramaGames[gameKey]) {
      const g = global.anagramaGames[gameKey];
      return reply(MESSAGES.member.anagrama.status(g.embaralhada.toUpperCase(), g.dica));
    }

    const esc = palavrasAnagrama[Math.floor(Math.random() * palavrasAnagrama.length)];
    global.anagramaGames[gameKey] = {
      palavra: esc.palavra, embaralhada: embaralhar(esc.palavra), dica: esc.dica, tentativas: 0
    };
    await reply(MESSAGES.member.anagrama.start(global.anagramaGames[gameKey].embaralhada.toUpperCase(), esc.dica));
  },
};
