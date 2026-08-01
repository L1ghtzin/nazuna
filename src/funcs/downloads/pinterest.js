/**
 * Pinterest - PinGrab + SystemZone + SiputZX
 */
import axios from 'axios';

const SYSZONE = 'https://systemzone.store/api';
const SIPUTZX = 'https://api.siputzx.my.id/api';
const COBALT_INSTANCES = [
  'api.cobalt.blackcat.sweeux.org',
  'cobaltapi.cjs.nz'
];
const CACHE_TTL = 30 * 60 * 1000;
const cache = new Map();
const PIN_REGEX = /^https?:\/\/(?:(?:[a-zA-Z0-9-]+\.)?pinterest\.\w{2,6}(?:\.\w{2})?\/pin\/[a-zA-Z0-9_-]+|pin\.it\/[a-zA-Z0-9]+)/;

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
  // Suporta URLs com slug: /pin/texto-descritivo--123456789/ e URLs numéricas: /pin/123456789/
  const m = url.match(/\/pin\/(?:[a-zA-Z0-9_-]*?--)?(\d{10,})/);
  if (m) return m[1];
  // Fallback: qualquer sequência numérica longa após /pin/
  const fallback = url.match(/\/pin\/(\d+)/);
  return fallback ? fallback[1] : null;
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

    // 2. SiputZX API (fallback de busca)
    try {
      const { data } = await axios.get(`${SIPUTZX}/s/pinterest`, { params: { query }, timeout: 15000 });
      if (data?.status && data.data?.length) {
        const urls = data.data.map(i => i.video_url || i.image_url || i.gif_url).filter(Boolean);
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

async function resolveRedirect(url) {
  try {
    const res = await axios.get(url, {
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive'
      }
    });
    return res.request.res.responseUrl || res.config.url || url;
  } catch (e) {
    try {
      const resManual = await axios.get(url, {
        maxRedirects: 0,
        validateStatus: (status) => status >= 300 && status < 400,
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
        }
      });
      if (resManual.headers.location) {
        return resManual.headers.location;
      }
    } catch {}
    return url;
  }
}


async function scrapePingrab(url, pinId) {
  try {
    const payload = JSON.stringify([{ link: url, lang: 'pt' }]);
    const res = await axios.post('https://www.pingrab.app/pt', payload, {
      headers: {
        'Accept': 'text/x-component',
        'Content-Type': 'text/plain;charset=UTF-8',
        'Next-Action': 'b6a36f7c1501bcb36f14e864ac5abbc092b365be',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
        'Origin': 'https://www.pingrab.app',
        'Referer': 'https://www.pingrab.app/pt'
      },
      timeout: 15000
    });

    const rawData = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);

    // Resposta vem no formato RSC: a linha 1:{...} contém o JSON real
    const jsonMatch = rawData.match(/^\d+:(\{.+\})$/m);
    if (!jsonMatch) return { ok: false };

    const parsed = JSON.parse(jsonMatch[1]);
    if (!parsed.ok || !parsed.data) return { ok: false };

    const pinData = parsed.data;
    const mediaList = pinData.media || [];
    const videoMedia = mediaList.find(m => m.type === 'video');
    const coverOrig = pinData.cover?.orig?.url || pinData.cover?.['736x']?.url || '';

    if (videoMedia?.url) {
      // Vídeo encontrado — usa URL principal + fallbacks
      const videoUrls = [videoMedia.url, ...(videoMedia.fallbacks || [])].filter(Boolean);
      return {
        ok: true,
        pin_id: pinId || pinData.id,
        type: 'video',
        mime: 'video/mp4',
        title: (pinData.title || '').trim(),
        description: (pinData.description || '').trim(),
        urls: videoUrls
      };
    }

    // Sem vídeo — usa cover como imagem
    if (coverOrig) {
      return {
        ok: true,
        pin_id: pinId || pinData.id,
        type: 'image',
        mime: 'image/jpeg',
        title: (pinData.title || '').trim(),
        description: (pinData.description || '').trim(),
        urls: [coverOrig]
      };
    }

    return { ok: false };
  } catch (e) {
    console.error('[Pinterest] PinGrab Fallback failed:', e.message);
    return { ok: false };
  }
}

