import { PREFIX } from "../../config.js";

export default {
  name: "download",
  description: "Comandos de download de mídia (YouTube, Spotify, etc)",
  commands: ["bot-zip", "botzip", "download-bot", "downloadbot", "drive", "facebook", "facebookdl", "fb", "fbdl", "gd", "gdrive", "git-bot", "git-hub", "gitbot", "github", "googledrive", "ig", "igdl", "igstory", "instagram", "instavideo", "jogar", "kwai", "letra", "lyrics", "mcplugin", "mcplugins", "mediafire", "mf", "play", "play2", "play3", "playsoundcloud", "playspotify", "playvid", "repo", "repositorio", "soundcloud", "soundclouddl", "source", "source-code", "sourcecode", "spotify", "spotifydl", "tiktok", "tiktokaudio", "tiktoks", "tiktoksearch", "tiktokvideo", "tkk", "ttk", "twitter", "twitterdl", "twt", "x", "xdl", "ytmp3", "ytmp4", "zip-bot", "zipbot"],
  handle: async ({ 
    nazu, from, info, command, q, reply, prefix,
    youtube, spotifyModule, soundcloud, tiktok, igdl, facebook, kwai,
    twitterModule, twitterGetInfo, gdriveGetInfo, mediafireGetInfo,
    lyrics, mcPlugin,
    nomebot, botVersion,
    MESSAGES
  }) => {
    const cmd = command.toLowerCase();

    // Helper para envio de áudio (usado em play/ytmp3)
    const sendAudio = async (dlRes) => {
      if (!dlRes.ok) return reply(MESSAGES.error.general);
      try {
        await nazu.sendMessage(from, { audio: dlRes.buffer, mimetype: 'audio/mpeg' }, { quoted: info });
      } catch (e) {
        if (String(e).includes("ENOSPC") || String(e).includes("size")) {
          await reply('📦 Arquivo muito grande, enviando como documento...');
          await nazu.sendMessage(from, { document: dlRes.buffer, fileName: dlRes.filename || 'audio.mp3', mimetype: 'audio/mpeg' }, { quoted: info });
        } else {
          reply(MESSAGES.error.general);
        }
      }
    };

    // ═══════════════════════════════════════════════════════════════
    // 🎵 YOUTUBE (MP3 / PLAY)
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'play' || cmd === 'ytmp3') {
      if (!q) {
        return reply(`╭━━━⊱ 🎵 *YOUTUBE MP3* 🎵 ⊱━━━╮\n│\n│ 📝 Digite o nome da música ou\n│     um link do YouTube\n│\n│  *Exemplos:*\n│  ${prefix + command} Back to Black\n│  ${prefix + command} https://youtube.com/...\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━╯`);
      }

      try {
        if (q.includes('youtube.com') || q.includes('youtu.be')) {
          await reply('Aguarde um momentinho... ☀️');
          // Execução em background para não travar o bot
          youtube.mp3(q).then(sendAudio).catch(e => {
            console.error('Erro play link:', e);
            reply(MESSAGES.error.general);
          });
        } else {
          await reply(`🔍 *Pesquisando no YouTube...*\n\n🎵 Música: *${q}*\n\n⏳ Aguarde um momento...`);
          const result = await youtube.search(q);
          if (!result.ok) return reply(MESSAGES.error.general);

          const { data: v } = result;
          if (v.seconds > 1800) return reply(`⚠️ Este vídeo é muito longo (${v.timestamp}).\nPor favor, escolha um vídeo com menos de 30 minutos.`);

          const views = typeof v.views === 'number' ? v.views.toLocaleString('pt-BR') : v.views;
          const caption = `🎵 *Música Encontrada* 🎵\n\n📌 *Título:* ${v.title}\n👤 *Artista/Canal:* ${v.author.name}\n⏱ *Duração:* ${v.timestamp} (${v.seconds} segundos)\n👀 *Visualizações:* ${views}\n🔗 *Link:* ${v.url}\n\n🎧 *Baixando e processando sua música, aguarde...*`;

          nazu.sendMessage(from, { image: { url: v.thumbnail }, caption, footer: `${nomebot} • Versão ${botVersion}` }, { quoted: info }).catch(() => {});
          
          // Download em background
          youtube.mp3(v.url, v).then(sendAudio).catch(e => {
            console.error('Erro play search:', e);
            reply(MESSAGES.error.general);
          });
        }
      } catch (error) {
        console.error('Erro no comando play:', error);
        reply(MESSAGES.error.general);
      }
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // 📺 YOUTUBE VIDEO (MP4 / PLAYVID)
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'playvid' || cmd === 'ytmp4') {
      if (!q) return reply(`🎥 Envie o nome ou link do vídeo do YouTube!\n\nExemplo: ${prefix}${cmd} Linkin Park Numb`);
      
      try {
        let videoUrl = q;
        if (!q.includes('youtube.com') && !q.includes('youtu.be')) {
          await reply(`🔍 Pesquisando vídeo: *${q}*...`);
          const result = await youtube.search(q);
          if (!result.ok) return reply(`💔 Vídeo não encontrado.`);
          videoUrl = result.data.url;
        }

        await reply('⏳ Baixando vídeo... Isso pode levar um momento.');
        
        // Download em background para não travar o bot
        youtube.mp4(videoUrl, '360p').then(async (dlRes) => {
          if (!dlRes || !dlRes.ok || !dlRes.buffer) {
            console.error('Download MP4 falhou:', dlRes?.msg);
            return reply('💔 Não foi possível baixar o vídeo. Tente novamente mais tarde.');
          }

          await nazu.sendMessage(from, { 
            video: dlRes.buffer, 
            caption: `✨ *${dlRes.title || 'Vídeo baixado'}*\n\n📺 Qualidade: ${dlRes.quality || '360p'}\n🔗 Fonte: ${dlRes.source || 'Auto'}`,
            mimetype: 'video/mp4' 
          }, { quoted: info });
        }).catch(e => {
          console.error('Erro fatal no playvid background:', e);
          reply('💔 Ocorreu um erro ao processar seu vídeo.');
        });

      } catch (e) {
        console.error(e);
        reply(MESSAGES.error.general);
      }
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // 🎵 SPOTIFY
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'spotify' || cmd === 'spotifydl' || cmd === 'play2' || cmd === 'playspotify') {
      if (!q) return reply(`🎵 Envie o nome da música ou link do Spotify!\n\nExemplo: ${prefix}${cmd} Imagine Dragons Believer`);
      
      try {
        await reply('🎵 Processando solicitação do Spotify...');
        spotifyModule.download(q).then(async (dlRes) => {
          if (!dlRes.ok) return reply(MESSAGES.error.general);
          await nazu.sendMessage(from, { audio: dlRes.buffer, mimetype: 'audio/mpeg' }, { quoted: info });
        }).catch(() => reply(MESSAGES.error.general));
      } catch (e) { reply(MESSAGES.error.general); }
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // 🎵 SOUNDCLOUD
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'soundcloud' || cmd === 'soundclouddl' || cmd === 'play3' || cmd === 'playsoundcloud') {
      if (!q) return reply(`🎵 Envie o nome ou link do SoundCloud!\n\nExemplo: ${prefix}${cmd} https://soundcloud.com/...`);
      try {
        await reply('☁️ Baixando do SoundCloud...');
        soundcloud.download(q).then(async (dlRes) => {
          if (!dlRes.ok) return reply(MESSAGES.error.general);
          await nazu.sendMessage(from, { audio: dlRes.buffer, mimetype: 'audio/mpeg' }, { quoted: info });
        }).catch(() => reply(MESSAGES.error.general));
      } catch (e) { reply(MESSAGES.error.general); }
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // 📱 TIKTOK
    // ═══════════════════════════════════════════════════════════════
    if (['tiktok', 'ttk', 'tkk', 'tiktokaudio', 'tiktokvideo', 'tiktoks', 'tiktoksearch'].includes(cmd)) {
      if (!q) return reply(`📱 Envie o link do TikTok ou o que deseja pesquisar!`);
      try {
        if (q.includes('tiktok.com')) {
          await reply('⏳ Baixando do TikTok...');
          tiktok.dl(q).then(async (dlRes) => {
            if (!dlRes.ok) return reply(MESSAGES.error.general);
            if (cmd === 'tiktokaudio') {
              await nazu.sendMessage(from, { audio: { url: dlRes.audio }, mimetype: 'audio/mpeg' }, { quoted: info });
            } else {
              await nazu.sendMessage(from, { video: { url: dlRes.video }, caption: `✨ TikTok de *${dlRes.author}*` }, { quoted: info });
            }
          }).catch(() => reply(MESSAGES.error.general));
        } else {
          await reply(`🔍 Pesquisando TikToks: *${q}*...`);
          const results = await tiktok.search(q);
          if (!results || results.length === 0) return reply(`💔 Nenhum resultado encontrado.`);
          const video = results[0];
          await nazu.sendMessage(from, { video: { url: video.url }, caption: `✨ *${video.title}*\n👤 Autor: ${video.author}` }, { quoted: info });
        }
      } catch (e) { reply(MESSAGES.error.general); }
      return;
    }


    // ═══════════════════════════════════════════════════════════════
    // 📸 INSTAGRAM
    // ═══════════════════════════════════════════════════════════════
    if (['instagram', 'igdl', 'ig', 'instavideo', 'igstory'].includes(cmd)) {
      if (!q || !q.includes('instagram.com')) return reply(`📸 Envie um link vindo do Instagram!`);
      try {
        await reply('⏳ Baixando do Instagram...');
        igdl.dl(q).then(async (dlRes) => {
          if (!dlRes || !dlRes.ok || !dlRes.data || dlRes.data.length === 0) {
            return reply(`💔 Não foi possível baixar. Verifique se o link é público.`);
          }
          for (const item of dlRes.data) {
            if (item.type === 'image') {
              await nazu.sendMessage(from, { image: item.buff || { url: item.url } }, { quoted: info });
            } else {
              await nazu.sendMessage(from, { video: item.buff || { url: item.url } }, { quoted: info });
            }
          }
        }).catch((err) => {
          console.error('Erro no download Instagram:', err);
          reply(MESSAGES.error.general);
        });
      } catch (e) { reply(MESSAGES.error.general); }
      return;
    }

    if (['facebook', 'fb', 'fbdl', 'facebookdl'].includes(cmd)) {
      if (!q || !q.includes('facebook.com')) return reply(`👥 Envie um link do Facebook!`);
      try {
        await reply('⏳ Baixando do Facebook...');
        facebook.dl(q).then(async (dlRes) => {
          if (!dlRes.ok) return reply(MESSAGES.error.general);
          await nazu.sendMessage(from, { video: { url: dlRes.url }, caption: '✨ Vídeo do Facebook' }, { quoted: info });
        }).catch(() => reply(MESSAGES.error.general));
      } catch (e) { reply(MESSAGES.error.general); }
      return;
    }

    if (['twitter', 'twitterdl', 'twt', 'x', 'xdl'].includes(cmd)) {
      if (!q) return reply(`🐦 Envie o link do tweet!`);
      try {
        await reply('🐦 Buscando informações do tweet...');
        twitterGetInfo(q).then(async (twitterResult) => {
          if (!twitterResult.ok) return reply(`💔 ${twitterResult.msg || 'Erro'}`);
          const { text, author, stats, media, hasMedia } = twitterResult;
          const caption = `🐦 *Twitter/X Download*\n\n👤 *${author?.name || 'Usuário'}*\n\n📝 ${text || ''}`;
          if (!hasMedia) return reply(`${caption}\n\n⚠️ Sem mídia.`);
          for (const item of media) {
            if (item.type === 'video') await nazu.sendMessage(from, { video: { url: item.bestQuality?.url || item.url }, caption }, { quoted: info });
            else await nazu.sendMessage(from, { image: { url: item.url }, caption }, { quoted: info });
          }
        }).catch(() => reply(MESSAGES.error.general));
      } catch (e) { reply(MESSAGES.error.general); }
      return;
    }

    if (['gdrive', 'googledrive', 'drive', 'gd'].includes(cmd)) {
      if (!q) return reply(`📂 Envie o link do Google Drive!`);
      try {
        gdriveGetInfo(q).then(async (res) => {
          if (!res.ok) return reply(MESSAGES.error.general);
          await nazu.sendMessage(from, { document: { url: res.downloadUrl }, fileName: res.name, mimetype: res.mimetype }, { quoted: info });
        }).catch(() => reply(MESSAGES.error.general));
      } catch (e) { reply(MESSAGES.error.general); }
      return;
    }

    if (['mediafire', 'mf'].includes(cmd)) {
      if (!q) return reply(`📂 Envie o link do Mediafire!`);
      try {
        mediafireGetInfo(q).then(async (res) => {
          if (!res.ok) return reply(MESSAGES.error.general);
          await nazu.sendMessage(from, { document: { url: res.downloadUrl }, fileName: res.name, mimetype: res.mimetype }, { quoted: info });
        }).catch(() => reply(MESSAGES.error.general));
      } catch (e) { reply(MESSAGES.error.general); }
      return;
    }

    if (cmd === 'lyrics' || cmd === 'letra') {
      if (!q) return reply(`🎵 Qual música?`);
      try {
        await reply(`🔍 Procurando letra de *${q}*...`);
        const res = await lyrics.search(q);
        if (!res) return reply(`💔 Letra não encontrada.`);
        await reply(`🎵 *${res.title}* - *${res.artist}*\n\n${res.lyrics}`);
      } catch (e) { reply(MESSAGES.error.general); }
      return;
    }

    if (cmd === 'kwai') {
      if (!q) return reply(`📱 Envie o link do Kwai!`);
      try {
        kwai.dl(q).then(async (res) => {
          await nazu.sendMessage(from, { video: { url: res.video }, caption: '✨ Kwai Video' }, { quoted: info });
        }).catch(() => reply(MESSAGES.error.general));
      } catch (e) { reply(MESSAGES.error.general); }
      return;
    }

    if (['zipbot', 'zip-bot', 'botzip', 'bot-zip', 'downloadbot', 'download-bot', 'github', 'repo', 'repositorio', 'source', 'sourcecode', 'source-code', 'git-bot', 'git-hub'].includes(cmd)) {
      try {
        await reply('📦 Baixando código-fonte...');
        const zipUrl = 'https://github.com/L1ghtzin/nazuna/archive/refs/heads/main.zip';
        await nazu.sendMessage(from, { document: { url: zipUrl }, fileName: 'nazuna-bot.zip', mimetype: 'application/zip', caption: `📂 *Código-fonte*` }, { quoted: info });
      } catch (e) { reply(MESSAGES.error.general); }
      return;
    }
  }
};
