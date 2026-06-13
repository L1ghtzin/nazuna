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
        return reply(`⏰ Você está exausto! Aguarde *${remaining} minutos*.`);
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
        let text = `╭━━━⊱ 🗺️ *MASMORRAS* ⊱━━━╮\n│ Aventureiro: *${pushname}*\n│ Nível: ${userLevel}\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
        availableDungeons.forEach((d, i) => {
          text += `${i + 1}. ${d.emoji} *${d.name}* (Lv.${d.diff * 5})\n   💰 ${d.reward[0]}-${d.reward[1]} | ✨ ${d.exp}\n\n`;
        });
        return reply(text + `💡 Use ${prefix}dg <número>`);
      }
      
      const index = parseInt(q) - 1;
      if (isNaN(index) || index < 0 || index >= availableDungeons.length) return reply(`💔 Masmorra inválida!`);
      
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
          reply(`🌟 *LEVEL UP!* Você agora é nível ${me.level}!`);
        }
        
        saveEconomy(econ);
        return reply(`⚔️ *VITÓRIA!* Você conquistou a ${dungeon.name}!\n💰 +${reward.toLocaleString()} moedas\n✨ +${dungeon.exp} XP`);
      } else {
        const loss = Math.floor(me.wallet * 0.1);
        me.wallet -= loss;
        saveEconomy(econ);
        return reply(`💀 *DERROTA!* Você fugiu da ${dungeon.name}!\n💸 Perdeu ${loss.toLocaleString()} moedas.`);
      }
    }

    // --- CHEFE / BOSS ---
    if (command === 'cheferpg' || command === 'bossrpg' || command === 'bossfight') {
      const BOSS_COOLDOWN = 4 * 60 * 60 * 1000;
      if (me.lastBoss && (now - me.lastBoss) < BOSS_COOLDOWN) {
        const remaining = Math.ceil((BOSS_COOLDOWN - (now - me.lastBoss)) / 60000);
        return reply(`⏰ Exausto! Aguarde *${Math.floor(remaining/60)}h ${remaining%60}min*.`);
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
      
      let battleLog = `╭━━━⊱ 👹 *BOSS FIGHT!* ⊱━━━╮\n\n${boss.emoji} *${boss.name}*\n❤️ HP: ${boss.hp} | ⚔️ ATK: ${boss.attack} | 🛡️ DEF: ${boss.defense}\n\nVS\n\n⚔️ *${pushname}* (Poder: ${playerPower})\n\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      
      while (bossHp > 0 && playerHp > 0 && turns < maxTurns) {
        const playerDmg = Math.max(10, Math.floor(playerPower * 0.3 + Math.random() * 30 - boss.defense * 0.2));
        bossHp -= playerDmg;
        
        if (bossHp <= 0) {
          battleLog += `⚔️ Você desferiu o golpe final! (-${playerDmg} HP)\n`;
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
        
        battleLog += `\n╭━━━⊱ 🏆 *VITÓRIA!* ⊱━━━╮\n│ Você derrotou ${boss.emoji} *${boss.name}*!\n│\n│ 💰 Recompensa: +${boss.reward.toLocaleString()}\n│ ✨ XP: +${boss.xp}\n│ 🏅 Bosses derrotados: ${me.stats.bossesDefeated}\n╰━━━━━━━━━━━━━━━━━━━━╯`;
        
        if (levelUpRes.leveledUp) {
          battleLog += `\n\n🌟 *LEVEL UP!* Você agora é nível ${levelUpRes.newLevel}!`;
        }
        return reply(battleLog);
      } else {
        saveEconomy(econ);
        battleLog += `\n╭━━━⊱ 💀 *DERROTA!* ⊱━━━╮\n│ ${boss.emoji} *${boss.name}* foi mais forte!\n│\n│ 💡 Fique mais forte e tente novamente!\n│ 📈 Use ${prefix}equipar ou ${prefix}encantar para melhorar\n╰━━━━━━━━━━━━━━━━━━━━╯`;
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
      
      let text = `╭━━━⊱ 🎉 *EVENTOS RPG* ⊱━━━╮\n│ Hoje: ${weeklyEvents[dayOfWeek]}\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      text += `📅 *Agenda Semanal:*\n` + weeklyEvents.join('\n');
      return reply(text);
    }
  }
};
