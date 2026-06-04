/**
 * Spotify Download - Implementação via System Zone API
 */

import axios from 'axios';
import SimpleCache from '../../utils/simpleCache.js';

const SYSTEM_ZONE_URL = 'https://systemzone.store';
const API_KEY = 'freekey';

// Cache simples
const CACHE_TTL = 30 * 60 * 1000;
const cache = new SimpleCache(CACHE_TTL);

function getCached(key) {
  return cache.get(key);
}

function setCache(key, val) {
  cache.set(key, val, CACHE_TTL);
}

/**
 * Valida se é uma URL válida do Spotify
 */
function isValidSpotifyUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return url.includes('open.spotify.com/') || url.includes('spotify.com/');
}

/**
 * Busca músicas no Spotify
 * @param {string} query - Nome da música ou artista
 * @returns {Promise<Object>} Resultados da busca
 */
async function search(query) {
  try {
    if (!query || typeof query !== 'string') {
      return { ok: false, msg: 'Query inválida' };
    }

    const cached = getCached(`search:${query}`);
    if (cached) return cached;

    // Busca usando a API da System Zone
    const response = await axios.get(`${SYSTEM_ZONE_URL}/api/search/spotify`, {
      params: { q: query },
      timeout: 120000
    });

    if (!response.data || !response.data.status) {
      console.log('[Spotify] Erro na resposta da System Zone:', response.data);
      return { ok: false, msg: 'Erro ao buscar no Spotify pela System Zone' };
    }

    const searchData = response.data.result || [];
    
    // Mapeia para o formato esperado
    const mappedResults = searchData.map(item => ({
      name: item.title || 'Desconhecido',
      artists: item.artists ? [item.artists] : ['Desconhecido'],
      song_link: item.url,
      link: item.url,
      duration_ms: item.duration || 0
    }));

    const result = {
      ok: true,
      query,
      total: mappedResults.length,
      results: mappedResults
    };

    setCache(`search:${query}`, result);
    return result;
  } catch (error) {
    console.error('Erro na busca do Spotify (System Zone):', error.message);
    return { ok: false, msg: 'Erro ao buscar no Spotify: ' + error.message };
  }
}

/**
 * Faz download direto de uma música do Spotify via URL
 * @param {string} url - URL do track do Spotify
 * @returns {Promise<Object>} Dados do download
 */
async function download(url) {
  try {
    if (!isValidSpotifyUrl(url)) {
      console.log('[Spotify] URL inválida:', url);
      return { ok: false, msg: 'URL inválida do Spotify.' };
    }

    const cached = getCached(`download:${url}`);
    if (cached) return cached;

    console.log(`[Spotify] Extraindo dados via System Zone: ${url}`);
    
    // Etapa 1: Obter a URL de download da System Zone
    const { data } = await axios.get(`${SYSTEM_ZONE_URL}/api/v1/spotify`, {
      params: {
        text: url,
        apikey: API_KEY
      },
      timeout: 120000
    });

    if (!data || !data.status || !data.download_url) {
      console.log('[Spotify] Erro na resposta da System Zone:', data);
      return { ok: false, msg: 'Erro ao extrair informações da música ou API Key inválida' };
    }

    console.log(`[Spotify] 🎵 Música: ${data.title}`);
    console.log(`[Spotify] ⬇️ Iniciando download do MP3...`);

    // Etapa 2: Baixar o buffer do MP3
    const dlResponse = await axios.get(data.download_url, {
      responseType: 'arraybuffer',
      timeout: 120000
    });

    console.log(`[Spotify] ✅ Download concluído`);

    const result = {
      ok: true,
      buffer: Buffer.from(dlResponse.data),
      title: data.title,
      artists: [data.artists],
      albumImage: data.thumbnail,
      year: new Date().getFullYear().toString(),
      duration: data.duration,
      filename: `${data.artists} - ${data.title}.mp3`
    };

    setCache(`download:${url}`, result);
    return result;
  } catch (error) {
    console.error('Erro no download do Spotify:', error.message);
    return { ok: false, msg: 'Erro ao baixar do Spotify: ' + error.message };
  }
}

/**
 * Busca e faz download de uma música do Spotify
 * @param {string} query - Nome da música ou artista
 * @returns {Promise<Object>} Dados da busca e download
 */
async function searchDownload(query) {
  try {
    // Buscar primeiro resultado
    const searchResult = await search(query);
    
    if (!searchResult.ok || !searchResult.results?.length) {
      return { ok: false, msg: 'Nenhuma música encontrada com esse nome' };
    }

    const track = searchResult.results[0];
    
    if (!track.song_link) {
      return { ok: false, msg: 'Link da música não encontrado' };
    }

    // Fazer download direto via URL
    const downloadResult = await download(track.song_link);
    
    if (!downloadResult.ok) {
      return downloadResult;
    }

    return {
      ok: true,
      buffer: downloadResult.buffer,
      query,
      track: {
        name: track.name,
        artists: track.artists,
        link: track.link
      },
      title: downloadResult.title,
      artists: downloadResult.artists,
      albumImage: downloadResult.albumImage,
      year: downloadResult.year,
      duration: downloadResult.duration,
      filename: downloadResult.filename
    };
  } catch (error) {
    console.error('Erro na busca/download do Spotify:', error.message);
    return { ok: false, msg: error.message || 'Erro ao buscar no Spotify' };
  }
}

export default {
  download,
  search,
  searchDownload
};