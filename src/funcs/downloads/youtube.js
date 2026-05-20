import axios from 'axios';
import yts from 'yt-search';
import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import os from 'os';
import { join } from 'path';

const TIMEOUT = 60000;
const DL_TIMEOUT = 300000; // 5 minutos para downloads grandes

const api = axios.create({
  timeout: TIMEOUT,
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
});

function isRealMp3(buf) {
  if (!buf || buf.length < 3) return false;
  if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) return true;
  if (buf[0] === 0xFF && (buf[1] & 0xE0) === 0xE0) return true;
  return false;
}

async function convertToMp3(inputBuffer) {
  if (isRealMp3(inputBuffer)) return inputBuffer;

  const id = `yt_${Date.now()}`;
  const inp = join(os.tmpdir(), `${id}_in`);
  const out = join(os.tmpdir(), `${id}.mp3`);

  try {
    await fs.writeFile(inp, inputBuffer);
    await new Promise((resolve, reject) => {
      ffmpeg(inp).toFormat('mp3').audioBitrate(128).audioChannels(2).audioFrequency(44100)
        .outputOptions('-threads', '0')
        .on('error', reject).on('end', resolve).save(out);
    });
    return await fs.readFile(out);
  } finally {
    try { await fs.unlink(inp); } catch { }
    try { await fs.unlink(out); } catch { }
  }
}

function getVideoId(url) {
  return url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1] || null;
}

function fmtDur(s) {
  if (!s || isNaN(s)) return "00:00";
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`;
}

/**
 * Fallback: Nayan Video Downloader
 */
async function fetchNayan(url, format, retries = 2) {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      const { data: raw } = await api.get('https://nayan-video-downloader.vercel.app/ytdown', { params: { url } });
      const body = (raw?.status !== undefined && raw.data) ? raw.data : raw;
      if (!body || body.status === false) throw new Error('Nayan: Resposta inválida');

      const media = (body.data?.title || body.data?.video || body.data?.audio) ? body.data : body;
      const dlUrl = format === 'mp3' ? media.audio : (media.video_hd || media.video);
      if (!dlUrl) throw new Error(`Nayan: URL de ${format} não disponível`);

      const { data } = await api.get(dlUrl, {
        responseType: 'arraybuffer',
        timeout: DL_TIMEOUT,
        headers: { Referer: 'https://nayan-video-downloader.vercel.app/' }
      });

      const buffer = Buffer.from(data);
      if (buffer.length < 1000) throw new Error('Nayan: Arquivo muito pequeno');

      return { buffer, title: media.title || 'YouTube Media', thumb: media.thumb, source: 'nayan' };
    } catch (e) {
      lastError = e;
      if (i < retries - 1) await new Promise(res => setTimeout(res, 1500));
    }
  }
  throw lastError;
}

/**
 * Principal: System Zero API
 * Resposta real: { status, title, download_url, youtube_url, thumbnail, duration, creator, source_used }
 */
async function fetchSystemZero(query, mode = 'mp3') {
  try {
    const endpoint = mode === 'mp3' ? 'https://systemzone.store/api/play' : 'https://systemzone.store/api/ytmp4';
    const { data } = await api.get(endpoint, { params: { text: query } });

    if (!data || data.status === false || !data.download_url) {
      throw new Error(data?.message || 'Resultado não encontrado');
    }

    return {
      downloadUrl: data.download_url,
      title: data.title || 'YouTube Media',
      thumb: data.thumbnail,
      source: 'systemzero',
      url: data.youtube_url || query
    };
  } catch (e) {
    const status = e.response?.status;
    const errorMsg = e.response?.data?.message || e.message;
    throw new Error(`[${status || 'ERR'}] ${errorMsg}`);
  }
}

async function fetchBuffer(url) {
  const { data } = await api.get(url, {
    responseType: 'arraybuffer',
    timeout: DL_TIMEOUT
  });
  return Buffer.from(data);
}

async function search(query) {
  try {
    if (!query?.trim()) return { ok: false, msg: 'Termo de pesquisa inválido' };
    const video = (await yts(query))?.videos?.[0];
    if (!video) return { ok: false, msg: 'Nenhum vídeo encontrado' };

    return {
      ok: true,
      data: {
        videoId: video.videoId || video.id || '',
        url: video.url,
        title: video.title,
        description: video.description || '',
        thumbnail: video.thumbnail || video.image || '',
        seconds: video.seconds || 0,
        timestamp: video.timestamp || fmtDur(video.seconds || 0),
        ago: video.ago || '',
        views: video.views || 0,
        author: { name: video.author?.name || 'Unknown', url: video.author?.url || '' }
      }
    };
  } catch (e) {
    return { ok: false, msg: 'Erro ao buscar vídeo: ' + e.message };
  }
}

async function mp3(query, preInfo = null) {
  try {
    let dlData;
    let source = 'systemzero';
    let buffer;

    try {
      // Tenta System Zero
      dlData = await fetchSystemZero(query, 'mp3');
      buffer = await fetchBuffer(dlData.downloadUrl);
    } catch (e) {
      console.warn('System Zero falhou, usando Nayan como fallback...', e.message);
      source = 'nayan';
      const s = await search(query);
      if (!s.ok) throw new Error('Vídeo não encontrado para fallback');
      const dl = await fetchNayan(s.data.url, 'mp3');
      dlData = { title: dl.title, thumb: dl.thumb, url: s.data.url };
      buffer = dl.buffer;
    }

    const { title, thumb } = dlData;
    try { buffer = await convertToMp3(buffer); } catch { }

    return {
      ok: true,
      buffer,
      title: title || 'Audio',
      thumbnail: thumb || `https://i.ytimg.com/vi/${getVideoId(dlData.url || query) || 'default'}/maxresdefault.jpg`,
      quality: '128 kbps',
      filename: `${(title || 'audio').replace(/[^\w\s]/gi, '')}.mp3`,
      source: source,
      tempo: preInfo?.seconds || 0
    };
  } catch (e) {
    return { ok: false, msg: 'Erro ao baixar áudio: ' + e.message };
  }
}

