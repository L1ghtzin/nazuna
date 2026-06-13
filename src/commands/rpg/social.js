
export default {
  name: "socialrpg",
  description: "Interações sociais e reputação no RPG",
  commands: ["abracarrpg", "baterrpg", "beijarrpg", "hugrpg", "kissrpg", "meustats", "mystats", "protect", "proteger", "rep", "reputacao", "reputation", "slaprpg", "taparpg", "votar", "vote"],
  usage: "{prefix}abracarrpg @user",
  handle: async ({ 
    reply, 
    isGroup, 
    groupData, 
    sender, 
    prefix, 
    pushname, 
    command,
    menc_jid2,
    loadEconomy, 
    saveEconomy, 
    getEcoUser,
    timeLeft,
    MESSAGES
  }) => {
    if (!isGroup) return reply(MESSAGES.rpg.groupOnly);
    if (!groupData.modorpg) return reply(MESSAGES.rpg.disabled(prefix));
    
    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);
    const target = (menc_jid2 && menc_jid2[0]) || null;

    // --- MEUSTATS ---
    if (command === 'meustats' || command === 'mystats' || command === 'statsrpg') {
      const totalWealth = (me.wallet || 0) + (me.bank || 0);
      return reply(MESSAGES.rpg.social.stats(
        pushname, 
        me.wallet.toLocaleString(), 
        me.bank.toLocaleString(), 
        totalWealth.toLocaleString(), 
        me.battlesWon || 0, 
        me.battlesLost || 0, 
        me.level || 1, 
        me.reputation?.points || 0
      ));
    }

    // --- ABRAÇAR ---
    if (command === 'abracarrpg' || command === 'hugrpg') {
      if (!target) return reply(MESSAGES.rpg.social.needTarget('abraçar'));
      if (target === sender) return reply(MESSAGES.rpg.social.cantTargetSelf('abraçar'));
      const acts = MESSAGES.rpg.social.hug;
      return reply(acts[Math.floor(Math.random() * acts.length)](pushname, target.split('@')[0]), { mentions: [target] });
    }

    // --- BEIJAR ---
    if (command === 'beijarrpg' || command === 'kissrpg') {
      if (!target) return reply(MESSAGES.rpg.social.needTarget('beijar'));
      if (target === sender) return reply(MESSAGES.rpg.social.cantTargetSelf('beijar'));
      const acts = MESSAGES.rpg.social.kiss;
      return reply(acts[Math.floor(Math.random() * acts.length)](pushname, target.split('@')[0]), { mentions: [target] });
    }

    // --- BATER ---
    if (command === 'baterrpg' || command === 'taparpg' || command === 'slaprpg') {
      if (!target) return reply(MESSAGES.rpg.social.needTarget('dar um tapa'));
      if (target === sender) return reply(MESSAGES.rpg.social.cantHitSelf);
      const acts = MESSAGES.rpg.social.slap;
      return reply(acts[Math.floor(Math.random() * acts.length)](pushname, target.split('@')[0]), { mentions: [target] });
    }

    // --- PROTEGER ---
    if (command === 'proteger' || command === 'protect') {
      if (!target) return reply(MESSAGES.rpg.social.needTarget('proteger'));
      if (target === sender) return reply(MESSAGES.rpg.social.cantProtectSelf);
      
      const protectCost = 2000;
      if (me.wallet < protectCost) return reply(MESSAGES.rpg.insufficientCoins(protectCost.toLocaleString()));
      
      me.wallet -= protectCost;
      const targetData = getEcoUser(econ, target);
      if (!targetData.protection) targetData.protection = {};
      targetData.protection.protectedBy = sender;
      targetData.protection.until = Date.now() + 3600000; // 1 hora
      
      saveEconomy(econ);
      return reply(MESSAGES.rpg.social.protect(pushname, target.split('@')[0]), { mentions: [target] });
    }

    // --- REPUTAÇÃO ---
    if (command === 'reputacao' || command === 'rep' || command === 'reputation') {
      if (!me.reputation) me.reputation = { points: 0, upvotes: 0, downvotes: 0, karma: 0, fame: 0 };
      
      const repLevel = Math.floor(me.reputation.points / 100);
      const ranks = ['Novato', 'Conhecido', 'Respeitado', 'Famoso', 'Lendário'];
      const rank = ranks[Math.min(repLevel, ranks.length - 1)];
      
      return reply(MESSAGES.rpg.social.reputation(
        pushname, me.reputation.points, me.reputation.upvotes, 
        me.reputation.downvotes, me.reputation.karma, me.reputation.fame, 
        rank, prefix
      ));
    }

    // --- VOTAR ---
    if (command === 'votar' || command === 'vote') {
      if (!target) return reply(MESSAGES.rpg.social.needTarget('votar'));
      if (target === sender) return reply(MESSAGES.rpg.social.cantTargetSelf('votar'));
      
      if (!me.lastVote) me.lastVote = {};
      const now = Date.now();
      if (me.lastVote[target] && (now - me.lastVote[target]) < 86400000) {
        return reply(MESSAGES.rpg.social.alreadyVoted(timeLeft(me.lastVote[target] + 86400000)));
      }
      
      const targetData = getEcoUser(econ, target);
      if (!targetData.reputation) targetData.reputation = { points: 0, upvotes: 0, downvotes: 0, karma: 0, fame: 0 };
      
      targetData.reputation.points += 10;
      targetData.reputation.upvotes++;
      targetData.reputation.karma += 5;
      targetData.reputation.fame++;
      
      me.lastVote[target] = now;
      saveEconomy(econ);
      return reply(MESSAGES.rpg.social.voted(pushname, target.split('@')[0]), { mentions: [target] });
    }
  }
};
