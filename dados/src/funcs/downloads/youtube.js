/**
 * YouTube Download - Usando API ApisNodz
 */

import yts from 'yt-search';
import axios from 'axios';

// ============================================
// CONFIGURAÇÕES
// ============================================

const CONFIG = {
  API_BASE: 'https://apisnodz.com.br/api/downloads/youtube',
  DOWNLOAD_TIMEOUT: 180000,
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function getYouTubeVideoId(url) {
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return "00:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

async function downloadFile(url) {
  try {
    console.log(`Baixando arquivo...`);
    
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer',
      timeout: CONFIG.DOWNLOAD_TIMEOUT,
      maxRedirects: 5,
      headers: {
        'User-Agent': CONFIG.USER_AGENT
      }
    });

    return Buffer.from(response.data);
  } catch (error) {
    throw new Error(`Falha no download: ${error.message}`);
  }
}

// ============================================
// DOWNLOADS
// ============================================

async function DownloadAudio(url) {
  try {
    console.log(`Iniciando download de áudio...`);
    
    const videoId = getYouTubeVideoId(url);
    if (!videoId) throw new Error('URL do YouTube inválida');

    const apiUrl = `${CONFIG.API_BASE}/audio?url=${encodeURIComponent(`https://youtube.com/watch?v=${videoId}`)}`;
    
    const response = await axios.get(apiUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': CONFIG.USER_AGENT
      }
    });

    const data = response.data;
    
    if (!data.success || !data.resultado) {
      throw new Error(data.message || 'Resposta inválida da API');
    }

    const resultado = data.resultado;

    // Busca informações adicionais do vídeo
    let videoInfo = null;
    try {
      const searchResults = await yts(url);
      videoInfo = searchResults?.videos?.[0] || null;
    } catch (e) {}

    // Faz o download do arquivo
    const buffer = await downloadFile(resultado.url);
    if (!buffer) throw new Error('Falha ao baixar o arquivo');

    return {
      success: true,
      buffer,
      title: resultado.titulo || videoInfo?.title || 'YouTube Audio',
      thumbnail: videoInfo?.thumbnail || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      quality: resultado.qualidade || '128 kbps',
      filename: resultado.filename || `${(resultado.titulo || 'audio').replace(/[^\w\s]/gi, '')}.mp3`,
      tempo: videoInfo?.seconds || 0,
      duration: resultado.tempo || '0:00',
      source: 'apisnodz'
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message, 
      source: 'apisnodz' 
    };
  }
}

async function DownloadVideo(url, qualidade = '360p') {
  try {
    console.log(`Iniciando download de vídeo...`);
    
    const videoId = getYouTubeVideoId(url);
    if (!videoId) throw new Error('URL do YouTube inválida');

    const apiUrl = `${CONFIG.API_BASE}/video?url=${encodeURIComponent(`https://youtube.com/watch?v=${videoId}`)}`;
    
    const response = await axios.get(apiUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': CONFIG.USER_AGENT
      }
    });

    const data = response.data;
    
    if (!data.success || !data.resultado) {
      throw new Error(data.message || 'Resposta inválida da API');
    }

    const resultado = data.resultado;

    // Busca informações adicionais do vídeo
    let videoInfo = null;
    try {
      const searchResults = await yts(url);
      videoInfo = searchResults?.videos?.[0] || null;
    } catch (e) {}

    // Faz o download do arquivo
    const buffer = await downloadFile(resultado.url);
    if (!buffer) throw new Error('Falha ao baixar o arquivo');

    return {
      success: true,
      buffer,
      title: resultado.titulo || videoInfo?.title || 'YouTube Video',
      thumbnail: videoInfo?.thumbnail || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      quality: resultado.qualidade || qualidade,
      filename: resultado.filename || `${(resultado.titulo || 'video').replace(/[^\w\s]/gi, '')}.mp4`,
      tempo: videoInfo?.seconds || 0,
      duration: resultado.tempo || '0:00',
      source: 'apisnodz'
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message, 
      source: 'apisnodz' 
    };
  }
}

// ============================================
// FUNÇÕES PÚBLICAS
// ============================================

async function search(query) {
  try {
    if (!query?.trim()) return { ok: false, msg: 'Termo de pesquisa inválido' };

    const results = await yts(query);
    const video = results?.videos?.[0];
    if (!video) return { ok: false, msg: 'Nenhum vídeo encontrado' };

    return {
      ok: true,
      criador: 'Hiudy',
      data: {
        videoId: video.videoId || video.id || '',
        url: video.url,
        title: video.title,
        description: video.description || '',
        thumbnail: video.thumbnail || video.image || '',
        seconds: video.seconds || 0,
        timestamp: video.timestamp || formatDuration(video.seconds || 0),
        ago: video.ago || '',
        views: video.views || 0,
        author: {
          name: video.author?.name || 'Unknown',
          url: video.author?.url || ''
        }
      }
    };
  } catch (error) {
    return { ok: false, msg: 'Erro ao buscar vídeo: ' + error.message };
  }
}

async function mp3(url) {
  try {
    const id = getYouTubeVideoId(url);
    if (!id) return { ok: false, msg: 'URL inválida do YouTube' };

    const result = await DownloadAudio(`https://youtube.com/watch?v=${id}`);
    
    if (!result.success || !result.buffer) {
      return { ok: false, msg: result.error || 'Erro ao processar áudio' };
    }

    return {
      ok: true,
      criador: 'Hiudy',
      buffer: result.buffer,
      title: result.title,
      thumbnail: result.thumbnail,
      quality: result.quality,
      filename: result.filename,
      source: result.source,
      tempo: result.tempo
    };
  } catch (error) {
    return { ok: false, msg: 'Erro ao baixar áudio: ' + error.message };
  }
}

async function mp4(url, qualidade = '360p') {
  try {
    const id = getYouTubeVideoId(url);
    if (!id) return { ok: false, msg: 'URL inválida do YouTube' };

    const result = await DownloadVideo(`https://youtube.com/watch?v=${id}`, qualidade);
    
    if (!result.success || !result.buffer) {
      return { ok: false, msg: result.error || 'Erro ao processar vídeo' };
    }

    return {
      ok: true,
      criador: 'Hiudy',
      buffer: result.buffer,
      title: result.title,
      thumbnail: result.thumbnail,
      quality: result.quality,
      filename: result.filename,
      source: result.source,
      tempo: result.tempo
    };
  } catch (error) {
    return { ok: false, msg: 'Erro ao baixar vídeo: ' + error.message };
  }
}

// ============================================
// EXPORTS
// ============================================

export const ytmp3 = mp3;
export const ytmp4 = mp4;
export { search, mp3, mp4 };