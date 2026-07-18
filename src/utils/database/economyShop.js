// ==================== ECONOMY SHOP ====================
// SHOP_ITEMS, ensureEconomyDefaults, material prices, recipes, constants.

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
  "battle_potion": { name: "Poção de Batalha", price: 300, stats: { attack: 10 }, consumable: true },
  "defense_potion": { name: "Poção de Defesa", price: 300, stats: { defense: 10 }, consumable: true },
  "evolution_stone": { name: "Pedra da Evolução", price: 8000, type: "evolution" }
};

export function getActivePickaxe(user) {
  const pk = user.tools?.pickaxe;
  if (!pk || pk.dur <= 0) return null;
  return pk;
}

export function giveMaterial(user, key, qty) {
  user.materials[key] = (user.materials[key] || 0) + Math.max(0, Math.floor(qty));
}

export function ensureShopDefaults(econ, migrateAndValidateEcoUser) {
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
    "repairkit": { name: "Kit de Reparos", price: 200, type: "consumable", effect: { repair: 40 } },
    "mate": { name: "🧉 Mate (Chimarrão)", price: 200, type: "consumable", consumable: true, description: "Reduz cooldown de trabalhar" },
    "cerveja": { name: "🍺 Cerveja Gelada", price: 220, type: "consumable", consumable: true, description: "Reduz cooldown de explorar. Aumenta embriaguez." },
    "cigarro": { name: "🚬 Cigarro", price: 150, type: "consumable", consumable: true, description: "Reduz cooldown de pescar. Aumenta a calma." },
    "banza": { name: "🍁 Banza (Maconha)", price: 280, type: "consumable", consumable: true, description: "Reduz muito o cooldown de pescar. Dá uma lombra forte." }
  };
  for (const [k,v] of Object.entries(defs)) {
    if (!econ.shop[k] || econ.shop[k].name !== v.name || econ.shop[k].price !== v.price || econ.shop[k].description !== v.description) {
      econ.shop[k] = v;
      changed = true;
    }
  }
  econ.materialsPrices = econ.materialsPrices || { pedra: 3, ferro: 6, ouro: 12, diamante: 30, madeira: 2, corda: 5, couro: 4, linha: 3, carvao: 5, cristal: 25 };
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
    battle_potion: { name: 'Poção de Batalha', price: 300, stats: { attack: 10 }, consumable: true },
    defense_potion: { name: 'Poção de Defesa', price: 300, stats: { defense: 10 }, consumable: true },
    evolution_stone: { name: 'Pedra da Evolução', price: 8000, type: 'evolution' }
  };
  for (const [k, v] of Object.entries(petItems)) { if (!econ.shop[k]) { econ.shop[k] = v; changed = true; } }
  return changed;
}
