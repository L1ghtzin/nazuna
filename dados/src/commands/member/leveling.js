export default {
  name: "leveling",
  description: "Sistema de níveis e experiência por mensagens",
  commands: ["21", "addxp", "adicionardinheiro", "adicionaritem", "bj", "blackjack", "buypremium", "cacaniquel", "cavalos", "comprarpremium", "corrida", "definirnivelrpg", "delxp", "estatisticasrpg", "globalrank", "horserace", "level", "leveling", "lojadeluxo", "lojapremium", "loteria", "lottery", "mega", "premiumshop", "rankglobal", "removerdinheiro", "removeritem", "resetarjogador", "resetrpgglobal", "roleta", "roulette", "rpgadd", "rpgadditem", "rpgaddmoney", "rpgremove", "rpgremoveitem", "rpgremovemoney", "rpgresetglobal", "rpgresetplayer", "rpgsetlevel", "rpgstatistics", "rpgstats", "setlevel", "slotmachine", "slots", "topglobal", "toprpgglobal", "votar", "vote"],
  handle: async ({ 
    nazu, from, info, command, q, args, reply, prefix, pushname, sender, menc_os2,
    isGroup, isGroupAdmin, isOwner, groupData, groupFile, getUserName, optimizer,
    loadLevelingSafe, saveLevelingSafe, getLevelingUser, calculateNextLevelXp, checkLevelUp, checkLevelDown
  , MESSAGES }) => {
    const cmd = command.toLowerCase();

    // ═══════════════════════════════════════════════════════════════
    // ⚙️ CONFIGURAÇÃO (ADMIN)
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'leveling') {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      groupData.levelingEnabled = !groupData.levelingEnabled;
      await optimizer.saveJsonWithCache(groupFile, groupData);
      return reply(`🎚️ Sistema de leveling ${groupData.levelingEnabled ? 'ativado' : 'desativado'}!`);
    }

    // ═══════════════════════════════════════════════════════════════
    // 📊 STATUS (MEMBER)
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'level') {
      const data = loadLevelingSafe();
      const user = getLevelingUser(data, sender);
      const nextXp = calculateNextLevelXp(user.level || 1);
      const progress = Math.floor(((user.xp || 0) / nextXp) * 100);
      const barLen = 10;
      const filled = Math.round((progress / 100) * barLen);
      const bar = '█'.repeat(filled) + '░'.repeat(barLen - filled);

      let text = `╭━━━⊱ 📊 *STATUS DE NÍVEL* ⊱━━━╮\n`;
      text += `│ 👤 *Jogador:* ${pushname}\n`;
      text += `│ 🏅 *Nível:* ${user.level || 1}\n`;
      text += `│ 🎖️ *Patente:* ${user.patent || 'Bronze'}\n`;
      text += `│ ✨ *XP:* ${user.xp || 0} / ${nextXp}\n`;
      text += `│ 📈 [${bar}] ${progress}%\n`;
      text += `│ 💬 *Msgs:* ${user.messages || 0}\n`;
      text += `╰━━━━━━━━━━━━━━━━━━━━╯`;
      return reply(text);
    }

    if (['rank', 'ranking'].includes(cmd)) {
      const data = loadLevelingSafe();
      const users = Object.entries(data).sort((a, b) => (b[1].xp || 0) - (a[1].xp || 0)).slice(0, 10);
      if (!users.length) return reply("Vazio.");
      let text = `🏆 *TOP 10 NÍVEL*\n\n`;
      for (let i = 0; i < users.length; i++) {
        text += `${i + 1}. @${getUserName(users[i][0])} - Lvl ${users[i][1].level || 1}\n`;
      }
      return reply(text, { mentions: users.map(u => u[0]) });
    }

    // ═══════════════════════════════════════════════════════════════
    // 🛠️ GERENCIAMENTO (OWNER)
    // ═══════════════════════════════════════════════════════════════
    if (['addxp', 'delxp', 'setlevel'].includes(cmd)) {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      if (!menc_os2) return reply(MESSAGES.permission.mentionRequired);
      const val = parseInt(q);
      if (isNaN(val)) return reply("Informe um número.");
      
      const data = loadLevelingSafe();
      const user = getLevelingUser(data, menc_os2);
      
      if (cmd === 'addxp') {
        user.xp = (user.xp || 0) + val;
        checkLevelUp(menc_os2, user, data, nazu, from);
      } else if (cmd === 'delxp') {
        user.xp = Math.max(0, (user.xp || 0) - val);
        checkLevelDown(menc_os2, user, data);
      } else if (cmd === 'setlevel') {
        user.level = val;
        user.xp = 0;
      }
      
      saveLevelingSafe(data);
      return reply(`✅ @${getUserName(menc_os2)} atualizado!`, { mentions: [menc_os2] });
    }
  }
};
