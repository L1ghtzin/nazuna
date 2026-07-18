import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readAsync } from '../../utils/database/io.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "batalhanaval",
  description: "Jogo de estratégia naval",
  commands: ["batalhanaval", "batalha", "naval"],
  usage: "{prefix}batalhanaval @usuário",
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
    if (!isGroup) return reply(MESSAGES.member.naval.groupOnly);

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
      const navalData = await readAsync(navalPath, { config: {} });
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
      // Limpar desafios expirados (60 segundos)
      if (global.navalChallenges[gameKey] && Date.now() - global.navalChallenges[gameKey].created > 60000) {
        delete global.navalChallenges[gameKey];
      }
      // Limpar jogos abandonados (10 minutos sem atividade)
      if (global.navalGames[gameKey] && global.navalGames[gameKey].ultimaJogada && Date.now() - global.navalGames[gameKey].ultimaJogada > 600000) {
        delete global.navalGames[gameKey];
      }

      if (global.navalChallenges[gameKey] || global.navalGames[gameKey]) return reply(MESSAGES.member.naval.existingGame);
      global.navalChallenges[gameKey] = { challenger: sender, challenged: menc_os2, status: 'pending', created: Date.now() };
      return reply(MESSAGES.member.naval.challenge(sender.split('@')[0], menc_os2.split('@')[0], prefix), { mentions: [sender, menc_os2] });
    }

    if (args[0]?.toLowerCase() === 'aceitar') {
      const ch = global.navalChallenges[gameKey];
      if (!ch || ch.challenged !== sender || ch.status !== 'pending') return reply(MESSAGES.member.naval.noChallengeAccept);
      // Verificar expiração (60 segundos)
      if (Date.now() - ch.created > 60000) {
        delete global.navalChallenges[gameKey];
        return reply(MESSAGES.member.naval.challengeExpired);
      }
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
      return reply(MESSAGES.member.naval.started(ch.challenger.split('@')[0], ch.challenged.split('@')[0], prefix), { mentions: [ch.challenger, ch.challenged] });
    } else if (args[0]?.toLowerCase() === 'recusar') {
      const ch = global.navalChallenges[gameKey];
      if (!ch || ch.challenged !== sender || ch.status !== 'pending') return reply(MESSAGES.member.naval.noChallengeRefuse);
      delete global.navalChallenges[gameKey];
      return reply(MESSAGES.member.naval.refused(sender.split('@')[0]), { mentions: [sender] });
    }

    if (global.navalGames[gameKey] && args[0]) {
      const game = global.navalGames[gameKey];
      if (game.status !== 'active') return reply(MESSAGES.member.naval.gameOver);
      if (game.turno !== sender) return reply(MESSAGES.member.naval.notYourTurn);
      const coord = parseCoordenada(args[0].toUpperCase());
      if (!coord) return reply(MESSAGES.member.naval.invalidCoord(prefix));

      let alvo = sender === game.jogador1 ? game.tabuleiro2 : game.tabuleiro1;
      let tiros = sender === game.jogador1 ? game.tiros1 : game.tiros2;
      let naviosAlvo = sender === game.jogador1 ? game.navios2 : game.navios1;

      if (tiros[coord.linha][coord.coluna] !== '🌊') return reply(MESSAGES.member.naval.alreadyShot);

      const celula = alvo[coord.linha][coord.coluna];
      let res = celula === '🚢' ? MESSAGES.member.naval.hit : MESSAGES.member.naval.miss;
      tiros[coord.linha][coord.coluna] = celula === '🚢' ? '💥' : '❌';
      alvo[coord.linha][coord.coluna] = tiros[coord.linha][coord.coluna];

      if (celula === '🚢') {
        for (const n of naviosAlvo) {
          if (n.posicoes.some(p => p.linha === coord.linha && p.coluna === coord.coluna)) {
            n.acertos++;
            if (n.acertos === n.tamanho) res = MESSAGES.member.naval.sunk(n.nome);
            break;
          }
        }
      }

      if (naviosAlvo.every(n => n.acertos === n.tamanho)) {
        const v = game.turno;
        delete global.navalGames[gameKey];
        return reply(MESSAGES.member.naval.victory(v.split('@')[0]), { mentions: [game.jogador1, game.jogador2] });
      }

      game.turno = sender === game.jogador1 ? game.jogador2 : game.jogador1;
      game.ultimaJogada = Date.now();

      const naviosAfundados = naviosAlvo.filter(n => n.acertos === n.tamanho);
      const naviosAtingidos = naviosAlvo.filter(n => n.acertos > 0 && n.acertos < n.tamanho);
      const naviosIntactos = naviosAlvo.filter(n => n.acertos === 0);

      let afundadosText = `${naviosAfundados.length}/${naviosAlvo.length}`;
      if (naviosAfundados.length > 0) afundadosText += ` (${naviosAfundados.map(n => n.nome).join(', ')})`;
      
      const msg = MESSAGES.member.naval.turnResult(res, args[0].toUpperCase(), afundadosText, naviosAtingidos.length, naviosIntactos.length, formatarTabuleiro(tiros), game.turno.split('@')[0]);
      return reply(msg, { mentions: [game.jogador1, game.jogador2] });
    }

    // Mostrar status do jogo ativo (sem argumentos)
    if (global.navalGames[gameKey]) {
      const game = global.navalGames[gameKey];
      const isJogador1 = sender === game.jogador1;
      const tirosJogador = isJogador1 ? game.tiros1 : game.tiros2;
      const naviosAlvoStatus = isJogador1 ? game.navios2 : game.navios1;

      const naviosAfundados = naviosAlvoStatus.filter(n => n.acertos === n.tamanho);
      const naviosAtingidos = naviosAlvoStatus.filter(n => n.acertos > 0 && n.acertos < n.tamanho);
      const naviosIntactos = naviosAlvoStatus.filter(n => n.acertos === 0);

      let afundadosText = `${naviosAfundados.length}/${naviosAlvoStatus.length}`;
      if (naviosAfundados.length > 0) afundadosText += ` (${naviosAfundados.map(n => n.nome).join(', ')})`;
      
      let atingidosText = `${naviosAtingidos.length}`;
      if (naviosAtingidos.length > 0) atingidosText += ` (${naviosAtingidos.map(n => `${n.nome} ${n.acertos}/${n.tamanho}`).join(', ')})`;

      const statusMsg = MESSAGES.member.naval.status(game.jogador1.split('@')[0], game.jogador2.split('@')[0], game.turno.split('@')[0], afundadosText, atingidosText, naviosIntactos.length, formatarTabuleiro(tirosJogador), prefix);
      return reply(statusMsg, { mentions: [game.jogador1, game.jogador2] });
    }

    return reply(MESSAGES.member.naval.usage(prefix));
  },
};
