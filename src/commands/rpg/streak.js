
export default {
  name: "streak",
  description: "Sistema de streak diário e recompensas",
  commands: ["streak", "serie"],
  usage: "{prefix}streak",
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
    if (!isGroup) return reply(MESSAGES.rpg.groupOnly);
    if (!groupData.modorpg) return reply(MESSAGES.rpg.disabled(prefix));
    
    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);
    
    if (!me.streak) me.streak = { current: 0, lastClaim: 0 };
    
    const now = Date.now();
    const oneDay = 86400000;
    
    if (now - me.streak.lastClaim < oneDay) {
      const remaining = oneDay - (now - me.streak.lastClaim);
      const hours = Math.floor(remaining / 3600000);
      const mins = Math.floor((remaining % 3600000) / 60000);
      return reply(MESSAGES.rpg.streak.alreadyClaimed(hours, mins));
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
    return reply(MESSAGES.rpg.streak.claimed(me.streak.current, reward.toLocaleString()));
  }
};
