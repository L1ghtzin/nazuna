/**
 * Valida e corrige estrutura de dados comum.
 * Retorna { data, repaired } para evitar comparação O(n) via JSON.stringify.
 */
export function validateAndRepairData(data, expectedStructure) {
  if (data === null || data === undefined) {
    return { data: expectedStructure, repaired: data !== expectedStructure };
  }
  
  if (typeof expectedStructure !== 'object' || expectedStructure === null) {
    return { data, repaired: false };
  }
  
  // Se data não é objeto, retorna estrutura esperada
  if (typeof data !== 'object') {
    return { data: expectedStructure, repaired: true };
  }
  
  const result = Array.isArray(expectedStructure) ? [] : {};
  let repaired = false;
  
  // Copia dados existentes
  if (Array.isArray(expectedStructure)) {
    if (Array.isArray(data)) {
      return { data, repaired: false };
    }
    return { data: expectedStructure, repaired: true };
  }
  
  // Para objetos, garante que todas as chaves esperadas existam
  for (const key in expectedStructure) {
    if (data.hasOwnProperty(key)) {
      if (typeof expectedStructure[key] === 'object' && expectedStructure[key] !== null && !Array.isArray(expectedStructure[key])) {
        const nested = validateAndRepairData(data[key], expectedStructure[key]);
        result[key] = nested.data;
        if (nested.repaired) repaired = true;
      } else {
        result[key] = data[key];
      }
    } else {
      result[key] = expectedStructure[key];
      repaired = true;
    }
  }
  
  // Mantém chaves extras que não estão na estrutura esperada
  for (const key in data) {
    if (!result.hasOwnProperty(key)) {
      result[key] = data[key];
    }
  }
  
  return { data: result, repaired };
}

/**
 * Valida estrutura de usuário do leveling
 */
export function validateLevelingUser(user) {
  const defaultUser = {
    level: 1,
    xp: 0,
    messages: 0,
    commands: 0,
    patent: 'Iniciante',
    lastMessage: 0
  };
  
  if (!user || typeof user !== 'object') {
    return defaultUser;
  }
  
  return {
    level: typeof user.level === 'number' && user.level >= 1 ? Math.floor(user.level) : 1,
    xp: typeof user.xp === 'number' && user.xp >= 0 ? Math.floor(user.xp) : 0,
    messages: typeof user.messages === 'number' && user.messages >= 0 ? Math.floor(user.messages) : 0,
    commands: typeof user.commands === 'number' && user.commands >= 0 ? Math.floor(user.commands) : 0,
    patent: typeof user.patent === 'string' ? user.patent : 'Iniciante',
    lastMessage: typeof user.lastMessage === 'number' ? user.lastMessage : 0,
    ...user // Mantém propriedades extras
  };
}

/**
 * Valida estrutura de usuário da economia
 */
export function validateEconomyUser(user) {
  const defaultUser = {
    wallet: 0,
    bank: 0,
    level: 1,
    exp: 0,
    power: 100,
    inventory: {},
    tools: {},
    materials: {},
    pets: [],
    achievements: {},
    stats: {}
  };
  
  if (!user || typeof user !== 'object') {
    return defaultUser;
  }
  
  return {
    wallet: typeof user.wallet === 'number' ? Math.max(0, Math.floor(user.wallet)) : 0,
    bank: typeof user.bank === 'number' ? Math.max(0, Math.floor(user.bank)) : 0,
    level: typeof user.level === 'number' && user.level >= 1 ? Math.floor(user.level) : 1,
    exp: typeof user.exp === 'number' && user.exp >= 0 ? Math.floor(user.exp) : 0,
    power: typeof user.power === 'number' && user.power >= 0 ? Math.floor(user.power) : 100,
    inventory: typeof user.inventory === 'object' && user.inventory !== null ? user.inventory : {},
    tools: typeof user.tools === 'object' && user.tools !== null ? user.tools : {},
    materials: typeof user.materials === 'object' && user.materials !== null ? user.materials : {},
    pets: Array.isArray(user.pets) ? user.pets : [],
    achievements: typeof user.achievements === 'object' && user.achievements !== null ? user.achievements : {},
    stats: typeof user.stats === 'object' && user.stats !== null ? user.stats : {},
    ...user // Mantém propriedades extras
  };
}

/**
 * Valida dados de grupo
 */
export function validateGroupData(data) {
  const defaultData = {
    welcome: false,
    welcomeMsg: '',
    goodbye: false,
    goodbyeMsg: '',
    antilink: false,
    antifake: false,
    antistealth: false,
    modorpg: false,
    leveling: false
  };
  
  if (!data || typeof data !== 'object') {
    return defaultData;
  }
  
  return {
    ...defaultData,
    ...data,
    welcome: typeof data.welcome === 'boolean' ? data.welcome : false,
    goodbye: typeof data.goodbye === 'boolean' ? data.goodbye : false,
    antilink: typeof data.antilink === 'boolean' ? data.antilink : false,
    antifake: typeof data.antifake === 'boolean' ? data.antifake : false,
    antistealth: typeof data.antistealth === 'boolean' ? data.antistealth : false,
    modorpg: typeof data.modorpg === 'boolean' ? data.modorpg : false,
    leveling: typeof data.leveling === 'boolean' ? data.leveling : false
  };
}
