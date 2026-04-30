import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PREFIX } from "../../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "quiz",
  description: "Jogo de perguntas e respostas (individual ou duelo)",
  commands: ["quiz", "trivia", "pergunta", "dueloquiz", "duelo"],
  usage: `${PREFIX}quiz ou ${PREFIX}dueloquiz @user`,
  handle: async ({ 
    reply, 
    isGroup, 
    from, 
    sender, 
    args, 
    prefix, 
    normalizar, 
    menc_os2,
    MESSAGES
  }) => {
    // Carregar perguntas do JSON
    const quizPath = path.join(__dirname, '../../funcs/json/quiz.json');
    let quizDB = {};
    try {
      quizDB = JSON.parse(fs.readFileSync(quizPath, 'utf-8'));
    } catch (e) {
      console.error('Erro ao carregar quiz.json:', e);
      quizDB = {
        'geral': [{ p: 'Qual é o maior planeta do sistema solar?', r: ['jupiter', 'júpiter'], d: 'Júpiter' }],
        'anime': [{ p: 'Qual é o nome do protagonista de Naruto?', r: ['naruto'], d: 'Naruto Uzumaki' }],
        'games': [{ p: 'Qual é o nome do personagem principal de The Legend of Zelda?', r: ['link'], d: 'Link' }],
        'ciencia': [{ p: 'Qual é a fórmula química da água?', r: ['h2o'], d: 'H2O' }],
        'historia': [{ p: 'Em que ano começou a Segunda Guerra Mundial?', r: ['1939'], d: '1939' }]
      };
    }

    const gameKey = isGroup ? from : sender;

    // --- LÓGICA DE DUELO ---
    if (args[0] === 'duelo' || args[0] === 'dueloquiz' || menc_os2) {
      if (!isGroup) return reply('⚔️ Este jogo só funciona em grupos!');
      if (!global.dueloQuizGames) global.dueloQuizGames = {};
      if (!global.dueloQuizChallenges) global.dueloQuizChallenges = {};

      // Desafiar alguém
      if (menc_os2 && menc_os2 !== sender) {
        const numPerguntas = parseInt(args.find(arg => !isNaN(parseInt(arg)))) || 5;
        if (numPerguntas < 3 || numPerguntas > 20) {
          return reply(`💔 Número de perguntas inválido! Use entre 3 e 20 perguntas.\n\n💡 Exemplo: ${prefix}dueloquiz @usuario 10`);
        }

        if (global.dueloQuizChallenges[gameKey] || global.dueloQuizGames[gameKey]) {
          return reply('⚠️ Já existe um duelo ou desafio pendente neste grupo!');
        }

        global.dueloQuizChallenges[gameKey] = {
          challenger: sender,
          challenged: menc_os2,
          numPerguntas: numPerguntas,
          status: 'pending',
          created: Date.now()
        };

        return reply(`⚔️ *DESAFIO DE QUIZ*\n\n@${sender.split('@')[0]} desafiou @${menc_os2.split('@')[0]} para um duelo de ${numPerguntas} perguntas!\n\n💡 O desafiado deve usar: ${prefix}dueloquiz aceitar\n⏱️ O desafio expira em 60 segundos.`, { mentions: [sender, menc_os2] });
      }

      // Aceitar desafio
      if (args[0]?.toLowerCase() === 'aceitar') {
        const challenge = global.dueloQuizChallenges[gameKey];
        if (!challenge || challenge.challenged !== sender || challenge.status !== 'pending') {
          return reply(`💔 Não há desafio pendente para você aceitar!`);
        }
        if (Date.now() - challenge.created > 60000) {
          delete global.dueloQuizChallenges[gameKey];
          return reply('⏰ O desafio expirou!');
        }

        const categoriasDisponiveis = Object.keys(quizDB);
        const perguntasSelecionadas = [];
        const todasPerguntas = [];
        categoriasDisponiveis.forEach(cat => {
          quizDB[cat].forEach((pergunta, idx) => {
            todasPerguntas.push({ categoria: cat, pergunta, id: `${cat}_${idx}` });
          });
        });

        while (perguntasSelecionadas.length < challenge.numPerguntas && todasPerguntas.length > 0) {
          const idx = Math.floor(Math.random() * todasPerguntas.length);
          perguntasSelecionadas.push(todasPerguntas.splice(idx, 1)[0]);
        }

        global.dueloQuizGames[gameKey] = {
          jogador1: challenge.challenger,
          jogador2: challenge.challenged,
          perguntas: perguntasSelecionadas,
          perguntaAtual: 0,
          respostas1: [],
          respostas2: [],
          turno: challenge.challenger,
          status: 'active',
          iniciado: Date.now()
        };

        delete global.dueloQuizChallenges[gameKey];
        const primeiraPergunta = perguntasSelecionadas[0];
        return reply(`⚔️ *DUELO DE QUIZ INICIADO!*\n\n@${challenge.challenger.split('@')[0]} vs @${challenge.challenged.split('@')[0]}\n\n📊 ${challenge.numPerguntas} perguntas\n\n🎯 *Pergunta 1/${challenge.numPerguntas}*\n📂 Categoria: ${primeiraPergunta.categoria}\n\n❓ ${primeiraPergunta.pergunta.p}\n\n💡 É a vez de @${challenge.challenger.split('@')[0]} responder!\nUse: ${prefix}dueloquiz [resposta]`, { mentions: [challenge.challenger, challenge.challenged] });
      }

      // Responder duelo
      if (global.dueloQuizGames[gameKey]) {
        const game = global.dueloQuizGames[gameKey];
        if (game.status !== 'active') return reply(`💔 Este duelo já terminou!`);
        if (game.turno !== sender) return reply('⏳ Não é sua vez! Aguarde o oponente.');

        const perguntaAtual = game.perguntas[game.perguntaAtual];
        const resposta = normalizar(args.join(' ').toLowerCase());
        const acertou = perguntaAtual.pergunta.r.some(r => normalizar(r) === resposta || resposta.includes(normalizar(r)));

        if (sender === game.jogador1) {
          game.respostas1.push({ acertou });
        } else {
          game.respostas2.push({ acertou });
        }

        game.perguntaAtual++;
        game.turno = sender === game.jogador1 ? game.jogador2 : game.jogador1;

        if (game.perguntaAtual >= game.perguntas.length) {
          game.status = 'finished';
          const acertos1 = game.respostas1.filter(r => r.acertou).length;
          const acertos2 = game.respostas2.filter(r => r.acertou).length;
          let res = `⚔️ *DUELO FINALIZADO!*\n\n📊 *Resultado:*\n@${game.jogador1.split('@')[0]}: ${acertos1}/${game.perguntas.length} acertos\n@${game.jogador2.split('@')[0]}: ${acertos2}/${game.perguntas.length} acertos\n\n`;
          if (acertos1 > acertos2) res += `🏆 *VENCEDOR:* @${game.jogador1.split('@')[0]}!`;
          else if (acertos2 > acertos1) res += `🏆 *VENCEDOR:* @${game.jogador2.split('@')[0]}!`;
          else res += `🤝 *EMPATE!*`;
          delete global.dueloQuizGames[gameKey];
          return reply(res, { mentions: [game.jogador1, game.jogador2] });
        }

        const proxima = game.perguntas[game.perguntaAtual];
        let msg = acertou ? `✅ *CORRETO!*` : `💔 *ERRADO!*\n✅ Resposta: ${perguntaAtual.pergunta.d}`;
        msg += `\n\n🎯 *Pergunta ${game.perguntaAtual + 1}/${game.perguntas.length}*\n📂 Categoria: ${proxima.categoria}\n\n❓ ${proxima.pergunta.p}\n\n💡 É a vez de @${game.turno.split('@')[0]} responder!\nUse: ${prefix}dueloquiz [resposta]`;
        return reply(msg, { mentions: [game.jogador1, game.jogador2] });
      }
    }

    // --- LÓGICA DE QUIZ INDIVIDUAL ---
    if (!global.quizGames) global.quizGames = {};
    const categoriasDisponiveis = Object.keys(quizDB);

    if (global.quizGames[gameKey] && args.length > 0 && !categoriasDisponiveis.includes(args[0].toLowerCase())) {
      if (args[0] === 'pular') {
        const resposta = global.quizGames[gameKey].display;
        delete global.quizGames[gameKey];
        return reply(`⏭️ Pergunta pulada!\n\nA resposta era: *${resposta}*`);
      }
      const game = global.quizGames[gameKey];
      const resposta = normalizar(args.join(' ').toLowerCase());
      const acertou = game.respostas.some(r => normalizar(r) === resposta || resposta.includes(normalizar(r)));
      delete global.quizGames[gameKey];
      if (acertou) {
        const tempo = ((Date.now() - game.iniciado) / 1000).toFixed(1);
        const pontos = Math.max(50 - Math.floor(parseFloat(tempo) * 2), 10);
        return reply(`🎉 *CORRETO!*\n\n✅ Resposta: *${game.display}*\n⏱️ Tempo: ${tempo}s\n🏆 +${pontos} pontos`);
      } else {
        return reply(`💔 *ERRADO!*\n\n✅ A resposta correta era: *${game.display}*\n\nMais sorte na próxima!`);
      }
    }

    if (!args[0]) {
      const list = categoriasDisponiveis.map(cat => `• ${prefix}quiz ${cat}`).join('\n');
      return reply(`❓ *QUIZ - Teste seus conhecimentos!*\n\n📚 *Categorias disponíveis:*\n${list}\n\n💡 Responda rápido para ganhar mais pontos!`);
    }

    const categoria = args[0].toLowerCase();
    const perguntas = quizDB[categoria];
    if (!perguntas) return reply(`💔 Categoria "${categoria}" não encontrada!\n\n📚 Categorias disponíveis: ${categoriasDisponiveis.join(', ')}`);

    const escolhida = perguntas[Math.floor(Math.random() * perguntas.length)];
    global.quizGames[gameKey] = {
      pergunta: escolhida.p,
      respostas: escolhida.r,
      display: escolhida.d,
      categoria,
      iniciado: Date.now()
    };

    await reply(`❓ *QUIZ* (${categoria})\n\n${escolhida.p}\n\n💡 Responda com: ${prefix}quiz [resposta]\n⏱️ Responda rápido para mais pontos!`);
  },
};
