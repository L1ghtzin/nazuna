import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "stop",
  description: "Jogo de palavras por categorias (Adedonha)",
  commands: ["stop", "adedonha"],
  usage: "{prefix}stop [categoria] [palavra]",
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
    if (!isGroup) return reply(MESSAGES.permission.groupOnly);

    const stopPath = path.join(__dirname, '../../funcs/json/stop.json');
    let categoriasStop = ['Nome', 'País', 'Cidade', 'Animal', 'Cor', 'Fruta', 'Objeto', 'Profissão'];
    try {
      const stopData = await optimizer.loadJsonWithCache(stopPath, 'utf-8');
      categoriasStop = stopData.categorias || categoriasStop;
    } catch (e) {
      console.error('Erro ao carregar stop.json:', e);
    }

    if (!global.stopGames) global.stopGames = {};
    const gameKey = from;

    if (!global.stopGames[gameKey] || global.stopGames[gameKey].status === 'finished') {
      const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      const letra = letras[Math.floor(Math.random() * letras.length)];
      const numCat = 5;
      const escolhidas = [];
      const disp = [...categoriasStop];
      for (let i = 0; i < numCat; i++) {
        const idx = Math.floor(Math.random() * disp.length);
        escolhidas.push(disp.splice(idx, 1)[0]);
      }
      global.stopGames[gameKey] = {
        letra, categorias: escolhidas, respostas: {}, status: 'active', iniciado: Date.now(), tempoLimite: 300000
      };
      let msg = MESSAGES.member.stop.start(letra, escolhidas.map((c, i) => `${i+1}. ${c}`).join('\n'), prefix);
      return reply(msg);
    }

    const game = global.stopGames[gameKey];
    if (Date.now() - game.iniciado > game.tempoLimite) {
      game.status = 'finished';
      delete global.stopGames[gameKey];
      return reply(MESSAGES.member.stop.timeout);
    }

    if (args.length >= 2) {
      const catInput = normalizar(args[0].toLowerCase());
      const palInput = args.slice(1).join(' ');
      const cat = game.categorias.find(c => normalizar(c.toLowerCase()).includes(catInput) || catInput.includes(normalizar(c.toLowerCase())));
      if (!cat) return reply(MESSAGES.member.stop.invalidCategory);
      if (normalizar(palInput.toLowerCase())[0] !== normalizar(game.letra.toLowerCase())) return reply(MESSAGES.member.stop.wrongLetter(game.letra));
      if (!game.respostas[sender]) game.respostas[sender] = {};
      if (game.respostas[sender][cat]) return reply(MESSAGES.member.stop.alreadyAnsweredCategory(cat));
      
      const jaUsada = Object.values(game.respostas).some(r => Object.values(r).some(p => normalizar(p.toLowerCase()) === normalizar(palInput.toLowerCase())));
      if (jaUsada) return reply(MESSAGES.member.stop.wordAlreadyUsed);

      game.respostas[sender][cat] = palInput;
      const comps = Object.keys(game.respostas[sender]).length;
      if (comps === game.categorias.length) {
        delete global.stopGames[gameKey];
        return reply(MESSAGES.member.stop.winner(sender.split('@')[0], ((Date.now() - game.iniciado)/1000).toFixed(1)), { mentions: [sender] });
      }
      return reply(MESSAGES.member.stop.accepted(cat, palInput, comps, game.categorias.length));
    }

    let status = MESSAGES.member.stop.status(game.letra);
    game.categorias.forEach((c, i) => status += `${i+1}. ${c}${game.respostas[sender]?.[c] ? ' ✅' : ''}\n`);
    return reply(status);
  },
};
