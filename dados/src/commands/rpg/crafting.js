import { PREFIX } from "../../config.js";

export default {
  name: "crafting",
  description: "Sistema de encantamento e reciclagem de itens",
  commands: ["desmontar", "dismantle", "encantar", "enchant"],
  usage: `${PREFIX}encantar`,
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
    if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
    if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);
    
    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);

    // --- ENCANTAR ---
    if (command === 'encantar' || command === 'enchant') {
      if (!me.equipment || !me.equipment.weapon) {
        return reply(`❌ Você não tem uma arma equipada!\n\n💡 Use ${prefix}equipar para equipar uma arma`);
      }
      
      const weapon = me.equipment.weapon;
      const enchantLevel = weapon.enchant || 0;
      
      if (enchantLevel >= 10) return reply('❌ Sua arma já está no encantamento máximo (+10)!');
      
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
      
      if (args[0].toLowerCase() !== 'confirmar') return reply('❌ Use "confirmar" para prosseguir');
      
      if ((me.wallet || 0) < cost) return reply(`💰 Você precisa de ${cost.toLocaleString('pt-BR')} moedas!`);
      if (!me.materials || (me.materials.cristal || 0) < crystals) {
        return reply(`💎 Você precisa de ${crystals}x cristais!`);
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
          return reply(`💀 *FALHA CRÍTICA!*\n\n⚠️ Sua arma foi destruída no processo...\n\n❌ Você perdeu: ${weapon.emoji || ''} ${weapon.name} +${enchantLevel}`);
        } else {
          saveEconomy(econ);
          return reply(`❌ *FALHA!*\n\n⚠️ O encantamento falhou, mas sua arma permaneceu intacta.\n\n💸 Perdeu: ${cost.toLocaleString('pt-BR')}\n💎 Perdeu: ${crystals}x cristais`);
        }
      }
    }

    // --- DESMONTAR ---
    if (command === 'desmontar' || command === 'dismantle') {
      if (!me.inventory || Object.keys(me.inventory).length === 0) {
        return reply(`❌ Seu inventário está vazio!\n\n💡 Consiga equipamentos em masmorras`);
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
        return reply('❌ Você não tem este item!');
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
