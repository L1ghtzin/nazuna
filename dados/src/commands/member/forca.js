import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PREFIX } from "../../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "forca",
  description: "Jogo da Forca em grupo",
  commands: ["forca", "hangman"],
  usage: `${PREFIX}forca [letra/palavra]`,
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
    // Carregar palavras do JSON
    const forcaPath = path.join(__dirname, '../../funcs/json/forca.json');
    let palavrasForca = [];
    try {
      const forcaData = JSON.parse(fs.readFileSync(forcaPath, 'utf-8'));
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
      '```\n  ┌───┐\n  │   │\n      │\n      │\n      │\n══════╧══```',
      '```\n  ┌───┐\n  │   │\n  😮  │\n      │\n      │\n══════╧══```',
      '```\n  ┌───┐\n  │   │\n  😮  │\n  │   │\n      │\n══════╧══```',
      '```\n  ┌───┐\n  │   │\n  😮  │\n ─│   │\n      │\n══════╧══```',
      '```\n  ┌───┐\n  │   │\n  😮  │\n ─│─  │\n      │\n══════╧══```',
      '```\n  ┌───┐\n  │   │\n  😮  │\n ─│─  │\n /    │\n══════╧══```',
      '```\n  ┌───┐\n  │   │\n  😵  │\n ─│─  │\n / \\  │\n══════╧══```'
    ];

    if (!global.forcaGames) global.forcaGames = {};
    const gameKey = isGroup ? from : sender;

    if (args[0] === 'desistir' && global.forcaGames[gameKey]) {
      const palavra = global.forcaGames[gameKey].palavra;
      delete global.forcaGames[gameKey];
      return reply(`🏳️ Vocês desistiram!\n\nA palavra era: *${palavra.toUpperCase()}*`);
    }

    if (args[0] === 'dica' && global.forcaGames[gameKey]) {
      const game = global.forcaGames[gameKey];
      return reply(`${desenhoForca[game.erros]}\n\n🎯 *FORCA*\n\n📝 ${game.progresso.join(' ')}\n\n💡 *Dica:* ${game.dica}\n❌ Letras erradas: ${game.letrasErradas.join(', ') || 'Nenhuma'}\n⚠️ Erros: ${game.erros}/6\n\n💬 Chute com: ${prefix}forca [letra]\n🔤 Ou chute a palavra: ${prefix}forca [palavra]`);
    }

    if (global.forcaGames[gameKey] && args.length > 0) {
      const game = global.forcaGames[gameKey];
      const chute = normalizar(args.join('').toLowerCase());
      
      if (chute.length > 1) {
        if (chute === normalizar(game.palavra)) {
          delete global.forcaGames[gameKey];
          return reply(`🎉 *PARABÉNS!*\n\n✅ Você acertou a palavra!\n\n🏆 A palavra era: *${game.palavra.toUpperCase()}*`);
        } else {
          game.erros += 2;
          if (game.erros >= 6) {
            delete global.forcaGames[gameKey];
            return reply(`${desenhoForca[6]}\n\n💀 *GAME OVER!*\n\n❌ A palavra era: *${game.palavra.toUpperCase()}*`);
          }
          return reply(`${desenhoForca[game.erros]}\n\n❌ Palavra errada! (+2 erros)\n\n📝 ${game.progresso.join(' ')}\n\n❌ Letras erradas: ${game.letrasErradas.join(', ') || 'Nenhuma'}\n⚠️ Erros: ${game.erros}/6`);
        }
      }

      const letra = chute[0];
      if (game.letrasCorretas.includes(letra) || game.letrasErradas.includes(letra)) {
        return reply(`⚠️ Você já chutou a letra "${letra.toUpperCase()}"!`);
      }
      
      const palavraNorm = normalizar(game.palavra.toLowerCase());
      if (palavraNorm.includes(letra)) {
        game.letrasCorretas.push(letra);
        for (let i = 0; i < palavraNorm.length; i++) {
          if (palavraNorm[i] === letra) game.progresso[i] = game.palavra[i].toUpperCase();
        }
        if (!game.progresso.includes('_')) {
          delete global.forcaGames[gameKey];
          return reply(`🎉 *PARABÉNS!*\n\n📝 ${game.progresso.join(' ')}\n\n✅ Vocês descobriram a palavra!\n🏆 *${game.palavra.toUpperCase()}*`);
        }
        return reply(`${desenhoForca[game.erros]}\n\n✅ Letra "${letra.toUpperCase()}" correta!\n\n📝 ${game.progresso.join(' ')}\n\n⚠️ Erros: ${game.erros}/6`);
      } else {
        game.letrasErradas.push(letra.toUpperCase());
        game.erros++;
        if (game.erros >= 6) {
          delete global.forcaGames[gameKey];
          return reply(`${desenhoForca[6]}\n\n💀 *GAME OVER!*\n\n❌ A palavra era: *${game.palavra.toUpperCase()}*`);
        }
        return reply(`${desenhoForca[game.erros]}\n\n❌ Letra "${letra.toUpperCase()}" errada!\n\n📝 ${game.progresso.join(' ')}\n\n❌ Letras erradas: ${game.letrasErradas.join(', ')}\n⚠️ Erros: ${game.erros}/6`);
      }
    }

    if (global.forcaGames[gameKey]) {
      const game = global.forcaGames[gameKey];
      return reply(`${desenhoForca[game.erros]}\n\n🎯 *FORCA*\n\n📝 ${game.progresso.join(' ')}\n\n💡 Ver dica: ${prefix}forca dica\n🏳️ Desistir: ${prefix}forca desistir`);
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

    await reply(`${desenhoForca[0]}\n\n🎯 *FORCA - Novo Jogo!*\n\n📝 ${progresso.join(' ')}\n\n💬 Chute uma letra: ${prefix}forca [letra]\n💡 Ver dica: ${prefix}forca dica`);
  },
};
