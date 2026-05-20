// ===================================================================
// DATABASE AGGREGATOR
// Centraliza todos os módulos do banco de dados e os re-exporta.
// Zero impacto em arquivos consumidores.
// ===================================================================

// Inicialização (executa side-effects como criação de diretórios e arquivos JSON padrão)
import './database/_init.js';

// Exportações dos sub-módulos
export * from './database/_core.js';
export * from './database/config.js';
export * from './database/economy.js';
export * from './database/leveling.js';
export * from './database/rental.js';
export * from './database/support.js';
export * from './database/autoResponses.js';
export * from './database/customCommands.js';
export * from './database/menuConfig.js';

// Re-exports de helpers.js para manter compatibilidade com a API legada
export {
  normalizeParam,
  compareParams,
  findKeyIgnoringAccents,
  findInArrayIgnoringAccents,
  resolveParamAlias,
  matchParam,
  PARAM_ALIASES,
  getUserName,
  loadJsonFile,
  loadJsonFileSafe,
  saveJsonFileSafe,
  validateLevelingUser,
  validateEconomyUser,
  validateGroupData,
  createBackup
} from './helpers.js';

// Re-exports de equipment.js para manter compatibilidade com a API legada
export { recalcEquipmentBonuses } from './equipment.js';