// ==================== DATABASE RENTAL ====================
// Sistema de aluguel de grupos e códigos de ativação.

import fs from 'fs';
import crypto from 'crypto';
import { PREFIX } from '../../config.js';
import { ensureDirectoryExists, loadJsonFile, getUserName, isGroupId , debouncedSaveJson} from '../helpers.js';
import { DONO_DIR, ALUGUEIS_FILE, CODIGOS_ALUGUEL_FILE } from '../paths.js';

export const loadRentalData = () => {
  return loadJsonFile(ALUGUEIS_FILE, { globalMode: false, groups: {} });
};

export const saveRentalData = data => {
  try {
    ensureDirectoryExists(DONO_DIR);
    debouncedSaveJson(ALUGUEIS_FILE, data, 1000);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar dados de aluguel:', error);
    return false;
  }
};

export const isRentalModeActive = () => {
  const rentalData = loadRentalData();
  return rentalData.globalMode === true;
};

export const setRentalMode = isActive => {
  let rentalData = loadRentalData();
  rentalData.globalMode = !!isActive;
  return saveRentalData(rentalData);
};

export const getGroupRentalStatus = groupId => {
  const rentalData = loadRentalData();
  const groupInfo = rentalData.groups[groupId];
  if (!groupInfo) return { active: false, expiresAt: null, permanent: false };
  if (groupInfo.expiresAt === 'permanent' || groupInfo.duration === 'permanent' || groupInfo.durationDays === 'permanent') {
    return { active: true, expiresAt: 'permanent', permanent: true };
  }
  if (groupInfo.expiresAt) {
    const expirationDate = new Date(groupInfo.expiresAt);
    if (expirationDate > new Date()) {
      return { active: true, expiresAt: groupInfo.expiresAt, permanent: false };
    } else {
      return { active: false, expiresAt: groupInfo.expiresAt, permanent: false };
    }
  }
  return { active: false, expiresAt: null, permanent: false };
};

export const setGroupRental = (groupId, durationDays, prefix = PREFIX) => {
  if (!groupId || typeof groupId !== 'string' || !isGroupId(groupId)) {
    return { success: false, message: '🤔 ID de grupo inválido! Verifique se o ID está correto (geralmente termina com @g.us).' };
  }
  let rentalData = loadRentalData();
  let expiresAt = null;
  let message = '';
  const now = Date.now();
  if (durationDays === 'permanent') {
    expiresAt = 'permanent';
    message = `♾️ *ALUGUEL PERMANENTE ATIVADO!*\n\n`;
    message += `📱 *Grupo:* ${groupId}\n`;
    message += `✨ Status: Permanente\n`;
    message += `⏰ Não há data de expiração.`;
  } else if (typeof durationDays === 'number' && durationDays > 0) {
    expiresAt = now + (durationDays * 24 * 60 * 60 * 1000);
    const expirationDate = new Date(expiresAt);
    message = `✅ *ALUGUEL ATIVADO COM SUCESSO!*\n\n`;
    message += `📱 *Grupo:* ${groupId}\n`;
    message += `📅 *Duração:* ${durationDays} dia(s)\n`;
    message += `⏰ *Expira em:* ${expirationDate.toLocaleDateString('pt-BR')} às ${expirationDate.toLocaleTimeString('pt-BR')}\n\n`;
    message += `💡 Use *${prefix}infoaluguel* para ver os detalhes.`;
  } else {
    return { success: false, message: '🤔 Duração inválida! Use um número de dias (ex: 30) ou a palavra "permanente".' };
  }
  rentalData.groups[groupId] = {
    addedAt: now,
    expiresAt: expiresAt,
    durationDays: durationDays,
    duration: durationDays === 'permanent' ? 'permanent' : 'temporary',
    days: durationDays === 'permanent' ? null : durationDays,
    status: 'active'
  };
  if (saveRentalData(rentalData)) {
    return { success: true, message: message };
  } else {
    return { success: false, message: '😥 Oops! Tive um problema ao salvar as informações de aluguel deste grupo.' };
  }
};

export const loadActivationCodes = () => {
  return loadJsonFile(CODIGOS_ALUGUEL_FILE, { codes: {} });
};

export const saveActivationCodes = data => {
  try {
    ensureDirectoryExists(DONO_DIR);
    debouncedSaveJson(CODIGOS_ALUGUEL_FILE, data, 1000);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar códigos de ativação:', error);
    return false;
  }
};

