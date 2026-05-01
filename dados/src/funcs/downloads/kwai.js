/**
 * Kwai Download - Implementação direta via scraping
 * Extrai dados do JSON-LD da página
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { mediaClient } from '../../utils/httpClient.js';
import SimpleCache from '../../utils/simpleCache.js';

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36";

// Cache simples
const CACHE_TTL = 60 * 60 * 1000; // 1 hora
const cache = new SimpleCache(CACHE_TTL);

function getCached(key) {
  return cache.get(key);
}

function setCache(key, val) {
  cache.set(key, val, CACHE_TTL);
}

/**
 * Faz download de vídeo do Kwai
 * @param {string} url - URL do vídeo do Kwai
 * @returns {Promise<Object>} Dados do download
 */
async function dl(url) {
  try {
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return {
        ok: false,
        msg: 'URL inválida'
      };
    }

    // Verificar cache
    const cached = getCached(`download:${url}`);
    if (cached) return { ok: true, ...cached, cached: true };

    const response = await axios.get(url, {
      headers: {
        "User-Agent": USER_AGENT
      },
      timeout: 120000
    });

    const $ = cheerio.load(response.data);
    const scriptTag = $('script#VideoObject');
    
    if (!scriptTag.length) {
      return {
        ok: false,
        msg: 'Vídeo não encontrado'
      };
    }

    const videoData = JSON.parse(scriptTag.html());
    
    // Baixar o vídeo
    let videoBuffer = null;
    try {
      const mediaResponse = await mediaClient.get(videoData.contentUrl, { 
        timeout: 120000,
        headers: {
          "User-Agent": USER_AGENT
        }
      });
      videoBuffer = mediaResponse.data;
    } catch (downloadError) {
      console.error('Erro ao baixar vídeo do Kwai:', downloadError.message);
    }

    const result = {
      criador: 'DevCrician',
      data: [{
        type: 'video',
        buff: videoBuffer,
        url: videoData.contentUrl,
        mime: 'video/mp4',
        metadata: {
          titulo: videoData.name,
          descricao: videoData.description || "Sem descrição",
          thumbnail: videoData.thumbnailUrl?.[0],
          publicado: videoData.uploadDate,
          duracao: videoData.duration,
          autor: {
            nome: videoData.creator?.mainEntity?.name,
            usuario: videoData.creator?.mainEntity?.alternateName,
            perfil: videoData.creator?.mainEntity?.url
          }
        }
      }],
      count: 1
    };

    setCache(`download:${url}`, result);

    return {
      ok: true,
      ...result
    };
  } catch (error) {
    console.error('Erro no download Kwai:', error.message);
    return {
      ok: false,
      msg: 'Erro ao baixar vídeo: ' + error.message
    };
  }
}

export {
  dl
};