async function scrapeSystemZone(url, pinId) {
  try {
    const { data } = await axios.get(`${SYSZONE}/v2/pinterest`, { 
      params: { url, apikey: 'freekey' }, 
      timeout: 15000 
    });
    if (data?.status && data.result) {
      const r = data.result;
      const mediaList = r.media || [];

      // Prefere MP4 sobre HLS, e maior qualidade disponível
      const mp4s = mediaList.filter(m => m.type === 'video' && m.url?.includes('.mp4'));
      const hlss = mediaList.filter(m => m.type === 'video' && m.url?.includes('.m3u8'));
      const images = mediaList.filter(m => m.type === 'image');

      const videoUrls = [...mp4s, ...hlss].map(m => m.url);
      const imageUrls = images.map(m => m.url);
      const urls = r.isVideo
        ? [...videoUrls, ...imageUrls].filter(Boolean)
        : [...imageUrls, ...videoUrls].filter(Boolean);

      if (urls.length) {
        const meta = r.metadata || {};
        return {
          ok: true,
          pin_id: pinId,
          type: r.isVideo ? 'video' : 'image',
          mime: r.isVideo ? 'video/mp4' : 'image/jpeg',
          title: meta.title || meta.caption?.slice(0, 100) || '',
          description: meta.caption || '',
          urls
        };
      }
    }
    return { ok: false };
  } catch (e) {
    console.error('[Pinterest] SystemZone Fallback failed:', e.message);
    return { ok: false };
  }
}

async function scrapeCobalt(url, pinId) {
  for (const apiHost of COBALT_INSTANCES) {
    const endpoint = `https://${apiHost}/`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        body: JSON.stringify({ url })
      });
      
      if (res.status === 200) {
        const data = await res.json();
        if (data.url || data.picker) {
          const urls = data.picker ? data.picker.map(item => item.url) : [data.url];
          const isVideo = data.status === 'stream' || (urls[0] && urls[0].includes('.mp4'));
          return {
            ok: true,
            pin_id: pinId,
            type: isVideo ? 'video' : 'image',
            mime: isVideo ? 'video/mp4' : 'image/jpeg',
            title: '',
            description: '',
            urls
          };
        }
      }
    } catch (e) {
      console.error(`[Pinterest] Cobalt Fallback ${apiHost} failed:`, e.message);
    }
  }
  return { ok: false };
}

async function dl(url) {
  try {
    if (!PIN_REGEX.test(url)) return { ok: false, msg: 'URL inválida do Pinterest' };

    const key = `d:${url}`;
    const cached = getCached(key);
    if (cached) return { ok: true, ...cached, cached: true };

    const longUrl = await resolveRedirect(url);
    const pinId = extractPinId(longUrl);

    // 1. PinGrab.app (API Pinterest interna, melhor detecção de vídeo)
    const pingrab = await scrapePingrab(longUrl, pinId);
    if (pingrab.ok) {
      setCache(key, pingrab);
      return pingrab;
    }

    // 2. SystemZone API v2
    const sysZone = await scrapeSystemZone(longUrl, pinId);
    if (sysZone.ok) {
      setCache(key, sysZone);
      return sysZone;
    }

    // 4. Tenta Fallback 3: Cobalt API
    const cobalt = await scrapeCobalt(longUrl, pinId);
    if (cobalt.ok) {
      setCache(key, cobalt);
      return cobalt;
    }

    return { ok: false, msg: 'Sem mídia disponível para download' };
  } catch (e) {
    console.error('[Pinterest] dl:', e.message);
    return { ok: false, msg: 'Erro ao baixar do Pinterest' };
  }
}

export { search, dl };
