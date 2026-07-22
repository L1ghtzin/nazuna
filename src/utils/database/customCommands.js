// ==================== DATABASE CUSTOM COMMANDS ====================
// Comandos personalizados, apelidos (aliases), comandos sem prefixo e limites de comandos.

import fs from 'fs';
import { ensureDirectoryExists, loadJsonFile, normalizar , debouncedSaveJson} from '../helpers.js';
import {
  DATABASE_DIR,
  DONO_DIR,
  CUSTOM_COMMANDS_FILE,
  NO_PREFIX_COMMANDS_FILE,
  COMMAND_ALIASES_FILE,
  CMD_LIMIT_FILE
} from '../paths.js';

// ==================== COMANDOS PERSONALIZADOS ====================

export const loadCustomCommands = () => {
  try {
    const data = loadJsonFile(CUSTOM_COMMANDS_FILE, { commands: [] });
    return Array.isArray(data.commands) ? data.commands : [];
  } catch (error) {
    console.error('❌ Erro ao carregar comandos personalizados:', error);
    return [];
  }
};

export const saveCustomCommands = (commands) => {
  try {
    ensureDirectoryExists(DONO_DIR);
    debouncedSaveJson(CUSTOM_COMMANDS_FILE, { commands }, 1000);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar comandos personalizados:', error);
    return false;
  }
};

export const removeCustomCommand = (predicate) => {
  try {
    const commands = loadCustomCommands();
    const filtered = commands.filter(cmd => !predicate(cmd));
    if (filtered.length === commands.length) {
      return { removed: false, commands };
    }
    const success = saveCustomCommands(filtered);
    return { removed: success, commands: filtered };
  } catch (error) {
    console.error('❌ Erro ao remover comando personalizado:', error);
    return { removed: false, commands: [] };
  }
};

export const findCustomCommand = (trigger) => {
  try {
    const normalized = normalizar(trigger || '').replace(/\s+/g, '');
    if (!normalized) return null;
    const commands = loadCustomCommands();
    return commands.find(cmd => cmd.trigger === normalized) || null;
  } catch (error) {
    console.error('❌ Erro ao buscar comando personalizado:', error);
    return null;
  }
};

// ==================== COMANDOS SEM PREFIXO ====================

export const loadNoPrefixCommands = () => {
  return loadJsonFile(NO_PREFIX_COMMANDS_FILE, {
    commands: []
  }).commands || [];
};

export const saveNoPrefixCommands = commands => {
  try {
    ensureDirectoryExists(DATABASE_DIR);
    debouncedSaveJson(NO_PREFIX_COMMANDS_FILE, {
      commands
    }, 1000);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar comandos sem prefixo:', error);
    return false;
  }
};

export const addNoPrefix = (trigger, command, fixedParams = '') => {
  const commands = loadNoPrefixCommands();
  const index = commands.findIndex(c => c.trigger === trigger);
  if (index !== -1) {
    commands[index] = { trigger, command, fixedParams };
  } else {
    commands.push({ trigger, command, fixedParams });
  }
  return saveNoPrefixCommands(commands);
};

export const removeNoPrefix = (index) => {
  const commands = loadNoPrefixCommands();
  if (index < 0 || index >= commands.length) return false;
  commands.splice(index, 1);
  return saveNoPrefixCommands(commands);
};

export const listNoPrefix = () => {
  return loadNoPrefixCommands();
};

let cachedAliases = null;

export const loadCommandAliases = () => {
  if (cachedAliases !== null) return cachedAliases;
  cachedAliases = loadJsonFile(COMMAND_ALIASES_FILE, {
    aliases: []
  }, true).aliases || [];
  return cachedAliases;
};

export const saveCommandAliases = aliases => {
  try {
    cachedAliases = Array.isArray(aliases) ? [...aliases] : aliases;
    ensureDirectoryExists(DATABASE_DIR);
    debouncedSaveJson(COMMAND_ALIASES_FILE, {
      aliases
    }, 1000);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar apelidos de comandos:', error);
    return false;
  }
};

export const addAlias = (alias, command) => {
  const aliases = loadCommandAliases();
  const index = aliases.findIndex(a => a.alias === alias);
  if (index !== -1) {
    aliases[index].command = command;
  } else {
    aliases.push({ alias, command });
  }
  return saveCommandAliases(aliases);
};

export const removeAlias = (alias) => {
  const aliases = loadCommandAliases();
  const newAliases = aliases.filter(a => a.alias !== alias);
  return saveCommandAliases(newAliases);
};

export const listAliases = () => {
  return loadCommandAliases();
};

// ==================== LIMITES DE COMANDOS ====================

export const loadCommandLimits = () => {
  const data = loadJsonFile(CMD_LIMIT_FILE, {
    commands: {},
    users: {}
  });
  if (!data || typeof data !== 'object') {
    return { commands: {}, users: {} };
  }
  return {
    ...data,
    commands: data.commands && typeof data.commands === 'object' ? data.commands : {},
    users: data.users && typeof data.users === 'object' ? data.users : {}
  };
};

