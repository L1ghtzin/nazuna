/**
 * Handler de Auto-Download de mídias para URLs detectadas em mensagens.
 * Suporta: YouTube, TikTok, Instagram, Kwai, Facebook, Pinterest, Spotify, SoundCloud
 */
export async function handleAutoDownload(nazu, from, url, info, modules) {
  try {
    const { youtube, tiktok, igdl, kwai, facebook, pinterest, spotify, soundcloud } = modules;
    
    // Detectar tipo de URL e usar o módulo específico
    const urlLower = url.toLowerCase();
    let downloadModule = null;
    let platformName = '';
    
    // YouTube
    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
      downloadModule = youtube;
      platformName = 'YouTube';
    }
    // TikTok
    else if (urlLower.includes('tiktok.com') || urlLower.includes('vt.tiktok.com')) {
      downloadModule = tiktok;
      platformName = 'TikTok';
    }
    // Instagram
    else if (urlLower.includes('instagram.com') || urlLower.includes('instagr.am')) {
      downloadModule = igdl;
      platformName = 'Instagram';
    }
    // Kwai
    else if (urlLower.includes('kwai.com') || urlLower.includes('kwa.am')) {
      downloadModule = kwai;
      platformName = 'kwai';
    }
    // Facebook
    else if (urlLower.includes('facebook.com') || urlLower.includes('fb.watch')) {
      downloadModule = facebook;
      platformName = 'Facebook';
    }
    // Pinterest
    else if (urlLower.includes('pinterest.com') || urlLower.includes('pin.it')) {
      downloadModule = pinterest;
      platformName = 'Pinterest';
    }
    // Spotify
    else if (urlLower.includes('spotify.com') || urlLower.includes('open.spotify.com')) {
      downloadModule = spotify;
      platformName = 'Spotify';
    }
    // SoundCloud
    else if (urlLower.includes('soundcloud.com')) {
      downloadModule = soundcloud;
      platformName = 'SoundCloud';
    }
    else {
      // URL não suportada
      return false;
    }
    
    // Processar download baseado na plataforma
    let result = null;
    
    // YouTube - baixar apenas áudio (MP3)
    if (platformName === 'YouTube') {
      result = await youtube.mp3(url, 128);
      if (result && result.ok) {
        await nazu.sendMessage(from, {
          audio: result.buffer,
          mimetype: 'audio/mpeg',
          fileName: result.filename || 'audio.mp3'
        }, { quoted: info });
        return true;
      }
    }
    
    // TikTok
    else if (platformName === 'TikTok') {
      result = await tiktok.dl(url);
      if (result && result.ok && result.urls && result.urls.length > 0) {
        const videoUrl = result.urls[0];
        if (videoUrl) {
          await nazu.sendMessage(from, {
            video: { url: videoUrl },
            caption: `📱 *TikTok*`,
            mimetype: 'video/mp4'
          }, { quoted: info });
          return true;
        }
      }
    }
    
    // Instagram
    else if (platformName === 'Instagram') {
      result = await igdl.dl(url);
      if (result && result.ok && result.data && result.data.length > 0) {
        const media = result.data[0];
        if (media.type === 'video') {
          await nazu.sendMessage(from, {
            video: media.buff,
            caption: '📸 *Instagram*',
            mimetype: 'video/mp4'
          }, { quoted: info });
        } else {
          await nazu.sendMessage(from, {
            image: media.buff,
            caption: '📸 *Instagram*'
          }, { quoted: info });
        }
        return true;
      }
    }
    
    // Kwai
    else if (platformName === 'Kwai') {
      result = await kwai.dl(url);
      if (result && result.ok && result.data && result.data.length > 0) {
        const media = result.data[0];
        if (media.type === 'video') {
          await nazu.sendMessage(from, {
            video: media.buff,
            caption: '📸 *Kwai*',
            mimetype: 'video/mp4'
          }, { quoted: info });
        } else {
          await nazu.sendMessage(from, {
            image: media.buff,
            caption: '📸 *Kwai*'
          }, { quoted: info });
        }
        return true;
      }
    }
    
    // Facebook
    else if (platformName === 'Facebook') {
      result = await facebook.downloadHD(url);
      if (result && result.ok && result.buffer) {
        await nazu.sendMessage(from, {
          video: result.buffer,
          caption: `📘 *Facebook* - ${result.resolution || 'HD'}`,
          mimetype: 'video/mp4'
        }, { quoted: info });
        return true;
      }
    }
    
    // Pinterest
    else if (platformName === 'Pinterest') {
      result = await pinterest.dl(url);
      if (result && result.ok && result.urls && result.urls.length > 0) {
        const mediaUrl = result.urls[0];
        if (result.type === 'video') {
          await nazu.sendMessage(from, {
            video: { url: mediaUrl },
            caption: '📌 *Pinterest*',
            mimetype: 'video/mp4'
          }, { quoted: info });
        } else {
          await nazu.sendMessage(from, {
            image: { url: mediaUrl },
            caption: '📌 *Pinterest*'
          }, { quoted: info });
        }
        return true;
      }
    }
    
    // Spotify - baixar áudio
    else if (platformName === 'Spotify') {
      result = await spotify.download(url);
      if (result && result.ok && result.buffer) {
        await nazu.sendMessage(from, {
          audio: result.buffer,
          mimetype: 'audio/mpeg',
          fileName: result.filename || `${result.title || 'audio'}.mp3`
        }, { quoted: info });
        return true;
      }
    }
    
    // SoundCloud - baixar áudio
    else if (platformName === 'SoundCloud') {
      result = await soundcloud.download(url);
      if (result && result.ok && result.buffer) {
        await nazu.sendMessage(from, {
          audio: result.buffer,
          mimetype: 'audio/mpeg',
          fileName: result.filename || `${result.title || 'audio'}.mp3`
        }, { quoted: info });
        return true;
      }
    }
    
    else {
      // Mapeamento de métodos para cada plataforma
      const methodMap = {
        'Instagram': 'dl',
        'Facebook': 'downloadHD',
        'TikTok': 'dl',
        'Pinterest': 'dl'
      };
      
      const methodName = methodMap[platformName] || 'download';
      
      if (downloadModule && typeof downloadModule[methodName] === 'function') {
        result = await downloadModule[methodName](url);
        if (result && result.data) {
          const videoUrl = result.data.video || result.data.videoUrl || result.data.url;
          if (videoUrl) {
            await nazu.sendMessage(from, {
              video: { url: videoUrl },
              caption: `🎬 *${platformName}*`,
              mimetype: 'video/mp4'
            }, { quoted: info });
            return true;
          }
        }
      }
    }
    
    return false;
    
  } catch (e) {
    console.error('Erro no autodl:', e);
    return false;
  }
}
