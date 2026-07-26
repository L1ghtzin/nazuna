import { lidCache } from '../lidCache.js';
import { toLID } from '../toLID.js';

// Inicializa o caminho do cache
export function initJidLidCache(cacheFilePath) {
  lidCache.load(cacheFilePath).catch((err) => {
    console.warn(`⚠️ Erro ao carregar cache JID→LID: ${err.message}`);
  });
}

// Salva o cache em disco
export function saveJidLidCache(force = false) {
  lidCache.flush().catch((err) => {
    console.error(`❌ Erro ao salvar cache JID→LID: ${err.message}`);
  });
}

// Busca LID do cache ou via onWhatsApp/USync
export async function getLidFromJidCached(bot, jid) {
  if (!isValidJid(jid)) {
    return jid; // Já é LID ou outro formato
  }
  
  // 1. Verifica cache em memória primeiro (mais rápido)
  const cached = lidCache.get(jid);
  if (cached) {
    return removeDeviceId(cached);
  }
  
  // 2. Tenta o toLID robusto (Baileys signal store & USync query)
  try {
    const lid = await toLID(jid, bot);
    if (lid) {
      const cleanLid = removeDeviceId(lid);
      lidCache.set(jid, cleanLid);
      return cleanLid;
    }
  } catch (error) {
    console.warn(`⚠️ Erro no toLID para ${jid}: ${error.message}`);
  }
  
  // 3. Fallback alternativo via onWhatsApp antigo se o toLID falhou ou não retornou nada
  try {
    const result = await Promise.race([
      bot.onWhatsApp(jid),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout onWhatsApp')), 3000))
    ]);
    if (result && result[0] && result[0].lid) {
      let lid = result[0].lid;
      
      // Remove :XX se existir
      lid = removeDeviceId(lid);
      
      // Salva no cache
      lidCache.set(jid, lid);
      
      return lid;
    }
  } catch (error) {
    console.warn(`⚠️ Erro ao buscar LID via onWhatsApp para ${jid}: ${error.message}`);
  }
  
  // 4. Fallback final: retorna o JID original
  return jid;
}

// Busca reversa: dado um LID, encontra o JID correspondente no cache
export function getJidFromLid(lid) {
  if (!lid || !lid.includes('@lid')) return null;
  const cleanLid = removeDeviceId(lid);
  const found = lidCache.getJidFromLid(cleanLid);
  if (found) return found;

  for (const [jid, cachedLid] of lidCache.entries()) {
    const normalizedCached = removeDeviceId(cachedLid);
    if (normalizedCached === cleanLid) {
      return jid;
    }
  }
  
  return null;
}

// Adiciona um mapeamento JID ↔ LID ao cache se não existir
export function addJidLidToCache(jid, lid) {
  if (!jid || !lid || !jid.includes('@s.whatsapp.net') || !lid.includes('@lid')) return;
  const cleanJid = removeDeviceId(jid);
  const cleanLid = removeDeviceId(lid);
  if (lidCache.get(cleanJid) !== cleanLid) {
    lidCache.set(cleanJid, cleanLid);
  }
}

// Normaliza o conteúdo de uma mensagem para que menções usando LID sejam convertidas em JID caso existam no cache
export function normalizeMessageContent(content) {
  if (!content || typeof content !== 'object') return content;

  // Clona o objeto de conteúdo para evitar mutar o original diretamente
  const newContent = { ...content };

  if (newContent && Array.isArray(newContent.mentions) && newContent.mentions.length > 0) {
    const normalizedMentions = [];
    let text = typeof newContent.text === 'string' ? newContent.text : '';
    let caption = typeof newContent.caption === 'string' ? newContent.caption : '';

    for (const mention of newContent.mentions) {
      if (mention && typeof mention === 'string' && mention.includes('@lid')) {
        const jid = getJidFromLid(mention);
        if (jid) {
          normalizedMentions.push(jid);
          const lidNumber = mention.split('@')[0];
          const jidNumber = jid.split('@')[0];
          
          if (text) {
            text = text.replaceAll('@' + lidNumber, '@' + jidNumber);
          }
          if (caption) {
            caption = caption.replaceAll('@' + lidNumber, '@' + jidNumber);
          }
        } else {
          normalizedMentions.push(mention);
        }
      } else {
        normalizedMentions.push(mention);
      }
    }

    newContent.mentions = normalizedMentions;
    if (typeof newContent.text === 'string') newContent.text = text;
    if (typeof newContent.caption === 'string') newContent.caption = caption;
  }

  return newContent;
}

// Converte um array de IDs (JID/LID) para LID in batch
export async function convertIdsToLid(bot, ids) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  
  const converted = [];
  
  // Processa em paralelo (batch de 5 para não sobrecarregar)
  const batchSize = 5;
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const batchPromises = batch.map(id => getLidFromJidCached(bot, id));
    const batchResults = await Promise.all(batchPromises);
    converted.push(...batchResults);
  }
  
  return converted;
}

// Verifica se dois IDs são equivalentes (ignora sufixo @lid/@s.whatsapp.net e :XX)
export function idsMatch(id1, id2) {
  if (!id1 || !id2) return false;
  const base1 = removeDeviceId(id1).split('@')[0];
  const base2 = removeDeviceId(id2).split('@')[0];
  return base1 === base2;
}

