import { updateQuestProgress } from "../../utils/database.js";

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
    nazu, getLidFromJidCached, isValidJid
  }) => {
    if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
    if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);
    
    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);
    const now = Date.now();

    // --- DUELO PVP ---
    if (command === 'duelarrpg' || command === 'duelorpg' || command === 'duelrpg' || command === 'pvp') {
      let target = (menc_jid2 && menc_jid2[0]) || null;
      if (!target) return reply(`💔 Marque alguém para duelar!`);
      
      if (isValidJid(target)) {
        target = await getLidFromJidCached(nazu, target) || target;
      }
      
      if (target === sender) return reply(`💔 Você não pode duelar consigo mesmo!`);
      
      if (me.lastDuel && (now - me.lastDuel) < 600000) {
        const remaining = Math.ceil((600000 - (now - me.lastDuel)) / 60000);
        return reply(`⏰ Você está exausto! Aguarde ${remaining} minutos.`);
      }
      
      const opponent = getEcoUser(econ, target);
      const myPower = (me.power || 100) + (me.attackBonus || 0);
      const oppPower = (opponent.power || 100) + (opponent.attackBonus || 0);
      
      const myDefense = (me.defenseBonus || 0) + 50;
      const oppDefense = (opponent.defenseBonus || 0) + 50;
      
      let myHp = 200 + ((me.level || 1) * 10);
      let oppHp = 200 + ((opponent.level || 1) * 10);
      
      let text = `╭━━━⊱ ⚔️ *DUELO* ⊱━━━╮\n│ ${pushname} VS @${target.split('@')[0]}\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      let turn = 0;
      let battle = '';

      while (myHp > 0 && oppHp > 0 && turn < 10) {
        turn++;
        const myDmg = Math.max(5, myPower - Math.floor(Math.random() * oppDefense));
        oppHp -= myDmg;
        battle += `⚔️ ${pushname}: -${myDmg} HP\n`;
        if (oppHp <= 0) break;
        
        const oppDmg = Math.max(5, oppPower - Math.floor(Math.random() * myDefense));
        myHp -= oppDmg;
        battle += `🛡️ Oponente: -${oppDmg} HP\n\n`;
      }
      
      me.lastDuel = now;
      updateQuestProgress(me, 'duel', 1);

      if (myHp > oppHp) {
        const reward = Math.floor((opponent.wallet || 0) * 0.05);
        me.wallet += reward;
        opponent.wallet = Math.max(0, opponent.wallet - reward);
        me.exp = (me.exp || 0) + 150;
        
        // Incrementar estatísticas de batalha
        if (!me.battlesWon) me.battlesWon = 0;
        if (!opponent.battlesLost) opponent.battlesLost = 0;
        me.battlesWon++;
        opponent.battlesLost++;
        
        const levelUpRes = checkEcoLevelUp(me);
        saveEconomy(econ);
        
        text += battle;
        text += `\n╭━━━⊱ 🏆 *VITÓRIA!* 🏆 ⊱━━━╮\n│\n│ 💰 Recompensa: *+${reward.toLocaleString()}*\n│ ✨ EXP: *+150*\n`;
        if (levelUpRes.leveledUp) {
          text += `│\n╰━━━━━━━━━━━━━━━━━━━━━╯\n\n╭━━━⊱   *LEVEL UP!* 🌟 ⊱━━━╮\n│\n│ 📊 Nível atual: *${levelUpRes.newLevel}*\n│ ❤️ HP restante: *${Math.max(0, myHp)}*\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`;
        } else {
          text += `│ ❤️ HP restante: *${Math.max(0, myHp)}*\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`;
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
        text += `\n╭━━━⊱ 💀 *DERROTA!* 💀 ⊱━━━╮\n│\n│ 💸 Perdeu: *-${loss.toLocaleString()}*\n│ ❤️ HP restante: *0*\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`;
        
        return reply(text, { mentions: [target] });
      }
    }

    // --- ARENA ---
    if (command === 'arena' || command === 'gladiador') {
      if (me.lastArena && (now - me.lastArena) < 1800000) {
        const remaining = Math.ceil((1800000 - (now - me.lastArena)) / 60000);
        return reply(`⏰ A arena está fechada para você! Aguarde ${remaining} minutos.`);
      }
      
      const levels = [
        { name: 'Bronze', minLevel: 1, reward: [1000, 3000], enemies: 3 },
        { name: 'Prata', minLevel: 10, reward: [3000, 7000], enemies: 5 },
        { name: 'Ouro', minLevel: 25, reward: [7000, 15000], enemies: 7 }
      ];
      
      const available = levels.filter(l => l.minLevel <= (me.level || 1));
      if (!q) {
        let text = `╭━━━⊱ 🏛️ *ARENA* ⊱━━━╮\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
        available.forEach((l, i) => {
          text += `${i + 1}. 🏆 *${l.name}* (Lv.${l.minLevel})\n   💰 ${l.reward[0]}-${l.reward[1]} | ⚔️ ${l.enemies} Inimigos\n\n`;
        });
        return reply(text + `💡 Use ${prefix}arena <número>`);
      }
      
      const index = parseInt(q) - 1;
      if (isNaN(index) || index < 0 || index >= available.length) return reply(`💔 Arena inválida!`);
      
      const arena = available[index];
      const wins = Math.floor(Math.random() * (arena.enemies + 1));
      
      me.lastArena = now;
      if (wins >= arena.enemies * 0.7) {
        const reward = Math.floor(Math.random() * (arena.reward[1] - arena.reward[0])) + arena.reward[0];
        me.wallet += reward;
        me.exp = (me.exp || 0) + (arena.enemies * 50);
        
        const levelUpRes = checkEcoLevelUp(me);
        if (levelUpRes.leveledUp) {
          reply(`🌟 *LEVEL UP!* Você agora é nível ${levelUpRes.newLevel}!`);
        }

        saveEconomy(econ);
        return reply(`🏆 *VITÓRIA NA ARENA!* Derrotou ${wins}/${arena.enemies} inimigos!\n💰 Prêmio: +${reward.toLocaleString()} moedas`);
      } else {
        const loss = Math.floor(me.wallet * 0.08);
        me.wallet -= loss;
        saveEconomy(econ);
        return reply(`💀 *DERROTA NA ARENA!* Derrotou apenas ${wins}/${arena.enemies} inimigos.\n💸 Perdeu: -${loss.toLocaleString()} moedas`);
      }
    }
  }
};
