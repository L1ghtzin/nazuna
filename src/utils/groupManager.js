import fsPromises from 'fs/promises';
import { idsMatch } from './helpers.js';
import { writeJsonFileAsync, readJsonFileAsync } from './asyncFs.js';

/**
 * Loads group data securely, ensuring no blocking and proper error handling, utilizing cache
 */
export async function loadGroupData(isGroup, from, groupFile, groupName, optimizer) {
  if (!isGroup) return {};

  let groupData = {};

  try {
    groupData = await optimizer.getGroupDataCached(
      from,
      async () => {
        // Fallback for cache miss
        let parsedData = {};
        const fileExists = await optimizer.fileExists(groupFile);
        
        if (!fileExists) {
          await writeJsonFileAsync(groupFile, {
            mark: {},
            createdAt: new Date().toISOString(),
            groupName: groupName
          });
          optimizer.invalidateJson(groupFile);
        }
        
        try {
          let rawContent = await fsPromises.readFile(groupFile, 'utf-8');
          if (!rawContent || rawContent.trim() === '') {
            parsedData = { mark: {}, createdAt: new Date().toISOString() };
          } else {
            rawContent = rawContent.replace(/^\uFEFF/, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
            try {
              parsedData = JSON.parse(rawContent);
            } catch (parseError) {
              console.error(`❌ JSON inválido no grupo ${from}, tentando recuperar:`, parseError.message);
              try {
                rawContent = rawContent.replace(/,\s*([\]}])/g, '$1');
                parsedData = JSON.parse(rawContent);
              } catch (retryError) {
                parsedData = { mark: {}, createdAt: new Date().toISOString(), recovered: true };
              }
            }
          }
        } catch (readError) {
          if (readError.code !== 'ENOENT') {
            console.error(`❌ Erro ao ler arquivo do grupo ${from}:`, readError.message);
          }
          parsedData = { mark: {} };
        }
        return parsedData;
      },
      5000 // 5 seconds TTL
    );
  } catch (e) {
    console.error('Erro ao carregar groupData com cache:', e);
    try {
      groupData = await readJsonFileAsync(groupFile, {});
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
  if (!groupData.roles || typeof groupData.roles !== 'object') {
    groupData.roles = {};
  }
  if (!groupData.roleMessages || typeof groupData.roleMessages !== 'object') {
    groupData.roleMessages = {};
  }

  if (groupName && groupData.groupName !== groupName) {
    groupData.groupName = groupName;
    writeJsonFileAsync(groupFile, groupData).then(() => {
      optimizer.invalidateGroup(from);
    }).catch(err => console.error('Erro ao salvar groupData:', err));
  }
  
  return groupData;
}

/**
 * Persists group data asynchronously without blocking
 */
export const persistGroupData = (isGroup, from, groupFile, groupData, optimizer) => {
  if (isGroup) {
    writeJsonFileAsync(groupFile, groupData).then(() => {
      optimizer.invalidateGroup(from);
    }).catch(err => console.error('Erro ao persistir groupData:', err));
  }
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
