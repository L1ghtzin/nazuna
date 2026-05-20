// ==================== DATABASE ECONOMY ====================
// Sistema de economia RPG: load/save, migração, defaults, challenges, skills, quests, pets.

import { loadJsonFileSafe, saveJsonFileSafe, getUserName } from '../helpers.js';
import { ECONOMY_FILE, LEVELING_FILE } from '../paths.js';

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
    return saveJsonFileSafe(ECONOMY_FILE, data, true);
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

export function migrateAndValidatePet(pet) {
  if (!pet || typeof pet !== 'object') return null;
  const validateNumber = (value, defaultValue = 0) => {
    if (typeof value !== 'number' || isNaN(value)) return defaultValue;
    return Math.max(0, Math.floor(value));
  };
  const validateObject = (value, defaultValue = {}) => {
    return (value && typeof value === 'object' && !Array.isArray(value)) ? value : defaultValue;
  };
  return {
    name: pet.name || 'Pet', emoji: pet.emoji || '🐾', type: pet.type || 'lobo',
    hp: validateNumber(pet.hp, 100), maxHp: validateNumber(pet.maxHp, 100),
    attack: validateNumber(pet.attack, 15), defense: validateNumber(pet.defense, 10), speed: validateNumber(pet.speed, 18),
    element: pet.element || 'normal',
    level: validateNumber(pet.level, 1), exp: validateNumber(pet.exp, 0), evolutions: validateNumber(pet.evolutions, 0),
    hunger: validateNumber(pet.hunger, 100), mood: validateNumber(pet.mood, 100),
    wins: validateNumber(pet.wins, 0), losses: validateNumber(pet.losses, 0),
    equipment: validateObject(pet.equipment),
    lastUpdate: validateNumber(pet.lastUpdate, Date.now()), lastTrain: validateNumber(pet.lastTrain, 0),
    cost: validateNumber(pet.cost, 5000)
  };
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

// ===== Constantes =====
export const PICKAXE_TIER_MULT = { bronze: 1.0, ferro: 1.25, diamante: 1.6 };
export const PICKAXE_TIER_ORDER = { bronze: 1, ferro: 2, diamante: 3 };

export const SHOP_ITEMS = {
  "pet_sword": { name: "Espada para Pet", price: 1200, stats: { attack: 15 } },
  "pet_armor": { name: "Armadura para Pet", price: 1500, stats: { defense: 12 } },
  "pet_shield": { name: "Escudo para Pet", price: 1000, stats: { defense: 8 } },
  "pet_ring": { name: "Anel do Pet", price: 700, stats: { attack: 5, defense: 5 } },
  "dragonslayer": { name: "Mata-Dragões", price: 3000, stats: { attack: 20, critBonus: 5 }, advantage: "dragao" },
  "wolfbane": { name: "Maldição Lobisomem", price: 2500, stats: { attack: 18 }, advantage: "lobo" },
  "phoenix_feather": { name: "Pena de Fênix", price: 2800, stats: { attack: 15, speed: 10 }, advantage: "fenix" },
  "tiger_talisman": { name: "Talismã do Tigre", price: 2200, stats: { attack: 12, defense: 5 }, advantage: "tigre" },
  "eagle_eye": { name: "Olho de Águia", price: 2400, stats: { attack: 15, critBonus: 15 }, advantage: "aguia" },
  "mystic_collar": { name: "Coleira Mística", price: 3500, stats: { attack: 10, defense: 10, speed: 5 } },
  "battle_potion": { name: "Poção de Batalha", price: 500, stats: { attack: 10 }, consumable: true },
  "defense_potion": { name: "Poção de Defesa", price: 500, stats: { defense: 10 }, consumable: true },
  "evolution_stone": { name: "Pedra da Evolução", price: 10000, type: "evolution" }
};

export function getActivePickaxe(user) {
  const pk = user.tools?.pickaxe;
  if (!pk || pk.dur <= 0) return null;
  return pk;
}

export function ensureEconomyDefaults(econ) {
  let changed = false;
  econ.shop = econ.shop || {};
  econ.users = econ.users || {};
  Object.keys(econ.users).forEach(userId => {
    const oldUser = { ...econ.users[userId] };
    econ.users[userId] = migrateAndValidateEcoUser(econ.users[userId]);
    if (JSON.stringify(oldUser) !== JSON.stringify(econ.users[userId])) changed = true;
  });
  const defs = {
    "pickaxe_bronze": { name: "Picareta de Bronze", price: 500, type: "tool", toolType: "pickaxe", tier: "bronze", durability: 20, effect: { mineBonus: 0.1 } },
    "pickaxe_ferro": { name: "Picareta de Ferro", price: 1500, type: "tool", toolType: "pickaxe", tier: "ferro", durability: 60, effect: { mineBonus: 0.25 } },
    "pickaxe_diamante": { name: "Picareta de Diamante", price: 5000, type: "tool", toolType: "pickaxe", tier: "diamante", durability: 150, effect: { mineBonus: 0.5 } },
    "repairkit": { name: "Kit de Reparos", price: 350, type: "consumable", effect: { repair: 40 } }
  };
  for (const [k,v] of Object.entries(defs)) { if (!econ.shop[k]) { econ.shop[k]=v; changed=true; } }
  econ.materialsPrices = econ.materialsPrices || { pedra: 2, ferro: 6, ouro: 12, diamante: 30, madeira: 1, corda: 3, couro: 4, linha: 2, carvao: 5, cristal: 25 };
  econ.recipes = econ.recipes || {
    pickaxe_bronze: { requires: { pedra: 10, ferro: 2 }, gold: 100 }, pickaxe_ferro: { requires: { ferro: 10, ouro: 2 }, gold: 300 }, pickaxe_diamante: { requires: { ouro: 10, diamante: 4 }, gold: 1200 },
    espada_ferro: { requires: { ferro: 15, madeira: 5 }, gold: 250 }, espada_aco: { requires: { ferro: 25, carvao: 10 }, gold: 500 }, espada_diamante: { requires: { diamante: 8, ferro: 20 }, gold: 1500 },
    arco_basico: { requires: { madeira: 10, corda: 3 }, gold: 200 }, arco_reforcado: { requires: { madeira: 15, ferro: 12 }, gold: 600 },
    armadura_couro: { requires: { couro: 20, linha: 5 }, gold: 300 }, armadura_ferro: { requires: { ferro: 30, couro: 15 }, gold: 800 }, armadura_aco: { requires: { ferro: 40, carvao: 15 }, gold: 1200 },
    escudo_madeira: { requires: { madeira: 15, ferro: 5 }, gold: 150 }, escudo_ferro: { requires: { ferro: 25, madeira: 10 }, gold: 450 },
    elmo_couro: { requires: { couro: 10, linha: 3 }, gold: 200 }, elmo_ferro: { requires: { ferro: 15, couro: 8 }, gold: 400 }, elmo_aco: { requires: { ferro: 20, carvao: 8 }, gold: 700 },
    botas_couro: { requires: { couro: 12, linha: 4 }, gold: 250 }, botas_ferro: { requires: { ferro: 18, couro: 10 }, gold: 500 }, botas_aco: { requires: { ferro: 25, carvao: 10 }, gold: 900 },
    anel_ferro: { requires: { ferro: 8, ouro: 2 }, gold: 350 }, anel_ouro: { requires: { ouro: 12, diamante: 2 }, gold: 800 },
    amuleto_protecao: { requires: { cristal: 5, ouro: 8 }, gold: 1000 }, luvas_ferro: { requires: { ferro: 10, couro: 5 }, gold: 300 }, luvas_aco: { requires: { ferro: 15, carvao: 6 }, gold: 600 }
  };
  if (!Array.isArray(econ.market)) { econ.market = []; changed = true; }
  if (typeof econ.marketCounter !== 'number') { econ.marketCounter = 1; changed = true; }
  econ.propertiesCatalog = econ.propertiesCatalog || {
    casa: { name: 'Casa', price: 5000, upkeepPerDay: 50, incomeGoldPerDay: 80 },
    fazenda: { name: 'Fazenda', price: 15000, upkeepPerDay: 150, incomeMaterialsPerDay: { pedra: 6, ferro: 1 } },
    mina_privada: { name: 'Mina Privada', price: 30000, upkeepPerDay: 400, incomeMaterialsPerDay: { pedra: 12, ferro: 3, ouro: 1 } }
  };
  if (!econ.clans) { econ.clans = {}; changed = true; }
  if (typeof econ.clanCounter !== 'number') { econ.clanCounter = 1; changed = true; }
  for (const [k, c] of Object.entries(econ.clans || {})) {
    if (!Array.isArray(c.pendingInvites)) { c.pendingInvites = []; changed = true; }
  }
  if (!econ.lottery) {
    econ.lottery = { jackpot: 10000, tickets: {}, lastDraw: Date.now(), drawInterval: 86400000, ticketPrice: 100, winners: [] };
    changed = true;
  }
  if (!econ.lottery.tickets) { econ.lottery.tickets = {}; changed = true; }
  if (!econ.lottery.lastDraw || econ.lottery.lastDraw === 0 || econ.lottery.lastDraw < 1000000000000) {
    econ.lottery.lastDraw = Date.now(); changed = true;
  }
  const petItems = {
    pet_sword: { name: 'Espada de Pet', price: 1200, stats: { attack: 15 } },
    pet_armor: { name: 'Armadura de Pet', price: 1500, stats: { defense: 12 } },
    pet_shield: { name: 'Escudo de Pet', price: 1000, stats: { defense: 8 } },
    pet_ring: { name: 'Anel de Pet', price: 700, stats: { attack: 5, defense: 5 } },
    dragonslayer: { name: 'Mata-Dragões', price: 3000, stats: { attack: 20, critBonus: 5 }, advantage: 'dragao' },
    wolfbane: { name: 'Maldição Lobisomem', price: 2500, stats: { attack: 18 }, advantage: 'lobo' },
    phoenix_feather: { name: 'Pena de Fênix', price: 2800, stats: { attack: 15, speed: 10 }, advantage: 'fenix' },
    tiger_talisman: { name: 'Talismã do Tigre', price: 2200, stats: { attack: 12, defense: 5 }, advantage: 'tigre' },
    eagle_eye: { name: 'Olho de Águia', price: 2400, stats: { attack: 15, critBonus: 15 }, advantage: 'aguia' },
    mystic_collar: { name: 'Coleira Mística', price: 3500, stats: { attack: 10, defense: 10, speed: 5 } },
    battle_potion: { name: 'Poção de Batalha', price: 500, stats: { attack: 10 }, consumable: true },
    defense_potion: { name: 'Poção de Defesa', price: 500, stats: { defense: 10 }, consumable: true },
    evolution_stone: { name: 'Pedra da Evolução', price: 10000, type: 'evolution' }
  };
  for (const [k, v] of Object.entries(petItems)) { if (!econ.shop[k]) { econ.shop[k] = v; changed = true; } }
  return changed;
}

export function giveMaterial(user, key, qty) {
  user.materials[key] = (user.materials[key] || 0) + Math.max(0, Math.floor(qty));
}

// ===== Challenges =====
export function generateDailyChallenge(now=new Date()) {
  const end = new Date(now); end.setHours(23,59,59,999);
  const pick = (arr,n) => arr.sort(()=>Math.random()-0.5).slice(0,n);
  const types = ['mine','work','fish','explore','hunt','crimeSuccess'];
  const chosen = pick(types,3).map(t=>({ type:t, target: 3 + Math.floor(Math.random()*5), progress:0 }));
  const reward = 300 + Math.floor(Math.random()*401);
  return { expiresAt: end.getTime(), tasks: chosen, reward, claimed:false };
}

export function ensureUserChallenge(user) {
  const now = Date.now();
  if (!user.challenge || now > (user.challenge.expiresAt||0)) user.challenge = generateDailyChallenge(new Date());
}

export function updateChallenge(user, type, inc=1, successFlag=true) {
  ensureUserChallenge(user);
  const ch = user.challenge; if (!ch || ch.claimed) return;
  ch.tasks.forEach(task => {
    if (task.type === type) {
      if (type.endsWith('Success')) { if (!successFlag) return; }
      task.progress = Math.min(task.target, (task.progress||0) + inc);
    }
  });
}

export function isChallengeCompleted(user) {
  const ch = user.challenge; if (!ch) return false;
  return ch.tasks.every(t => (t.progress||0) >= t.target);
}

export function updateQuestProgress(user, questType, inc = 1) {
  if (!user.quests || !user.quests.daily || !Array.isArray(user.quests.daily)) return;
  const questIdMap = { 'duel': 'duel_3', 'dungeon': 'dungeon_2', 'gather': 'gather_10', 'cook': 'cook_5', 'train_pet': 'train_pet' };
  const questId = questIdMap[questType] || questType;
  user.quests.daily.forEach(quest => {
    if (quest.id === questId && quest.progress < quest.goal) {
      quest.progress = Math.min(quest.goal, (quest.progress || 0) + inc);
    }
  });
}

export function checkEcoLevelUp(user) {
  let leveledUp = false;
  let expRequired = 100 * Math.pow(1.5, (user.level || 1) - 1);
  let iterations = 0;
  while (user.exp >= expRequired && iterations < 100) {
    user.exp -= expRequired;
    user.level = (user.level || 1) + 1;
    expRequired = 100 * Math.pow(1.5, (user.level || 1) - 1);
    leveledUp = true;
    iterations++;
  }
  return { leveledUp, newLevel: user.level || 1 };
}

// ===== Skills =====
export const SKILL_LIST = ['mining','working','fishing','exploring','hunting','forging','crime'];

export function ensureUserSkills(user) {
  user.skills = user.skills || {};
  for (const s of SKILL_LIST) { user.skills[s] = user.skills[s] || { level: 1, xp: 0 }; }
}

export function skillXpForNext(level) {
  return Math.floor(50 * Math.pow(1.35, Math.max(0, level - 1)));
}

export function addSkillXP(user, skill, amount=1) {
  ensureUserSkills(user);
  if (!SKILL_LIST.includes(skill)) return;
  const sk = user.skills[skill];
  sk.xp += Math.max(0, Math.floor(amount));
  let leveled = 0;
  while (sk.xp >= skillXpForNext(sk.level)) {
    sk.xp -= skillXpForNext(sk.level);
    sk.level += 1; leveled++;
    if (sk.level > 1000) break;
  }
  return leveled;
}

export function getSkillBonus(user, skill) {
  ensureUserSkills(user);
  const lvl = user.skills[skill]?.level || 1;
  return 0.02 * Math.max(0, (lvl - 1));
}

// ===== Period Challenges =====
export function endOfWeekTimestamp(date=new Date()) {
  const d = new Date(date); const day = d.getDay();
  const diff = (7 - day) % 7;
  d.setDate(d.getDate() + diff); d.setHours(23,59,59,999);
  return d.getTime();
}

export function endOfMonthTimestamp(date=new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth()+1, 0, 23,59,59,999);
  return d.getTime();
}

