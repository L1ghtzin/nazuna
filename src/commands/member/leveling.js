export default {
  name: "leveling",
  description: "Sistema de níveis e experiência por mensagens",
  commands: ["leveling", "level", "rank", "ranking", "ranklevel", "ranklvl", "rankinglevel", "levels", "toplevels", "addxp", "delxp", "setlevel"],
  handle: async ({ 
    bot, from, info, command, q, args, reply, prefix, pushname, sender, menc_os2,
    isGroup, isGroupAdmin, isOwner, groupData, groupFile, getUserName, optimizer,
    loadLevelingSafe, saveLevelingSafe, getLevelingUser, calculateNextLevelXp, checkLevelUp, checkLevelDown
  , MESSAGES }) => {
    const cmd = command.toLowerCase();

  handle: async ({ 
    bot, from, info, command, q, args, reply, prefix, pushname, sender, menc_os2,
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
      return reply(MESSAGES.member.leveling.toggled(groupData.levelingEnabled));
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

      return reply(MESSAGES.member.leveling.status(pushname, user.level || 1, user.patent || 'Bronze', user.xp || 0, nextXp, bar, progress, user.messages || 0));
    }

    if (['rank', 'ranking', 'ranklevel', 'ranklvl', 'rankinglevel', 'levels', 'toplevels'].includes(cmd)) {
      const data = loadLevelingSafe();
      const users = Object.entries(data).sort((a, b) => (b[1].xp || 0) - (a[1].xp || 0)).slice(0, 10);
      if (!users.length) return reply(MESSAGES.member.leveling.emptyRank);
      let text = MESSAGES.member.leveling.rankHeader;
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
      if (!menc_os2) return reply(MESSAGES.error.missing('alguém'));
      const val = parseInt(q);
      if (isNaN(val)) return reply(MESSAGES.member.leveling.requireNumber);
      
      const data = loadLevelingSafe();
      const user = getLevelingUser(data, menc_os2);
      
      if (cmd === 'addxp') {
        user.xp = (user.xp || 0) + val;
        checkLevelUp(menc_os2, user, data, bot, from);
      } else if (cmd === 'delxp') {
        user.xp = Math.max(0, (user.xp || 0) - val);
        checkLevelDown(menc_os2, user, data);
      } else if (cmd === 'setlevel') {
        user.level = val;
        user.xp = 0;
      }
      
      saveLevelingSafe(data);
      return reply(MESSAGES.member.leveling.updated(getUserName(menc_os2)), { mentions: [menc_os2] });
    }
  }
};
