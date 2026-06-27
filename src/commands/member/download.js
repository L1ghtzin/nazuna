export default {
  name: "download",
  description: "Comandos de download de mídia (YouTube, Spotify, etc)",
  commands: ["bot-zip", "botzip", "download-bot", "downloadbot", "drive", "facebook", "facebookdl", "fb", "fbdl", "gd", "gdrive", "git-bot", "git-hub", "gitbot", "github", "googledrive", "ig", "igdl", "igstory", "instagram", "instavideo", "kwai", "letra", "lyrics", "mcplugin", "mcplugins", "mediafire", "mf", "play", "play2", "play3", "playsoundcloud", "playspotify", "playvid", "repo", "repositorio", "soundcloud", "soundclouddl", "source", "source-code", "sourcecode", "spotify", "spotifydl", "tiktok", "tiktokaudio", "tiktoks", "tiktoksearch", "tiktokvideo", "tkk", "ttk", "twitter", "twitterdl", "twt", "x", "xdl", "ytmp3", "ytmp4", "zip-bot", "zipbot"],
  handle: async ({
    bot, from, info, command, q, reply, prefix,
    youtube, spotifyModule, soundcloud, tiktok, igdl, facebook, kwai,
    twitterModule, twitterGetInfo, gdriveGetInfo, mediafireGetInfo,
    Lyrics: lyrics, mcPlugin,
    nomebot, botVersion,
    MESSAGES
  }) => {
    const cmd = command.toLowerCase();

    // Helper para envio de áudio (usado em play/ytmp3)
    const sendAudio = async (dlRes) => {
      if (!dlRes.ok) return reply(MESSAGES.error.general);
      try {
        await bot.sendMessage(from, { audio: dlRes.buffer, mimetype: 'audio/mpeg' }, { quoted: info });
      } catch (e) {
        if (String(e).includes("ENOSPC") || String(e).includes("size")) {
          await reply(MESSAGES.member.download.largeFile);
          await bot.sendMessage(from, { document: dlRes.buffer, fileName: dlRes.filename || 'audio.mp3', mimetype: 'audio/mpeg' }, { quoted: info });
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
        return reply(MESSAGES.member.download.youtubeMenu(prefix, command));
      }

      try {
        if (q.includes('youtube.com') || q.includes('youtu.be')) {
          await reply(MESSAGES.member.download.youtubeWaitLink);
          // Execução em background para não travar o bot
          youtube.mp3(q).then(sendAudio).catch(e => {
            console.error('Erro play link:', e);
            reply(MESSAGES.error.general);
          });
        } else {
          await reply(MESSAGES.member.download.youtubeSearch(q));
          const result = await youtube.search(q);
          if (!result.ok) return reply(MESSAGES.error.general);

          const { data: v } = result;
          if (v.seconds > 1800) return reply(MESSAGES.member.download.youtubeVideoTooLong(v.timestamp));

          const views = typeof v.views === 'number' ? v.views.toLocaleString('pt-BR') : v.views;
          const caption = MESSAGES.member.download.youtubeFound(v.title, v.author.name, v.timestamp, v.seconds, views, v.url);

          bot.sendMessage(from, { image: { url: v.thumbnail }, caption, footer: `${nomebot} • Versão ${botVersion}` }, { quoted: info }).catch(() => { });

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
      if (!q) return reply(MESSAGES.member.download.youtubeVideoMenu(prefix, cmd));

      try {
        let videoUrl = q;
        if (!q.includes('youtube.com') && !q.includes('youtu.be')) {
          await reply(MESSAGES.member.download.youtubeVideoSearch(q));
          const result = await youtube.search(q);
          if (!result.ok) return reply(MESSAGES.member.download.youtubeVideoNotFound);
          videoUrl = result.data.url;
        }

        await reply(MESSAGES.member.download.youtubeVideoWait);

        // Download em background para não travar o bot
        youtube.mp4(videoUrl, '360p').then(async (dlRes) => {
          if (!dlRes || !dlRes.ok || !dlRes.buffer) {
            console.error('Download MP4 falhou:', dlRes?.msg);
            return reply(MESSAGES.member.download.youtubeVideoFail);
          }

          await bot.sendMessage(from, {
            video: dlRes.buffer,
            caption: MESSAGES.member.download.youtubeVideoCaption(dlRes.title, dlRes.quality, dlRes.source),
            mimetype: 'video/mp4'
          }, { quoted: info });
        }).catch(e => {
          console.error('Erro fatal no playvid background:', e);
          reply(MESSAGES.member.download.youtubeVideoFatalError);
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
      if (!q) return reply(MESSAGES.member.download.spotifyMenu(prefix, cmd));

      try {
        await reply(MESSAGES.member.download.spotifyProcessing);
        const spotifyFn = q.includes('spotify.com') ? spotifyModule.download : spotifyModule.searchDownload;
        spotifyFn(q).then(async (dlRes) => {
          if (!dlRes.ok) return reply(MESSAGES.error.general);
          await bot.sendMessage(from, { audio: dlRes.buffer, mimetype: 'audio/mpeg' }, { quoted: info });
        }).catch(() => reply(MESSAGES.error.general));
      } catch (e) { reply(MESSAGES.error.general); }
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // 🎵 SOUNDCLOUD
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'soundcloud' || cmd === 'soundclouddl' || cmd === 'play3' || cmd === 'playsoundcloud') {
      if (!q) return reply(MESSAGES.member.download.soundcloudMenu(prefix, cmd));
      try {
        await reply(MESSAGES.member.download.soundcloudDownloading);
        const scFn = q.includes('soundcloud.com') ? soundcloud.download : soundcloud.searchDownload;
        scFn(q).then(async (dlRes) => {
          if (!dlRes.ok) return reply(MESSAGES.error.general);
          await bot.sendMessage(from, { audio: dlRes.buffer, mimetype: 'audio/mpeg' }, { quoted: info });
        }).catch(() => reply(MESSAGES.error.general));
      } catch (e) { reply(MESSAGES.error.general); }
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // 📱 TIKTOK
    // ═══════════════════════════════════════════════════════════════
    if (['tiktok', 'ttk', 'tkk', 'tiktokaudio', 'tiktokvideo', 'tiktoks', 'tiktoksearch'].includes(cmd)) {
      if (!q) return reply(MESSAGES.member.download.tiktokMenu);
      try {
        if (q.includes('tiktok.com')) {
          await reply(MESSAGES.member.download.tiktokDownloading);
          tiktok.dl(q).then(async (dlRes) => {
            if (!dlRes.ok) return reply(MESSAGES.error.general);
            if (cmd === 'tiktokaudio') {
              if (dlRes.audio) {
                await bot.sendMessage(from, { audio: { url: dlRes.audio }, mimetype: 'audio/mpeg' }, { quoted: info });
              } else {
                return reply(MESSAGES.member.download.tiktokAudioNotFound);
              }
            } else {
              if (dlRes.type === 'image' && dlRes.urls) {
                for (let url of dlRes.urls) {
                  await bot.sendMessage(from, { image: { url }, caption: MESSAGES.member.download.tiktokCaption(dlRes.title) }, { quoted: info });
                }
              } else if (dlRes.urls && dlRes.urls.length > 0) {
                await bot.sendMessage(from, { video: { url: dlRes.urls[0] }, caption: MESSAGES.member.download.tiktokCaption(dlRes.title) }, { quoted: info });
              } else {
                return reply(MESSAGES.member.download.tiktokMediaNotFound);
              }
            }
          }).catch(() => reply(MESSAGES.error.general));
        } else {
          await reply(MESSAGES.member.download.tiktokSearching(q));
          const results = await tiktok.search(q);
          if (!results || !results.ok) return reply(MESSAGES.member.download.tiktokSearchNoResults);
          if (results.type === 'image' && results.urls) {
            await bot.sendMessage(from, { image: { url: results.urls[0] }, caption: MESSAGES.member.download.tiktokSearchCaption(results.title) }, { quoted: info });
          } else if (results.urls && results.urls.length > 0) {
            await bot.sendMessage(from, { video: { url: results.urls[0] }, caption: MESSAGES.member.download.tiktokSearchCaption(results.title) }, { quoted: info });
          }
        }
      } catch (e) { reply(MESSAGES.error.general); }
      return;
    }


    // ═══════════════════════════════════════════════════════════════
    // 📸 INSTAGRAM
    // ═══════════════════════════════════════════════════════════════
    if (['instagram', 'igdl', 'ig', 'instavideo', 'igstory'].includes(cmd)) {
      if (!q || !q.includes('instagram.com')) return reply(MESSAGES.member.download.instagramMenu);
      try {
        await reply(MESSAGES.member.download.instagramDownloading);
        igdl.dl(q).then(async (dlRes) => {
          if (!dlRes || !dlRes.ok || !dlRes.data || dlRes.data.length === 0) {
            return reply(MESSAGES.member.download.instagramFail);
          }
          for (const item of dlRes.data) {
            if (item.type === 'image') {
              await bot.sendMessage(from, { image: item.buff || { url: item.url } }, { quoted: info });
            } else {
              await bot.sendMessage(from, { video: item.buff || { url: item.url } }, { quoted: info });
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
      if (!q || !q.includes('facebook.com')) return reply(MESSAGES.member.download.facebookMenu);
      try {
        await reply(MESSAGES.member.download.facebookDownloading);
        facebook.downloadHD(q).then(async (dlRes) => {
          if (!dlRes.ok) return reply(MESSAGES.error.general);
          await bot.sendMessage(from, { video: dlRes.buffer, caption: MESSAGES.member.download.facebookCaption(dlRes.resolution) }, { quoted: info });
        }).catch(() => reply(MESSAGES.error.general));
      } catch (e) { reply(MESSAGES.error.general); }
      return;
    }

    if (['twitter', 'twitterdl', 'twt', 'x', 'xdl'].includes(cmd)) {
      if (!q) return reply(MESSAGES.member.download.twitterMenu);
      try {
        await reply(MESSAGES.member.download.twitterFetching);
        twitterGetInfo(q).then(async (twitterResult) => {
          if (!twitterResult.ok) return reply(MESSAGES.member.download.twitterError(twitterResult.msg));
          const { text, author, stats, media, hasMedia } = twitterResult;
          const caption = MESSAGES.member.download.twitterCaption(author?.name, text);
          if (!hasMedia) return reply(MESSAGES.member.download.twitterNoMedia(caption));
          for (const item of media) {
            if (item.type === 'video') await bot.sendMessage(from, { video: { url: item.bestQuality?.url || item.url }, caption }, { quoted: info });
            else await bot.sendMessage(from, { image: { url: item.url }, caption }, { quoted: info });
          }
        }).catch(() => reply(MESSAGES.error.general));
      } catch (e) { reply(MESSAGES.error.general); }
      return;
    }

    if (['gdrive', 'googledrive', 'drive', 'gd'].includes(cmd)) {
      if (!q) return reply(MESSAGES.member.download.gdriveMenu);
      try {
        gdriveGetInfo(q).then(async (res) => {
          if (!res.ok) return reply(MESSAGES.error.general);
          await bot.sendMessage(from, { document: { url: res.downloadUrl }, fileName: res.name, mimetype: res.mimetype }, { quoted: info });
        }).catch(() => reply(MESSAGES.error.general));
      } catch (e) { reply(MESSAGES.error.general); }
      return;
    }

    if (['mediafire', 'mf'].includes(cmd)) {
      if (!q) return reply(MESSAGES.member.download.mediafireMenu);
      try {
        mediafireGetInfo(q).then(async (res) => {
          if (!res.ok) return reply(MESSAGES.error.general);
          await bot.sendMessage(from, { document: { url: res.downloadUrl }, fileName: res.name, mimetype: res.mimetype }, { quoted: info });
        }).catch(() => reply(MESSAGES.error.general));
      } catch (e) { reply(MESSAGES.error.general); }
      return;
    }

    if (cmd === 'lyrics' || cmd === 'letra') {
      if (!q) return reply(MESSAGES.member.download.lyricsMenu);
      if (!lyrics) return reply(MESSAGES.member.download.lyricsUnavailable);
      try {
        await reply(MESSAGES.member.download.lyricsSearching(q));
        const res = await lyrics(q);
        if (!res) return reply(MESSAGES.member.download.lyricsNotFound);
        await reply(res);
      } catch (e) { reply(MESSAGES.error.general); }
      return;
    }

    if (cmd === 'mcplugin' || cmd === 'mcplugins') {
      if (!q) return reply(MESSAGES.member.download.mcpluginMenu(prefix, cmd));
      if (!mcPlugin) return reply(MESSAGES.member.download.mcpluginUnavailable);
      try {
        await reply(MESSAGES.member.download.mcpluginSearching);
        mcPlugin(q).then(async (datz) => {
          if (!datz.ok) return reply(datz.msg);
          await bot.sendMessage(from, {
            image: { url: datz.image },
            caption: MESSAGES.member.download.mcpluginCaption(datz.name, datz.creator, datz.desc, datz.url)
          }, { quoted: info });
        }).catch((e) => {
          console.error('Erro mcplugin:', e);
          reply(MESSAGES.error.general);
        });
      } catch (e) { reply(MESSAGES.error.general); }
      return;
    }

    if (cmd === 'kwai') {
      if (!q) return reply(MESSAGES.member.download.kwaiMenu);
      try {
        kwai.dl(q).then(async (res) => {
          if (!res.ok || !res.data || !res.data.length) return reply(MESSAGES.error.general);
          const item = res.data[0];
          await bot.sendMessage(from, { video: item.buff || { url: item.url }, caption: MESSAGES.member.download.kwaiCaption(item.metadata?.titulo) }, { quoted: info });
        }).catch(() => reply(MESSAGES.error.general));
      } catch (e) { reply(MESSAGES.error.general); }
      return;
    }

    if (['zipbot', 'zip-bot', 'botzip', 'bot-zip', 'downloadbot', 'download-bot', 'github', 'repo', 'repositorio', 'source', 'sourcecode', 'source-code', 'git-bot', 'git-hub'].includes(cmd)) {
      try {
        await reply(MESSAGES.member.download.sourceCodeDownloading);
        const zipUrl = 'https://github.com/L1ghtzin/chainy/archive/refs/heads/main.zip';
        await bot.sendMessage(from, { document: { url: zipUrl }, fileName: 'chainy-bot.zip', mimetype: 'application/zip', caption: MESSAGES.member.download.sourceCodeCaption }, { quoted: info });
      } catch (e) { reply(MESSAGES.error.general); }
      return;
    }
  }
};