function isRealMp4(buf) {
  if (!buf || buf.length < 8) return false;
  const signature = buf.slice(4, 8).toString('hex');
  return signature === '66747970'; 
}

async function convertToMp4(inputBuffer) {
  if (isRealMp4(inputBuffer)) return inputBuffer;

  const id = `ytv_${Date.now()}`;
  const inp = join(os.tmpdir(), `${id}_in`);
  const out = join(os.tmpdir(), `${id}.mp4`);

  try {
    await fs.writeFile(inp, inputBuffer);
    await new Promise((resolve, reject) => {
      ffmpeg(inp)
        .toFormat('mp4')
        .outputOptions([
          '-c:v libx264',
          '-preset superfast',
          '-crf 28',
          '-c:a aac',
          '-b:a 128k',
          '-movflags +faststart',
          '-threads 0'
        ])
        .on('error', reject)
        .on('end', resolve)
        .save(out);
    });
    return await fs.readFile(out);
  } finally {
    try { await fs.unlink(inp); } catch { }
    try { await fs.unlink(out); } catch { }
  }
}

async function mp4(query, qualidade = '360p', preInfo = null) {
  try {
    let dlData;
    let source = 'nayan';
    let buffer;

    try {
      const s = await search(query);
      if (!s.ok) throw new Error('Vídeo não encontrado');
      
      const dl = await fetchNayan(s.data.url, 'mp4');
      dlData = { title: dl.title, thumb: dl.thumb, url: s.data.url };
      buffer = dl.buffer;
      
      // Se Nayan não mandar MP4, converte para garantir compatibilidade
      if (!isRealMp4(buffer)) {
        try { buffer = await convertToMp4(buffer); } catch { /* mantém buffer original se falhar */ }
      }
    } catch (e) {
      throw e;
    }

    return {
      ok: true,
      buffer,
      title: dlData.title || 'Video',
      thumbnail: dlData.thumb || `https://i.ytimg.com/vi/${getVideoId(dlData.url || query) || 'default'}/maxresdefault.jpg`,
      quality: qualidade,
      filename: `${(dlData.title || 'video').replace(/[^\w\s]/gi, '')}.mp4`,
      source: source,
      tempo: preInfo?.seconds || 0
    };
  } catch (e) {
    return { ok: false, msg: 'Erro ao baixar vídeo: ' + e.message };
  }
}

export const ytmp3 = mp3;
export const ytmp4 = mp4;
export { search, mp3, mp4 };