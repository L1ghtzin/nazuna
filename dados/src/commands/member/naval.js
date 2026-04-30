import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PREFIX } from "../../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "batalhanaval",
  description: "Jogo de estratégia naval",
  commands: ["batalhanaval", "batalha", "naval"],
  usage: `${PREFIX}batalhanaval @usuario`,
  handle: async ({ 
    reply, 
    isGroup, 
    from, 
    sender, 
    args, 
    prefix, 
    menc_os2,
    MESSAGES
  }) => {
    if (!isGroup) return reply('🚢 Este jogo só funciona em grupos!');

    const navalPath = path.join(__dirname, '../../funcs/json/batalhanaval.json');
    let configNaval = {
      tamanhoTabuleiro: 10,
      navios: [
        { nome: "Porta-aviões", tamanho: 5, quantidade: 1 },
        { nome: "Encouraçado", tamanho: 4, quantidade: 1 },
        { nome: "Cruzador", tamanho: 3, quantidade: 2 },
        { nome: "Destroyer", tamanho: 2, quantidade: 2 },
        { nome: "Submarino", tamanho: 1, quantidade: 2 }
      ]
    };
    try {
      const navalData = JSON.parse(fs.readFileSync(navalPath, 'utf-8'));
      configNaval = { ...configNaval, ...navalData.config };
    } catch (e) {
      console.error('Erro ao carregar batalhanaval.json:', e);
    }

    if (!global.navalGames) global.navalGames = {};
    if (!global.navalChallenges) global.navalChallenges = {};
    const gameKey = from;

    const criarTabuleiro = (tamanho) => Array(tamanho).fill(null).map(() => Array(tamanho).fill('🌊'));

    const posicionarNavios = (tabuleiro, navios) => {
      const tamanho = tabuleiro.length;
      const naviosPosicionados = [];
      for (const navio of navios) {
        for (let qtd = 0; qtd < navio.quantidade; qtd++) {
          let posicionado = false;
          let tentativas = 0;
          while (!posicionado && tentativas < 100) {
            tentativas++;
            const horizontal = Math.random() < 0.5;
            const linha = Math.floor(Math.random() * tamanho);
            const coluna = Math.floor(Math.random() * tamanho);
            let cabe = true;
            const posicoes = [];
            for (let i = 0; i < navio.tamanho; i++) {
              const l = horizontal ? linha : linha + i;
              const c = horizontal ? coluna + i : coluna;
              if (l >= tamanho || c >= tamanho || tabuleiro[l][c] !== '🌊') { cabe = false; break; }
              posicoes.push({ linha: l, coluna: c });
            }
            if (cabe) {
              posicoes.forEach(pos => tabuleiro[pos.linha][pos.coluna] = '🚢');
              naviosPosicionados.push({ nome: navio.nome, tamanho: navio.tamanho, posicoes, acertos: 0 });
              posicionado = true;
            }
          }
        }
      }
      return naviosPosicionados;
    };

    const parseCoordenada = (coord) => {
      const match = coord.match(/^([A-J])(\d+)$/i);
      if (!match) return null;
      const coluna = match[1].toUpperCase().charCodeAt(0) - 65;
      const linha = parseInt(match[2]) - 1;
      if (linha < 0 || linha >= 10 || coluna < 0 || coluna >= 10) return null;
      return { linha, coluna };
    };

    const formatarTabuleiro = (tabuleiro, mostrarNavios = false) => {
      let res = '   A B C D E F G H I J\n';
      for (let i = 0; i < tabuleiro.length; i++) {
        res += `${(i + 1).toString().padStart(2)} `;
        for (let j = 0; j < tabuleiro[i].length; j++) {
          const celula = tabuleiro[i][j];
          if (celula === '🌊') res += '🌊';
          else if (celula === '🚢' && !mostrarNavios) res += '🌊';
          else if (celula === '💥') res += '💥';
          else if (celula === '❌') res += '❌';
          else res += celula;
          res += ' ';
        }
        res += '\n';
      }
      return res;
    };

    if (menc_os2 && menc_os2 !== sender) {
      if (global.navalChallenges[gameKey] || global.navalGames[gameKey]) return reply('⚠️ Já existe um jogo ou desafio pendente!');
      global.navalChallenges[gameKey] = { challenger: sender, challenged: menc_os2, status: 'pending', created: Date.now() };
      return reply(`🚢 *DESAFIO DE BATALHA NAVAL*\n\n@${sender.split('@')[0]} desafiou @${menc_os2.split('@')[0]}!\n💡 Use: ${prefix}batalhanaval aceitar`, { mentions: [sender, menc_os2] });
    }

    if (args[0]?.toLowerCase() === 'aceitar') {
      const ch = global.navalChallenges[gameKey];
      if (!ch || ch.challenged !== sender) return reply(`💔 Não há desafio para você!`);
      const t1 = criarTabuleiro(10), t2 = criarTabuleiro(10);
      global.navalGames[gameKey] = {
        jogador1: ch.challenger, jogador2: ch.challenged,
        tabuleiro1: t1, tabuleiro2: t2,
        tiros1: criarTabuleiro(10), tiros2: criarTabuleiro(10),
        navios1: posicionarNavios(t1, configNaval.navios),
        navios2: posicionarNavios(t2, configNaval.navios),
        turno: ch.challenger, status: 'active', ultimaJogada: Date.now()
      };
      delete global.navalChallenges[gameKey];
      return reply(`🚢 *BATALHA NAVAL INICIADA!*\n🎯 Vez de @${ch.challenger.split('@')[0]}!`, { mentions: [ch.challenger, ch.challenged] });
    }

    if (global.navalGames[gameKey] && args[0]) {
      const game = global.navalGames[gameKey];
      if (game.status !== 'active') return reply(`💔 Jogo terminado!`);
      if (game.turno !== sender) return reply('⏳ Não é sua vez!');
      const coord = parseCoordenada(args[0].toUpperCase());
      if (!coord) return reply(`💔 Coordenada inválida! (Ex: A5)`);

      let alvo = sender === game.jogador1 ? game.tabuleiro2 : game.tabuleiro1;
      let tiros = sender === game.jogador1 ? game.tiros1 : game.tiros2;
      let naviosAlvo = sender === game.jogador1 ? game.navios2 : game.navios1;

      if (tiros[coord.linha][coord.coluna] !== '🌊') return reply('⚠️ Já atirou aqui!');

      const celula = alvo[coord.linha][coord.coluna];
      let res = celula === '🚢' ? '💥 *ACERTOU!*' : `💔 *ÁGUA!*`;
      tiros[coord.linha][coord.coluna] = celula === '🚢' ? '💥' : '❌';
      alvo[coord.linha][coord.coluna] = tiros[coord.linha][coord.coluna];

      if (celula === '🚢') {
        for (const n of naviosAlvo) {
          if (n.posicoes.some(p => p.linha === coord.linha && p.coluna === coord.coluna)) {
            n.acertos++;
            if (n.acertos === n.tamanho) res = `💥 *${n.nome.toUpperCase()} AFUNDADO!*`;
            break;
          }
        }
      }

      if (naviosAlvo.every(n => n.acertos === n.tamanho)) {
        const v = game.turno;
        delete global.navalGames[gameKey];
        return reply(`🏆 *VITÓRIA!* @${v.split('@')[0]} afundou toda a frota!`, { mentions: [game.jogador1, game.jogador2] });
      }

      game.turno = sender === game.jogador1 ? game.jogador2 : game.jogador1;
      let msg = `${res}\n\n📊 *Seu tabuleiro de tiros:*\n\`\`\`${formatarTabuleiro(tiros)}\`\`\`\n⏭️ Vez de @${game.turno.split('@')[0]}!`;
      return reply(msg, { mentions: [game.jogador1, game.jogador2] });
    }

    return reply(`🚢 *BATALHA NAVAL*\n💡 Desafie: ${prefix}batalhanaval @usuario\n🎯 Atire: ${prefix}batalhanaval A5`);
  },
};
