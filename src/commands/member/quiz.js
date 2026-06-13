import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "quiz",
  description: "Jogo de perguntas e respostas (individual ou duelo)",
  commands: ["quiz", "trivia", "pergunta", "dueloquiz", "duelo"],
  usage: "{prefix}quiz ou {prefix}dueloquiz @user",
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
      if (!isGroup) return reply(MESSAGES.member.quiz.groupOnly);
      if (!global.dueloQuizGames) global.dueloQuizGames = {};
      if (!global.dueloQuizChallenges) global.dueloQuizChallenges = {};

      // Desafiar alguém
      if (menc_os2 && menc_os2 !== sender) {
        const numPerguntas = parseInt(args.find(arg => !isNaN(parseInt(arg)))) || 5;
        if (numPerguntas < 3 || numPerguntas > 20) {
          return reply(MESSAGES.member.quiz.invalidNumQuestions(prefix));
        }

        if (global.dueloQuizChallenges[gameKey] || global.dueloQuizGames[gameKey]) {
          return reply(MESSAGES.member.quiz.existingGame);
        }

        global.dueloQuizChallenges[gameKey] = {
          challenger: sender,
          challenged: menc_os2,
          numPerguntas: numPerguntas,
          status: 'pending',
          created: Date.now()
        };

        return reply(MESSAGES.member.quiz.challenge(sender.split('@')[0], menc_os2.split('@')[0], numPerguntas, prefix), { mentions: [sender, menc_os2] });
      }

      // Aceitar desafio
      if (args[0]?.toLowerCase() === 'aceitar') {
        const challenge = global.dueloQuizChallenges[gameKey];
        if (!challenge || challenge.challenged !== sender || challenge.status !== 'pending') {
          return reply(MESSAGES.member.quiz.noChallengeAccept);
        }
        if (Date.now() - challenge.created > 60000) {
          delete global.dueloQuizChallenges[gameKey];
          return reply(MESSAGES.member.quiz.challengeExpired);
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
        return reply(MESSAGES.member.quiz.duelStarted(challenge.challenger.split('@')[0], challenge.challenged.split('@')[0], challenge.numPerguntas, primeiraPergunta.categoria, primeiraPergunta.pergunta.p, prefix), { mentions: [challenge.challenger, challenge.challenged] });
      }

      // Responder duelo
      if (global.dueloQuizGames[gameKey]) {
        const game = global.dueloQuizGames[gameKey];
        if (game.status !== 'active') return reply(MESSAGES.member.quiz.duelFinished);
        if (game.turno !== sender) return reply(MESSAGES.member.quiz.notYourTurn);

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
          let resText = '';
          if (acertos1 > acertos2) resText = MESSAGES.member.quiz.winner(game.jogador1.split('@')[0]);
          else if (acertos2 > acertos1) resText = MESSAGES.member.quiz.winner(game.jogador2.split('@')[0]);
          else resText = MESSAGES.member.quiz.draw;
          const res = MESSAGES.member.quiz.duelResult(game.jogador1.split('@')[0], game.jogador2.split('@')[0], acertos1, acertos2, game.perguntas.length, resText);
          delete global.dueloQuizGames[gameKey];
          return reply(res, { mentions: [game.jogador1, game.jogador2] });
        }

        const proxima = game.perguntas[game.perguntaAtual];
        let acertouText = acertou ? MESSAGES.member.quiz.duelCorrect : MESSAGES.member.quiz.duelIncorrect(perguntaAtual.pergunta.d);
        const msg = MESSAGES.member.quiz.duelTurnResult(acertouText, game.perguntaAtual + 1, game.perguntas.length, proxima.categoria, proxima.pergunta.p, game.turno.split('@')[0], prefix);
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
        return reply(MESSAGES.member.quiz.skipped(resposta));
      }
      const game = global.quizGames[gameKey];
      const resposta = normalizar(args.join(' ').toLowerCase());
      const acertou = game.respostas.some(r => normalizar(r) === resposta || resposta.includes(normalizar(r)));
      delete global.quizGames[gameKey];
      if (acertou) {
        const tempo = ((Date.now() - game.iniciado) / 1000).toFixed(1);
        const pontos = Math.max(50 - Math.floor(parseFloat(tempo) * 2), 10);
        return reply(MESSAGES.member.quiz.correct(game.display, tempo, pontos));
      } else {
        return reply(MESSAGES.member.quiz.incorrect(game.display));
      }
    }

    if (!args[0]) {
      const list = categoriasDisponiveis.map(cat => `• ${prefix}quiz ${cat}`).join('\n');
      return reply(MESSAGES.member.quiz.usage(list));
    }

    const categoria = args[0].toLowerCase();
    const perguntas = quizDB[categoria];
    if (!perguntas) return reply(MESSAGES.member.quiz.invalidCategory(categoria, categoriasDisponiveis));

    const escolhida = perguntas[Math.floor(Math.random() * perguntas.length)];
    global.quizGames[gameKey] = {
      pergunta: escolhida.p,
      respostas: escolhida.r,
      display: escolhida.d,
      categoria,
      iniciado: Date.now()
    };

    await reply(MESSAGES.member.quiz.question(categoria, escolhida.p, prefix));
  },
};
