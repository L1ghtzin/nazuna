import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readJsonFileAsync } from '../../utils/asyncFs.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "digitar",
  description: "Corrida de digitação entre usuários",
  commands: ["digitar", "typing", "digitacao"],
  usage: "{prefix}digitar @usuário",
  handle: async ({ 
    reply, 
    isGroup, 
    from, 
    sender, 
    args, 
    prefix, 
    normalizar, 
    menc_os2, 
    q,
    MESSAGES
  }) => {
    if (!isGroup) return reply(MESSAGES.permission.groupOnly);

    // Carregar frases do JSON
    const digitacaoPath = path.join(__dirname, '../../funcs/json/digitacao.json');
    let frasesDigitacao = [];
    try {
      const digitacaoData = await readJsonFileAsync(digitacaoPath, 'utf-8');
      frasesDigitacao = digitacaoData.frases || [];
    } catch (e) {
      console.error('Erro ao carregar digitacao.json:', e);
      frasesDigitacao = ['A tecnologia está mudando o mundo rapidamente'];
    }

    if (!global.digitacaoChallenges) global.digitacaoChallenges = {};
    if (!global.digitacaoGames) global.digitacaoGames = {};

    const challengeKey = from;

    // Desafiar alguém
    if (menc_os2 && menc_os2 !== sender) {
      if (global.digitacaoChallenges[challengeKey] && Date.now() - global.digitacaoChallenges[challengeKey].created > 60000) {
        delete global.digitacaoChallenges[challengeKey];
      }
      if (global.digitacaoChallenges[challengeKey]) return reply(MESSAGES.member.typing.pendingChallenge);

      global.digitacaoChallenges[challengeKey] = {
        challenger: sender,
        challenged: menc_os2,
        status: 'pending',
        created: Date.now()
      };

      return reply(MESSAGES.member.typing.challenge(sender.split('@')[0], menc_os2.split('@')[0], prefix), { mentions: [sender, menc_os2] });
    }

    // Aceitar desafio
    if (args[0]?.toLowerCase() === 'aceitar') {
      const challenge = global.digitacaoChallenges[challengeKey];
      if (!challenge || challenge.challenged !== sender || challenge.status !== 'pending') {
        return reply(MESSAGES.member.typing.noPendingChallenge);
      }
      if (Date.now() - challenge.created > 60000) {
        delete global.digitacaoChallenges[challengeKey];
        return reply(MESSAGES.member.typing.challengeExpired);
      }

      const fraseEscolhida = frasesDigitacao[Math.floor(Math.random() * frasesDigitacao.length)];
      const gameId = `game_${Date.now()}`;
      challenge.status = 'accepted';
      challenge.gameId = gameId;

      const delay = 2000;
      setTimeout(async () => {
        global.digitacaoGames[gameId] = {
          challenger: challenge.challenger,
          challenged: challenge.challenged,
          frase: fraseEscolhida,
          fraseNormalizada: normalizar(fraseEscolhida.toLowerCase()),
          status: 'active',
          iniciado: Date.now(),
          resultados: {}
        };
        await reply(MESSAGES.member.typing.gameStarted(fraseEscolhida), { mentions: [challenge.challenger, challenge.challenged] });
      }, delay);

      return reply(MESSAGES.member.typing.challengeAccepted(delay / 1000), { mentions: [challenge.challenger] });
    }

    // Verificar resposta
    for (const [gameId, game] of Object.entries(global.digitacaoGames)) {
      if (game.status === 'active' && (game.challenger === sender || game.challenged === sender)) {
        if (!q) continue;
        const resposta = normalizar(q.toLowerCase());
        const tempoDecorrido = Date.now() - game.iniciado;
        if (tempoDecorrido < 3000) return reply(MESSAGES.member.typing.tooFast);
        if (game.resultados[sender]) return reply(MESSAGES.member.typing.alreadyAnswered);

        const acertou = (resposta === game.fraseNormalizada || normalizar(q.toLowerCase().replace(prefix + 'digitar ', '').trim()) === game.fraseNormalizada);
        
        game.resultados[sender] = { acertou, tempo: tempoDecorrido };

        if (game.resultados[game.challenger] && game.resultados[game.challenged]) {
          game.status = 'finished';
          const r1 = game.resultados[game.challenger];
          const r2 = game.resultados[game.challenged];
          let vencedor = null;
          if (r1.acertou && r2.acertou) vencedor = r1.tempo < r2.tempo ? game.challenger : game.challenged;
          else if (r1.acertou) vencedor = game.challenger;
          else if (r2.acertou) vencedor = game.challenged;

          let res = '';
          if (vencedor) {
            res = MESSAGES.member.typing.resultWinner(game.frase, vencedor.split('@')[0], (game.resultados[vencedor].tempo / 1000).toFixed(2));
          } else {
            res = MESSAGES.member.typing.resultDraw(game.frase);
          }
          delete global.digitacaoChallenges[challengeKey];
          delete global.digitacaoGames[gameId];
          return reply(res, { mentions: [game.challenger, game.challenged] });
        }
        return reply(MESSAGES.member.typing.answerReceived);
      }
    }

    return reply(MESSAGES.member.typing.usage(prefix));
  },
};
