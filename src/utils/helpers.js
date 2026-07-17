// ===================================================================
// UTILITY HELPERS FACADE (FACADE DE HELPERS)
// Re-exporta todos os submódulos para manter 100% de retrocompatibilidade.
// ===================================================================

export {
  initJidLidCache,
  saveJidLidCache,
  getLidFromJidCached,
  getJidFromLid,
  addJidLidToCache,
  normalizeMessageContent,
  convertIdsToLid,
  idsMatch,
  idInArray,
  findInBlacklistMap,
  normalizeUserId,
  flushJidLidCache,
  isGroupId,
  isUserId,
  isValidLid,
  isValidJid,
  removeDeviceId,
  getUserName,
  getLidFromJid,
  buildUserId,
  getBotId
} from './helpers/jidLidResolver.js';

export {
  ensureDirectoryExists,
  ensureJsonFileExists,
  loadJsonFile,
  clearJsonFileCache,
  createBackup,
  recoverFromBackup,
  sanitizeJsonString,
  loadJsonFileSafe,
  saveJsonFileSafe,
  saveJsonFileAsync,
  debouncedSaveJson,
  flushAllDebouncedSaves
} from './helpers/jsonIo.js';

export {
  validateAndRepairData,
  validateLevelingUser,
  validateEconomyUser,
  validateGroupData
} from './helpers/dataValidators.js';

export {
  parseCustomCommandMeta,
  buildUsageFromParams,
  parseArgsFromString,
  normalizeParamName,
  validateParamValue
} from './helpers/paramParser.js';

export {
  PARAM_ALIASES,
  formatUptime,
  normalizar,
  normalizeClanName,
  normalizeParam,
  compareParams,
  findKeyIgnoringAccents,
  findInArrayIgnoringAccents,
  timeLeft,
  resolveParamAlias,
  matchParam,
  escapeRegExp,
  formatAIResponse
} from './helpers/formatting.js';