import { PREFIX } from "../../config.js";

// Utility for equipment bonuses
const recalcEquipmentBonuses = (me, shop) => {
  me.attackBonus = 0;
  me.defenseBonus = 0;
  me.hpBonus = 0;
  
  if (!me.equipment) return;
  
  Object.values(me.equipment).forEach(itemId => {
    if (!itemId) return;
    const item = shop[itemId];
    if (item) {
      me.attackBonus += item.attackBonus || 0;
      me.defenseBonus += item.defenseBonus || 0;
      me.hpBonus += item.hpBonus || 0;
    }
  });
  
  me.power = 100 + (me.attackBonus || 0) + (me.defenseBonus || 0);
};

export default {
  name: "equipment",
  description: "Gerenciamento de equipamentos e bônus",
  commands: ["desequipar", "desequiparpet", "encantar", "enchant", "equip", "equipamentos", "equipar", "equiparpet", "equippet", "gear", "unequip", "unequippet"],
  usage: `${PREFIX}equipamentos`,
  handle: async ({ 
    reply, 
    isGroup, 
    groupData, 
    sender, 
    prefix, 
    pushname, 
    command,
    args,
    q,
    loadEconomy, 
    saveEconomy, 
    getEcoUser,
    MESSAGES
  }) => {
    if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
    if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);
    
    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);
    const shop = econ.shop || {};
    
    if (!me.equipment) me.equipment = { weapon: null, armor: null, helmet: null, boots: null, shield: null, accessory: null };
    if (!me.inventory) me.inventory = {};

    // --- LISTAR EQUIPAMENTOS ---
    if (command === 'equipamentos' || command === 'gear') {
      recalcEquipmentBonuses(me, shop);
      let text = `╭━━━⊱ ⚔️ *EQUIPAMENTOS* ⊱━━━╮\n│ 👤 Aventureiro: *${pushname}*\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      text += `🗡️ *Arma:* ${me.equipment.weapon || '❌'}\n🛡️ *Armadura:* ${me.equipment.armor || '❌'}\n⛑️ *Capacete:* ${me.equipment.helmet || '❌'}\n👢 *Botas:* ${me.equipment.boots || '❌'}\n\n`;
      text += `📊 *Bônus Totais:*\n⚔️ Ataque: +${me.attackBonus}\n🛡️ Defesa: +${me.defenseBonus}\n❤️ Vida: +${me.hpBonus}\n✨ Poder Total: ${me.power}`;
      return reply(text);
    }

    // --- EQUIPAR ---
    if (command === 'equipar' || command === 'equip') {
      const itemId = q?.toLowerCase().trim();
      if (!itemId) return reply(`💔 Informe o item: ${prefix}equipar <item>`);
      
      const foundItemId = Object.keys(me.inventory).find(k => k.toLowerCase().includes(itemId) && me.inventory[k] > 0);
      if (!foundItemId) return reply(`💔 Item não encontrado no inventário!`);
      
      const item = shop[foundItemId];
      if (!item || item.type !== 'equipment') return reply(`💔 Este item não pode ser equipado!`);
      
      const slot = item.slot || 'accessory';
      if (me.equipment[slot]) me.inventory[me.equipment[slot]] = (me.inventory[me.equipment[slot]] || 0) + 1;
      
      me.equipment[slot] = foundItemId;
      me.inventory[foundItemId]--;
      
      recalcEquipmentBonuses(me, shop);
      saveEconomy(econ);
      return reply(`✅ Você equipou *${item.name}* no slot ${slot}!`);
    }

    // --- DESEQUIPAR ---
    if (command === 'desequipar' || command === 'unequip') {
      const slot = args[0]?.toLowerCase();
      if (!slot || !me.equipment[slot]) return reply(`💔 Informe um slot válido: arma, armadura, helmet, boots, shield, accessory`);
      
      const itemId = me.equipment[slot];
      me.inventory[itemId] = (me.inventory[itemId] || 0) + 1;
      me.equipment[slot] = null;
      
      recalcEquipmentBonuses(me, shop);
      saveEconomy(econ);
      return reply(`✅ *${itemId}* desequipado!`);
    }

    // --- ENCANTAR ---
    if (command === 'encantar' || command === 'enchant') {
      if (!me.equipment.weapon) return reply(`💔 Você precisa de uma arma equipada para encantar!`);
      const weaponId = me.equipment.weapon;
      const weapon = shop[weaponId];
      
      const cost = 5000;
      if (me.wallet < cost) return reply(`💰 Encantar custa ${cost} moedas!`);
      
      me.wallet -= cost;
      const success = Math.random() > 0.4;
      if (success) {
        me.attackBonus += 5;
        me.power += 5;
        saveEconomy(econ);
        return reply(`✨ *SUCESSO!* Sua arma brilhou intensamente! (+5 ATK)`);
      } else {
        saveEconomy(econ);
        return reply(`💨 *FALHA!* O encantamento se dissipou no ar...`);
      }
    }
  }
};
