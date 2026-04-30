import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PREFIX } from "../../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "cacapalavras",
  description: "Encontre palavras escondidas na grade",
  commands: ["cacapalavras", "cacapalavra", "caca"],
  usage: `${PREFIX}cacapalavras [palavra]`,
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
    const cacaPath = path.join(__dirname, '../../funcs/json/cacapalavras.json');
    let configCaca = {
      tamanho: 15,
      dificuldades: {
        facil: { palavras: 5, tamanhoMin: 4, tamanhoMax: 6 },
        medio: { palavras: 7, tamanhoMin: 5, tamanhoMax: 8 },
        dificil: { palavras: 10, tamanhoMin: 6, tamanhoMax: 10 }
      }
    };
    let palavrasCaca = ['amor', 'fogo', 'gato', 'hora', 'jogo', 'rosa', 'vida', 'água', 'amigo', 'barco'];
    try {
      const cacaData = JSON.parse(fs.readFileSync(cacaPath, 'utf-8'));
      configCaca = { ...configCaca, ...cacaData.config };
      palavrasCaca = cacaData.palavras || palavrasCaca;
    } catch (e) {
      console.error('Erro ao carregar cacapalavras.json:', e);
    }

    if (!global.cacaPalavrasGames) global.cacaPalavrasGames = {};
    const gameKey = isGroup ? from : sender;

    const gerarGrade = (palavras, tamanho) => {
      const grade = Array(tamanho).fill(null).map(() => Array(tamanho).fill(''));
      const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const posicionadas = [];
      for (const p of palavras) {
        let pos = false, tent = 0;
        while (!pos && tent < 50) {
          tent++;
          const dir = Math.floor(Math.random() * 8), lin = Math.floor(Math.random() * tamanho), col = Math.floor(Math.random() * tamanho);
          let cabe = true;
          const posições = [];
          for (let i = 0; i < p.length; i++) {
            let l = lin, c = col;
            if (dir === 0) c += i; else if (dir === 1) c -= i; else if (dir === 2) l += i; else if (dir === 3) l -= i;
            else if (dir === 4) { l += i; c += i; } else if (dir === 5) { l += i; c -= i; } else if (dir === 6) { l -= i; c += i; } else { l -= i; c -= i; }
            if (l < 0 || l >= tamanho || c < 0 || c >= tamanho || (grade[l][c] !== '' && grade[l][c] !== p[i].toUpperCase())) { cabe = false; break; }
            posições.push({ l, c, letra: p[i].toUpperCase() });
          }
          if (cabe) {
            posições.forEach(pos => grade[pos.l][pos.c] = pos.letra);
            posicionadas.push(p.toUpperCase());
            pos = true;
          }
        }
      }
      for (let i = 0; i < tamanho; i++) for (let j = 0; j < tamanho; j++) if (grade[i][j] === '') grade[i][j] = letras[Math.floor(Math.random() * letras.length)];
      return { grade, posicionadas };
    };

    const formatarGrade = (grade) => {
      let res = '   ' + Array.from({length: grade.length}, (_, i) => String.fromCharCode(65+i)).join(' ') + '\n';
      grade.forEach((row, i) => res += `${(i+1).toString().padStart(2)} ${row.join(' ')}\n`);
      return res;
    };

    if (global.cacaPalavrasGames[gameKey] && args.length > 0) {
      const game = global.cacaPalavrasGames[gameKey];
      const chute = normalizar(args.join(' ').toUpperCase());
      const pEnc = game.palavras.find(p => normalizar(p) === chute);
      if (!pEnc) return reply(`❌ "${args.join(' ')}" não está na lista!`);
      if (game.palavrasEncontradas.includes(pEnc)) return reply('⚠️ Já encontrou!');
      game.palavrasEncontradas.push(pEnc);
      if (game.palavrasEncontradas.length === game.palavras.length) {
        delete global.cacaPalavrasGames[gameKey];
        return reply(`🎉 *VITÓRIA!* Todas encontradas em ${((Date.now()-game.iniciado)/1000).toFixed(1)}s!`);
      }
      return reply(`✅ Encontrou "${pEnc}"! (${game.palavrasEncontradas.length}/${game.palavras.length})`);
    }

    if (global.cacaPalavrasGames[gameKey]) {
      const g = global.cacaPalavrasGames[gameKey];
      return reply(`🔍 *CAÇA PALAVRAS*\nProgresso: ${g.palavrasEncontradas.length}/${g.palavras.length}\n\`\`\`${formatarGrade(g.grade)}\`\`\``);
    }

    const dif = args[0]?.toLowerCase() || 'medio';
    const conf = configCaca.dificuldades[dif] || configCaca.dificuldades.medio;
    const filtradas = palavrasCaca.filter(p => p.length >= conf.tamanhoMin && p.length <= conf.tamanhoMax);
    const sel = [];
    while (sel.length < conf.palavras && filtradas.length > 0) sel.push(filtradas.splice(Math.floor(Math.random() * filtradas.length), 1)[0]);
    const { grade, posicionadas } = gerarGrade(sel, configCaca.tamanho);
    global.cacaPalavrasGames[gameKey] = { grade, palavras: posicionadas, palavrasEncontradas: [], iniciado: Date.now() };
    await reply(`🔍 *CAÇA PALAVRAS* (${dif})\n\`\`\`${formatarGrade(grade)}\`\`\`\nEncontre ${posicionadas.length} palavras!`);
  },
};
