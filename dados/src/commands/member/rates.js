import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "rates",
  description: "Comandos de porcentagem e ranks engraçados",
  commands: ["analogica", "analogico", "antisocial", "ateia", "ateu", "atleta", "aventureira", "aventureiro", "azarada", "azarado", "bagunceira", "bagunceiro", "bandida", "bandido", "bebada", "bebado", "bilionaria", "billionario", "boba", "bobo", "bolsonarista", "bombada", "bombado", "braba", "brabo", "brincalhao", "brincalhona", "bucetuda", "burra", "burro", "cachorra", "cachorro", "calma", "calmo", "carinhosa", "carinhoso", "caseira", "caseiro", "cetica", "cetico", "charmosa", "charmoso", "chata", "chato", "chefe", "chorao", "chorona", "ciumenta", "ciumento", "comedia", "comilao", "comilona", "comunista", "confiante", "conservador", "conservadora", "corajosa", "corajoso", "corna", "corno", "cosmopolita", "covarde", "criativa", "criativo", "dependente", "desumilde", "digital", "doente", "dorminhoca", "dorminhoco", "economica", "economico", "engracada", "engracado", "esperta", "esperto", "estudiosa", "estudioso", "extrovertida", "extrovertido", "feia", "feio", "fiel", "fofoqueira", "fofoqueiro", "fortao", "forte", "fortona", "fraca", "fraco", "gado", "gamer", "gastador", "gastadora", "gay", "global", "gostosa", "gostoso", "homofobica", "homofobico", "humilde", "independente", "infantil", "infiel", "insegura", "inseguro", "inteligente", "introvertida", "introvertido", "irresponsavel", "ladra", "ladrao", "lesbica", "liberal", "lider", "linda", "lindo", "local", "lulista", "machista", "macho", "madura", "maduro", "magrela", "magrelo", "malandra", "malandro", "misteriosa", "misterioso", "mito", "moderna", "moderno", "nazista", "nerd", "nervosa", "nervoso", "offline", "online", "organizada", "organizado", "otaku", "otaria", "otario", "otimista", "padrao", "patrao", "patriotica", "patriotico", "patroa", "pegador", "pegadora", "pessimista", "petista", "pilantra", "pirocudo", "pirokudo", "playboy", "pobre", "poderosa", "poderoso", "popular", "pratica", "pratico", "preguicosa", "preguicoso", "presidenta", "presidente", "programador", "programadora", "psicopata", "racista", "rainha", "rankbraba", "rankbrabas", "rankbrabo", "rankbrabos", "rankburra", "rankburras", "rankburro", "rankburros", "rankcharmosa", "rankcharmosas", "rankcharmoso", "rankcharmosos", "rankcorna", "rankcornas", "rankcorno", "rankcornos", "rankengracada", "rankengracadas", "rankengracado", "rankengracados", "rankfiel", "rankfiels", "rankforte", "rankfortes", "rankgada", "rankgado", "rankgados", "rankgads", "rankgay", "rankgays", "rankgostosa", "rankgostosas", "rankgostoso", "rankgostosos", "rankinfieis", "rankinfiel", "rankinteligente", "rankinteligentes", "ranklesbica", "ranklesbicas", "ranklinda", "ranklindas", "ranklindo", "ranklindos", "rankmacho", "rankmachos", "rankmalandra", "rankmalandras", "rankmalandro", "rankmalandros", "ranknerd", "ranknerds", "rankotaku", "rankotakus", "rankpegador", "rankpegadora", "rankpegadoras", "rankpegadores", "rankpobre", "rankpobres", "rankpoderosa", "rankpoderosas", "rankpoderoso", "rankpoderosos", "rankrica", "rankricas", "rankrico", "rankricos", "ranktrabalhador", "ranktrabalhadora", "ranktrabalhadoras", "ranktrabalhadores", "rankvencedor", "rankvencedora", "rankvencedoras", "rankvencedores", "rankvisionaria", "rankvisionarias", "rankvisionario", "rankvisionarios", "realista", "rei", "religiosa", "religioso", "responsavel", "rica", "rico", "romantica", "romantico", "rural", "safada", "safado", "saudavel", "sedentaria", "sedentario", "seguidor", "seguidora", "senhor", "senhora", "seria", "serio", "simpatica", "simpatico", "social", "solitaria", "solitario", "sonhador", "sonhadora", "sortuda", "sortudo", "sortudo2", "supersticiosa", "supersticioso", "talarica", "talarico", "tecnologica", "tecnologico", "trabalhador", "trabalhadora", "tradicional", "traidor", "traidora", "urbana", "urbano", "vagabunda", "vagabundo", "vencedor", "vencedora", "vesga", "vesgo", "viaja nte", "viajante", "visionaria", "visionario", "zueira", "zueiro"],
  usage: `${global.prefix}gay\n${global.prefix}rankgay`,
  handle: async ({  nazu, reply, isGroup, command, menc_os2, info, getUserName, from, sender, buildGroupFilePath, AllgroupMembers, isModoLite, isModoBn , MESSAGES }) => {
    try {
      const modoLite = isModoLite || false;
      const modoBn = isModoBn || false;
      
      const funcsDir = path.join(__dirname, '../../funcs');
      
      // Comando Individual
      if (!command.startsWith('rank')) {
        const proibidosMasc = ['pirocudo', 'pirokudo', 'gostoso', 'nazista', 'machista', 'homofobico', 'racista'];
        const proibidosFem = ['bucetuda', 'cachorra', 'vagabunda', 'racista', 'nazista', 'gostosa', 'machista', 'homofobica'];
        
        if (modoLite && (proibidosMasc.includes(command) || proibidosFem.includes(command))) {
          return nazu.react('❌', { key: info.key });
        }
        
        if (!isGroup) return reply(MESSAGES.permission.groupOnly);
        if (!modoBn) return reply(`💔 O modo brincadeira não esta ativo nesse grupo`);
        
        let gamesData = fs.existsSync(funcsDir + '/json/games.json') ? JSON.parse(fs.readFileSync(funcsDir + '/json/games.json')) : { games: {} };
        let responses = fs.existsSync(funcsDir + '/json/gamestext.json') ? JSON.parse(fs.readFileSync(funcsDir + '/json/gamestext.json')) : {};
        // Se a resposta fem não estiver no gamestext.json, a logica anterior tentava usar gamestext2.json
        if (!responses[command]) {
          responses = fs.existsSync(funcsDir + '/json/gamestext2.json') ? JSON.parse(fs.readFileSync(funcsDir + '/json/gamestext2.json')) : {};
        }

        const target = menc_os2 ? menc_os2 : sender;
        const targetName = `@${getUserName(target)}`;
        const level = Math.floor(Math.random() * 101);
        
        const responseText = (responses[command] ? responses[command].replaceAll('#nome#', targetName).replaceAll('#level#', level) : `📊 ${targetName} tem *${level}%* de ${command}! 🔥`);
        const media = gamesData.games[command];
        
        if (media?.image) {
          await nazu.sendMessage(from, { image: media.image, caption: responseText, mentions: [target] });
        } else if (media?.video) {
          await nazu.sendMessage(from, { video: media.video, caption: responseText, mentions: [target], gifPlayback: true });
        } else {
          await nazu.sendMessage(from, { text: responseText, mentions: [target] });
        }
      } 
      // Comandos de Rank
      else {
        if (modoLite && ['rankgostoso', 'rankgostosos', 'rankgostosa', 'rankgostosas', 'ranknazista'].includes(command)) {
          return nazu.react('❌', { key: info.key });
        }
        
        if (!isGroup) return reply(MESSAGES.permission.groupOnly);
        if (!modoBn) return reply(`💔 O modo brincadeira não está ativo nesse grupo.`);
        
        let gpPath = buildGroupFilePath(from);
        let gamesData = fs.existsSync(funcsDir + '/json/games.json') ? JSON.parse(fs.readFileSync(funcsDir + '/json/games.json')) : { ranks: {} };
        let data = fs.existsSync(gpPath) ? JSON.parse(fs.readFileSync(gpPath)) : { mark: {} };
        
        let membros = AllgroupMembers.filter(m => !['0', 'marca'].includes(data.mark[m]));
        if (membros.length < 5) return reply(`💔 Membros insuficientes para formar um ranking.`);
        
        let top5 = membros.sort(() => Math.random() - 0.5).slice(0, 5);
        let cleanedCommand = command.endsWith('s') ? command.slice(0, -1) : command;
        
        let ranksData = fs.existsSync(funcsDir + '/json/ranks.json') ? JSON.parse(fs.readFileSync(funcsDir + '/json/ranks.json')) : { ranks: {} };
        
        let responseText = ranksData[cleanedCommand] || `📊 *Ranking de ${cleanedCommand.replace('rank', '')}*:\n\n`;
        // Ajuste para evitar bugs onde não concatena as linhas corretamente
        if (!responseText.includes('\n\n')) responseText += '\n\n';
        
        top5.forEach((m, i) => {
          responseText += `🏅 *#${i + 1}* - @${getUserName(m)}\n`;
        });
        
        let media = gamesData.ranks[cleanedCommand];
        
        if (media?.image) {
          await nazu.sendMessage(from, { image: media.image, caption: responseText, mentions: top5 });
        } else if (media?.video) {
          await nazu.sendMessage(from, { video: media.video, caption: responseText, mentions: top5, gifPlayback: true });
        } else {
          await nazu.sendMessage(from, { text: responseText, mentions: top5 });
        }
      }
    } catch (e) {
      console.error(e);
      await reply(MESSAGES.error.internal);
    }
  }
};
