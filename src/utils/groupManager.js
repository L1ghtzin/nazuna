import fsPromises from 'fs/promises';
import fs from 'fs';
import pathz from 'path';
import { idsMatch } from './helpers.js';
import { writeAsync, readAsync, queue as writeQueued } from './database/io.js';
import { GRUPOS_DIR, ATIVIDADE_DIR } from './paths.js';

export const buildGroupFilePath   = (groupId) => pathz.join(GRUPOS_DIR,    `${groupId}.json`);
export const buildActivityFilePath = (groupId) => pathz.join(ATIVIDADE_DIR, `${groupId}.json`);

// ─── Helpers de Atividade ───────────────────────────────────────────────────

export async function loadActivityData(groupId, defaultValue = {}) {
  if (!groupId) return defaultValue;
  try {
    return await readAsync(buildActivityFilePath(groupId), defaultValue);
  } catch {
    return defaultValue;
  }
}

export async function saveActivityData(groupId, data) {
  if (!groupId) return false;
  try {
    return await writeQueued(buildActivityFilePath(groupId), data);
  } catch (err) {
    console.error(`Erro ao salvar atividade do grupo ${groupId}:`, err.message);
    return false;
  }
}

export async function loadGroupDataById(groupId, {
  defaultValue = {},
  groupFile = buildGroupFilePath(groupId)
} = {}) {
  if (!groupId) return defaultValue;

  try {
    return await readAsync(groupFile, defaultValue);
  } catch (error) {
    console.error(`Erro ao carregar dados do grupo ${groupId}:`, error.message);
    return defaultValue;
  }
}

export async function saveGroupDataById(groupId, groupData, {
  groupFile = buildGroupFilePath(groupId)
} = {}) {
  if (!groupId || !groupData || typeof groupData !== 'object') return false;

  try {
    return await writeAsync(groupFile, groupData);
  } catch (error) {
    console.error(`Erro ao salvar dados do grupo ${groupId}:`, error.message);
    return false;
  }
}

/**
 * Loads group data securely, ensuring no blocking and proper error handling
 */
export async function loadGroupData(isGroup, from, groupFile, groupName) {
  if (!isGroup) return {};

  let groupData = {};

  try {
    const fileExists = fs.existsSync(groupFile);
    if (!fileExists) {
      await writeAsync(groupFile, {
        mark: {},
        createdAt: new Date().toISOString(),
        groupName: groupName
      });
    }
    
    groupData = await readAsync(groupFile, { mark: {}, createdAt: new Date().toISOString() });
  } catch (e) {
    console.error('Erro ao carregar groupData:', e);
    try {
      groupData = await readAsync(groupFile, {});
    } catch (e2) {
      groupData = { mark: {} };
    }
  }



  // Validação básica
  if (!groupData || typeof groupData !== 'object') {
    groupData = { mark: {} };
  }

  // default flags
  groupData.modorpg = typeof groupData.modorpg === 'boolean' ? groupData.modorpg : false;
  groupData.minMessage = groupData.minMessage || null;
  groupData.moderators = groupData.moderators || [];
  groupData.allowedModCommands = groupData.allowedModCommands || [];
  groupData.mutedUsers = groupData.mutedUsers || {};
  groupData.mutedUsers2 = groupData.mutedUsers2 || {};
  groupData.levelingEnabled = groupData.levelingEnabled || false;
  groupData.adminWhitelist = groupData.adminWhitelist || {};
  
  // novas chaves consolidadas (estilo Misa)
  groupData.antiflood = groupData.antiflood || { enabled: false, interval: 5, users: {} };
  groupData.modolite = typeof groupData.modolite === 'boolean' ? groupData.modolite : false;
  groupData.botBan = groupData.botBan || { ativo: false, motivo: null, createdAt: null, createdBy: null };
  groupData.aluguel = groupData.aluguel || { ativo: false, expiresAt: null, codigoUsado: null };
  groupData.menuAudio = groupData.menuAudio || null;
  groupData.menuLerMais = typeof groupData.menuLerMais === 'boolean' ? groupData.menuLerMais : false;
  if (!groupData.roles || typeof groupData.roles !== 'object') {
    groupData.roles = {};
  }
  if (!groupData.roleMessages || typeof groupData.roleMessages !== 'object') {
    groupData.roleMessages = {};
  }

  if (groupName && groupData.groupName !== groupName) {
    groupData.groupName = groupName;
    writeAsync(groupFile, groupData).catch(err => console.error('Erro ao salvar groupData:', err));
  }
  
  return groupData;
}

/**
 * Persists group data asynchronously without blocking
 */
export const persistGroupData = (isGroup, from, groupFile, groupData) => {
  if (isGroup) {
    return writeAsync(groupFile, groupData).then(() => {
      return true;
    }).catch(err => {
      console.error('Erro ao persistir groupData:', err);
      return false;
    });
  }
  return Promise.resolve(false);
};

/**
 * Verifies if a user is whitelisted for a given anti feature
 */
export const isUserWhitelisted = (groupData, userId, antiType) => {
  if (!groupData.adminWhitelist || typeof groupData.adminWhitelist !== 'object') {
    return false;
  }
  
  const userWhitelist = groupData.adminWhitelist[userId];
  if (!userWhitelist || !Array.isArray(userWhitelist.antis)) {
    return false;
  }
  
  return userWhitelist.antis.includes(antiType);
};

/**
 * Helper to check if a user is muted
 */
export const isUserInMap = (map, userId) => {
  if (!map || !userId) return false;
  if (map[userId]) return true;
  const keys = Object.keys(map);
  return keys.some(key => idsMatch(key, userId));
};

/**
 * Removes a user from a mute map
 */
export const removeUserFromMap = (map, userId) => {
  if (!map || !userId) return false;
  let removed = false;
  if (map[userId]) {
    delete map[userId];
    removed = true;
  }
  for (const key of Object.keys(map)) {
    if (idsMatch(key, userId)) {
      delete map[key];
      removed = true;
    }
  }
  return removed;
};
