import { PREFIX } from "../../config.js";

export default {
  name: "prestige",
  description: "Sistema de prestige e evolução final",
  commands: ["evoluir", "evolucao", "prestige"],
  usage: `${PREFIX}evoluir`,
  handle: async ({ 
    reply, 
    isGroup, 
    groupData, 
    sender, 
    prefix, 
    pushname, 
    loadEconomy, 
    saveEconomy, 
    getEcoUser,
    MESSAGES
  }) => {
    if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
    if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);
    
    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);
    
    if (!me.prestige) me.prestige = { level: 0, bonusMultiplier: 1 };
    
    const reqLevel = 50 + (me.prestige.level * 25);
    const reqMoney = 1000000 * (me.prestige.level + 1);
    
    if (!q || q === 'info') {
      let text = `╭━━━⊱ ✨ *PRESTIGE* ⊱━━━╮\n`;
      text += `│ Nível Atual: ${me.prestige.level}\n`;
      text += `│ Bônus: +${(me.prestige.level * 10)}% ganhos\n`;
      text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      text += `🚀 *REQUISITOS PARA EVOLUIR:*\n`;
      text += `• Nível: ${me.level || 1}/${reqLevel}\n`;
      text += `• Dinheiro: ${me.wallet.toLocaleString()}/${reqMoney.toLocaleString()}\n\n`;
      text += `⚠️ *AVISO:* Evoluir resetará seu nível e dinheiro, mas dará bônus permanentes!\n\n`;
      text += `💡 Use ${prefix}evoluir confirmar para prosseguir.`;
      return reply(text);
    }

    if (q === 'confirmar') {
      if ((me.level || 1) < reqLevel) return reply(`💔 Você precisa ser Lv.${reqLevel}!`);
      if (me.wallet < reqMoney) return reply(`💰 Você precisa de ${reqMoney.toLocaleString()}!`);
      
      me.prestige.level++;
      me.level = 1;
      me.exp = 0;
      me.wallet = 1000;
      me.bank = 0;
      me.prestige.bonusMultiplier += 0.1;
      
      saveEconomy(econ);
      return reply(`🌟 *EVOLUÇÃO CONCLUÍDA!*\n\n${pushname} agora é Prestige Nível ${me.prestige.level}!\n\n✨ Seus ganhos permanentes aumentaram em 10%!`);
    }
  }
};