export function generateWeeklyChallenge(now=new Date()) {
  const types = ['mine','work','fish','explore','hunt','crimeSuccess'];
  const chosen = types.sort(()=>Math.random()-0.5).slice(0,4).map(t=>({ type:t, target: 15 + Math.floor(Math.random()*16), progress:0 }));
  const reward = 3000 + Math.floor(Math.random()*2001);
  return { expiresAt: endOfWeekTimestamp(now), tasks: chosen, reward, claimed:false };
}

export function generateMonthlyChallenge(now=new Date()) {
  const types = ['mine','work','fish','explore','hunt','crimeSuccess'];
  const chosen = types.sort(()=>Math.random()-0.5).slice(0,5).map(t=>({ type:t, target: 60 + Math.floor(Math.random()*41), progress:0 }));
  const reward = 15000 + Math.floor(Math.random()*5001);
  return { expiresAt: endOfMonthTimestamp(now), tasks: chosen, reward, claimed:false };
}

export function ensureUserPeriodChallenges(user) {
  const now = Date.now();
  if (!user.weeklyChallenge || now > (user.weeklyChallenge.expiresAt||0)) user.weeklyChallenge = generateWeeklyChallenge(new Date());
  if (!user.monthlyChallenge || now > (user.monthlyChallenge.expiresAt||0)) user.monthlyChallenge = generateMonthlyChallenge(new Date());
}

