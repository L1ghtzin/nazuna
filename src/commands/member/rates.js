import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "rates",
  description: "Comandos de porcentagem e ranks engraçados",
  commands: ["analogica", "analogico", "antisocial", "ateia", "ateu", "atleta", "aventureira", "aventureiro", "azarada", "azarado", "bagunceira", "bagunceiro", "bandida", "bandido", "bebada", "bebado", "bilionaria", "billionario", "boba", "bobo", "bolsonarista", "bombada", "bombado", "braba", "brabo", "brincalhao", "brincalhona", "bucetuda", "burra", "burro", "cachorra", "cachorro", "calma", "calmo", "carinhosa", "carinhoso", "caseira", "caseiro", "cetica", "cetico", "charmosa", "charmoso", "chata", "chato", "chefe", "chorao", "chorona", "ciumenta", "ciumento", "comedia", "comilao", "comilona", "comunista", "confiante", "conservador", "conservadora", "corajosa", "corajoso", "corna", "corno", "cosmopolita", "covarde", "criativa", "criativo", "dependente", "desumilde", "digital", "doente", "dorminhoca", "dorminhoco", "economica", "economico", "engracada", "engracado", "esperta", "esperto", "estudiosa", "estudioso", "extrovertida", "extrovertido", "feia", "feio", "fiel", "fofoqueira", "fofoqueiro", "fortao", "forte", "fortona", "fraca", "fraco", "gado", "gada", "gamer", "gastador", "gastadora", "gay", "global", "gostosa", "gostoso", "homofobica", "homofobico", "humilde", "independente", "infantil", "infiel", "insegura", "inseguro", "inteligente", "introvertida", "introvertido", "irresponsavel", "ladra", "ladrao", "lesbica", "liberal", "lider", "linda", "lindo", "local", "lulista", "machista", "macho", "madura", "maduro", "magrela", "magrelo", "malandra", "malandro", "misteriosa", "misterioso", "mito", "moderna", "moderno", "nazista", "nerd", "nervosa", "nervoso", "offline", "online", "organizada", "organizado", "otaku", "otaria", "otario", "otimista", "padrao", "patrao", "patriotica", "patriotico", "patroa", "pegador", "pegadora", "pessimista", "petista", "pilantra", "pirocudo", "pirokudo", "playboy", "pobre", "poderosa", "poderoso", "popular", "pratica", "pratico", "preguicosa", "preguicoso", "presidenta", "presidente", "programador", "programadora", "psicopata", "racista", "rainha", "rankbraba", "rankbrabas", "rankbrabo", "rankbrabos", "rankburra", "rankburras", "rankburro", "rankburros", "rankcharmosa", "rankcharmosas", "rankcharmoso", "rankcharmosos", "rankcorna", "rankcornas", "rankcorno", "rankcornos", "rankengracada", "rankengracadas", "rankengracado", "rankengracados", "rankfiel", "rankfiels", "rankforte", "rankfortes", "rankgada", "rankgado", "rankgados", "rankgads", "rankgay", "rankgays", "rankgostosa", "rankgostosas", "rankgostoso", "rankgostosos", "rankinfieis", "rankinfiel", "rankinteligente", "rankinteligentes", "ranklesbica", "ranklesbicas", "ranklinda", "ranklindas", "ranklindo", "ranklindos", "rankmacho", "rankmachos", "rankmalandra", "rankmalandras", "rankmalandro", "rankmalandros", "ranknerd", "ranknerds", "rankotaku", "rankotakus", "rankpegador", "rankpegadora", "rankpegadoras", "rankpegadores", "rankpobre", "rankpobres", "rankpoderosa", "rankpoderosas", "rankpoderoso", "rankpoderosos", "rankrica", "rankricas", "rankrico", "rankricos", "ranktrabalhador", "ranktrabalhadora", "ranktrabalhadoras", "ranktrabalhadores", "rankvencedor", "rankvencedora", "rankvencedoras", "rankvencedores", "rankvisionaria", "rankvisionarias", "rankvisionario", "rankvisionarios", "realista", "rei", "religiosa", "religioso", "responsavel", "rica", "rico", "romantica", "romantico", "rural", "safada", "safado", "saudavel", "sedentaria", "sedentario", "seguidor", "seguidora", "senhor", "senhora", "seria", "serio", "simpatica", "simpatico", "social", "solitaria", "solitario", "sonhador", "sonhadora", "sortuda", "sortudo", "sortudo2", "supersticiosa", "supersticioso", "talarica", "talarico", "tecnologica", "tecnologico", "trabalhador", "trabalhadora", "tradicional", "traidor", "traidora", "urbana", "urbano", "vagabunda", "vagabundo", "vencedor", "vencedora", "vesga", "vesgo", "viaja nte", "viajante", "visionaria", "visionario", "zueira", "zueiro"],
  usage: `${global.prefix}gay\n${global.prefix}rankgay`,
  handle: async ({  bot, reply, isGroup, command, menc_os2, info, getUserName, from, sender, pushname, groupData, AllgroupMembers, isModoLite, isModoBn , MESSAGES, optimizer }) => {
    try {
      const modoLite = isModoLite || false;
      const modoBn = isModoBn || false;
      
      const funcsDir = path.join(__dirname, '../../funcs');
      
      // Comando Individual
      if (!command.startsWith('rank')) {
        const proibidosMasc = ['pirocudo', 'pirokudo', 'gostoso', 'nazista', 'machista', 'homofobico', 'racista'];
        const proibidosFem = ['bucetuda', 'cachorra', 'vagabunda', 'racista', 'nazista', 'gostosa', 'machista', 'homofobica'];
        
        if (modoLite && (proibidosMasc.includes(command) || proibidosFem.includes(command))) {
          return bot.react('❌', { key: info.key });
        }
        
        let target = menc_os2 || sender;
        let targetName = `@${getUserName(target)}`;
        let level = Math.floor(Math.random() * 101); // 0 a 100
        
        let gamesData = await optimizer.loadJsonWithCache(funcsDir + '/json/games.json', { games: {} });
        let gamestextData = await optimizer.loadJsonWithCache(funcsDir + '/json/gamestext.json', {});
        
        const responseText = (gamestextData[command] ? gamestextData[command].replaceAll('#nome#', targetName).replaceAll('#level#', level) : (MESSAGES.member.rates?.resultIndividual ? MESSAGES.member.rates.resultIndividual(command, targetName, level) : `O nível de ${command} de ${targetName} é ${level}%!`));
        const media = gamesData.games ? gamesData.games[command] : null;
        
        if (media?.image) {
          await bot.sendMessage(from, { image: media.image, caption: responseText, mentions: [target] });
        } else if (media?.video) {
          await bot.sendMessage(from, { video: media.video, caption: responseText, mentions: [target], gifPlayback: true });
        } else {
          await bot.sendMessage(from, { text: responseText, mentions: [target] });
        }
      } 
      // Comandos de Rank
      else {
        if (modoLite && ['rankgostoso', 'rankgostosos', 'rankgostosa', 'rankgostosas', 'ranknazista'].includes(command)) {
          return bot.react('❌', { key: info.key });
        }
        
        if (!isGroup) return reply(MESSAGES.permission.groupOnly);
        if (!modoBn) return reply(MESSAGES.error.modoBnDisabled);
        
        let gamesData = await optimizer.loadJsonWithCache(funcsDir + '/json/games.json', { ranks: {} });
        const markConfig = groupData.mark || {};
        
        let membros = AllgroupMembers.filter(m => !['0', 'marca'].includes(markConfig[m]));
        if (membros.length < 5) return reply(MESSAGES.member.rates.notEnoughMembers);
        
        let top5 = membros.sort(() => Math.random() - 0.5).slice(0, 5);
        let cleanedCommand = command.endsWith('s') ? command.slice(0, -1) : command;
        
        let ranksData = await optimizer.loadJsonWithCache(funcsDir + '/json/ranks.json', { ranks: {} });
        
        let responseText = ranksData[cleanedCommand] || (MESSAGES.member.rates?.rankHeader ? MESSAGES.member.rates.rankHeader(cleanedCommand.replace('rank', '')) : `Top 5 ${cleanedCommand.replace('rank', '')}`);
        // Ajuste para evitar bugs onde não concatena as linhas corretamente
        if (!responseText.includes('\n\n')) responseText += '\n\n';
        
        top5.forEach((m, i) => {
          responseText += (MESSAGES.member.rates?.rankItem ? MESSAGES.member.rates.rankItem(i, getUserName(m)) : `${i+1}. @${getUserName(m)}\n`);
        });
        
        let media = gamesData.ranks ? gamesData.ranks[cleanedCommand] : null;
        
        if (media?.image) {
          await bot.sendMessage(from, { image: media.image, caption: responseText, mentions: top5 });
        } else if (media?.video) {
          await bot.sendMessage(from, { video: media.video, caption: responseText, mentions: top5, gifPlayback: true });
        } else {
          await bot.sendMessage(from, { text: responseText, mentions: top5 });
        }
      }
    } catch (e) {
      console.error(e);
      await reply(MESSAGES.error?.general || "Ocorreu um erro interno.");
    }
  }
};
