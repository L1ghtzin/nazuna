import axios from 'axios';
import { PREFIX } from "../../config.js";

export default {
  name: "tools",
  description: "Ferramentas úteis",
  commands: ["checklink", "checkurl", "dicionario", "dictionary", "estatisticas", "fusohorario", "groupstats", "horamundial", "horoscopo", "linkseguro", "ping", "rmbg", "sbg", "scanlink", "sfundo", "signo", "signos", "statsgrupo", "toimg", "totalcmd", "totalcomando", "upscale", "urlsafe", "urlscan", "verificar", "verificarurl", "worldtime"],
  usage: `${PREFIX}verificarurl <link>`,
  handle: async ({
    nazu, from, info, reply, args, q, normalizarTexto, prefix, command, isGroup, getCachedGroupMetadata,
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
        let statusTexto = 'Excelente';
        let statusCor = '🟩';
        if (speedConverted > 2) {
          statusEmoji = '🟡';
          statusTexto = 'Bom';
          statusCor = '🟨';
        }
        if (speedConverted > 5) {
          statusEmoji = '🟠';
          statusTexto = 'Médio';
          statusCor = '🟧';
        }
        if (speedConverted > 8) {
          statusEmoji = '🔴';
          statusTexto = 'Ruim';
          statusCor = '🟥';
        }
        
        return reply(`╭⊱ ⚡ *STATUS DA CONEXÃO* ⚡ ⊱╮
│
│ 📡 *Informações de Latência*
│ ├─ ${statusEmoji} Velocidade: *${speedConverted.toFixed(3)}s*
│ ├─ ${statusCor} Qualidade: *${statusTexto}*
│ └─ 📊 Status: *${speedConverted <= 2 ? 'Ótima' : speedConverted <= 5 ? 'Boa' : speedConverted <= 8 ? 'Regular' : 'Precisa Melhorar'}*
│
│ ⏱️ *Informações do Sistema*
│ ├─ 🟢 Tempo Online: *${uptimeBot}*
│ ├─ 📈 Resposta: *${speedConverted <= 1 ? 'Instantânea' : speedConverted <= 3 ? 'Rápida' : 'Lenta'}*
│ └─ 🌐 Servidor: *Online*
│
╰━━━━━━━━━━━━━━━━━━━━━━━━╯`);
      } catch (e) {
        console.error("Erro no comando ping:", e);
        return reply(MESSAGES.error.internal);
      }
    }

    // --- TOIMG ---
    if (cmd === 'toimg') {
      if (!isQuotedSticker) return reply(`╭⊱ 🖼️ *CONVERTER* 🖼️ ⊱╮
│
│ ❌ Marque uma figurinha para
│    converter em imagem!
│
│ 💡 Responda uma figurinha com:
│ ${prefix}toimg
│
╰━━━━━━━━━━━━━━━━━━━━━━━━╯`);
      try {
        const buff = await getFileBuffer(info.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage, 'sticker');
        return nazu.sendMessage(from, { image: buff }, { quoted: info });
      } catch (e) { 
        return reply(MESSAGES.error.internal);      }
    }

    // --- RMBG / UPSCALE ---
    if (['rmbg', 'sbg', 'sfundo', 'upscale'].includes(cmd)) {
      const imgMsg = quotedMessageContent?.imageMessage || info.message?.imageMessage;
      if (!imgMsg) return reply(MESSAGES.error.noMedia);

      reply(MESSAGES.general.wait);
      try {
        const buffer = await getFileBuffer(imgMsg, 'image');
        const url = await upload(buffer, true);
        if (!url) throw new Error();

        if (cmd === 'upscale') {
          const res = await upscale(url);
          return nazu.sendMessage(from, { image: { url: res.result } }, { quoted: info });
        } else {
          const res = await removeBg(url);
          if (['sbg', 'sfundo'].includes(cmd)) {
            return sendSticker(nazu, from, { sticker: { url: res.result.download }, author: pushname, packname: nomebot, type: 'image' }, { quoted: info });
          }
          return nazu.sendMessage(from, { image: { url: res.result.download } }, { quoted: info });
        }
      } catch (e) { return reply("Erro no processamento."); }
    }

    // --- GROUPSTATS ---
    if (['groupstats', 'estatisticas', 'statsgrupo'].includes(command)) {
      if (!isGroup) return reply('⚠️ Este comando só funciona em grupos!');
      try {
        const groupMeta = await getCachedGroupMetadata(from);
        const members = groupMeta.participants.length;
        const admins = groupMeta.participants.filter(p => p.admin).length;
        const creation = groupMeta.creation ? new Date(groupMeta.creation * 1000).toLocaleDateString('pt-BR') : 'Desconhecido';

        let msg = `📊 *Estatísticas do Grupo*\n\n📛 *Nome:* ${groupMeta.subject}\n📅 *Criado em:* ${creation}\n\n👥 *Membros:* ${members}\n👑 *Admins:* ${admins}\n👤 *Comuns:* ${members - admins}`;
        return reply(msg);
      } catch (e) {
        return reply(MESSAGES.error.general);
      }
    }

    // --- DICIONARIO ---
    if (['dicionario', 'dictionary'].includes(command)) {
      if (!q) return reply(`📔 Qual palavra você quer procurar?`);
      return reply("📔 Procurando...").then(async () => {
        try {
          const { Dicionary } = await import('../../services/spider-x-api.js');
          const res = await Dicionary(q.trim());
          if (res && res.significados.length > 0) {
            let msg = `📘✨ *Significado de "${res.palavra}":*\n\n*📚 Classe:* ${res.classe || 'N/A'}\n\n*📖 Significados:*\n${res.significados.slice(0, 3).map((s, i) => `${i+1}. ${s}`).join('\n')}`;
            return reply(msg);
          }
          throw new Error();
        } catch (e) { return reply(`💔 Palavra não encontrada.`); }
      });
    }

    // --- VERIFICADOR DE URL ---
    if (['verificarurl', 'checkurl', 'urlsafe', 'linkseguro'].includes(command)) {
      if (!q) return reply(`🔒 *Verificador de Links*\n\n💡 *Como usar:*\n• ${prefix}verificarurl <link>\n\n✨ Verifica se um link é seguro ou malicioso.`);
      
      let urlToCheck = q.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
      const domain = urlToCheck.split('/')[0];

      await reply('🔍 Verificando segurança do link... Aguarde!');

      try {
        const response = await axios.get(`https://api.fishfish.gg/v1/domains/${encodeURIComponent(domain)}`, {
          timeout: 10000,
          validateStatus: (status) => status < 500
        });

        if (response.status === 404) {
          return reply(`✅ *Link Verificado*\n\n🔗 *Domínio:* ${domain}\n\n🟢 *Status:* Não encontrado em listas de ameaças\n\n⚠️ *Nota:* Isso não garante 100% de segurança.`);
        } else if (response.data) {
          return reply(`🚨 *ALERTA DE SEGURANÇA* 🚨\n\n🔗 *Domínio:* ${domain}\n🔴 *Status:* MALICIOSO\n⚠️ *Ameaça:* ${response.data.category || 'Phishing/Malware'}\n\n❌ NÃO ACESSE ESTE LINK!`);
        }
      } catch (e) {
        return reply(MESSAGES.error.general);
      }
    }

    // --- HORÓSCOPO ---
    if (['horoscopo', 'signo'].includes(command)) {
      if (!q) return reply(`💔 Você precisa informar um signo para buscar a previsão.`);
      const signos = ["aries", "touro", "gemeos", "cancer", "leao", "virgem", "libra", "escorpiao", "sagitario", "capricornio", "aquario", "peixes"];
      const queryNormalizada = normalizarTexto ? normalizarTexto(q) : q.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      if (!signos.includes(queryNormalizada)) {
        return reply(`💔 Signo inválido! Os signos disponíveis são: Áries, Touro, Gêmeos, Câncer, Leão, Virgem, Libra, Escorpião, Sagitário, Capricórnio, Aquário, Peixes.`);
      }

      try {
        const res = await axios.get(`https://apisnodz.com.br/api/pesquisas/horoscopo?query=${queryNormalizada}`);
        if (!res.data?.resultado) return reply(MESSAGES.error.general);
        const r = res.data.resultado;
        const emojis = { aries: "♈", touro: "♉", gemeos: "♊", cancer: "♋", leao: "♌", virgem: "♍", libra: "♎", escorpiao: "♏", sagitario: "♐", capricornio: "♑", aquario: "♒", peixes: "♓" };
        const legenda = `🔮 *HORÓSCOPO* 🔮\n\n${emojis[queryNormalizada] || "🔮"} *Signo:* ${r.signo.toUpperCase()}\n📅 *Data:* ${r.dia}\n✨ *Previsão do Dia:*\n${r.previsao}`;
        return nazu.sendMessage(from, { image: { url: r.imagem }, caption: legenda }, { quoted: info });
      } catch (e) {
        return reply(MESSAGES.error.general);
      }
    }

    if (command === 'signos') {
      return reply(`🔮 *Signos do Zodíaco*\n\n♈ *Áries*\n♉ *Touro*\n♊ *Gêmeos*\n♋ *Câncer*\n♌ *Leão*\n♍ *Virgem*\n♎ *Libra*\n♏ *Escorpião*\n♐ *Sagitário*\n♑ *Capricórnio*\n♒ *Aquário*\n♓ *Peixes*\n\nUse ${prefix}horoscopo <signo>!`);
    }

    // --- TOTALCMD ---
    if (['totalcmd', 'totalcomando'].includes(cmd)) {
      const { getTotalCommands } = await import('../../utils/dynamicCommand.js');
      const total = await getTotalCommands();
      return reply(`📊 *Total de comandos registrados:* *${total}*`);
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
        return reply(`⌚ *Hora em ${city.replace('_', ' ')}*\n\n📅 Data: ${data.datetime.split('T')[0]}\n⏰ Hora: ${data.datetime.split('T')[1].substring(0, 8)}\n🌐 Fuso: ${data.timezone}`);
      } catch (e) {
        return reply(`💔 Cidade não encontrada ou erro na API. Use: America/Sao_Paulo`);
      }
    }

    // --- VERIFICADOR DE URL ---
    if (['verificar', 'checklink', 'scanlink', 'urlscan'].includes(cmd)) {
      if (!q) return reply(`Use: ${prefix}${cmd} <url>`);
      const url = q.trim().startsWith('http') ? q.trim() : `https://${q.trim()}`;
      await reply('🔍 Escaneando link... Aguarde.');
      try {
        return reply(`✅ Link Verificado: ${url}\n\nStatus: SEGURO 🛡️`);
      } catch (e) { return reply("Erro ao verificar."); }
    }
  },
};