// Verifica se um ID está presente em um array (comparação por base, ignora :XX)
export function idInArray(id, array) {
  if (!id || !Array.isArray(array)) return false;
  const baseId = removeDeviceId(id).split('@')[0];
  
  return array.some(item => {
    if (!item) return false;
    const baseItem = removeDeviceId(item).split('@')[0];
    return baseItem === baseId;
  });
}

// Busca um userId em um mapa ou array de blacklist usando resolução cruzada de cache e idsMatch()
export function findInBlacklistMap(blacklist, userId) {
  if (!blacklist || !userId) return null;

  // Se for o formato de Array
  if (Array.isArray(blacklist)) {
    let found = blacklist.find(entry => entry.lid === userId || entry.number === userId.replace(/\D/g, ''));
    if (found) return found;

    if (isValidJid(userId)) {
      const cachedLid = lidCache.get(userId);
      if (cachedLid) {
        found = blacklist.find(entry => entry.lid === cachedLid);
        if (found) return found;
      }
    } else if (userId.includes('@lid')) {
      const cachedJid = getJidFromLid(userId);
      if (cachedJid) {
        const cleanNumber = cachedJid.replace(/\D/g, '');
        found = blacklist.find(entry => entry.number === cleanNumber);
        if (found) return found;
      }
    }

    for (const entry of blacklist) {
      const entryJid = entry.number ? entry.number + '@s.whatsapp.net' : null;
      if (idsMatch(entry.lid, userId) || (entryJid && idsMatch(entryJid, userId))) {
        return entry;
      }
    }
    return null;
  }

  // Fallback para o formato Objeto Legado (Legado do Chainy)
  if (typeof blacklist === 'object') {
    if (blacklist[userId]) return blacklist[userId];
    if (isValidJid(userId)) {
      const cachedLid = lidCache.get(userId);
      if (cachedLid && blacklist[cachedLid]) return blacklist[cachedLid];
    } else if (userId.includes('@lid')) {
      const cachedJid = getJidFromLid(userId);
      if (cachedJid && blacklist[cachedJid]) return blacklist[cachedJid];
    }
    for (const key of Object.keys(blacklist)) {
      if (idsMatch(key, userId)) return blacklist[key];
    }
  }

  return null;
}

// Converte qualquer ID (JID ou LID) para o formato unificado (preferencialmente LID)
export async function normalizeUserId(bot, userId) {
  if (!userId || typeof userId !== 'string') return userId;
  
  // Se já é LID, retorna direto
  if (isValidLid(userId)) {
    return userId;
  }
  
  // Se é JID, busca o LID
  if (isValidJid(userId)) {
    return await getLidFromJidCached(bot, userId);
  }
  
  // Outros formatos retornam como estão
  return userId;
}

// Força salvamento imediato do cache (útil ao finalizar o bot)
export function flushJidLidCache() {
  if (lidCache.saveTimer) {
    clearTimeout(lidCache.saveTimer);
  }
  saveJidLidCache(true);
}

// Funções auxiliares para LID/JID
export const isGroupId = (id) => id && typeof id === 'string' && id.endsWith('@g.us');
export const isUserId = (id) => id && typeof id === 'string' && (id.includes('@lid') || id.includes('@s.whatsapp.net'));
export const isValidLid = (str) => /^[a-zA-Z0-9_]+@lid$/.test(str);
export const isValidJid = (str) => /^\d+@s\.whatsapp\.net$/.test(str);

export const removeDeviceId = (id) => {
  if (!id || typeof id !== 'string') return id;
  return id.replace(/:[0-9]+/, '');
};

// Função para extrair nome de usuário de LID/JID de forma compatível
export const getUserName = (userId) => {
  if (!userId || typeof userId !== 'string') return 'unknown';
  
  let targetId = userId;
  if (userId.includes('@lid')) {
    const jid = getJidFromLid(userId);
    if (jid) {
      targetId = jid;
    }
  }
  
  if (targetId.includes('@lid')) {
    return targetId.split('@')[0];
  } else if (targetId.includes('@s.whatsapp.net')) {
    return targetId.split('@')[0];
  }
  return targetId.split('@')[0] || targetId;
};

// Função para obter LID a partir de JID (quando necessário para compatibilidade)
export const getLidFromJid = async (bot, jid) => {
  if (!isValidJid(jid)) return jid; // Já é LID ou outro formato
  try {
    const result = await Promise.race([
      bot.onWhatsApp(jid),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout onWhatsApp')), 3000))
    ]);
    if (result && result[0] && result[0].lid) {
      return result[0].lid;
    }
  } catch (error) {
    console.warn(`Erro ao obter LID para ${jid}: ${error.message}`);
  }
  return jid; // Fallback para o JID original
};

// Função para construir ID do usuário (LID ou JID como fallback)
export const buildUserId = (numberString, config) => {
  if (config.lidowner && numberString === config.numerodono) {
    return config.lidowner;
  }
  return numberString.replace(/[^\d]/g, '') + '@s.whatsapp.net';
};

// Função para obter o ID do bot
export const getBotId = (bot) => {
  const botId = bot.user.id.split(':')[0];
  return botId.includes('@lid') ? botId : botId + '@s.whatsapp.net';
};
