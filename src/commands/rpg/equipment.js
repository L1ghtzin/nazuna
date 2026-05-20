
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
  usage: "{prefix}equipamentos",
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

    // --- EQUIPAR ITEM NO PET ---
    if (command === 'equiparpet' || command === 'equippet') {
      if (!me.pets || me.pets.length === 0) return reply('🐾 Você não tem pets!');
      
      const petIndex = parseInt(args[0]) - 1;
      const itemIdQuery = args.slice(1).join('_').toLowerCase();
      
      if (isNaN(petIndex) || petIndex < 0 || petIndex >= me.pets.length) {
        return reply(`❌ Pet inválido!\n\n💡 Uso: ${prefix}equippet <nº pet> <item>`);
      }
      if (!itemIdQuery) {
        return reply(`❌ Informe o item!\n\n💡 Uso: ${prefix}equippet <nº pet> <item>`);
      }
      
      const pet = me.pets[petIndex];
      
      // Busca o item no inventário
      const foundItemId = Object.keys(me.inventory).find(key => 
        key.toLowerCase().includes(itemIdQuery) && me.inventory[key] > 0
      );
      
      if (!foundItemId) return reply('❌ Você não tem esse item no inventário!');
      
      const item = shop[foundItemId];
      if (!item) return reply('❌ Item inválido!');
      
      // Determina o slot do equipamento do pet
      let slot = 'weapon';
      const itemName = item.name || '';
      if (itemName.includes('Armadura') || itemName.includes('Armor')) slot = 'armor';
      else if (itemName.includes('Escudo') || itemName.includes('Shield')) slot = 'shield';
      else if (itemName.includes('Anel') || itemName.includes('Ring') || itemName.includes('Colar') || itemName.includes('Collar')) slot = 'accessory';
      else if (itemName.includes('Poção') || itemName.includes('Potion')) slot = 'potion';
      else if (foundItemId.includes('slayer') || foundItemId.includes('bane') || foundItemId.includes('feather') || foundItemId.includes('talisman') || foundItemId.includes('eye')) slot = 'weapon';
      
      if (!pet.equipment) pet.equipment = {};
      
      // Devolve o item antigo ao inventário se houver
      if (pet.equipment[slot]) {
        me.inventory[pet.equipment[slot]] = (me.inventory[pet.equipment[slot]] || 0) + 1;
      }
      
      // Equipa
      pet.equipment[slot] = foundItemId;
      me.inventory[foundItemId]--;
      
      saveEconomy(econ);
      
      let text = `✅ ${pet.emoji || '🐾'} *${pet.name}* equipou *${item.name}*!\n\n`;
      text += `📦 *Slot:* ${slot === 'weapon' ? '⚔️ Arma' : slot === 'armor' ? '🛡️ Armadura' : slot === 'shield' ? '🛡️ Escudo' : slot === 'accessory' ? '💍 Acessório' : '🧪 Poção'}\n\n`;
      
      if (item.stats) {
        text += `📊 *Bônus:*\n`;
        if (item.stats.attack) text += `⚔️ ATK +${item.stats.attack}\n`;
        if (item.stats.defense) text += `🛡️ DEF +${item.stats.defense}\n`;
        if (item.stats.speed) text += `⚡ SPD +${item.stats.speed}\n`;
        if (item.stats.critBonus) text += `💥 CRIT +${item.stats.critBonus}%\n`;
      }
      if (item.advantage) text += `\n✨ *Vantagem contra:* ${item.advantage}`;
      
      return reply(text);
    }

    // --- DESEQUIPAR ITEM DO PET ---
    if (command === 'desequiparpet' || command === 'unequippet') {
      if (!me.pets || me.pets.length === 0) return reply('🐾 Você não tem pets!');
      
      const petIndex = parseInt(args[0]) - 1;
      const slot = args[1]?.toLowerCase();
      
      if (isNaN(petIndex) || petIndex < 0 || petIndex >= me.pets.length) {
        return reply(`❌ Pet inválido!\n\n💡 Uso: ${prefix}desequiparpet <nº pet> <slot>\n📦 Slots: arma, armadura, escudo, acessorio, potao`);
      }
      
      const pet = me.pets[petIndex];
      if (!pet.equipment || Object.keys(pet.equipment).length === 0) {
        return reply(`❌ ${pet.emoji || '🐾'} *${pet.name}* não tem equipamentos equipados!`);
      }
      
      // Normaliza slot informado pelo usuário
      let targetSlot = null;
      if (!slot || slot.includes('acess') || slot.includes('ring') || slot.includes('anel')) targetSlot = 'accessory';
      else if (slot.includes('arma') || slot.includes('weapon')) targetSlot = 'weapon';
      else if (slot.includes('armadura') || slot.includes('armor')) targetSlot = 'armor';
      else if (slot.includes('escudo') || slot.includes('shield')) targetSlot = 'shield';
      else if (slot.includes('poca') || slot.includes('pot')) targetSlot = 'potion';
      
      if (!targetSlot || !pet.equipment[targetSlot]) {
        return reply(`❌ Slot inválido ou sem item equipado! Escolha entre: arma, armadura, escudo, acessorio, potao`);
      }
      
      const itemKey = pet.equipment[targetSlot];
      me.inventory[itemKey] = (me.inventory[itemKey] || 0) + 1;
      delete pet.equipment[targetSlot];
      
      saveEconomy(econ);
      return reply(`✅ *${itemKey}* foi removido de ${pet.emoji || '🐾'} *${pet.name}* e devolvido ao seu inventário!`);
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
