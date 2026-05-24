// ==================== DATABASE LEVELING ====================
// Sistema de leveling por mensagens: XP, patentes, level up/down.

import { loadJsonFileSafe, saveJsonFileSafe, debouncedSaveJson, validateLevelingUser, getUserName } from '../helpers.js';
import { LEVELING_FILE } from '../paths.js';
import { calculateNextLevelXp, getPatent } from './economy.js';

export const DEFAULT_PATENTS = [
  { name: "Iniciante", minLevel: 1 },
  { name: "Aprendiz", minLevel: 2 },
  { name: "Explorador", minLevel: 5 },
  { name: "Aventureiro", minLevel: 10 },
  { name: "Veterano", minLevel: 15 },
  { name: "Mestre", minLevel: 20 },
  { name: "Elite", minLevel: 30 },
  { name: "Lendário", minLevel: 50 }
];

export const DEFAULT_LEVELING_STRUCTURE = {
  users: {},
  patents: DEFAULT_PATENTS,
  settings: {
    xpPerMessage: 10,
    xpCooldown: 30000,
    levelUpNotification: true
  }
};

export function loadLevelingSafe() {
  try {
    const data = loadJsonFileSafe(LEVELING_FILE, DEFAULT_LEVELING_STRUCTURE, DEFAULT_LEVELING_STRUCTURE);
    if (!data || typeof data !== 'object') {
      console.warn('⚠️ Dados de leveling inválidos, usando padrão');
      return { ...DEFAULT_LEVELING_STRUCTURE };
    }
    if (!data.users || typeof data.users !== 'object') data.users = {};
    if (!Array.isArray(data.patents) || data.patents.length === 0) data.patents = DEFAULT_PATENTS;
    for (const [userId, userData] of Object.entries(data.users)) {
      if (!userData || typeof userData !== 'object') {
        data.users[userId] = validateLevelingUser(null);
        continue;
      }
      data.users[userId] = validateLevelingUser(userData);
    }
    return data;
  } catch (error) {
    console.error('❌ Erro crítico ao carregar leveling:', error.message);
    return { ...DEFAULT_LEVELING_STRUCTURE };
  }
}

export function saveLevelingSafe(data) {
  try {
    if (!data || typeof data !== 'object') {
      console.error('❌ Tentativa de salvar leveling com dados inválidos');
      return false;
    }
    data.users = data.users || {};
    data.patents = data.patents || DEFAULT_PATENTS;
    debouncedSaveJson(LEVELING_FILE, data, 5000);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar leveling:', error.message);
    return false;
  }
}

export function getLevelingUser(levelingData, userId) {
  try {
    if (!levelingData || typeof levelingData !== 'object') {
      console.error('❌ getLevelingUser: levelingData inválido');
      return validateLevelingUser(null);
    }
    if (!userId || typeof userId !== 'string') {
      console.error('❌ getLevelingUser: userId inválido');
      return validateLevelingUser(null);
    }
    levelingData.users = levelingData.users || {};
    if (!levelingData.users[userId]) {
      levelingData.users[userId] = validateLevelingUser(null);
    } else {
      levelingData.users[userId] = validateLevelingUser(levelingData.users[userId]);
    }
    return levelingData.users[userId];
  } catch (error) {
    console.error('❌ Erro em getLevelingUser:', error.message);
    return validateLevelingUser(null);
  }
}

export function checkLevelUp(userId, userData, levelingData, nazu, from) {
  try {
    if (!userData || typeof userData !== 'object') return;
    if (!levelingData || typeof levelingData !== 'object') return;
    userData.level = typeof userData.level === 'number' && !isNaN(userData.level) ? Math.max(1, Math.floor(userData.level)) : 1;
    userData.xp = typeof userData.xp === 'number' && !isNaN(userData.xp) ? Math.max(0, Math.floor(userData.xp)) : 0;
    const nextLevelXp = calculateNextLevelXp(userData.level);
    if (userData.xp >= nextLevelXp) {
      userData.level++;
      userData.xp -= nextLevelXp;
      userData.patent = getPatent(userData.level, levelingData.patents || DEFAULT_PATENTS);
      saveLevelingSafe(levelingData);
      let levelUpText = `╭━━━⊱ ⭐ *LEVEL UP!* ⭐ ⊱━━━╮\n`;
      levelUpText += `│\n`;
      levelUpText += `│ 👤 @${getUserName(userId)}\n`;
      levelUpText += `│\n`;
      levelUpText += `│ 📊 *Nível Atual:* ${userData.level}\n`;
      levelUpText += `│ ✨ *XP:* ${userData.xp}/${calculateNextLevelXp(userData.level)}\n`;
      levelUpText += `│ 🎖️ *Patente:* ${userData.patent}\n`;
      levelUpText += `│\n`;
      levelUpText += `╰━━━━━━━━━━━━━━━━━━━━━━╯\n`;
      levelUpText += `\n🎊 *Parabéns pelo progresso!* 🎊`;
      if (nazu && from) {
        nazu.sendMessage(from, { text: levelUpText, mentions: [userId] }).catch(err => console.error('Erro ao enviar msg level up:', err.message));
      }
    }
  } catch (error) {
    console.error('❌ Erro em checkLevelUp:', error.message);
  }
}

export function checkLevelDown(userId, userData, levelingData) {
  try {
    if (!userData || typeof userData !== 'object') return;
    if (!levelingData || typeof levelingData !== 'object') return;
    userData.level = typeof userData.level === 'number' && !isNaN(userData.level) ? Math.max(1, Math.floor(userData.level)) : 1;
    userData.xp = typeof userData.xp === 'number' && !isNaN(userData.xp) ? Math.floor(userData.xp) : 0;
    while (userData.xp < 0 && userData.level > 1) {
      userData.level--;
      const prevLevelXp = calculateNextLevelXp(userData.level - 1);
      userData.xp += prevLevelXp;
    }
    if (userData.xp < 0) userData.xp = 0;
    userData.patent = getPatent(userData.level, levelingData.patents || DEFAULT_PATENTS);
  } catch (error) {
    console.error('❌ Erro em checkLevelDown:', error.message);
  }
}
