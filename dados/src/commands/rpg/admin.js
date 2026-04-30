import { PREFIX } from "../../config.js";

export default {
  name: "rpgadmin",
  description: "Comandos administrativos do RPG",
  commands: ["adicionardinheiro", "adicionaritem", "definirnivelrpg", "estatisticasrpg", "globalrank", "rankglobal", "removerdinheiro", "removeritem", "resetarjogador", "resetrpgglobal", "rpgadd", "rpgadditem", "rpgaddmoney", "rpgremove", "rpgremoveitem", "rpgremovemoney", "rpgresetglobal", "rpgresetplayer", "rpgsetlevel", "rpgstatistics", "rpgstats", "setlevel", "topglobal", "toprpgglobal"],
  usage: `${PREFIX}rankglobal`,
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
      if (allUsers.length === 0) return reply('📊 Nenhum jogador registrado.');

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
    if (!isOwnerOrSub) return reply('🚫 Apenas donos e subdonos podem usar este comando!');

    const econ = loadEconomy();

    // --- ADD MONEY ---
    if (command === 'rpgadd' || command === 'rpgaddmoney' || command === 'adicionardinheiro') {
      const target = (menc_jid2 && menc_jid2[0]) || null;
      const amount = parseInt(args[args.length - 1]) || 0;
      if (!target || amount <= 0) return reply(`💔 Uso: ${prefix}rpgadd @user <valor>`);
      
      const targetData = getEcoUser(econ, target);
      targetData.wallet = (targetData.wallet || 0) + amount;
      saveEconomy(econ);
      return reply(`💰 Adicionado ${amount.toLocaleString()} para @${target.split('@')[0]}`, { mentions: [target] });
    }

    // --- REMOVE MONEY ---
    if (command === 'rpgremove' || command === 'rpgremovemoney' || command === 'removerdinheiro') {
      const target = (menc_jid2 && menc_jid2[0]) || null;
      const amount = parseInt(args[args.length - 1]) || 0;
      if (!target || amount <= 0) return reply(`💔 Uso: ${prefix}rpgremove @user <valor>`);
      
      const targetData = getEcoUser(econ, target);
      targetData.wallet = Math.max(0, (targetData.wallet || 0) - amount);
      saveEconomy(econ);
      return reply(`💸 Removido ${amount.toLocaleString()} de @${target.split('@')[0]}`, { mentions: [target] });
    }

    // --- SET LEVEL ---
    if (command === 'rpgsetlevel' || command === 'setlevel' || command === 'definirnivelrpg') {
      const target = (menc_jid2 && menc_jid2[0]) || null;
      const newLevel = parseInt(args[args.length - 1]) || 0;
      if (!target || newLevel < 1) return reply(`💔 Uso: ${prefix}rpgsetlevel @user <nivel>`);
      
      const targetData = getEcoUser(econ, target);
      targetData.level = newLevel;
      targetData.power = 100 + (newLevel * 15);
      saveEconomy(econ);
      return reply(`📊 Nível de @${target.split('@')[0]} definido para ${newLevel}`, { mentions: [target] });
    }

    // --- RESET PLAYER ---
    if (command === 'rpgresetplayer' || command === 'resetarjogador') {
      const target = (menc_jid2 && menc_jid2[0]) || null;
      if (!target) return reply(`💔 Marque um usuário!`);
      if (econ.users[target]) {
        delete econ.users[target];
        saveEconomy(econ);
        return reply(`🗑️ Jogador @${target.split('@')[0]} resetado.`, { mentions: [target] });
      }
      return reply(`💔 Jogador não encontrado.`);
    }

    // --- STATS ---
    if (command === 'rpgstats' || command === 'rpgstatistics' || command === 'estatisticasrpg') {
      const allUsers = Object.entries(econ.users || {});
      let totalMoney = 0;
      allUsers.forEach(([id, data]) => totalMoney += (data.wallet || 0) + (data.bank || 0));
      return reply(`📊 *STATS RPG*\n\n👥 Jogadores: ${allUsers.length}\n💰 Circulação: ${totalMoney.toLocaleString()}`);
    }

    // --- RESET GLOBAL ---
    if (command === 'rpgresetglobal' || command === 'resetrpgglobal') {
      if (!isOwner) return reply('🚫 Apenas o dono principal!');
      if (args[0] !== 'confirmar') return reply(`⚠️ Use ${prefix}rpgresetglobal confirmar para resetar TUDO.`);
      econ.users = {};
      saveEconomy(econ);
      return reply('⚠️ Sistema RPG resetado globalmente!');
    }
  }
};
