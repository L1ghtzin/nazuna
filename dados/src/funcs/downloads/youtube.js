import axios from 'axios';
import yts from 'yt-search';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import os from 'os';
import { join } from 'path';

const TIMEOUT = 60000;
const DL_TIMEOUT = 180000;

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
    fs.writeFileSync(inp, inputBuffer);
    await new Promise((resolve, reject) => {
      ffmpeg(inp).toFormat('mp3').audioBitrate(128).audioChannels(2).audioFrequency(44100)
        .outputOptions('-threads', '1')
        .on('error', reject).on('end', resolve).save(out);
    });
    return fs.readFileSync(out);
  } finally {
    try { fs.unlinkSync(inp); } catch { }
    try { fs.unlinkSync(out); } catch { }
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

async function fetchNayan(url, format) {
  const { data: raw } = await api.get('https://nayan-video-downloader.vercel.app/ytdown', { params: { url } });

  const body = (raw?.status !== undefined && raw.data) ? raw.data : raw;
  if (!body || body.status === false) throw new Error('Resposta inválida');

  const media = (body.data?.title || body.data?.video || body.data?.audio) ? body.data : body;
  const dlUrl = format === 'mp3' ? media.audio : (media.video_hd || media.video);
  if (!dlUrl) throw new Error(`URL de ${format} não disponível`);

  const { data } = await api.get(dlUrl, {
    responseType: 'arraybuffer',
    timeout: DL_TIMEOUT,
    headers: { Referer: 'https://nayan-video-downloader.vercel.app/' }
  });

  const buffer = Buffer.from(data);
  if (buffer.length < 1000) throw new Error('Arquivo muito pequeno');

  return { buffer, title: media.title || 'YouTube Media', thumb: media.thumb };
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

async function mp3(url) {
  try {
    const id = getVideoId(url);
    if (!id) return { ok: false, msg: 'URL inválida do YouTube' };

    const ytUrl = `https://youtube.com/watch?v=${id}`;
    const [dl, info] = await Promise.allSettled([
      fetchNayan(ytUrl, 'mp3'),
      yts(url).then(r => r?.videos?.[0] || null)
    ]);

    if (dl.status === 'rejected') return { ok: false, msg: dl.reason.message };

    const { buffer: raw, title, thumb } = dl.value;
    const yt = info.status === 'fulfilled' ? info.value : null;

    let buffer;
    try { buffer = await convertToMp3(raw); } catch { buffer = raw; }

    const result = {
      ok: true,
      buffer,
      title: title || yt?.title || 'Audio',
      thumbnail: thumb || yt?.thumbnail || `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
      quality: '128 kbps',
      filename: `${(title || 'audio').replace(/[^\w\s]/gi, '')}.mp3`,
      source: 'nayan',
      tempo: yt?.seconds || 0
    };

    return result;
  } catch (e) {
    return { ok: false, msg: 'Erro ao baixar áudio: ' + e.message };
  }
}

async function mp4(url, qualidade = '360p') {
  try {
    const id = getVideoId(url);
    if (!id) return { ok: false, msg: 'URL inválida do YouTube' };

    const ytUrl = `https://youtube.com/watch?v=${id}`;
    const [dl, info] = await Promise.allSettled([
      fetchNayan(ytUrl, 'mp4'),
      yts(url).then(r => r?.videos?.[0] || null)
    ]);

    if (dl.status === 'rejected') return { ok: false, msg: dl.reason.message };

    const { buffer, title, thumb } = dl.value;
    const yt = info.status === 'fulfilled' ? info.value : null;

    return {
      ok: true,
      buffer,
      title: title || yt?.title || 'Video',
      thumbnail: thumb || yt?.thumbnail || `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
      quality: qualidade,
      filename: `${(title || 'video').replace(/[^\w\s]/gi, '')}.mp4`,
      source: 'nayan',
      tempo: yt?.seconds || 0
    };
  } catch (e) {
    return { ok: false, msg: 'Erro ao baixar vídeo: ' + e.message };
  }
}

export const ytmp3 = mp3;
export const ytmp4 = mp4;
export { search, mp3, mp4 };