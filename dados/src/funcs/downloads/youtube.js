/**
 * YouTube Download - Usando API SaveTube
 * Implementação usando a API SaveTube para download de áudio e vídeo
 * 
 * SEM SISTEMA DE CACHE - cada requisição baixa um novo arquivo
 */

import axios from 'axios';
import yts from 'yt-search';
import crypto from 'crypto';

// ============================================
// CONFIGURAÇÕES
// ============================================

const CONFIG = {
  TIMEOUT: 60000,
  DOWNLOAD_TIMEOUT: 180000,
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

// ============================================
// CLASSE SAVETUBE
// ============================================

class SaveTube {
  constructor() {
    this.api = {
      base: "https://media.savetube.vip/api",
      cdn: "/random-cdn",
      info: "/v2/info",
      download: "/download"
    };

    this.headers = {
      accept: "*/*",
      "content-type": "application/json",
      origin: "https://media.savetube.vip",
      referer: "https://media.savetube.vip/",
      "user-agent": CONFIG.USER_AGENT
    };

    this.formats = ["144", "240", "360", "480", "720", "1080", "mp3"];
    this.secretKey = 'C5D58EF67A7584E4A29F6C35BBC4EB12';
  }

  hexToBuffer(hexString) {
    const matches = hexString.match(/.{1,2}/g);
    return new Uint8Array(matches.map(b => parseInt(b, 16)));
  }

  async decrypt(enc) {
    try {
      const data = new Uint8Array(atob(enc).split('').map(c => c.charCodeAt(0)));
      const iv = data.slice(0, 16);
      const content = data.slice(16);
      const key = this.hexToBuffer(this.secretKey);

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'AES-CBC' },
        false,
        ['decrypt']
      );

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-CBC', iv: iv },
        cryptoKey,
        content
      );

      const decryptedText = new TextDecoder().decode(decrypted);
      return JSON.parse(decryptedText);
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  isUrl(str) {
    try {
      new URL(str);
      return true;
    } catch (_) {
      return false;
    }
  }

  youtube(url) {
    if (!url) return null;
    const patterns = [
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/
    ];
    for (let pattern of patterns) {
      if (pattern.test(url)) return url.match(pattern)[1];
    }
    return null;
  }

  async request(endpoint, data = {}, method = 'POST') {
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${this.api.base}${endpoint}`;
      const options = {
        method,
        headers: this.headers
      };

      if (method === 'POST') {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      const responseData = await response.json();

      return {
        status: response.ok,
        code: response.status,
        data: responseData
      };
    } catch (error) {
      return {
        status: false,
        code: 500,
        error: error.message
      };
    }
  }

  async getCDN() {
    const response = await this.request(this.api.cdn, {}, 'GET');
    if (!response.status) return response;
    return {
      status: true,
      code: 200,
      data: response.data.cdn
    };
  }

  async download(link, format) {
    if (!link) {
      return {
        status: false,
        code: 400,
        error: "URL is required"
      };
    }

    if (!this.isUrl(link)) {
      return {
        status: false,
        code: 400,
        error: "Invalid YouTube URL"
      };
    }

    if (!format || !this.formats.includes(format)) {
      return {
        status: false,
        code: 400,
        error: "Format is unavailable",
        available_fmt: this.formats
      };
    }

    const id = this.youtube(link);
    if (!id) {
      return {
        status: false,
        code: 400,
        error: "Cannot extract YouTube video ID"
      };
    }

    try {
      const cdnx = await this.getCDN();
      if (!cdnx.status) return cdnx;
      const cdn = cdnx.data;

      const result = await this.request(`https://${cdn}${this.api.info}`, {
        url: `https://www.youtube.com/watch?v=${id}`
      });
      if (!result.status) return result;

      const decrypted = await this.decrypt(result.data.data);

      const dl = await this.request(`https://${cdn}${this.api.download}`, {
        id: id,
        downloadType: format === 'mp3' ? 'audio' : 'video',
        quality: format === 'mp3' ? '128' : format,
        key: decrypted.key
      });

      return {
        status: true,
        code: 200,
        result: {
          title: decrypted.title || "Unknown",
          type: format === 'mp3' ? 'audio' : 'video',
          format: format,
          thumbnail: decrypted.thumbnail || `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
          download: dl.data.data.downloadUrl,
          id: id,
          key: decrypted.key,
          duration: decrypted.duration, // Isso pode ser string ou número
          quality: format === 'mp3' ? '128' : format,
          downloaded: dl.data.data.downloaded || false
        }
      };

    } catch (error) {
      return {
        status: false,
        code: 500,
        error: error.message
      };
    }
  }
}

// ============================================
// INSTÂNCIA DO SAVETUBE
// ============================================

const savetube = new SaveTube();

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Extrai o ID do vídeo do YouTube de uma URL
 * @param {string} url - URL do vídeo do YouTube
 * @returns {string|null} ID do vídeo ou null se não encontrado
 */
function getYouTubeVideoId(url) {
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|v\/|embed\/|user\/[^\/\n\s]+\/)?(?:watch\?v=|v%3D|embed%2F|video%2F)?|youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/|youtube\.com\/playlist\?list=)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

/**
 * Formata segundos em string de duração (HH:MM:SS ou MM:SS)
 * @param {number} seconds - Segundos totais
 * @returns {string} Duração formatada
 */
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

/**
 * Converte duração para segundos (aceita string ou número)
 * @param {string|number} duration - Duração em segundos (número) ou formato HH:MM:SS (string)
 * @returns {number} Segundos totais
 */
function parseDuration(duration) {
  if (!duration) return 0;
  
  // Se já for número, retorna direto
  if (typeof duration === 'number') {
    return Math.floor(duration);
  }
  
  // Se for string, tenta fazer o parse
  if (typeof duration === 'string') {
    try {
      const parts = duration.split(':').map(Number);
      if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
      }
    } catch (e) {
      console.error('Erro ao fazer parse da duração:', e.message);
    }
  }
  
  return 0;
}

/**
 * Baixa o arquivo da URL e retorna o buffer
 * @param {string} url - URL do arquivo
 * @returns {Promise<Buffer>} Buffer do arquivo
 */
async function downloadFile(url) {
  try {
    console.log(`📥 Baixando arquivo...`);
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: CONFIG.DOWNLOAD_TIMEOUT,
      headers: {
        'User-Agent': CONFIG.USER_AGENT
      }
    });
    return Buffer.from(response.data);
  } catch (error) {
    console.error('Erro ao baixar arquivo:', error.message);
    return null;
  }
}

// ============================================
// FUNÇÕES DE DOWNLOAD (SaveTube)
// ============================================

/**
 * Download de áudio usando a API SaveTube
 * @param {string} url - URL do vídeo do YouTube
 * @returns {Promise<Object>} Resultado do download
 */
async function DownloadSaveTubeAudio(url) {
  try {
    console.log(`🚀 [SaveTube] Baixando mp3...`);
    
    const saveTubeResult = await savetube.download(url, "mp3");

    if (!saveTubeResult.status) {
      throw new Error(saveTubeResult.error || "Falha ao obter áudio");
    }

    const result = saveTubeResult.result;
    
    // Buscar informações adicionais
    let videoInfo = null;
    try {
      const searchResults = await yts(url);
      videoInfo = searchResults?.videos?.[0] || null;
    } catch (e) {
      // Ignora erro na pesquisa adicional
    }

    // Baixar o arquivo
    const buffer = await downloadFile(result.download);

    // CORREÇÃO: Usar a função parseDuration que agora aceita números
    const durationSeconds = result.duration ? parseDuration(result.duration) : (videoInfo?.seconds || 0);

    return {
      success: true,
      buffer,
      title: result.title || 'YouTube Audio',
      thumbnail: result.thumbnail || videoInfo?.thumbnail || '',
      quality: '128 kbps',
      filename: `${result.title?.replace(/[^\w\s]/gi, '') || 'audio'}.mp3`,
      tempo: durationSeconds,
      source: 'savetube'
    };
    
  } catch (error) {
    console.error(`❌ [SaveTube] Erro no áudio:`, error.message);
    return { 
      success: false, 
      error: error.message, 
      source: 'savetube'
    };
  }
}

/**
 * Download de vídeo usando a API SaveTube
 * @param {string} url - URL do vídeo do YouTube
 * @param {string} qualidade - Qualidade desejada (144, 240, 360, 480, 720, 1080)
 * @returns {Promise<Object>} Resultado do download
 */
async function DownloadSaveTubeVideo(url, qualidade = '360') {
  try {
    // Adicionar 'p' se necessário para compatibilidade
    const quality = qualidade.replace('p', '');
    
    console.log(`🚀 [SaveTube] Baixando vídeo em ${quality}p...`);
    
    const validResolutions = savetube.formats.filter(f => f !== "mp3");
    if (!validResolutions.includes(quality)) {
      throw new Error(`Resolução inválida. Disponíveis: ${validResolutions.map(r => r + 'p').join(", ")}`);
    }

    const saveTubeResult = await savetube.download(url, quality);

    if (!saveTubeResult.status) {
      throw new Error(saveTubeResult.error || "Falha ao obter vídeo");
    }

    const result = saveTubeResult.result;
    
    // Buscar informações adicionais
    let videoInfo = null;
    try {
      const searchResults = await yts(url);
      videoInfo = searchResults?.videos?.[0] || null;
    } catch (e) {
      // Ignora erro na pesquisa adicional
    }

    // Baixar o arquivo
    const buffer = await downloadFile(result.download);

    // CORREÇÃO: Usar a função parseDuration que agora aceita números
    const durationSeconds = result.duration ? parseDuration(result.duration) : (videoInfo?.seconds || 0);

    return {
      success: true,
      buffer,
      title: result.title || 'YouTube Video',
      thumbnail: result.thumbnail || videoInfo?.thumbnail || '',
      quality: `${result.quality}p`,
      filename: `${result.title?.replace(/[^\w\s]/gi, '') || 'video'} (${quality}p).mp4`,
      tempo: durationSeconds,
      source: 'savetube'
    };
    
  } catch (error) {
    console.error(`❌ [SaveTube] Erro no vídeo:`, error.message);
    return { 
      success: false, 
      error: error.message, 
      source: 'savetube'
    };
  }
}

// ============================================
// FUNÇÕES PÚBLICAS (API)
// ============================================

/**
 * Pesquisa vídeos no YouTube
 * @param {string} query - Termo de pesquisa
 * @returns {Promise<Object>} Resultado da pesquisa
 */
async function search(query) {
  try {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return { ok: false, msg: 'Termo de pesquisa inválido' };
    }

    const results = await yts(query);
    const video = results?.videos?.[0];

    if (!video) {
      return { ok: false, msg: 'Nenhum vídeo encontrado' };
    }

    const seconds = Number.isFinite(video.seconds) ? video.seconds : 0;
    const timestamp = video.timestamp || formatDuration(seconds);

    const result = {
      criador: 'Hiudy',
      data: {
        videoId: video.videoId || video.id || '',
        url: video.url,
        title: video.title,
        description: video.description || '',
        image: video.image || video.thumbnail || '',
        thumbnail: video.thumbnail || video.image || '',
        seconds,
        timestamp,
        duration: { seconds, timestamp },
        ago: video.ago || video.uploadedAt || '',
        views: video.views || 0,
        author: {
          name: video.author?.name || 'Unknown',
          url: video.author?.url || ''
        }
      }
    };

    return { ok: true, ...result };
  } catch (error) {
    console.error('Erro na busca YouTube:', error.message);
    return { ok: false, msg: 'Erro ao buscar vídeo: ' + error.message };
  }
}

/**
 * Download de áudio (MP3) usando SaveTube
 * @param {string} url - URL do vídeo do YouTube
 * @returns {Promise<Object>} Resultado do download
 */
async function mp3(url) {
  try {
    const id = getYouTubeVideoId(url);
    if (!id) {
      return { ok: false, msg: 'URL inválida do YouTube' };
    }

    const videoUrl = `https://youtube.com/watch?v=${id}`;
    
    const result = await DownloadSaveTubeAudio(videoUrl);
    
    if (!result.success || !result.buffer) {
      return {
        ok: false,
        msg: result.error || 'Erro ao processar áudio'
      };
    }

    const downloadResult = {
      criador: 'Hiudy',
      buffer: result.buffer,
      title: result.title,
      thumbnail: result.thumbnail,
      quality: result.quality || 'mp3',
      filename: result.filename || `${result.title || 'audio'}.mp3`,
      source: result.source,
      tempo: result.tempo || 0
    };

    return { ok: true, ...downloadResult };
  } catch (error) {
    console.error('Erro no download MP3:', error.message);
    return { ok: false, msg: 'Erro ao baixar áudio: ' + error.message };
  }
}

