import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "forca",
  description: "Jogo da Forca em grupo",
  commands: ["forca", "hangman"],
  usage: "{prefix}forca [letra/palavra]",
  handle: async ({ 
    reply, 
    isGroup, 
    from, 
    sender, 
    args, 
    prefix, 
    normalizar,
    MESSAGES,
    optimizer
  }) => {
    // Carregar palavras do JSON
    const forcaPath = path.join(__dirname, '../../funcs/json/forca.json');
    let palavrasForca = [];
    try {
      const forcaData = await optimizer.loadJsonWithCache(forcaPath, 'utf-8');
      palavrasForca = forcaData.palavras || [];
    } catch (e) {
      console.error('Erro ao carregar forca.json:', e);
      palavrasForca = [
        { palavra: 'elefante', dica: 'Animal grande com tromba' },
        { palavra: 'computador', dica: 'Máquina eletrônica' },
        { palavra: 'chocolate', dica: 'Doce feito de cacau' }
      ];
    }

    const desenhoForca = [
      '```\n  +-----+\n  |     |\n  |      \n  |      \n  |      \n=======```',
      '```\n  +-----+\n  |     |\n  |     O\n  |      \n  |      \n=======```',
      '```\n  +-----+\n  |     |\n  |     O\n  |     |\n  |      \n=======```',
      '```\n  +-----+\n  |     |\n  |     O\n  |    /|\n  |      \n=======```',
      '```\n  +-----+\n  |     |\n  |     O\n  |    /|\\\n  |      \n=======```',
      '```\n  +-----+\n  |     |\n  |     O\n  |    /|\\\n  |    /  \n=======```',
      '```\n  +-----+\n  |     |\n  |     X\n  |    /|\\\n  |    / \\\n=======```'
    ];

    if (!global.forcaGames) global.forcaGames = {};
    const gameKey = isGroup ? from : sender;

    if (args[0] === 'desistir' && global.forcaGames[gameKey]) {
      const palavra = global.forcaGames[gameKey].palavra;
      delete global.forcaGames[gameKey];
      return reply(MESSAGES.member.forca.surrender(palavra));
    }

    if (args[0] === 'dica' && global.forcaGames[gameKey]) {
      return reply(MESSAGES.member.forca.hint(desenhoForca[game.erros], game.progresso.join(' '), game.dica, game.letrasErradas.join(', '), game.erros, prefix));
    }

    if (global.forcaGames[gameKey] && args.length > 0) {
      const game = global.forcaGames[gameKey];
      const chute = normalizar(args.join('').toLowerCase());
      
      if (chute.length > 1) {
        if (chute === normalizar(game.palavra)) {
          delete global.forcaGames[gameKey];
          return reply(MESSAGES.member.forca.correctWord(game.palavra));
        } else {
          game.erros += 2;
          if (game.erros >= 6) {
            delete global.forcaGames[gameKey];
            return reply(MESSAGES.member.forca.gameOverWord(desenhoForca[6], game.palavra));
          }
          return reply(MESSAGES.member.forca.wrongWord(desenhoForca[game.erros], game.progresso.join(' '), game.letrasErradas.join(', '), game.erros));
        }
      }

      const letra = chute[0];
      if (game.letrasCorretas.includes(letra) || game.letrasErradas.includes(letra)) {
        return reply(MESSAGES.member.forca.alreadyGuessed(letra));
      }
      
      const palavraNorm = normalizar(game.palavra.toLowerCase());
      if (palavraNorm.includes(letra)) {
        game.letrasCorretas.push(letra);
        for (let i = 0; i < palavraNorm.length; i++) {
          if (palavraNorm[i] === letra) game.progresso[i] = game.palavra[i].toUpperCase();
        }
        if (!game.progresso.includes('_')) {
          delete global.forcaGames[gameKey];
          return reply(MESSAGES.member.forca.correctLetterWin(game.progresso.join(' '), game.palavra));
        }
        return reply(MESSAGES.member.forca.correctLetter(desenhoForca[game.erros], letra, game.progresso.join(' '), game.erros));
      } else {
        game.letrasErradas.push(letra.toUpperCase());
        game.erros++;
        if (game.erros >= 6) {
          delete global.forcaGames[gameKey];
          return reply(MESSAGES.member.forca.gameOverLetter(desenhoForca[6], game.palavra));
        }
        return reply(MESSAGES.member.forca.wrongLetter(desenhoForca[game.erros], letra, game.progresso.join(' '), game.letrasErradas.join(', '), game.erros));
      }
    }

    if (global.forcaGames[gameKey]) {
      return reply(MESSAGES.member.forca.gameStatus(desenhoForca[game.erros], game.progresso.join(' '), prefix));
    }

    const escolhida = palavrasForca[Math.floor(Math.random() * palavrasForca.length)];
    const progresso = escolhida.palavra.split('').map(() => '_');
    global.forcaGames[gameKey] = {
      palavra: escolhida.palavra,
      dica: escolhida.dica,
      progresso,
      letrasCorretas: [],
      letrasErradas: [],
      erros: 0,
      iniciado: Date.now()
    };

    await reply(MESSAGES.member.forca.newGame(desenhoForca[0], progresso.join(' '), prefix));
  },
};
