
export default {
  name: "prestige",
  description: "Sistema de prestige e evolução final",
  commands: ["evoluir", "evolucao", "prestige"],
  usage: "{prefix}evoluir",
  handle: async ({ 
    reply, 
    isGroup, 
    groupData, 
    sender, 
    prefix, 
    pushname, 
    args,
    loadEconomy, 
    saveEconomy, 
    getEcoUser,
    MESSAGES
  }) => {
    if (!isGroup) return reply(MESSAGES.rpg.core.groupOnly);
    if (!groupData.modorpg) return reply(MESSAGES.rpg.core.disabled(prefix));
    
    const q = args ? args.join(" ").toLowerCase() : "";

    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);
    
    if (!me.prestige) me.prestige = { level: 0, bonusMultiplier: 1 };
    
    const reqLevel = 50 + (me.prestige.level * 25);
    const reqMoney = 1000000 * (me.prestige.level + 1);
    
    if (!q || q === 'info') {
      return reply(MESSAGES.rpg.prestige.info(
        me.prestige.level, 
        (me.prestige.level * 10), 
        me.level || 1, 
        reqLevel, 
        me.wallet.toLocaleString(), 
        reqMoney.toLocaleString(), 
        prefix
      ));
    }

    if (q === 'confirmar') {
      if ((me.level || 1) < reqLevel) return reply(MESSAGES.rpg.prestige.needLevel(reqLevel));
      if (me.wallet < reqMoney) return reply(MESSAGES.rpg.prestige.needMoney(reqMoney.toLocaleString()));
      
      me.prestige.level++;
      me.level = 1;
      me.exp = 0;
      me.wallet = 1000;
      me.bank = 0;
      me.prestige.bonusMultiplier += 0.1;
      
      saveEconomy(econ);
      return reply(MESSAGES.rpg.prestige.success(pushname, me.prestige.level));
    }
  }
};