/**
 * Download de vídeo (MP4) usando SaveTube
 * @param {string} url - URL do vídeo do YouTube
 * @param {string} qualidade - Qualidade desejada (360p, 720p, 1080p)
 * @returns {Promise<Object>} Resultado do download
 */
async function mp4(url, qualidade = '360p') {
  try {
    const id = getYouTubeVideoId(url);
    if (!id) {
      return { ok: false, msg: 'URL inválida do YouTube' };
    }

    const videoUrl = `https://youtube.com/watch?v=${id}`;
    
    const result = await DownloadSaveTubeVideo(videoUrl, qualidade);
    
    if (!result.success || !result.buffer) {
      return {
        ok: false,
        msg: result.error || 'Erro ao processar vídeo'
      };
    }

    const downloadResult = {
      criador: 'Hiudy',
      buffer: result.buffer,
      title: result.title,
      thumbnail: result.thumbnail,
      quality: result.quality || qualidade,
      filename: result.filename || `${result.title || 'video'} (${qualidade}).mp4`,
      source: result.source,
      tempo: result.tempo || 0
    };

    return { ok: true, ...downloadResult };
  } catch (error) {
    console.error('Erro no download MP4:', error.message);
    return { ok: false, msg: 'Erro ao baixar vídeo: ' + error.message };
  }
}

// ============================================
// ALIASES PARA COMPATIBILIDADE
// ============================================

export const ytmp3 = mp3;
export const ytmp4 = mp4;

// ============================================
// EXPORTS
// ============================================

export { 
  search, 
  mp3, 
  mp4,
  DownloadSaveTubeAudio,
  DownloadSaveTubeVideo,
  SaveTube,
  savetube
};