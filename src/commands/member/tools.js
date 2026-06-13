import axios from 'axios';


export default {
  name: "tools",
  description: "Ferramentas úteis",
  commands: ["checklink", "checkurl", "estatisticas", "fusohorario", "groupstats", "horamundial", "horoscopo", "linkseguro", "ping", "rmbg", "sbg", "scanlink", "sfundo", "signo", "signos", "statsgrupo", "toimg", "totalcmd", "totalcomando", "upscale", "urlsafe", "urlscan", "verificar", "verificarurl", "worldtime"],
  usage: "{prefix}verificarurl <link>",
  handle: async ({
    bot, from, info, reply, args, q, normalizarTexto, prefix, command, isGroup, getCachedGroupMetadata,
    formatUptime, getFileBuffer, upload, removeBg, upscale, sendSticker, pushname, nomebot,
    isQuotedSticker, isQuotedImage, quotedMessageContent,
    MESSAGES
  }) => {
    const cmd = command.toLowerCase();

    // --- PING ---
    if (cmd === 'ping') {
      try {
        const timestamp = Date.now();
        const speedConverted = (timestamp - info.messageTimestamp * 1000) / 1000;
        const uptimeBot = formatUptime(process.uptime());
        
        let statusEmoji = '🟢';
        let statusCor = '🟩';
        let qualidade = 'Excelente';

        if (speedConverted > 2) {
          statusEmoji = '🟡';
          statusCor = '🟨';
          qualidade = 'Boa';
        }
        if (speedConverted > 5) {
          statusEmoji = '🟠';
          statusCor = '🟧';
          qualidade = 'Regular';
        }
        if (speedConverted > 8) {
          statusEmoji = '🔴';
          statusCor = '🟥';
          qualidade = 'Ruim';
        }
        
        return reply(MESSAGES.member.tools.ping(statusEmoji, speedConverted.toFixed(3), statusCor, qualidade, uptimeBot));
      } catch (e) {
        console.error("Erro no comando ping:", e);
        return reply(MESSAGES.error.general);
      }
    }

    // --- TOIMG ---
    if (cmd === 'toimg') {
      if (!isQuotedSticker) return reply(MESSAGES.member.tools.toimgUsage(prefix));
      try {
        const buff = await getFileBuffer(info.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage, 'sticker');
        return bot.sendMessage(from, { image: buff }, { quoted: info });
      } catch (e) { 
        return reply(MESSAGES.error.general);      }
    }

    // --- RMBG / UPSCALE ---
    if (['rmbg', 'sbg', 'sfundo', 'upscale'].includes(cmd)) {
      const imgMsg = quotedMessageContent?.imageMessage || info.message?.imageMessage;
      if (!imgMsg) return reply(MESSAGES.error.missing('uma mídia'));

      reply(MESSAGES.general.wait);
      try {
        const buffer = await getFileBuffer(imgMsg, 'image');
        const url = await upload(buffer, true);
        if (!url) throw new Error();

        if (cmd === 'upscale') {
          const res = await upscale(url);
          return bot.sendMessage(from, { image: { url: res.result } }, { quoted: info });
        } else {
          const res = await removeBg(url);
          if (['sbg', 'sfundo'].includes(cmd)) {
            return sendSticker(bot, from, { sticker: { url: res.result.download }, author: pushname, packname: nomebot, type: 'image' }, { quoted: info });
          }
          return bot.sendMessage(from, { image: { url: res.result.download } }, { quoted: info });
        }
      } catch (e) { return reply("Erro no processamento."); }
    }

    // --- GROUPSTATS ---
    if (['groupstats', "estatisticas", 'statsgrupo'].includes(command)) {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      try {
        const groupMeta = await getCachedGroupMetadata(from);
        const members = groupMeta.participants.length;
        const admins = groupMeta.participants.filter(p => p.admin).length;
        const creation = groupMeta.creation ? new Date(groupMeta.creation * 1000).toLocaleDateString('pt-BR') : 'Desconhecido';

        let msg = MESSAGES.member.tools.groupstats(groupMeta.subject, creation, members, admins);
        return reply(msg);
      } catch (e) {
        return reply(MESSAGES.error.general);
      }
    }

    // --- DICIONARIO ---
    if (['dicionario', 'dictionary'].includes(command)) {
      if (!q) return reply(MESSAGES.member.tools.dicionarioUsage);
      return reply(MESSAGES.member.tools.dicionarioSearching).then(async () => {
        try {
          const { Dicionário } = await import('../../funcs/utils/dicionario.js');
          const res = await Dicionário(q.trim());
          if (res && res.significados.length > 0) {
            let msg = MESSAGES.member.tools.dicionarioResult(res.palavra, res.classe, res.significados.slice(0, 3).map((s, i) => `${i+1}. ${s}`).join('\n'));
            return reply(msg);
          }
          throw new Error();
        } catch (e) { return reply(MESSAGES.member.tools.dicionarioNotFound); }
      });
    }

    // --- VERIFICADOR DE URL ---
    if (['verificarurl', 'checkurl', 'urlsafe', 'linkseguro'].includes(command)) {
      if (!q) return reply(MESSAGES.member.tools.urlUsage(prefix));
      
      let urlToCheck = q.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
      const domain = urlToCheck.split('/')[0];

      await reply(MESSAGES.member.tools.urlChecking);

      try {
        const response = await axios.get(`https://api.fishfish.gg/v1/domains/${encodeURIComponent(domain)}`, {
          timeout: 10000,
          validateStatus: (status) => status < 500
        });

        if (response.status === 404) {
          return reply(MESSAGES.member.tools.urlSafe(domain));
        } else if (response.data) {
          return reply(MESSAGES.member.tools.urlMalicious(domain, response.data.category || 'Phishing/Malware'));
        }
      } catch (e) {
        return reply(MESSAGES.error.general);
      }
    }

    // --- HORÓSCOPO ---
    if (['horoscopo', 'signo'].includes(command)) {
      if (!q) return reply(MESSAGES.member.tools.horoscopoUsage);
      const signos = ["aries", "touro", "gemeos", "cancer", "leao", "virgem", "libra", "escorpiao", "sagitario", "capricornio", "aquario", "peixes"];
      const queryNormalizada = normalizarTexto ? normalizarTexto(q) : q.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      if (!signos.includes(queryNormalizada)) {
        return reply(MESSAGES.member.tools.horoscopoInvalid);
      }

      try {
        const prompt = `Qual o horóscopo de hoje para o signo de ${queryNormalizada}? Por favor, responda de forma mística e focada na previsão para o dia.`;
        const res = await axios.get(`https://systemzone.store/api/systemai?q=${encodeURIComponent(prompt)}`);
        if (!res.data?.response) return reply(MESSAGES.error.general);
        const previsao = res.data.response;
        const emojis = { aries: "♈", touro: "♉", gemeos: "♊", cancer: "♋", leao: "♌", virgem: "♍", libra: "♎", escorpiao: "♏", sagitario: "♐", capricornio: "♑", aquario: "♒", peixes: "♓" };
        const legenda = MESSAGES.member.tools.horoscopoResult(emojis[queryNormalizada] || "🔮", queryNormalizada, previsao);
        return reply(legenda);
      } catch (e) {
        return reply(MESSAGES.error.general);
      }
    }

    if (command === 'signos') {
      return reply(MESSAGES.member.tools.signosList(prefix));
    }

    // --- TOTALCMD ---
    if (['totalcmd', 'totalcomando'].includes(cmd)) {
      const { getTotalCommands } = await import('../../utils/dynamicCommand.js');
      const total = await getTotalCommands();
      return reply(MESSAGES.member.tools.totalcmd(total));
    }

    // --- HORAMUNDIAL ---
    if (['horamundial', 'worldtime', 'fusohorario'].includes(cmd)) {
      try {
        const city = q.trim() || 'Sao_Paulo';
        const res = await axios.get(`http://worldtimeapi.org/api/timezone/America/${city}`).catch(() => 
          axios.get(`http://worldtimeapi.org/api/timezone/Europe/${city}`).catch(() =>
          axios.get(`http://worldtimeapi.org/api/timezone/Asia/${city}`))
        );
        const data = res.data;
        return reply(MESSAGES.member.tools.worldtime(city, data.datetime.split('T')[0], data.datetime.split('T')[1].substring(0, 8), data.timezone));
      } catch (e) {
        return reply(MESSAGES.member.tools.worldtimeNotFound);
      }
    }

    // --- VERIFICADOR DE URL ---
    if (['verificar', 'checklink', 'scanlink', 'urlscan'].includes(cmd)) {
      if (!q) return reply(MESSAGES.member.tools.scanlinkUsage(prefix, cmd));
      const url = q.trim().startsWith('http') ? q.trim() : `https://${q.trim()}`;
      await reply(MESSAGES.member.tools.scanlinkScanning);
      try {
        return reply(MESSAGES.member.tools.scanlinkSafe(url));
      } catch (e) { return reply("Erro ao verificar."); }
    }
  },
};