export const generateActivationCode = (durationDays, targetGroupId = null) => {
  let code = '';
  let codesData = loadActivationCodes();
  do {
    try {
      code = crypto.randomBytes(4).toString('hex').toUpperCase();
    } catch (error) {
      code = Math.random().toString(16).substring(2, 10).toUpperCase();
    }
  } while (codesData.codes[code]);
  if (durationDays !== 'permanent' && (typeof durationDays !== 'number' || durationDays <= 0)) {
    return { success: false, message: '🤔 Duração inválida para o código! Use um número de dias (ex: 7) ou "permanente".' };
  }
  if (targetGroupId && (typeof targetGroupId !== 'string' || !isGroupId(targetGroupId))) {
    targetGroupId = null;
  }
  codesData.codes[code] = {
    duration: durationDays,
    targetGroup: targetGroupId,
    used: false,
    usedBy: null,
    usedAt: null,
    createdAt: new Date().toISOString()
  };
  if (saveActivationCodes(codesData)) {
    let message = `🔑 Código de ativação gerado:\n\n*${code}*\n\n`;
    if (durationDays === 'permanent') { message += `Duração: Permanente ✨\n`; }
    else { message += `Duração: ${durationDays} dias ⏳\n`; }
    if (targetGroupId) { message += `Grupo Alvo: ${targetGroupId} 🎯\n`; }
    message += `\nEnvie este código no grupo para ativar o aluguel.`;
    return { success: true, message: message, code: code };
  } else {
    return { success: false, message: '😥 Oops! Não consegui salvar o novo código de ativação. Tente gerar novamente!' };
  }
};

export const validateActivationCode = code => {
  const codesData = loadActivationCodes();
  const codeInfo = codesData.codes[code?.toUpperCase()];
  if (!codeInfo) return { valid: false, message: '🤷 Código de ativação inválido ou não encontrado!' };
  if (codeInfo.used) {
    return { valid: false, message: `😕 Este código já foi usado em ${new Date(codeInfo.usedAt).toLocaleDateString('pt-BR')} por ${getUserName(codeInfo.usedBy) || 'alguém'}!` };
  }
  return { valid: true, ...codeInfo };
};

export const useActivationCode = (code, groupId, userId) => {
  const validation = validateActivationCode(code);
  if (!validation.valid) return { success: false, message: validation.message };
  const codeInfo = validation;
  const normalizedCode = code.toUpperCase();
  if (codeInfo.targetGroup && codeInfo.targetGroup !== groupId) {
    return { success: false, message: '🔒 Este código de ativação é específico para outro grupo!' };
  }
  const rentalResult = setGroupRental(groupId, codeInfo.duration);
  if (!rentalResult.success) {
    return { success: false, message: `😥 Oops! Erro ao ativar o aluguel com este código: ${rentalResult.message}` };
  }
  let codesData = loadActivationCodes();
  codesData.codes[normalizedCode].used = true;
  codesData.codes[normalizedCode].usedBy = userId;
  codesData.codes[normalizedCode].usedAt = new Date().toISOString();
  codesData.codes[normalizedCode].activatedGroup = groupId;
  if (saveActivationCodes(codesData)) {
    return { success: true, message: `🎉 Código *${normalizedCode}* ativado com sucesso! ${rentalResult.message}` };
  } else {
    console.error(`Falha CRÍTICA ao marcar código ${normalizedCode} como usado após ativar aluguel para ${groupId}.`);
    return { success: false, message: '🚨 Erro Crítico! O aluguel foi ativado, mas não consegui marcar o código como usado. Por favor, contate o suporte informando o código!' };
  }
};

export const extendGroupRental = (groupId, extraDays) => {
  if (!groupId || typeof groupId !== 'string' || !isGroupId(groupId)) {
    return { success: false, message: 'ID de grupo inválido.' };
  }
  if (typeof extraDays !== 'number' || extraDays <= 0) {
    return { success: false, message: 'Número de dias extras inválido. Deve ser um número positivo.' };
  }
  let rentalData = loadRentalData();
  const groupInfo = rentalData.groups[groupId];
  if (!groupInfo) return { success: false, message: 'Este grupo não possui aluguel configurado.' };
  if (groupInfo.expiresAt === 'permanent' || groupInfo.duration === 'permanent' || groupInfo.durationDays === 'permanent') {
    return { success: false, message: 'Aluguel já é permanente, não é possível estender.' };
  }
  const now = Date.now();
  const currentExpiresMs = new Date(groupInfo.expiresAt).getTime();
  let newExpiresAt;
  if (currentExpiresMs < now) {
    newExpiresAt = now + (extraDays * 24 * 60 * 60 * 1000);
  } else {
    newExpiresAt = currentExpiresMs + (extraDays * 24 * 60 * 60 * 1000);
  }
  rentalData.groups[groupId].expiresAt = newExpiresAt;
  if (saveRentalData(rentalData)) {
    return { success: true, message: `Aluguel estendido por ${extraDays} dias. Nova expiração: ${new Date(newExpiresAt).toLocaleDateString('pt-BR')}.` };
  } else {
    return { success: false, message: 'Erro ao salvar as informações de aluguel estendido.' };
  }
};
