/**
 * YouTube Download - Usando API Vex
 */

import https from 'https';
import yts from 'yt-search';

// ============================================
// CONFIGURAÇÕES
// ============================================

const CONFIG = {
  TIMEOUT: 60000,
  VEX_API_KEY: 'SUA_API_KEY_AQUI', // 🔑 Coloque sua API Key aqui
  VEX_API_BASE: 'https://vexapi.com.br/api/downloads',
  DOWNLOAD_TIMEOUT: 180000
};

// ============================================
// FUNÇÃO VEX API (conforme documentação)
// ============================================

function buscarVexAPI(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';

            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    if (res.headers['content-type']?.includes('application/json')) {
                        return resolve(JSON.parse(data));
                    }

                    if (res.headers['content-type']?.includes('text/html')) {
                        const match = data.match(/<pre[^>]*id=["']json["'][^>]*>([\s\S]*?)<\/pre>/i);
                        if (match) return resolve(JSON.parse(match[1].trim()));

                        try {
                            return resolve(JSON.parse(data));
                        } catch {
                            return reject(new Error('HTML sem JSON detectado'));
                        }
                    }

                    reject(new Error('Tipo de resposta desconhecido: ' + res.headers['content-type']));
                } catch (err) {
                    reject(err);
                }
            });
        }).on('error', err => reject(err));
    });
}

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    console.log(`Baixando arquivo...`);
    
    const urlObj = new URL(url);
    
    const req = https.get({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      timeout: CONFIG.DOWNLOAD_TIMEOUT
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, url);
        return downloadFile(redirectUrl.href).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout do download'));
    });
    req.end();
  });
}

// ============================================
// CLASSE VEXAPI
// ============================================

class VexAPI {
  constructor() {
    this.apiKey = CONFIG.VEX_API_KEY;
    this.baseUrl = CONFIG.VEX_API_BASE;
    
    // Verifica se a API key foi configurada
    if (!this.apiKey || this.apiKey === 'SUA_API_KEY_AQUI') {
      console.warn('⚠️  AVISO: API Key não configurada! Coloque sua chave no arquivo.');
    }
  }

  youtube(url) {
    if (!url) return null;
    const patterns = [
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/
    ];
    for (let pattern of patterns) {
      if (pattern.test(url)) return url.match(pattern)[1];
    }
    return null;
  }

  async downloadAudio(url) {
    try {
      const videoId = this.youtube(url);
      if (!videoId) throw new Error('URL do YouTube inválida');

      console.log(`Baixando áudio: ${videoId}`);
      
      const apiUrl = `${this.baseUrl}/youtubemp3?apikey=${this.apiKey}&query=${encodeURIComponent(`https://youtube.com/watch?v=${videoId}`)}`;
      const data = await buscarVexAPI(apiUrl);

      if (!data?.resposta) throw new Error('Resposta inválida da API');

      return {
        status: true,
        result: {
          title: data.resposta.title || 'YouTube Audio',
          download: data.resposta.dlurl,
          thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          id: videoId
        }
      };
    } catch (error) {
      return { status: false, error: error.message };
    }
  }

  async downloadVideo(url) {
    try {
      const videoId = this.youtube(url);
      if (!videoId) throw new Error('URL do YouTube inválida');

      console.log(`Baixando vídeo: ${videoId}`);
      
      const apiUrl = `${this.baseUrl}/youtubemp4?apikey=${this.apiKey}&query=${encodeURIComponent(`https://youtube.com/watch?v=${videoId}`)}`;
      const data = await buscarVexAPI(apiUrl);

      if (!data?.resposta) throw new Error('Resposta inválida da API');

      return {
        status: true,
        result: {
          title: data.resposta.title || 'YouTube Video',
          download: data.resposta.dlurl,
          thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          id: videoId
        }
      };
    } catch (error) {
      return { status: false, error: error.message };
    }
  }
}

// ============================================
// INSTÂNCIA
// ============================================

const vexApi = new VexAPI();

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

// ============================================
// DOWNLOADS
// ============================================

async function DownloadVexAudio(url) {
  try {
    console.log(`Iniciando download de áudio...`);
    
    const vexResult = await vexApi.downloadAudio(url);
    if (!vexResult.status) throw new Error(vexResult.error);

    const result = vexResult.result;
    if (!result.download) throw new Error('URL de download não encontrada');

    let videoInfo = null;
    try {
      const searchResults = await yts(url);
      videoInfo = searchResults?.videos?.[0] || null;
    } catch (e) {}

    const buffer = await downloadFile(result.download);
    if (!buffer) throw new Error('Falha ao baixar o arquivo');

    return {
      success: true,
      buffer,
      title: result.title || videoInfo?.title || 'YouTube Audio',
      thumbnail: result.thumbnail || videoInfo?.thumbnail || '',
      quality: '128 kbps',
      filename: `${(result.title || 'audio').replace(/[^\w\s]/gi, '')}.mp3`,
      tempo: videoInfo?.seconds || 0,
      source: 'vex'
    };
  } catch (error) {
    return { success: false, error: error.message, source: 'vex' };
  }
}

async function DownloadVexVideo(url, qualidade = '720p') {
  try {
    console.log(`Iniciando download de vídeo...`);
    
    const vexResult = await vexApi.downloadVideo(url);
    if (!vexResult.status) throw new Error(vexResult.error);

    const result = vexResult.result;
    if (!result.download) throw new Error('URL de download não encontrada');

    let videoInfo = null;
    try {
      const searchResults = await yts(url);
      videoInfo = searchResults?.videos?.[0] || null;
    } catch (e) {}

    const buffer = await downloadFile(result.download);
    if (!buffer) throw new Error('Falha ao baixar o arquivo');

    return {
      success: true,
      buffer,
      title: result.title || videoInfo?.title || 'YouTube Video',
      thumbnail: result.thumbnail || videoInfo?.thumbnail || '',
      quality: qualidade,
      filename: `${(result.title || 'video').replace(/[^\w\s]/gi, '')}.mp4`,
      tempo: videoInfo?.seconds || 0,
      source: 'vex'
    };
  } catch (error) {
    return { success: false, error: error.message, source: 'vex' };
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

    const result = await DownloadVexAudio(`https://youtube.com/watch?v=${id}`);
    
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

async function mp4(url, qualidade = '720p') {
  try {
    const id = getYouTubeVideoId(url);
    if (!id) return { ok: false, msg: 'URL inválida do YouTube' };

    const result = await DownloadVexVideo(`https://youtube.com/watch?v=${id}`, qualidade);
    
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