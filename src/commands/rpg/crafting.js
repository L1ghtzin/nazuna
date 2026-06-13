
export default {
  name: "crafting",
  description: "Sistema de encantamento e reciclagem de itens",
  commands: ["desmontar", "dismantle"],
  usage: "{prefix}encantar",
  handle: async ({ 
    reply, 
    isGroup, 
    groupData, 
    sender, 
    prefix, 
    pushname, 
    command,
    args,
    loadEconomy, 
    saveEconomy, 
    getEcoUser,
    MESSAGES
  }) => {
    if (!isGroup) return reply(MESSAGES.rpg.groupOnly);
    if (!groupData.modorpg) return reply(MESSAGES.rpg.disabled(prefix));
    
    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);

    // --- ENCANTAR ---
    if (command === 'encantar' || command === 'enchant') {
      if (!me.equipment || !me.equipment.weapon) {
        return reply(MESSAGES.rpg.crafting.noWeapon(prefix));
      }
      
      const weapon = me.equipment.weapon;
      const enchantLevel = weapon.enchant || 0;
      
      if (enchantLevel >= 10) return reply(MESSAGES.rpg.crafting.maxEnchant);
      
      const cost = (enchantLevel + 1) * 5000;
      const crystals = (enchantLevel + 1) * 3;
      
      if (!args[0]) {
        let text = `╭━━━✧ *ENCANTAR* ✧━━━╮\n`;
        text += `│ Arma: ${weapon.emoji || ''} *${weapon.name}*\n`;
        text += `│ Encantamento: +${enchantLevel}\n`;
        text += `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
        text += `🔮 Próximo nível: +${enchantLevel + 1}\n`;
        text += `│\n`;
        text += `│ 💰 Custo: ${cost.toLocaleString('pt-BR')}\n`;
        text += `│ 💎 Cristais: ${crystals}x\n`;
        text += `│ ⚔️ ATK: +${(enchantLevel + 1) * 5}\n`;
        text += `│ 📊 Chance: ${Math.max(30, 90 - (enchantLevel * 6))}%\n`;
        text += `│\n\n`;
        text += `⚠️ Falha pode destruir a arma!\n\n`;
        text += `💡 Use ${prefix}encantar confirmar`;
        return reply(text);
      }
      
      if (args[0].toLowerCase() !== 'confirmar') return reply(MESSAGES.rpg.crafting.confirmNeed);
      
      if ((me.wallet || 0) < cost) return reply(MESSAGES.rpg.crafting.insufficientFunds(cost.toLocaleString('pt-BR')));
      if (!me.materials || (me.materials.cristal || 0) < crystals) {
        return reply(MESSAGES.rpg.crafting.crystalsNeeded(crystals));
      }
      
      me.wallet -= cost;
      me.materials.cristal -= crystals;
      
      const chance = Math.max(30, 90 - (enchantLevel * 6));
      const success = Math.random() * 100 < chance;
      
      if (success) {
        weapon.enchant = (weapon.enchant || 0) + 1;
        weapon.attack = (weapon.attack || 0) + 5;
        
        let text = `╭━━━✧ *SUCESSO!* ✧━━━╮\n`;
        text += `│ ${weapon.emoji || ''} ${weapon.name} +${weapon.enchant}\n`;
        text += `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
        text += `✨ Encantamento realizado!\n\n`;
        text += `⚔️ ATK: ${weapon.attack}\n`;
        text += `🔥 Bônus: +${weapon.enchant * 5}\n\n`;
        text += `💪 Sua arma está mais poderosa!`;
        
        saveEconomy(econ);
        return reply(text);
      } else {
        if (enchantLevel >= 5 && Math.random() < 0.3) {
          delete me.equipment.weapon;
          saveEconomy(econ);
          return reply(MESSAGES.rpg.crafting.craftCritFail(weapon.emoji || '', weapon.name, enchantLevel));
        } else {
          saveEconomy(econ);
          return reply(MESSAGES.rpg.crafting.craftFail(cost.toLocaleString('pt-BR'), crystals));
        }
      }
    }

    // --- DESMONTAR ---
    if (command === 'desmontar' || command === 'dismantle') {
      if (!me.inventory || Object.keys(me.inventory).length === 0) {
        return reply(MESSAGES.rpg.crafting.emptyInventory);
      }
      
      if (!args[0]) {
        let text = `╭━━━⚒️ *DESMONTAR* ⚒️━━━╮\n`;
        text += `│ Desmonte itens por materiais\n`;
        text += `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
        text += `📦 *SEU INVENTÁRIO:*\n\n`;
        
        let index = 1;
        for (const [item, qty] of Object.entries(me.inventory)) {
          if (qty > 0) {
            text += `${index}. ${item} (${qty}x)\n`;
            index++;
          }
        }
        
        text += `\n💡 Use ${prefix}desmontar <nome do item>`;
        return reply(text);
      }
      
      const itemName = args.join(' ').toLowerCase();
      if (!me.inventory[itemName] || me.inventory[itemName] <= 0) {
        return reply(MESSAGES.rpg.itemNotFound);
      }
      
      me.inventory[itemName]--;
      
      if (!me.materials) me.materials = {};
      
      const materials = ['ferro', 'madeira', 'couro', 'cristal'];
      const gained = {};
      
      materials.forEach(mat => {
        const amount = Math.floor(Math.random() * 5) + 1;
        me.materials[mat] = (me.materials[mat] || 0) + amount;
        gained[mat] = amount;
      });
      
      let text = `╭━━━⚒️ *DESMONTADO* ⚒️━━━╮\n`;
      text += `│ Item: ${itemName}\n`;
      text += `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      text += `📦 *MATERIAIS OBTIDOS:*\n\n`;
      
      for (const [mat, amt] of Object.entries(gained)) {
        text += `  ${mat}: +${amt}\n`;
      }
      
      text += `\n💡 Use materiais para craftar e encantar!`;
      
      saveEconomy(econ);
      return reply(text);
    }
  }
};
