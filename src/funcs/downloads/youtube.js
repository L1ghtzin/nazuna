import axios from 'axios';
import yts from 'yt-search';
import ffmpeg from 'fluent-ffmpeg';
import { promises as fs, existsSync, mkdirSync } from 'fs';
import os from 'os';
import { join } from 'path';

const localTmp = join(process.cwd(), 'temp');
if (!existsSync(localTmp)) {
  mkdirSync(localTmp, { recursive: true });
}

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
  const inp = join(localTmp, `${id}_in`);
  const out = join(localTmp, `${id}.mp3`);

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
 * API 1: System Zero
 */
async function fetchSystemZero(query, mode = 'mp3') {
  try {
    const endpoint = mode === 'mp3' ? 'https://systemzone.store/v2/player' : 'https://systemzone.store/api/ytmp4';
    const params = mode === 'mp3' ? { text: query, apikey: 'freekey' } : { text: query };
    const { data } = await api.get(endpoint, { params });

    if (mode === 'mp4') {
      if (!data || data.status === false || !data.result || !data.result.download) throw new Error(data?.message || 'Resultado não encontrado');
      return { url: data.result.download, title: data.result.title, thumb: data.result.thumbnail };
    } else {
      if (!data || data.status === false || !data.download_url) throw new Error(data?.message || 'Resultado não encontrado');
      return { url: data.download_url, title: data.title, thumb: data.thumbnail };
    }
  } catch (e) {
    throw new Error(`SystemZero: ${e.message}`);
  }
}

/**
 * API 3: Nayan
 */
async function fetchNayan(url, format, retries = 1) {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      const { data: raw } = await api.get('https://nayan-video-downloader.vercel.app/ytdown', { params: { url } });
      const body = (raw?.status !== undefined && raw.data) ? raw.data : raw;
      if (!body || body.status === false) throw new Error('Nayan: Resposta inválida');
      const media = (body.data?.title || body.data?.video || body.data?.audio) ? body.data : body;
      const dlUrl = format === 'mp3' ? media.audio : (media.video_hd || media.video);
      if (!dlUrl) throw new Error(`Nayan: URL de ${format} não disponível`);
      return { url: dlUrl, title: media.title, thumb: media.thumb };
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

async function fetchBuffer(url, referer = null) {
  const headers = referer ? { Referer: referer } : {};
  const { data } = await api.get(url, {
    responseType: 'arraybuffer',
    timeout: DL_TIMEOUT,
    headers
  });
  return Buffer.from(data);
}

async function search(query) {
  try {
    if (!query?.trim()) return { ok: false, msg: 'Termo de pesquisa inválido' };
    
    let video = null;
    const videoId = getVideoId(query);
    if (videoId) {
      try {
        video = await yts({ videoId });
      } catch (e) {}
    }
    
    if (!video) {
      try {
        video = (await yts(query))?.videos?.[0];
      } catch (e) {}
    }
    
    // Se tudo falhar mas tivermos um ID válido (ex: shorts que o yts falha)
    if (!video && videoId) {
      return {
        ok: true,
        data: {
          videoId,
          url: `https://youtube.com/watch?v=${videoId}`,
          title: 'YouTube Video',
          description: '',
          thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          seconds: 0,
          timestamp: '00:00',
          ago: '',
          views: 0,
          author: { name: 'YouTube', url: '' }
        }
      };
    }

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
    const s = await search(query);
    if (!s.ok) throw new Error(s.msg);
    const urlToUse = s.data.url;
    const fallbackTitle = s.data.title || 'Audio';
    const fallbackThumb = s.data.thumbnail || `https://i.ytimg.com/vi/${getVideoId(urlToUse) || 'default'}/maxresdefault.jpg`;

    let buffer, title, thumbnail, quality, filename, source;

    // 1: System Zero
    try {
      const dl = await fetchSystemZero(urlToUse, 'mp3');
      buffer = await fetchBuffer(dl.url);
      title = dl.title || fallbackTitle;
      thumbnail = dl.thumb || fallbackThumb;
      quality = '128 kbps';
      filename = `${title.replace(/[^\w\s]/gi, '')}.mp3`;
      source = 'systemzero';
    } catch (e1) {
      console.warn('System Zero falhou para mp3, tentando Nayan...', e1.message);
      // 2: Nayan
      try {
        const dl = await fetchNayan(urlToUse, 'mp3');
        buffer = await fetchBuffer(dl.url, 'https://nayan-video-downloader.vercel.app/');
        title = dl.title || fallbackTitle;
        thumbnail = dl.thumb || fallbackThumb;
        quality = '128 kbps';
        filename = `${title.replace(/[^\w\s]/gi, '')}.mp3`;
        source = 'nayan';
      } catch (e2) {
        throw new Error('Todas as APIs de download falharam para o áudio.');
      }
    }

    try { buffer = await convertToMp3(buffer); } catch { }

    return {
      ok: true,
      buffer,
      title,
      thumbnail,
      quality,
      filename,
      source,
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
  const inp = join(localTmp, `${id}_in`);
  const out = join(localTmp, `${id}.mp4`);

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
    const s = await search(query);
    if (!s.ok) throw new Error(s.msg);
    const urlToUse = s.data.url;
    const fallbackTitle = s.data.title || 'Video';
    const fallbackThumb = s.data.thumbnail || `https://i.ytimg.com/vi/${getVideoId(urlToUse) || 'default'}/maxresdefault.jpg`;

    let buffer, title, thumbnail, filename, source;

    // 1: System Zero
    try {
      const dl = await fetchSystemZero(urlToUse, 'mp4');
      buffer = await fetchBuffer(dl.url);
      title = dl.title || fallbackTitle;
      thumbnail = dl.thumb || fallbackThumb;
      filename = `${title.replace(/[^\w\s]/gi, '')}.mp4`;
      source = 'systemzero';
    } catch (e1) {
      console.warn('System Zero falhou para mp4, tentando Nayan...', e1.message);
      // 2: Nayan
      try {
        const dl = await fetchNayan(urlToUse, 'mp4');
        buffer = await fetchBuffer(dl.url, 'https://nayan-video-downloader.vercel.app/');
        title = dl.title || fallbackTitle;
        thumbnail = dl.thumb || fallbackThumb;
        filename = `${title.replace(/[^\w\s]/gi, '')}.mp4`;
        source = 'nayan';
      } catch (e2) {
        throw new Error('Todas as APIs de download falharam para o vídeo.');
      }
    }
    
    if (!isRealMp4(buffer)) {
      try { buffer = await convertToMp4(buffer); } catch { /* mantém buffer original se falhar */ }
    }

    return {
      ok: true,
      buffer,
      title,
      thumbnail,
      quality: qualidade,
      filename,
      source,
      tempo: preInfo?.seconds || 0
    };
  } catch (e) {
    return { ok: false, msg: 'Erro ao baixar vídeo: ' + e.message };
  }
}

export const ytmp3 = mp3;
export const ytmp4 = mp4;
export { search, mp3, mp4 };