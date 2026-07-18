// ==================== DATABASE ECONOMY ====================
// Sistema de economia RPG: load/save, migração, defaults, diagnóstico.

import { loadJsonFileSafe, saveJsonFileSafe, debouncedSaveJson, getUserName } from '../helpers.js';
import { ECONOMY_FILE, LEVELING_FILE } from '../paths.js';
import { migrateAndValidatePet } from './economyPets.js';
import { ensureShopDefaults } from './economyShop.js';

// ====== Leveling Helpers (usados aqui e exportados) ======

export function calculateNextLevelXp(level) {
  return Math.floor(100 * Math.pow(1.1, level - 1));
}

export function getPatent(level, patents) {
  for (let i = patents.length - 1; i >= 0; i--) {
    if (level >= patents[i].minLevel) {
      return patents[i].name;
    }
  }
  return "Iniciante";
}

// ====== Economy Load/Save ======

export function loadEconomy() {
  const defaultEconomy = { users: {}, shop: {}, jobCatalog: {}, stockMarket: {}, treasury: 0, auctions: [], lottery: null };
  try {
    const data = loadJsonFileSafe(ECONOMY_FILE, defaultEconomy);
    if (!data || typeof data !== 'object') return defaultEconomy;
    if (!data.users || typeof data.users !== 'object') data.users = {};
    if (!data.shop || typeof data.shop !== 'object') data.shop = {};
    if (!data.jobCatalog || typeof data.jobCatalog !== 'object') data.jobCatalog = {};
    const needsSave = ensureEconomyDefaults(data);
    if (needsSave) {
      console.log('🔧 Sistema de migração detectou e corrigiu dados faltantes/incorretos');
      saveEconomy(data);
    }
    return data;
  } catch (error) {
    console.error('❌ Erro crítico ao carregar economia:', error.message);
    return defaultEconomy;
  }
}

export function saveEconomy(data) {
  try {
    if (!data || typeof data !== 'object') {
      console.error('❌ Tentativa de salvar economia com dados inválidos');
      return false;
    }
    debouncedSaveJson(ECONOMY_FILE, data, 5000);
    return true;
  } catch (e) {
    console.error('❌ Erro ao salvar economy.json:', e.message);
    return false;
  }
}

export function getEcoUser(econ, userId) {
  try {
    if (!econ || typeof econ !== 'object') {
      console.error('❌ getEcoUser: economia inválida');
      return createDefaultEcoUser();
    }
    if (!userId || typeof userId !== 'string') {
      console.error('❌ getEcoUser: userId inválido');
      return createDefaultEcoUser();
    }
    econ.users = econ.users || {};
    if (!econ.users[userId]) {
      econ.users[userId] = createDefaultEcoUser();
      return econ.users[userId];
    }
    econ.users[userId] = migrateAndValidateEcoUser(econ.users[userId]);
    return econ.users[userId];
  } catch (error) {
    console.error('❌ Erro em getEcoUser:', error.message);
    return createDefaultEcoUser();
  }
}

export function createDefaultEcoUser() {
  return {
    wallet: 0, bank: 0,
    cooldowns: {}, inventory: {}, items: {},
    job: null, tools: {}, materials: {},
    challenge: null, weeklyChallenge: null, monthlyChallenge: null,
    level: 1, exp: 0, prestige: 0, classe: null, clan: null, house: null, family: null,
    power: 100, hp: 100, maxHp: 100, mana: 50, maxMana: 50, stamina: 100, maxStamina: 100,
    strength: 10, defense: 10, agility: 10, intelligence: 10, luck: 10,
    attackBonus: 0, defenseBonus: 0,
    skills: {}, properties: {},
    pets: [], lastPetBattle: 0,
    totalWork: 0, totalMine: 0, totalFish: 0, totalHunt: 0, totalExplore: 0, totalCrime: 0,
    battlesWon: 0, battlesLost: 0,
    lotteryTickets: 0,
    lombraLevel: 0,
    calmaLevel: 0,
    createdAt: Date.now(), lastDaily: 0, lastWeekly: 0, lastMonthly: 0
  };
}

