import { updateQuestProgress, getRewardMultipliers } from "../../utils/database.js";

export default {
  name: "combat",
  description: "Duelos PvP e Arena de Gladiadores",
  commands: ["arena", "gladiador", "duelarrpg", "duelorpg", "duelrpg", "pvp"],
  usage: "{prefix}duelarrpg @user",
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
    menc_jid2,
    loadEconomy, 
    saveEconomy, 
    getEcoUser,
    checkEcoLevelUp,
    MESSAGES,
    bot, getLidFromJidCached, isValidJid
  }) => {
    if (!isGroup) return reply(MESSAGES.rpg.groupOnly);
    if (!groupData.modorpg) return reply(MESSAGES.rpg.disabled(prefix));
    
    const now = Date.now();

    // --- DUELO PVP ---
    if (command === 'duelarrpg' || command === 'duelorpg' || command === 'duelrpg' || command === 'pvp') {
      let target = (menc_jid2 && menc_jid2[0]) || null;
      if (!target) return reply(MESSAGES.rpg.combat.duel.needTarget);
      
      if (isValidJid(target)) {
        target = await getLidFromJidCached(bot, target) || target;
      }
      
      if (target === sender) return reply(MESSAGES.rpg.combat.duel.selfDuel);
      
      const econ = loadEconomy();
      const me = getEcoUser(econ, sender);
      
      if (me.lastDuel && (now - me.lastDuel) < 600000) {
        const remaining = Math.ceil((600000 - (now - me.lastDuel)) / 60000);
        return reply(MESSAGES.rpg.combat.duel.cooldown(remaining));
      }
      
      const opponent = getEcoUser(econ, target);
      const myPower = (me.power || 100) + (me.attackBonus || 0);
      const oppPower = (opponent.power || 100) + (opponent.attackBonus || 0);
      
      const myDefense = (me.defenseBonus || 0) + 50;
      const oppDefense = (opponent.defenseBonus || 0) + 50;
      
      let myHp = 200 + ((me.level || 1) * 10);
      let oppHp = 200 + ((opponent.level || 1) * 10);
      
      let text = MESSAGES.rpg.combat.duel.header(pushname, target?.split('@')?.[0] || 'desconhecido');
      let turn = 0;
      let battle = '';

      while (myHp > 0 && oppHp > 0 && turn < 10) {
        turn++;
        const myDmg = Math.max(5, myPower - Math.floor(Math.random() * oppDefense));
        oppHp -= myDmg;
        battle += MESSAGES.rpg.combat.duel.myDmgLine(pushname, myDmg);
        if (oppHp <= 0) break;
        
        const oppDmg = Math.max(5, oppPower - Math.floor(Math.random() * myDefense));
        myHp -= oppDmg;
        battle += MESSAGES.rpg.combat.duel.oppDmgLine(oppDmg);
      }
      
      me.lastDuel = now;
      updateQuestProgress(me, 'duel', 1);

      if (myHp > oppHp) {
        const { xpMultiplier } = getRewardMultipliers(me);
        const reward = Math.floor((opponent.wallet || 0) * 0.05);
        me.wallet += reward;
        opponent.wallet = Math.max(0, opponent.wallet - reward);
        me.exp = (me.exp || 0) + Math.floor(150 * xpMultiplier);
        
        // Incrementar estatísticas de batalha
        if (!me.battlesWon) me.battlesWon = 0;
        if (!opponent.battlesLost) opponent.battlesLost = 0;
        me.battlesWon++;
        opponent.battlesLost++;
        
        const levelUpRes = checkEcoLevelUp(me);
        saveEconomy(econ);
        
        text += battle;
        text += MESSAGES.rpg.combat.duel.win(reward.toLocaleString());
        if (levelUpRes.leveledUp) {
          text += MESSAGES.rpg.combat.duel.levelUpExt(levelUpRes.newLevel, Math.max(0, myHp));
        } else {
          text += MESSAGES.rpg.combat.duel.winExt(Math.max(0, myHp));
        }
        
        return reply(text, { mentions: [target] });
      } else {
        const loss = Math.floor(me.wallet * 0.05);
        me.wallet -= loss;
        opponent.wallet += loss;
        
        // Incrementar estatísticas de batalha
        if (!me.battlesLost) me.battlesLost = 0;
        if (!opponent.battlesWon) opponent.battlesWon = 0;
        me.battlesLost++;
        opponent.battlesWon++;
        
        saveEconomy(econ);
        
        text += battle;
        text += MESSAGES.rpg.combat.duel.lose(loss.toLocaleString());
        
        return reply(text, { mentions: [target] });
      }
    }

    // --- ARENA ---
    if (command === 'arena' || command === 'gladiador') {
      const econ = loadEconomy();
      const me = getEcoUser(econ, sender);
      if (me.lastArena && (now - me.lastArena) < 1800000) {
        const remaining = Math.ceil((1800000 - (now - me.lastArena)) / 60000);
        return reply(MESSAGES.rpg.combat.arena.cooldown(remaining));
      }
      
      const levels = [
        { name: 'Bronze', minLevel: 1, reward: [1000, 3000], enemies: 3 },
        { name: 'Prata', minLevel: 10, reward: [3000, 7000], enemies: 5 },
        { name: 'Ouro', minLevel: 25, reward: [7000, 15000], enemies: 7 }
      ];
      
      const available = levels.filter(l => l.minLevel <= (me.level || 1));
      if (!q) {
        let text = MESSAGES.rpg.combat.arena.header;
        available.forEach((l, i) => {
          text += MESSAGES.rpg.combat.arena.itemLine(i + 1, l.name, l.minLevel, l.reward[0], l.reward[1], l.enemies);
        });
        return reply(text + MESSAGES.rpg.combat.arena.footer(prefix));
      }
      
      const index = parseInt(q) - 1;
      if (isNaN(index) || index < 0 || index >= available.length) return reply(MESSAGES.rpg.combat.arena.invalid);
      
      const arena = available[index];
      const wins = Math.floor(Math.random() * (arena.enemies + 1));
      
      me.lastArena = now;
      if (wins >= arena.enemies * 0.7) {
        const { xpMultiplier, coinMultiplier } = getRewardMultipliers(me);
        const reward = Math.floor(Math.random() * (arena.reward[1] - arena.reward[0])) + arena.reward[0];
        const finalReward = Math.floor(reward * coinMultiplier);
        me.wallet += finalReward;
        me.exp = (me.exp || 0) + Math.floor((arena.enemies * 50) * xpMultiplier);
        
        const levelUpRes = checkEcoLevelUp(me);
        if (levelUpRes.leveledUp) {
          reply(MESSAGES.rpg.combat.arena.levelUp(levelUpRes.newLevel));
        }

        saveEconomy(econ);
        return reply(MESSAGES.rpg.combat.arena.win(wins, arena.enemies, finalReward.toLocaleString()));
      } else {
        const loss = Math.floor(me.wallet * 0.08);
        me.wallet -= loss;
        saveEconomy(econ);
        return reply(MESSAGES.rpg.combat.arena.lose(wins, arena.enemies, loss.toLocaleString()));
      }
    }
  }
};
