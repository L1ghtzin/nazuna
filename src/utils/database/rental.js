// ==================== DATABASE RENTAL ====================
// Sistema de aluguel de grupos e códigos de ativação.

import fs from 'fs';
import crypto from 'crypto';
import { PREFIX } from '../../config.js';
import { ensureDirectoryExists, loadJsonFile, getUserName, isGroupId , debouncedSaveJson} from '../helpers.js';
import { DONO_DIR, ALUGUEIS_FILE, CODIGOS_ALUGUEL_FILE } from '../paths.js';
import { MESSAGES } from '../messages.js';

export const loadRentalData = () => {
  return loadJsonFile(ALUGUEIS_FILE, { globalMode: false, groups: {} });
};

export const saveRentalData = data => {
  try {
    ensureDirectoryExists(DONO_DIR);
    debouncedSaveJson(ALUGUEIS_FILE, data, 1000);
    return true;
  } catch (error) {
    console.error(MESSAGES.rental.saveError, error);
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
    return { success: false, message: MESSAGES.rental.invalidGroupId };
  }
  let rentalData = loadRentalData();
  let expiresAt = null;
  let message = '';
  const now = Date.now();
  if (durationDays === 'permanent') {
    expiresAt = 'permanent';
    message = MESSAGES.rental.activatedPermanent(groupId);
  } else if (typeof durationDays === 'number' && durationDays > 0) {
    expiresAt = now + (durationDays * 24 * 60 * 60 * 1000);
    const expirationDate = new Date(expiresAt);
    message = MESSAGES.rental.activatedTemporary(groupId, durationDays, expirationDate.toLocaleDateString('pt-BR'), expirationDate.toLocaleTimeString('pt-BR'), prefix);
  } else {
    return { success: false, message: MESSAGES.rental.invalidDuration };
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
    return { success: false, message: MESSAGES.rental.saveError };
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
    console.error(MESSAGES.rental.saveCodeError, error);
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
    return { success: false, message: MESSAGES.rental.invalidCodeDuration };
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
    return { success: true, message: MESSAGES.rental.codeGenerated(code, durationDays === 'permanent', durationDays, targetGroupId), code: code };
  } else {
    return { success: false, message: MESSAGES.rental.codeSaveError };
  }
};

export const validateActivationCode = code => {
  const codesData = loadActivationCodes();
  const codeInfo = codesData.codes[code?.toUpperCase()];
  if (!codeInfo) return { valid: false, message: MESSAGES.rental.invalidCode };
  if (codeInfo.used) {
    return { valid: false, message: MESSAGES.rental.codeAlreadyUsed(new Date(codeInfo.usedAt).toLocaleDateString('pt-BR'), getUserName(codeInfo.usedBy) || 'alguém') };
  }
  return { valid: true, ...codeInfo };
};

export const useActivationCode = (code, groupId, userId) => {
  const validation = validateActivationCode(code);
  if (!validation.valid) return { success: false, message: validation.message };
  const codeInfo = validation;
  const normalizedCode = code.toUpperCase();
  if (codeInfo.targetGroup && codeInfo.targetGroup !== groupId) {
    return { success: false, message: MESSAGES.rental.codeTargetMismatch };
  }
  const rentalResult = setGroupRental(groupId, codeInfo.duration);
  if (!rentalResult.success) {
    return { success: false, message: MESSAGES.rental.codeActivationError(rentalResult.message) };
  }
  let codesData = loadActivationCodes();
  codesData.codes[normalizedCode].used = true;
  codesData.codes[normalizedCode].usedBy = userId;
  codesData.codes[normalizedCode].usedAt = new Date().toISOString();
  codesData.codes[normalizedCode].activatedGroup = groupId;
  if (saveActivationCodes(codesData)) {
    return { success: true, message: MESSAGES.rental.codeActivated(normalizedCode, rentalResult.message) };
  } else {
    console.error(MESSAGES.rental.codeMarkErrorLog(normalizedCode, groupId));
    return { success: false, message: MESSAGES.rental.codeCriticalError };
  }
};

export const extendGroupRental = (groupId, extraDays) => {
  if (!groupId || typeof groupId !== 'string' || !isGroupId(groupId)) {
    return { success: false, message: MESSAGES.rental.extendInvalidGroup };
  }
  if (typeof extraDays !== 'number' || extraDays <= 0) {
    return { success: false, message: MESSAGES.rental.extendInvalidDays };
  }
  let rentalData = loadRentalData();
  const groupInfo = rentalData.groups[groupId];
  if (!groupInfo) return { success: false, message: MESSAGES.rental.extendNoRental };
  if (groupInfo.expiresAt === 'permanent' || groupInfo.duration === 'permanent' || groupInfo.durationDays === 'permanent') {
    return { success: false, message: MESSAGES.rental.extendPermanent };
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
    return { success: true, message: MESSAGES.rental.extendSuccess(extraDays, new Date(newExpiresAt).toLocaleDateString('pt-BR')) };
  } else {
    return { success: false, message: MESSAGES.rental.extendSaveError };
  }
};