export function migrateAndValidateEcoUser(user) {
  const validateNumber = (value, defaultValue = 0, min = 0, max = Infinity) => {
    if (typeof value !== 'number' || isNaN(value)) return defaultValue;
    return Math.max(min, Math.min(max, Math.floor(value)));
  };
  const validateObject = (value, defaultValue = {}) => {
    return (value && typeof value === 'object' && !Array.isArray(value)) ? value : defaultValue;
  };
  const validateArray = (value, defaultValue = []) => {
    return Array.isArray(value) ? value : defaultValue;
  };

  user.wallet = validateNumber(user.wallet, 0);
  user.bank = validateNumber(user.bank, 0);
  user.cooldowns = validateObject(user.cooldowns);
  user.inventory = validateObject(user.inventory);
  user.items = validateObject(user.items);
  user.tools = validateObject(user.tools);
  user.materials = validateObject(user.materials);
  user.consumableUsage = validateObject(user.consumableUsage);
  user.consumableEffects = validateObject(user.consumableEffects);
  user.lombraLevel = validateNumber(user.lombraLevel, 0, 0, 3);
  user.calmaLevel = validateNumber(user.calmaLevel, 0, 0, 3);
  user.job = user.job || null;
  user.challenge = user.challenge || null;
  user.weeklyChallenge = user.weeklyChallenge || null;
  user.monthlyChallenge = user.monthlyChallenge || null;
  user.level = validateNumber(user.level, 1, 1);
  user.exp = validateNumber(user.exp, 0);
  user.prestige = validateNumber(user.prestige, 0);
  user.classe = user.classe || null;
  user.clan = user.clan || null;
  user.house = user.house || null;
  user.family = user.family || null;
  user.power = validateNumber(user.power, 100);
  user.hp = validateNumber(user.hp, 100);
  user.maxHp = validateNumber(user.maxHp, 100);
  user.mana = validateNumber(user.mana, 50);
  user.maxMana = validateNumber(user.maxMana, 50);
  user.stamina = validateNumber(user.stamina, 100);
  user.maxStamina = validateNumber(user.maxStamina, 100);
  user.strength = validateNumber(user.strength, 10);
  user.defense = validateNumber(user.defense, 10);
  user.agility = validateNumber(user.agility, 10);
  user.intelligence = validateNumber(user.intelligence, 10);
  user.luck = validateNumber(user.luck, 10);
  user.attackBonus = validateNumber(user.attackBonus, 0);
  user.defenseBonus = validateNumber(user.defenseBonus, 0);
  user.skills = validateObject(user.skills);
  user.properties = validateObject(user.properties);
  user.pets = validateArray(user.pets);
  user.lastPetBattle = validateNumber(user.lastPetBattle, 0);
  if (user.pets.length > 0) {
    user.pets = user.pets.map(pet => migrateAndValidatePet(pet));
  }
  user.totalWork = validateNumber(user.totalWork, 0);
  user.totalMine = validateNumber(user.totalMine, 0);
  user.totalFish = validateNumber(user.totalFish, 0);
  user.totalHunt = validateNumber(user.totalHunt, 0);
  user.totalExplore = validateNumber(user.totalExplore, 0);
  user.totalCrime = validateNumber(user.totalCrime, 0);
  user.battlesWon = validateNumber(user.battlesWon, 0);
  user.battlesLost = validateNumber(user.battlesLost, 0);
  user.lotteryTickets = validateNumber(user.lotteryTickets, 0);
  user.createdAt = validateNumber(user.createdAt, Date.now());
  user.lastDaily = validateNumber(user.lastDaily, 0);
  user.lastWeekly = validateNumber(user.lastWeekly, 0);
  user.lastMonthly = validateNumber(user.lastMonthly, 0);
  return user;
}