export function updatePeriodChallenge(user, type, inc=1, successFlag=true) {
  ensureUserPeriodChallenges(user);
  for (const ch of [user.weeklyChallenge, user.monthlyChallenge]) {
    if (!ch || ch.claimed) continue;
    ch.tasks.forEach(task => {
      if (task.type === type) {
        if (type.endsWith('Success') && !successFlag) return;
        task.progress = Math.min(task.target, (task.progress||0) + inc);
      }
    });
  }
}

export function isPeriodCompleted(ch) {
  if (!ch) return false; return ch.tasks.every(t => (t.progress||0) >= t.target);
}

// ===== Pet Degradation =====
export function applyPetDegradation(pets) {
  if (!Array.isArray(pets) || pets.length === 0) return { changed: false };
  const now = Date.now(); const oneHour = 3600000; const oneDayInHours = 24;
  let changed = false;
  pets.forEach(pet => {
    if (!pet.lastUpdate) { pet.lastUpdate = now; changed = true; return; }
    const timePassed = now - pet.lastUpdate;
    const hoursPassed = timePassed / oneHour;
    if (hoursPassed >= 1) {
      const hungerDegrade = Math.floor(hoursPassed * (100 / oneDayInHours));
      const moodDegrade = Math.floor(hoursPassed * (100 / (oneDayInHours * 2)));
      const oldHunger = pet.hunger || 100; const oldMood = pet.mood || 100;
      pet.hunger = Math.max(0, oldHunger - hungerDegrade);
      pet.mood = Math.max(0, oldMood - moodDegrade);
      if (pet.hunger < 30) pet.mood = Math.max(0, pet.mood - Math.floor(hoursPassed * 5));
      if (pet.hunger === 0 && hoursPassed >= 2) {
        const hpLoss = Math.floor(hoursPassed * (pet.maxHp * 0.02));
        pet.hp = Math.max(1, (pet.hp || pet.maxHp) - hpLoss);
      }
      pet.lastUpdate = now; changed = true;
    }
  });
  return { changed };
}
