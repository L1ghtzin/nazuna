import { PREFIX } from "../../config.js";

export default {
  name: "streak",
  description: "Sistema de streak diário e recompensas",
  commands: ["streak", "serie", "daily"],
  usage: `${PREFIX}streak`,
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
    
    if (!me.streak) me.streak = { current: 0, lastClaim: 0 };
    
    const now = Date.now();
    const oneDay = 86400000;
    
    if (now - me.streak.lastClaim < oneDay) {
      const remaining = oneDay - (now - me.streak.lastClaim);
      const hours = Math.floor(remaining / 3600000);
      const mins = Math.floor((remaining % 3600000) / 60000);
      return reply(`⏰ Você já coletou seu daily hoje! Volte em ${hours}h ${mins}min.`);
    }

    if (now - me.streak.lastClaim < oneDay * 2) {
      me.streak.current++;
    } else {
      me.streak.current = 1;
    }
    
    const reward = 1000 + (me.streak.current * 500);
    me.wallet += reward;
    me.streak.lastClaim = now;
    
    saveEconomy(econ);
    return reply(`🔥 *STREAK DIÁRIO* 🔥\n\nDia: ${me.streak.current}\n💰 Recompensa: +${reward.toLocaleString()} moedas\n\n✨ Volte amanhã para aumentar seu streak!`);
  }
};