export const saveCommandLimits = (data) => {
  try {
    ensureDirectoryExists(DATABASE_DIR);
    debouncedSaveJson(CMD_LIMIT_FILE, data, 1000);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar limites de comandos:', error);
    return false;
  }
};

export const addCommandLimit = (commandName, maxUses, timeFrame) => {
  try {
    const limitsData = loadCommandLimits();
    
    if (!commandName || typeof commandName !== 'string') {
      return {
        success: false,
        message: '❌ Nome do comando inválido!'
      };
    }
    
    const cmdName = commandName.toLowerCase().trim();
    
    if (!maxUses || maxUses <= 0 || !Number.isInteger(maxUses)) {
      return {
        success: false,
        message: '❌ Número de usos deve ser um inteiro positivo!'
      };
    }
    
    if (!timeFrame || typeof timeFrame !== 'string') {
      return {
        success: false,
        message: '❌ Período de tempo inválido!'
      };
    }
    
    const timeFrameRegex = /^(\d+)([smhd])$/i;
    if (!timeFrameRegex.test(timeFrame)) {
      return {
        success: false,
        message: '❌ Formato de tempo inválido! Use formatos como: 30m (30 minutos), 1h (1 hora), 1d (1 dia)'
      };
    }
    
    if (limitsData.commands[cmdName]) {
      return {
        success: false,
        message: `❌ O comando ${cmdName} já possui um limite configurado!`
      };
    }
    
    limitsData.commands[cmdName] = {
      maxUses: maxUses,
      timeFrame: timeFrame,
      createdAt: new Date().toISOString()
    };
    
    if (saveCommandLimits(limitsData)) {
      return {
        success: true,
        message: `✅ Limite adicionado para o comando ${cmdName}!\n📊 Máximo: ${maxUses} usos por ${timeFrame} por usuário`
      };
    } else {
      return {
        success: false,
        message: '❌ Erro ao salvar o limite do comando!'
      };
    }
  } catch (error) {
    console.error('❌ Erro ao adicionar limite de comando:', error);
    return {
      success: false,
      message: '❌ Erro interno ao adicionar limite!'
    };
  }
};

export const removeCommandLimit = (commandName) => {
  try {
    const limitsData = loadCommandLimits();
    
    if (!commandName || typeof commandName !== 'string') {
      return {
        success: false,
        message: '❌ Nome do comando inválido!'
      };
    }
    
    const cmdName = commandName.toLowerCase().trim();
    
    if (!limitsData.commands[cmdName]) {
      return {
        success: false,
        message: `❌ O comando ${cmdName} não possui limite configurado!`
      };
    }
    
    delete limitsData.commands[cmdName];
    
    if (saveCommandLimits(limitsData)) {
      return {
        success: true,
        message: `✅ Limite removido do comando ${cmdName}!`
      };
    } else {
      return {
        success: false,
        message: '❌ Erro ao remover o limite do comando!'
      };
    }
  } catch (error) {
    console.error('❌ Erro ao remover limite de comando:', error);
    return {
      success: false,
      message: '❌ Erro interno ao remover limite!'
    };
  }
};

export const getCommandLimits = () => {
  try {
    const limitsData = loadCommandLimits();
    return limitsData.commands || {};
  } catch (error) {
    console.error('❌ Erro ao carregar limites de comandos:', error);
    return {};
  }
};

export const checkCommandLimit = (commandName, userId) => {
  try {
    const limitsData = loadCommandLimits();
    const cmdName = commandName.toLowerCase().trim();
    const commandLimit = limitsData.commands[cmdName];
    
    if (!commandLimit) {
      return {
        limited: false,
        message: null
      };
    }
    
    limitsData.users[cmdName] = limitsData.users[cmdName] || {};
    const userUsage = limitsData.users[cmdName][userId] || { uses: 0, resetTime: 0 };
    
    const now = Date.now();
    
    if (now >= userUsage.resetTime) {
      userUsage.uses = 0;
      userUsage.resetTime = now + parseTimeFrame(commandLimit.timeFrame);
    }
    
    if (userUsage.uses >= commandLimit.maxUses) {
      const timeLeft = userUsage.resetTime - now;
      return {
        limited: true,
        message: `🚫 Comando ${cmdName} bloqueado! Tente novamente em ${formatTimeLeft(timeLeft)}.`,
        resetTime: userUsage.resetTime
      };
    }
    
    userUsage.uses++;
    userUsage.lastUsed = now;
    limitsData.users[cmdName][userId] = userUsage;
    
    saveCommandLimits(limitsData);
    
    return {
      limited: false,
      message: null,
      remainingUses: commandLimit.maxUses - userUsage.uses
    };
  } catch (error) {
    console.error('❌ Erro ao verificar limite de comando:', error);
    return {
      limited: false,
      message: null
    };
  }
};

export const parseTimeFrame = (timeFrame) => {
  const match = timeFrame.match(/^(\d+)([smhd])$/i);
  if (!match) return 0;
  
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 0;
  }
};

export const formatTimeLeft = (milliseconds) => {
  if (milliseconds <= 0) return '0s';
  
  const seconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  } else if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  } else if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${seconds}s`;
  }
};
