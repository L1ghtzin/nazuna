import { PREFIX } from "../../config.js";

export default {
  name: "combat",
  description: "Duelos PvP e Arena de Gladiadores",
  commands: ["arena", "duelarrpg", "duelorpg", "duelrpg", "eventos", "eventosrpg", "events"],
  usage: `${PREFIX}duelarrpg @user`,
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
    MESSAGES
  }) => {
    if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
    if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);
    
    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);
    const now = Date.now();

    // --- DUELO PVP ---
    if (command === 'duelarrpg' || command === 'duelorpg' || command === 'duelrpg' || command === 'pvp') {
      const target = (menc_jid2 && menc_jid2[0]) || null;
      if (!target || target === sender) return reply(`💔 Marque alguém para duelar!`);
      
      if (me.lastDuel && (now - me.lastDuel) < 600000) {
        const remaining = Math.ceil((600000 - (now - me.lastDuel)) / 60000);
        return reply(`⏰ Você está exausto! Aguarde ${remaining} minutos.`);
      }
      
      const opponent = getEcoUser(econ, target);
      const myPower = (me.power || 100) + (me.attackBonus || 0);
      const oppPower = (opponent.power || 100) + (opponent.attackBonus || 0);
      
      let myHp = 200 + ((me.level || 1) * 10);
      let oppHp = 200 + ((opponent.level || 1) * 10);
      
      while (myHp > 0 && oppHp > 0) {
        oppHp -= Math.max(5, myPower - Math.floor(Math.random() * 50));
        if (oppHp <= 0) break;
        myHp -= Math.max(5, oppPower - Math.floor(Math.random() * 50));
      }
      
      me.lastDuel = now;
      if (myHp > oppHp) {
        const reward = Math.floor((opponent.wallet || 0) * 0.05);
        me.wallet += reward;
        opponent.wallet = Math.max(0, opponent.wallet - reward);
        me.exp = (me.exp || 0) + 150;
        saveEconomy(econ);
        return reply(`🏆 *VITÓRIA!* Você venceu o duelo contra @${target.split('@')[0]}!\n💰 Ganhou: +${reward.toLocaleString()} | ✨ +150 XP`, { mentions: [target] });
      } else {
        const loss = Math.floor(me.wallet * 0.05);
        me.wallet -= loss;
        opponent.wallet += loss;
        saveEconomy(econ);
        return reply(`💀 *DERROTA!* Você perdeu o duelo para @${target.split('@')[0]}...\n💸 Perdeu: -${loss.toLocaleString()} moedas`, { mentions: [target] });
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
