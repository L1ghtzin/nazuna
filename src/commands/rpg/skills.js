import { ensureUserSkills, skillXpForNext, SKILL_LIST } from "../../utils/database.js";

export default {
  name: "habilidades",
  description: "Ver seu nível de habilidades e estatísticas RPG",
  commands: ["habilidades", "statsrpg"],
  usage: "{prefix}habilidades\n{prefix}statsrpg",
  handle: async ({ 
    reply, 
    isGroup, 
    groupData, 
    sender, 
    prefix, 
    pushname, 
    command,
    loadEconomy, 
    saveEconomy,
    getEcoUser,
    MESSAGES
  }) => {
    if (!isGroup) return reply(MESSAGES.rpg.groupOnly);
    if (!groupData.modorpg) return reply(MESSAGES.rpg.disabled(prefix));
    
    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);
    const cmd = command.toLowerCase();

    if (cmd === 'habilidades') {
      ensureUserSkills(me);
      let text = MESSAGES.rpg.skills.menu(pushname);
      
      for (const s of SKILL_LIST) {
        const sk = me.skills[s];
        text += MESSAGES.rpg.skills.item(s.toUpperCase(), sk.level, sk.xp, skillXpForNext(sk.level));
      }
      
      return reply(text);
    }

    if (cmd === 'statsrpg') {
      if (!me.stats) me.stats = {};
      
      const totalWealth = (me.wallet || 0) + (me.bank || 0);
      const premiumItems = Object.keys(me.premiumItems || {}).length;
      const achievements = Object.keys(me.achievements || {}).length;
      const pets = (me.pets || []).length;
      
      const text = MESSAGES.rpg.skills.fullStats(
        pushname,
        (me.wallet || 0).toLocaleString('pt-BR'),
        (me.bank || 0).toLocaleString('pt-BR'),
        totalWealth.toLocaleString('pt-BR'),
        (me.donations?.total || 0).toLocaleString('pt-BR'),
        me.battlesWon || 0,
        me.battlesLost || 0,
        me.stats?.duels || 0,
        me.stats?.crimes || 0,
        me.stats?.workCount || 0,
        me.stats?.mineCount || 0,
        me.stats?.fishCount || 0,
        me.stats?.huntCount || 0,
        (me.stats?.gamblingWins || 0).toLocaleString('pt-BR'),
        (me.stats?.gamblingLosses || 0).toLocaleString('pt-BR'),
        ((me.stats?.gamblingWins || 0) - (me.stats?.gamblingLosses || 0)).toLocaleString('pt-BR'),
        me.level || 1,
        me.prestige?.level || 0,
        achievements,
        pets,
        premiumItems,
        me.reputation?.points || 0,
        me.reputation?.karma || 0,
        me.reputation?.fame || 0
      );
      
      saveEconomy(econ);
      return reply(text);
    }
  }
};
