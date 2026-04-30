import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PREFIX } from "../../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "digitar",
  description: "Corrida de digitação entre usuários",
  commands: ["digitar", "typing", "digitacao"],
  usage: `${PREFIX}digitar @usuario`,
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
    if (!isGroup) return reply('⚡ Este jogo só funciona em grupos!');

    // Carregar frases do JSON
    const digitacaoPath = path.join(__dirname, '../../funcs/json/digitacao.json');
    let frasesDigitacao = [];
    try {
      const digitacaoData = JSON.parse(fs.readFileSync(digitacaoPath, 'utf-8'));
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
      if (global.digitacaoChallenges[challengeKey]) return reply('⚠️ Já existe um desafio pendente neste grupo!');

      global.digitacaoChallenges[challengeKey] = {
        challenger: sender,
        challenged: menc_os2,
        status: 'pending',
        created: Date.now()
      };

      return reply(`⚡ *DESAFIO DE DIGITAÇÃO*\n\n@${sender.split('@')[0]} desafiou @${menc_os2.split('@')[0]} para uma corrida de digitação!\n\n💡 O desafiado deve usar: ${prefix}digitar aceitar\n⏱️ O desafio expira em 60 segundos.`, { mentions: [sender, menc_os2] });
    }

    // Aceitar desafio
    if (args[0]?.toLowerCase() === 'aceitar') {
      const challenge = global.digitacaoChallenges[challengeKey];
      if (!challenge || challenge.challenged !== sender || challenge.status !== 'pending') {
        return reply(`💔 Não há desafio pendente para você aceitar!`);
      }
      if (Date.now() - challenge.created > 60000) {
        delete global.digitacaoChallenges[challengeKey];
        return reply('⏰ O desafio expirou!');
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
        await reply(`⚡ *CORRIDA DE DIGITAÇÃO INICIADA!*\n\n📝 *Digite exatamente esta frase:*\n\n"${fraseEscolhida}"\n\n⏱️ Quem digitar primeiro e corretamente vence!`, { mentions: [challenge.challenger, challenge.challenged] });
      }, delay);

      return reply(`✅ Desafio aceito! A frase será enviada em ${delay/1000} segundos... ⏱️`, { mentions: [challenge.challenger] });
    }

    // Verificar resposta
    for (const [gameId, game] of Object.entries(global.digitacaoGames)) {
      if (game.status === 'active' && (game.challenger === sender || game.challenged === sender)) {
        if (!q) continue;
        const resposta = normalizar(q.toLowerCase());
        const tempoDecorrido = Date.now() - game.iniciado;
        if (tempoDecorrido < 3000) return reply(`⏱️ Muito rápido! Aguarde um pouco.`);
        if (game.resultados[sender]) return reply('⚠️ Você já respondeu!');

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

          let res = `⚡ *RESULTADO DA CORRIDA*\n\n📝 Frase: "${game.frase}"\n\n`;
          if (vencedor) {
            res += `🏆 *VENCEDOR:* @${vencedor.split('@')[0]}\n⏱️ Tempo: ${(game.resultados[vencedor].tempo / 1000).toFixed(2)}s`;
          } else {
            res += `😔 *EMPATE!* Nenhum dos dois acertou.`;
          }
          delete global.digitacaoChallenges[challengeKey];
          delete global.digitacaoGames[gameId];
          return reply(res, { mentions: [game.challenger, game.challenged] });
        }
        return reply(`✅ Resposta recebida! Aguardando o oponente...`);
      }
    }

    return reply(`⚡ *CORRIDA DE DIGITAÇÃO*\n\n💡 *Como jogar:*\n1️⃣ Desafie alguém: ${prefix}digitar @usuario\n2️⃣ O desafiado aceita: ${prefix}digitar aceitar\n🏆 Quem digitar primeiro e corretamente vence!`);
  },
};
