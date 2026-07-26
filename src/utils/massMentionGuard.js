import fs from 'fs';
import pathz from 'path';
import { ensureDirectoryExists } from './helpers.js';
import { MASS_MENTION_LIMIT_FILE, MASS_MENTION_CONFIG_FILE } from './paths.js';
import { readAsync, writeAsync } from './database/io.js';

// ==================== PROTEÇÃO ANTI-BAN: Rate Limit para Menções em Massa ====================
// Sistema controlado pelo dono: pode ativar/desativar proteção por grupo
export const MASS_MENTION_THRESHOLD = 150; // Membros mínimos para aplicar proteção (quando ativa)
export const MASS_MENTION_MAX_USES = 2;    // Máximo de usos permitidos
const MASS_MENTION_COOLDOWN = 5 * 60 * 60 * 1000; // 5 horas em milissegundos

// Cache em memória para rate limit (persistido em arquivo)
let massMentionLimitCache = null;
let massMentionConfigCache = null;
let _limitSaveQueue = Promise.resolve();
let _configSaveQueue = Promise.resolve();

export const loadMassMentionConfig = () => {
  if (massMentionConfigCache) return massMentionConfigCache;
  try {
    massMentionConfigCache = db.read(MASS_MENTION_CONFIG_FILE, {});
  } catch (e) {
    console.error('Erro ao carregar massMentionConfig:', e.message);
    massMentionConfigCache = {};
  }
  return massMentionConfigCache;
};

export const saveMassMentionConfig = (data) => {
  massMentionConfigCache = data;
  try {
    db.debounced(MASS_MENTION_CONFIG_FILE, data, 2000);
  } catch (e) {
    console.error('Erro ao salvar massMentionConfig:', e.message);
  }
};

export const loadMassMentionLimit = () => {
  if (massMentionLimitCache) return massMentionLimitCache;
  try {
    massMentionLimitCache = db.read(MASS_MENTION_LIMIT_FILE, {});
  } catch (e) {
    console.error('Erro ao carregar massMentionLimit:', e.message);
    massMentionLimitCache = {};
  }
  return massMentionLimitCache;
};

const saveMassMentionLimit = (data) => {
  massMentionLimitCache = data;
  try {
    db.debounced(MASS_MENTION_LIMIT_FILE, data, 2000);
  } catch (e) {
    console.error('Erro ao salvar massMentionLimit:', e.message);
  }
};

/**
 * Verifica se o grupo pode usar comandos de menção em massa
 * @param {string} groupId - ID do grupo
 * @param {number} memberCount - Número de membros do grupo
 * @returns {{ allowed: boolean, remainingUses: number, resetTime: number|null, message: string|null }}
 */
export const checkMassMentionLimit = (groupId, memberCount) => {
  // Verifica se a proteção está ativada para este grupo
  const config = loadMassMentionConfig();
  if (!config[groupId] || !config[groupId].enabled) {
    return { allowed: true, remainingUses: -1, resetTime: null, message: null };
  }

  // Se grupo tem menos de 150 membros, não aplica limite mesmo se ativo
  if (memberCount < MASS_MENTION_THRESHOLD) {
    return { allowed: true, remainingUses: -1, resetTime: null, message: null };
  }

  const data = loadMassMentionLimit();
  const now = Date.now();

  // Inicializa dados do grupo se não existir
  if (!data[groupId]) {
    data[groupId] = { uses: [], lastReset: now };
  }

  const groupData = data[groupId];

  // Remove usos antigos (mais de 5 horas)
  groupData.uses = groupData.uses.filter(timestamp => (now - timestamp) < MASS_MENTION_COOLDOWN);

  // Verifica se atingiu o limite
  if (groupData.uses.length >= MASS_MENTION_MAX_USES) {
    const oldestUse = Math.min(...groupData.uses);
    const resetTime = oldestUse + MASS_MENTION_COOLDOWN;
    const timeLeft = resetTime - now;
    const hours = Math.floor(timeLeft / (60 * 60 * 1000));
    const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

    return {
      allowed: false,
      remainingUses: 0,
      resetTime: resetTime,
      message: `⚠️ *Proteção Anti-Ban Ativada pelo Dono*\n\n` +
     `Este grupo tem ${memberCount} membros. Para evitar banimento do número do bot pela Meta, ` +
     `o dono ativou uma proteção que limita comandos de marcação em massa a *${MASS_MENTION_MAX_USES} usos a cada 5 horas*.\n\n` +
     `⏰ Próximo uso disponível em: *${hours}h ${minutes}min*`
    };
  }

  saveMassMentionLimit(data);

  return {
    allowed: true,
    remainingUses: MASS_MENTION_MAX_USES - groupData.uses.length,
    resetTime: null,
    message: null
  };
};

/**
 * Registra um uso de menção em massa
 * @param {string} groupId - ID do grupo
 */
export const registerMassMentionUse = (groupId) => {
  const data = loadMassMentionLimit();
  const now = Date.now();

  if (!data[groupId]) {
    data[groupId] = { uses: [], lastReset: now };
  }

  // Remove usos antigos antes de adicionar novo
  data[groupId].uses = data[groupId].uses.filter(timestamp => (now - timestamp) < MASS_MENTION_COOLDOWN);
  data[groupId].uses.push(now);

  saveMassMentionLimit(data);
};
