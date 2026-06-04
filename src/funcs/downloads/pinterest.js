/**
 * Pinterest - SystemZone + SiputZX + apisnodz
 */
import axios from 'axios';

const SYSZONE = 'https://systemzone.store/api';
const SIPUTZX = 'https://api.siputzx.my.id/api';
const CACHE_TTL = 30 * 60 * 1000;
const cache = new Map();
const PIN_REGEX = /^https?:\/\/(?:(?:[a-zA-Z0-9-]+\.)?pinterest\.\w{2,6}(?:\.\w{2})?\/pin\/\d+|pin\.it\/[a-zA-Z0-9]+)/;

function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.ts > CACHE_TTL) { cache.delete(key); return null; }
  return item.val;
}

function setCache(key, val) {
  if (cache.size >= 1000) cache.delete(cache.keys().next().value);
  cache.set(key, { val, ts: Date.now() });
}

function extractPinId(url) {
  const m = url.match(/\/pin\/(\w+)/);
  return m ? m[1] : null;
}

async function search(query) {
  try {
    if (!query?.trim()) return { ok: false, msg: 'Termo de pesquisa inválido' };

    const key = `s:${query.toLowerCase()}`;
    const cached = getCached(key);
    if (cached) return { ok: true, ...cached, cached: true };

    // 1. SystemZone API (múltiplos resultados, qualidade original)
    try {
      const { data } = await axios.get(`${SYSZONE}/pinterest`, { params: { q: query, limit: 10, apikey: 'freekey' }, timeout: 15000 });
      if (data?.status && data.results?.length) {
        const urls = data.results.map(r => r.image_url).filter(Boolean);
        if (urls.length) {
          const result = { type: 'image', mime: 'image/jpeg', query, count: urls.length, urls };
          setCache(key, result);
          return { ok: true, ...result };
        }
      }
    } catch {}

    // 2. SiputZX API (múltiplos resultados, qualidade original)
    try {
      const { data } = await axios.get(`${SIPUTZX}/s/pinterest`, { params: { query, type: 'image' }, timeout: 15000 });
      if (data?.status && data.data?.length) {
        const urls = data.data.map(i => i.image_url || i.video_url || i.gif_url).filter(Boolean);
        if (urls.length) {
          const result = { type: 'image', mime: 'image/jpeg', query, count: urls.length, urls };
          setCache(key, result);
          return { ok: true, ...result };
        }
      }
    } catch {}

    return { ok: false, msg: 'Nenhuma imagem encontrada' };
  } catch (e) {
    console.error('[Pinterest] search:', e.message);
    return { ok: false, msg: 'Erro ao buscar imagens no Pinterest' };
  }
}

async function dl(url) {
  try {
    if (!PIN_REGEX.test(url)) return { ok: false, msg: 'URL inválida do Pinterest' };

    const key = `d:${url}`;
    const cached = getCached(key);
    if (cached) return { ok: true, ...cached, cached: true };

    const pinId = extractPinId(url);

    // 1. SystemZone API
    try {
      const { data } = await axios.get(`${SYSZONE}/v2/pinterest`, { params: { url, apikey: 'freekey' }, timeout: 15000 });
      if (data?.status && data.data) {
        const r = data.data;
        const urls = [r.url, r.image, r.video, ...(r.medias || []).map(m => m.url)].filter(Boolean);
        if (urls.length) {
          const result = { pin_id: pinId, type: r.video ? 'video' : 'image', mime: r.video ? 'video/mp4' : 'image/jpeg', title: r.title || '', description: r.description || '', urls };
          setCache(key, result);
          return { ok: true, ...result };
        }
      }
    } catch {}

    return { ok: false, msg: 'Sem mídia disponível para download' };
  } catch (e) {
    console.error('[Pinterest] dl:', e.message);
    return { ok: false, msg: 'Erro ao baixar do Pinterest' };
  }
}

export { search, dl };
