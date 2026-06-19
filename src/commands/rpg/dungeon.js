import { updateQuestProgress } from "../../utils/database.js";

export default {
  name: "dungeon",
  description: "Exploração de masmorras e chefões",
  commands: ["bossfight", "bossrpg", "cheferpg", "dg", "dungeon", "dungeonsolo", "eventos", "events", "masmorra", "masmorrasolo"],
  usage: "{prefix}masmorrasolo",
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
    checkEcoLevelUp,
    MESSAGES
  }) => {
    if (!isGroup) return reply(MESSAGES.rpg.groupOnly);
    if (!groupData.modorpg) return reply(MESSAGES.rpg.disabled(prefix));
    
    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);
    const now = Date.now();

    // --- MASMORRA SOLO ---
    if (command === 'masmorrasolo' || command === 'dungeonsolo' || command === 'dg' || command === 'dungeon' || command === 'masmorra') {
      if (me.lastDungeon && (now - me.lastDungeon) < 7200000) {
        const remaining = Math.ceil((7200000 - (now - me.lastDungeon)) / 60000);
        return reply(MESSAGES.rpg.dungeon.cooldown(remaining));
      }
      
      const dungeons = [
        { name: '🕷️ Caverna das Aranhas', diff: 1, reward: [1000, 2000], exp: 100, emoji: '🕷️' },
        { name: '🧟 Cripta dos Mortos', diff: 2, reward: [2000, 4000], exp: 200, emoji: '🧟' },
        { name: '🐉 Covil do Dragão', diff: 3, reward: [5000, 10000], exp: 500, emoji: '🐉' },
        { name: '👹 Fortaleza Demoníaca', diff: 4, reward: [10000, 20000], exp: 1000, emoji: '👹' }
      ];
      
      const userLevel = me.level || 1;
      const availableDungeons = dungeons.filter(d => d.diff <= Math.ceil(userLevel / 5) + 1);
      
      if (!q) {
        let text = MESSAGES.rpg.dungeon.header(pushname, userLevel);
        availableDungeons.forEach((d, i) => {
          text += MESSAGES.rpg.dungeon.itemLine(i + 1, d.emoji, d.name, d.diff * 5, d.reward[0], d.reward[1], d.exp);
        });
        return reply(text + MESSAGES.rpg.dungeon.footer(prefix));
      }
      
      const index = parseInt(q) - 1;
      if (isNaN(index) || index < 0 || index >= availableDungeons.length) return reply(MESSAGES.rpg.dungeon.invalid);
      
      const dungeon = availableDungeons[index];
      const userPower = (me.power || 100) + (me.attackBonus || 0);
      const success = Math.random() < (0.7 - (dungeon.diff * 0.1) + (userPower / 1000));
      
      me.lastDungeon = now;
      if (success) {
        const reward = Math.floor(Math.random() * (dungeon.reward[1] - dungeon.reward[0])) + dungeon.reward[0];
        me.wallet += reward;
        me.exp = (me.exp || 0) + dungeon.exp;
        updateQuestProgress(me, 'dungeon', 1);
        
        let leveledUp = false;
        let expRequired = 100 * Math.pow(1.5, (me.level || 1) - 1);
        while (me.exp >= expRequired) {
          me.exp -= expRequired;
          me.level = (me.level || 1) + 1;
          expRequired = 100 * Math.pow(1.5, (me.level || 1) - 1);
          leveledUp = true;
        }
        
        if (leveledUp) {
          reply(MESSAGES.rpg.dungeon.levelUp(me.level));
        }
        
        saveEconomy(econ);
        return reply(MESSAGES.rpg.dungeon.win(dungeon.name, reward.toLocaleString(), dungeon.exp));
      } else {
        const loss = Math.floor(me.wallet * 0.1);
        me.wallet -= loss;
        saveEconomy(econ);
        return reply(MESSAGES.rpg.dungeon.lose(dungeon.name, loss.toLocaleString()));
      }
    }

    // --- CHEFE / BOSS ---
    if (command === 'cheferpg' || command === 'bossrpg' || command === 'bossfight') {
      const BOSS_COOLDOWN = 4 * 60 * 60 * 1000;
      if (me.lastBoss && (now - me.lastBoss) < BOSS_COOLDOWN) {
        const remaining = Math.ceil((BOSS_COOLDOWN - (now - me.lastBoss)) / 60000);
        return reply(MESSAGES.rpg.dungeon.bossCooldown(Math.floor(remaining/60), remaining%60));
      }
      
      const bosses = [
        { name: 'Dragão Ancião', emoji: '🐉', hp: 1000, attack: 80, defense: 50, reward: 15000, xp: 500 },
        { name: 'Golem de Pedra', emoji: '🗿', hp: 1500, attack: 60, defense: 80, reward: 12000, xp: 400 },
        { name: 'Hidra Venenosa', emoji: '🐍', hp: 800, attack: 100, defense: 30, reward: 18000, xp: 600 },
        { name: 'Fênix Sombria', emoji: '🔥', hp: 700, attack: 90, defense: 40, reward: 20000, xp: 700 },
        { name: 'Kraken Abissal', emoji: '🦑', hp: 1200, attack: 70, defense: 60, reward: 16000, xp: 550 }
      ];
      
      const boss = bosses[Math.floor(Math.random() * bosses.length)];
      const playerPower = (me.power || 100) + (me.level || 1) * 10;
      
      let bossHp = boss.hp;
      let playerHp = 100 + (me.level || 1) * 5;
      let turns = 0;
      const maxTurns = 15;
      
      let battleLog = MESSAGES.rpg.dungeon.bossBattleStart(boss.emoji, boss.name, boss.hp, boss.attack, boss.defense, pushname, playerPower);
      
      while (bossHp > 0 && playerHp > 0 && turns < maxTurns) {
        const playerDmg = Math.max(10, Math.floor(playerPower * 0.3 + Math.random() * 30 - boss.defense * 0.2));
        bossHp -= playerDmg;
        
        if (bossHp <= 0) {
          battleLog += MESSAGES.rpg.dungeon.bossFinalHit(playerDmg);
          break;
        }
        
        const bossDmg = Math.max(5, boss.attack - Math.floor(playerPower * 0.1) + Math.floor(Math.random() * 20));
        playerHp -= bossDmg;
        turns++;
      }
      
      me.lastBoss = now;
      if (!me.stats) me.stats = {};
      
      if (bossHp <= 0) {
        me.wallet += boss.reward;
        me.exp = (me.exp || 0) + boss.xp;
        me.stats.bossesDefeated = (me.stats.bossesDefeated || 0) + 1;
        
        const levelUpRes = checkEcoLevelUp(me);
        saveEconomy(econ);
        
        battleLog += MESSAGES.rpg.dungeon.bossWin(boss.emoji, boss.name, boss.reward.toLocaleString(), boss.xp, me.stats.bossesDefeated);
        
        if (levelUpRes.leveledUp) {
          battleLog += MESSAGES.rpg.dungeon.bossLevelUp(levelUpRes.newLevel);
        }
        return reply(battleLog);
      } else {
        saveEconomy(econ);
        battleLog += MESSAGES.rpg.dungeon.bossLose(boss.emoji, boss.name, prefix);
        return reply(battleLog);
      }
    }

    // --- EVENTOS ---
    if (command === 'eventos' || command === 'events') {
      const dayOfWeek = new Date().getDay();
      const weeklyEvents = [
        '🎁 Domingo de Bônus (Dobro em tudo!)',
        '⛏️ Segunda da Mineração (+50%)',
        '🎣 Terça da Pescaria (Raros!)',
        '🏹 Quarta da Caça (Lendários!)',
        '💰 Quinta do Trabalho (+75%)',
        '⚔️ Sexta de Batalha (XP Dobrado!)',
        '🎰 Sábado do Cassino (Sorte!)'
      ];
      
      let text = MESSAGES.rpg.events.header(weeklyEvents[dayOfWeek]);
      text += MESSAGES.rpg.events.body(weeklyEvents.join('\n'));
      return reply(text);
    }
  }
};
