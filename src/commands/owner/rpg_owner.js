export default {
  name: "rpgadmin",
  description: "Comandos administrativos do RPG",
  commands: ["adicionardinheiro", "adicionaritem", "definirnivelrpg", "estatísticasrpg", "globalrank", "rankglobal", "removerdinheiro", "removeritem", "resetarjogador", "resetrpgglobal", "rpgadd", "rpgadditem", "rpgaddmoney", "rpgremove", "rpgremoveitem", "rpgremovemoney", "rpgresetglobal", "rpgresetplayer", "rpgsetlevel", "rpgstatistics", "rpgstats", "topglobal", "toprpgglobal"],
  usage: "{prefix}rankglobal",
  handle: async ({ 
    reply, 
    sender, 
    prefix, 
    pushname, 
    command,
    args,
    menc_jid2,
    isOwner,
    isSubdono, // We will inject this in index.js
    loadEconomy, 
    saveEconomy, 
    getEcoUser,
    MESSAGES
  }) => {
    const isOwnerOrSub = isOwner || (typeof isSubdono === 'function' ? isSubdono(sender) : false);

    // --- RANK GLOBAL ---
    if (command === 'rankglobal' || command === 'globalrank' || command === 'toprpgglobal' || command === 'topglobal') {
      const econ = loadEconomy();
      const allUsers = Object.entries(econ.users || {});
      if (allUsers.length === 0) return reply(MESSAGES.rpg.admin.noPlayers);

      const rankedUsers = allUsers.map(([id, data]) => {
        const totalWealth = (data.wallet || 0) + (data.bank || 0);
        const level = data.level || 1;
        const power = data.power || 100;
        const score = totalWealth + (level * 1000) + (power * 10);
        return { id, totalWealth, level, power, score };
      }).sort((a, b) => b.score - a.score).slice(0, 20);

      let text = `╭━━━⊱ 🌍 *RANKING GLOBAL RPG* ⊱━━━╮\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      const mentions = [];
      rankedUsers.forEach((user, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        text += `${medal} @${user.id.split('@')[0]}\n   💰 ${user.totalWealth.toLocaleString()} | Lv.${user.level} | ⚔️ ${user.power}\n\n`;
        mentions.push(user.id);
      });
      return reply(text, { mentions });
    }

    // --- ADMIN COMMANDS CHECK ---
    const econ = loadEconomy();

    // --- ADD MONEY ---
    if (command === 'rpgadd' || command === 'rpgaddmoney' || command === 'adicionardinheiro') {
      const target = (menc_jid2 && menc_jid2[0]) || null;
      const amount = parseInt(args[args.length - 1]) || 0;
      if (!target || amount <= 0) return reply(MESSAGES.rpg.admin.rpgaddUsage(prefix));
      
      const targetData = getEcoUser(econ, target);
      targetData.wallet = (targetData.wallet || 0) + amount;
      saveEconomy(econ);
      return reply(MESSAGES.rpg.admin.rpgaddSuccess(amount.toLocaleString(), target.split('@')[0]), { mentions: [target] });
    }

    // --- REMOVE MONEY ---
    if (command === 'rpgremove' || command === 'rpgremovemoney' || command === 'removerdinheiro') {
      const target = (menc_jid2 && menc_jid2[0]) || null;
      const amount = parseInt(args[args.length - 1]) || 0;
      if (!target || amount <= 0) return reply(MESSAGES.rpg.admin.rpgremoveUsage(prefix));
      
      const targetData = getEcoUser(econ, target);
      targetData.wallet = Math.max(0, (targetData.wallet || 0) - amount);
      saveEconomy(econ);
      return reply(MESSAGES.rpg.admin.rpgremoveSuccess(amount.toLocaleString(), target.split('@')[0]), { mentions: [target] });
    }

    // --- SET LEVEL ---
    if (command === 'rpgsetlevel' || command === 'definirnivelrpg') {
      const target = (menc_jid2 && menc_jid2[0]) || null;
      const newLevel = parseInt(args[args.length - 1]) || 0;
      if (!target || newLevel < 1) return reply(MESSAGES.rpg.admin.rpgsetlevelUsage(prefix));
      
      const targetData = getEcoUser(econ, target);
      targetData.level = newLevel;
      targetData.power = 100 + (newLevel * 15);
      saveEconomy(econ);
      return reply(MESSAGES.rpg.admin.rpgsetlevelSuccess(newLevel, target.split('@')[0]), { mentions: [target] });
    }

    // --- RESET PLAYER ---
    if (command === 'rpgresetplayer' || command === 'resetarjogador') {
      const target = (menc_jid2 && menc_jid2[0]) || null;
      if (!target) return reply(MESSAGES.rpg.admin.mentionPlayer);
      if (econ.users[target]) {
        delete econ.users[target];
        saveEconomy(econ);
        return reply(MESSAGES.rpg.admin.playerResetSuccess(target.split('@')[0]), { mentions: [target] });
      }
      return reply(MESSAGES.rpg.admin.playerNotFound);
    }

    // --- STATS ---
    if (command === 'rpgstats' || command === 'rpgstatistics' || command === 'estatísticasrpg') {
      const allUsers = Object.entries(econ.users || {});
      let totalMoney = 0;
      allUsers.forEach(([id, data]) => totalMoney += (data.wallet || 0) + (data.bank || 0));
      return reply(MESSAGES.rpg.admin.stats(allUsers.length, totalMoney.toLocaleString()));
    }

    // --- RESET GLOBAL ---
    if (command === 'rpgresetglobal' || command === 'resetrpgglobal') {
      if (args[0] !== 'confirmar') return reply(MESSAGES.rpg.admin.resetConfirm(prefix));
      econ.users = {};
      saveEconomy(econ);
      return reply(MESSAGES.rpg.admin.resetSuccess);
    }
  }
};