export function diagnosticDatabase(econ) {
  const report = { totalUsers: 0, usersMigrated: 0, petsFixed: 0, fieldsAdded: [], errors: [], warnings: [] };
  try {
    if (!econ || !econ.users) { report.errors.push('Estrutura de economia inválida'); return report; }
    report.totalUsers = Object.keys(econ.users).length;
    Object.entries(econ.users).forEach(([userId, user]) => {
      const oldUser = JSON.stringify(user);
      econ.users[userId] = migrateAndValidateEcoUser(user);
      if (oldUser !== JSON.stringify(econ.users[userId])) report.usersMigrated++;
      if (econ.users[userId].pets && econ.users[userId].pets.length > 0) {
        econ.users[userId].pets.forEach((pet, idx) => {
          const oldPet = JSON.stringify(pet);
          econ.users[userId].pets[idx] = migrateAndValidatePet(pet);
          if (oldPet !== JSON.stringify(econ.users[userId].pets[idx])) report.petsFixed++;
        });
      }
    });
    const globalChanged = ensureEconomyDefaults(econ);
    if (globalChanged) report.fieldsAdded.push('Estruturas globais (shop, lottery, clans, etc.)');
    if (econ.lottery && (!econ.lottery.lastDraw || econ.lottery.lastDraw < 1000000000000)) {
      report.warnings.push('Loteria tinha data inválida (corrigido)');
    }
    if (report.usersMigrated === 0 && report.petsFixed === 0 && !globalChanged) {
      report.warnings.push('Nenhum problema detectado - database está OK!');
    }
  } catch (error) { report.errors.push(`Erro no diagnóstico: ${error.message}`); }
  return report;
}

export function parseAmount(text, maxValue) {
  if (!text) return NaN;
  const t = text.trim().toLowerCase();
  if (['all', 'tudo', 'max'].includes(t)) return maxValue;
  const n = parseInt(t.replace(/[^0-9]/g, ''));
  return isNaN(n) ? NaN : Math.max(0, n);
}

export function fmt(n) { return new Intl.NumberFormat('pt-BR').format(Math.floor(n)); }

export function timeLeft(targetMs) {
  const diff = targetMs - Date.now();
  if (diff <= 0) return '0s';
  const s = Math.ceil(diff / 1000);
  const m = Math.floor(s / 60); const rs = s % 60; const h = Math.floor(m / 60); const rm = m % 60;
  return h > 0 ? `${h}h ${rm}m` : (m > 0 ? `${m}m ${rs}s` : `${rs}s`);
}

export function applyShopBonuses(user, econ) {
  const inv = user.inventory || {};
  const shop = econ.shop || {};
  let mineBonus = 0; let workBonus = 0; let bankCapacity = 10000; let fishBonus = 0; let exploreBonus = 0; let huntBonus = 0; let forgeBonus = 0;
  Object.entries(inv).forEach(([key, qty]) => {
    if (!qty || !shop[key]) return;
    const eff = shop[key].effect || {};
    if (eff.mineBonus) mineBonus += eff.mineBonus * qty;
    if (eff.workBonus) workBonus += eff.workBonus * qty;
    if (eff.bankCapacity) bankCapacity = bankCapacity + eff.bankCapacity * qty;
    if (eff.fishBonus) fishBonus += eff.fishBonus * qty;
    if (eff.exploreBonus) exploreBonus += eff.exploreBonus * qty;
    if (eff.huntBonus) huntBonus += eff.huntBonus * qty;
    if (eff.forgeBonus) forgeBonus += eff.forgeBonus * qty;
  });
  return { mineBonus, workBonus, bankCapacity, fishBonus, exploreBonus, huntBonus, forgeBonus };
}

export function getRewardMultipliers(user) {
  let xpMultiplier = 1.0;
  let coinMultiplier = 1.0;

  if (user.permanentBoost) {
    xpMultiplier += 0.5;
    coinMultiplier += 0.5;
  }

  const now = Date.now();
  if (user.activeBoosts) {
    if ((user.activeBoosts.xp && user.activeBoosts.xp.expires > now) || 
        (user.activeBoosts.mega && user.activeBoosts.mega.expires > now)) {
      xpMultiplier += 1.0;
    }
    if ((user.activeBoosts.money && user.activeBoosts.money.expires > now) || 
        (user.activeBoosts.mega && user.activeBoosts.mega.expires > now)) {
      coinMultiplier += 0.5;
    }
  }

  return { xpMultiplier, coinMultiplier };
}


export function ensureEconomyDefaults(econ) {
  return ensureShopDefaults(econ, migrateAndValidateEcoUser);
}
