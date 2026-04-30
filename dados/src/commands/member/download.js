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

    // ═══════════════════════════════════════════════════════════════
    // 🎵 YOUTUBE (MP3 / PLAY)
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'play' || cmd === 'ytmp3') {
      if (!q) {
        return reply(`╭━━━⊱ 🎵 *YOUTUBE MP3* 🎵 ⊱━━━╮\n│\n│ 📝 Digite o nome da música ou\n│     um link do YouTube\n│\n│  *Exemplos:*\n│  ${prefix + command} Back to Black\n│  ${prefix + command} https://youtube.com/...\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━╯`);
      }

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

      try {
        if (q.includes('youtube.com') || q.includes('youtu.be')) {
          await reply('Aguarde um momentinho... ☀️');
          const dlRes = await youtube.mp3(q);
          await sendAudio(dlRes);
        } else {
          if (!youtube || typeof youtube.search !== 'function') {
            return reply(`💔 Sistema de busca do YouTube não está disponível no momento.`);
          }

          await reply(`🔍 *Pesquisando no YouTube...*\n\n🎵 Música: *${q}*\n\n⏳ Aguarde um momento...`);

          const result = await youtube.search(q);
          if (!result.ok) return reply(MESSAGES.error.general);

          const { data: v } = result;
          if (v.seconds > 1800) return reply(`⚠️ Este vídeo é muito longo (${v.timestamp}).\nPor favor, escolha um vídeo com menos de 30 minutos.`);

          const views = typeof v.views === 'number' ? v.views.toLocaleString('pt-BR') : v.views;
          const desc = v.description ? v.description.slice(0, 100) + (v.description.length > 100 ? '...' : '') : 'Sem descrição disponível';
          const caption = `🎵 *Música Encontrada* 🎵\n\n📌 *Título:* ${v.title}\n👤 *Artista/Canal:* ${v.author.name}\n⏱ *Duração:* ${v.timestamp} (${v.seconds} segundos)\n👀 *Visualizações:* ${views}\n📅 *Publicado:* ${v.ago}\n📜 *Descrição:* ${desc}\n🔗 *Link:* ${v.url}\n\n🎧 *Baixando e processando sua música, aguarde...*`;

          const [, dlRes] = await Promise.all([
            nazu.sendMessage(from, { image: { url: v.thumbnail }, caption, footer: `${nomebot} • Versão ${botVersion}` }, { quoted: info }).catch(() => {}),
            youtube.mp3(v.url, v)
          ]);
          await sendAudio(dlRes);
        }
      } catch (error) {
        console.error('Erro no comando play:', error);
        if (String(error).includes("age")) return reply('🔞 Este conteúdo possui restrição de idade e não pode ser baixado.');
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
        const dlRes = await youtube.mp4(videoUrl);
        
        if (!dlRes.ok) return reply(MESSAGES.error.general);

        await nazu.sendMessage(from, { 
          video: dlRes.buffer, 
          caption: `✨ *${dlRes.title || 'Vídeo baixado'}*`,
          mimetype: 'video/mp4' 
        }, { quoted: info });

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
        const dlRes = await spotifyModule.download(q);
        
        if (!dlRes.ok) return reply(MESSAGES.error.general);

        await nazu.sendMessage(from, { 
          audio: dlRes.buffer, 
          mimetype: 'audio/mpeg',
          ptt: false 
        }, { quoted: info });

      } catch (e) {
        console.error(e);
        reply(MESSAGES.error.general);
      }
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // 🎵 SOUNDCLOUD
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'soundcloud' || cmd === 'soundclouddl' || cmd === 'play3' || cmd === 'playsoundcloud') {
      if (!q) return reply(`🎵 Envie o nome ou link do SoundCloud!\n\nExemplo: ${prefix}${cmd} https://soundcloud.com/...`);
      
      try {
        await reply('☁️ Baixando do SoundCloud...');
        const dlRes = await soundcloud.download(q);
        
        if (!dlRes.ok) return reply(MESSAGES.error.general);

        await nazu.sendMessage(from, { 
          audio: dlRes.buffer, 
          mimetype: 'audio/mpeg' 
        }, { quoted: info });

      } catch (e) {
        console.error(e);
        reply(MESSAGES.error.general);
      }
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
          const dlRes = await tiktok.dl(q);
          if (!dlRes.ok) return reply(MESSAGES.error.general);

          if (cmd === 'tiktokaudio') {
            await nazu.sendMessage(from, { audio: { url: dlRes.audio }, mimetype: 'audio/mpeg' }, { quoted: info });
          } else {
            await nazu.sendMessage(from, { video: { url: dlRes.video }, caption: `✨ TikTok de *${dlRes.author}*` }, { quoted: info });
          }
        } else {
          await reply(`🔍 Pesquisando TikToks: *${q}*...`);
          const results = await tiktok.search(q);
          if (!results || results.length === 0) return reply(`💔 Nenhum resultado encontrado.`);
          
          const video = results[0];
          await nazu.sendMessage(from, { video: { url: video.url }, caption: `✨ *${video.title}*\n👤 Autor: ${video.author}` }, { quoted: info });
        }
      } catch (e) {
        console.error(e);
        reply(MESSAGES.error.general);
      }
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // 📸 INSTAGRAM
    // ═══════════════════════════════════════════════════════════════
    if (['instagram', 'igdl', 'ig', 'instavideo', 'igstory'].includes(cmd)) {
      if (!q || !q.includes('instagram.com')) return reply(`📸 Envie um link vindo do Instagram!`);
      
      try {
        await reply('⏳ Baixando do Instagram...');
        const dlRes = await igdl(q);
        if (!dlRes || dlRes.length === 0) return reply(`💔 Não foi possível baixar este conteúdo.`);

        for (const item of dlRes) {
          if (item.type === 'image') {
            await nazu.sendMessage(from, { image: { url: item.url } }, { quoted: info });
          } else {
            await nazu.sendMessage(from, { video: { url: item.url } }, { quoted: info });
          }
        }
      } catch (e) {
        console.error(e);
        reply(MESSAGES.error.general);
      }
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // 👥 FACEBOOK
    // ═══════════════════════════════════════════════════════════════
    if (['facebook', 'fb', 'fbdl', 'facebookdl'].includes(cmd)) {
      if (!q || !q.includes('facebook.com')) return reply(`👥 Envie um link do Facebook!`);
      
      try {
        await reply('⏳ Baixando do Facebook...');
        const dlRes = await facebook.dl(q);
        if (!dlRes.ok) return reply(MESSAGES.error.general);

        await nazu.sendMessage(from, { video: { url: dlRes.url }, caption: '✨ Vídeo do Facebook' }, { quoted: info });
      } catch (e) {
        console.error(e);
        reply(MESSAGES.error.general);
      }
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // 🐦 TWITTER / X
    // ═══════════════════════════════════════════════════════════════
    if (['twitter', 'twitterdl', 'twt', 'x', 'xdl'].includes(cmd)) {
      if (!q) return reply(`🐦 Envie o link do tweet!`);
      
      try {
        await reply('🐦 Buscando informações do tweet...');
        const twitterResult = await twitterGetInfo(q);
        
        if (!twitterResult.ok) return reply(`💔 ${twitterResult.msg || 'Erro ao obter informações do tweet'}`);
        
        const { text, author, stats, media, hasMedia } = twitterResult;
        const caption = `🐦 *Twitter/X Download*\n\n👤 *${author?.name || 'Usuário'}* (@${author?.username || 'unknown'})\n\n📝 ${text || ''}\n\n❤️ ${stats?.likes || 0}   🔁 ${stats?.retweets || 0}`;
        
        if (!hasMedia || !media || media.length === 0) return reply(`${caption}\n\n⚠️ Este tweet não contém mídia.`);
        
        for (const item of media) {
          if (item.type === 'video') {
            await nazu.sendMessage(from, { video: { url: item.bestQuality?.url || item.url }, caption }, { quoted: info });
          } else {
            await nazu.sendMessage(from, { image: { url: item.url }, caption }, { quoted: info });
          }
        }
      } catch (e) {
        console.error(e);
        reply(MESSAGES.error.general);
      }
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // 📂 OUTROS (GDRIVE, MEDIAFIRE, KWAI, ZIPBOT)
    // ═══════════════════════════════════════════════════════════════
    if (['gdrive', 'googledrive', 'drive', 'gd'].includes(cmd)) {
      if (!q) return reply(`📂 Envie o link do Google Drive!`);
      try {
        const res = await gdriveGetInfo(q);
        if (!res.ok) return reply(MESSAGES.error.general);
        await nazu.sendMessage(from, { document: { url: res.downloadUrl }, fileName: res.name, mimetype: res.mimetype }, { quoted: info });
      } catch (e) { reply(MESSAGES.error.general); }
      return;
    }

    if (['mediafire', 'mf'].includes(cmd)) {
      if (!q) return reply(`📂 Envie o link do Mediafire!`);
      try {
        const res = await mediafireGetInfo(q);
        if (!res.ok) return reply(MESSAGES.error.general);
        await nazu.sendMessage(from, { document: { url: res.downloadUrl }, fileName: res.name, mimetype: res.mimetype }, { quoted: info });
      } catch (e) { reply(MESSAGES.error.general); }
      return;
    }

    if (cmd === 'lyrics' || cmd === 'letra') {
      if (!q) return reply(`🎵 Qual letra de música você quer procurar?`);
      try {
        await reply(`🔍 Procurando letra de *${q}*...`);
        const res = await lyrics.search(q);
        if (!res) return reply(`💔 Letra não encontrada.`);
        await reply(`🎵 *${res.title}* - *${res.artist}*\n\n${res.lyrics}`);
      } catch (e) { reply(MESSAGES.error.general); }
      return;
    }

    if (cmd === 'mcplugin' || cmd === 'mcplugins') {
      if (!q) return reply(`🎮 Qual plugin de Minecraft você quer procurar?`);
      try {
        await reply(`🔍 Procurando plugin: *${q}*...`);
        const res = await mcPlugin.search(q);
        if (!res || res.length === 0) return reply(`💔 Plugin não encontrado.`);
        const p = res[0];
        await nazu.sendMessage(from, { 
          image: { url: p.image }, 
          caption: `🎮 *Plugin encontrado:*\n\n📌 *Nome:* ${p.name}\n👤 *Autor:* ${p.creator}\n📝 *Descrição:* ${p.desc}\n🔗 *Link:* ${p.url}`
        }, { quoted: info });
      } catch (e) { reply(MESSAGES.error.general); }
      return;
    }

    if (cmd === 'kwai') {
      if (!q) return reply(`📱 Envie o link do Kwai!`);
      try {
        const res = await kwai.dl(q);
        await nazu.sendMessage(from, { video: { url: res.video }, caption: '✨ Kwai Video' }, { quoted: info });
      } catch (e) { reply(MESSAGES.error.general); }
      return;
    }

    if (['zipbot', 'zip-bot', 'botzip', 'bot-zip', 'downloadbot', 'download-bot', 'github', 'repo', 'repositorio', 'source', 'sourcecode', 'source-code', 'git-bot', 'git-hub'].includes(cmd)) {
      try {
        await reply('📦 Baixando código-fonte...');
        const zipUrl = 'https://github.com/L1ghtzin/nazuna/archive/refs/heads/main.zip';
        await nazu.sendMessage(from, { 
          document: { url: zipUrl }, 
          fileName: 'nazuna-bot.zip', 
          mimetype: 'application/zip',
          caption: `📂 *Código-fonte do ${nomebot}*`
        }, { quoted: info });
      } catch (e) { reply(MESSAGES.error.general); }
      return;
    }
  }
};
