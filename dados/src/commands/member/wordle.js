import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PREFIX } from "../../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "wordle",
  description: "Jogo de adivinhar a palavra",
  commands: ["wordle", "palavra"],
  usage: `${PREFIX}wordle`,
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
    const wordlePath = path.join(__dirname, '../../funcs/json/wordle.json');
    let palavrasPorTamanho = {};
    try {
      const wordleData = JSON.parse(fs.readFileSync(wordlePath, 'utf-8'));
      palavrasPorTamanho = wordleData.palavras || {};
    } catch (e) {
      console.error('Erro ao carregar wordle.json:', e);
      palavrasPorTamanho = { "5": ['amigo', 'barco', 'canto', 'dança', 'entre', 'falar', 'gosto', 'hotel', 'igual', 'jogar'] };
    }

    // Estado dos jogos de wordle ativos
    if (!global.wordleGames) global.wordleGames = {};
    const gameKey = isGroup ? from : sender;

    // Subcomando para chutar
    if (args[0] && global.wordleGames[gameKey]) {
      if (args[0].toLowerCase() === 'desistir') {
        const palavra = global.wordleGames[gameKey].palavra;
        delete global.wordleGames[gameKey];
        return reply(`🏳️ Você desistiu!\n\nA palavra era: *${palavra.toUpperCase()}*`);
      }

      const game = global.wordleGames[gameKey];
      const chute = normalizar(args[0].toLowerCase());
      const tamanhoEsperado = game.palavra.length;
      
      // Validar tamanho do chute
      if (chute.length !== tamanhoEsperado) {
        return reply(`💔 A palavra deve ter ${tamanhoEsperado} letras!\n\n💡 Você tem um jogo ativo com palavra de ${tamanhoEsperado} letras.\n\n📝 Chute: ${prefix}wordle [palavra de ${tamanhoEsperado} letras]`);
      }
      
      game.tentativas++;
      
      // Verificar letras com lógica correta do Wordle
      const palavraArray = game.palavra.split('');
      const chuteArray = chute.split('');
      
      // Array para rastrear letras disponíveis na palavra original
      const letrasDisponiveis = [...palavraArray];
      const statusLetras = new Array(tamanhoEsperado).fill(null); // null = não processado
      
      // Primeira passada: marcar letras no lugar certo (verde)
      for (let i = 0; i < tamanhoEsperado; i++) {
        if (chuteArray[i] === palavraArray[i]) {
          statusLetras[i] = '🟩'; // Verde
          // Remover essa letra do array disponível
          const index = letrasDisponiveis.indexOf(chuteArray[i]);
          if (index !== -1) {
            letrasDisponiveis.splice(index, 1);
          }
        }
      }
      
      // Segunda passada: marcar letras no lugar errado (amarelo) ou erradas (preto)
      for (let i = 0; i < tamanhoEsperado; i++) {
        if (statusLetras[i] === null) {
          // Letra não está no lugar certo
          const index = letrasDisponiveis.indexOf(chuteArray[i]);
          if (index !== -1) {
            // Letra existe na palavra e ainda há ocorrências disponíveis
            statusLetras[i] = '🟨'; // Amarelo
            letrasDisponiveis.splice(index, 1);
          } else {
            // Letra não existe ou já foi usada
            statusLetras[i] = '⬛'; // Preto
          }
        }
      }
      
      const resultado = statusLetras.join('');
      game.historico.push(`${chute.toUpperCase()} ${resultado}`);
      
      if (chute === game.palavra) {
        const pontos = Math.max(100 - (game.tentativas - 1) * 15, 10);
        delete global.wordleGames[gameKey];
        return reply(`🎉 *PARABÉNS!*\n\n${game.historico.join('\n')}\n\n✅ Você acertou em ${game.tentativas}/6 tentativas!\n🏆 +${pontos} pontos\n\nA palavra era: *${game.palavra.toUpperCase()}*`);
      }
      
      if (game.tentativas >= 6) {
        delete global.wordleGames[gameKey];
        return reply(`😢 *GAME OVER!*\n\n${game.historico.join('\n')}\n\n❌ Suas tentativas acabaram!\n\nA palavra era: *${game.palavra.toUpperCase()}*`);
      }
      
      return reply(`🎯 *WORDLE* (${game.tentativas}/6)\n\n${game.historico.join('\n')}\n\n💡 Continue chutando com: ${prefix}wordle [palavra de ${tamanhoEsperado} letras]`);
    }

    // Novo jogo
    if (global.wordleGames[gameKey]) {
      const game = global.wordleGames[gameKey];
      const tamanho = game.palavra.length;
      return reply(`🎮 *Jogo em andamento!*\n\n${game.historico.length > 0 ? game.historico.join('\n') + '\n\n' : ''}Tentativas: ${game.tentativas}/6\n📏 Tamanho: ${tamanho} letras\n\n💡 Chute uma palavra de ${tamanho} letras:\n${prefix}wordle [palavra]\n\n🔄 Para desistir: ${prefix}wordle desistir`);
    }

    // Iniciar novo jogo - escolher tamanho aleatório
    const tamanhosDisponiveis = Object.keys(palavrasPorTamanho).filter(t => palavrasPorTamanho[t] && palavrasPorTamanho[t].length > 0);
    if (tamanhosDisponiveis.length === 0) {
      return reply(MESSAGES.error.general);
    }
    
    const tamanhoEscolhido = tamanhosDisponiveis[Math.floor(Math.random() * tamanhosDisponiveis.length)];
    const palavrasDoTamanho = palavrasPorTamanho[tamanhoEscolhido];
    const palavraEscolhida = palavrasDoTamanho[Math.floor(Math.random() * palavrasDoTamanho.length)];
    
    global.wordleGames[gameKey] = {
      palavra: normalizar(palavraEscolhida.toLowerCase()),
      tentativas: 0,
      historico: [],
      iniciado: Date.now()
    };

    await reply(`🎮 *WORDLE - Adivinhe a Palavra!*\n\n📝 Tente adivinhar a palavra de ${tamanhoEscolhido} letras!\n\n🟩 = Letra certa no lugar certo\n🟨 = Letra certa no lugar errado\n⬛ = Letra não existe\n\n💡 Você tem 6 tentativas!\n\n*Chute com:* ${prefix}wordle [palavra de ${tamanhoEscolhido} letras]`);
  },
};
