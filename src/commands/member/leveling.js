export default {
  name: "leveling",
  description: "Consulta de niveis e experiencia por mensagens",
  commands: ["level", "rank", "ranking", "ranklevel", "ranklvl", "rankinglevel", "levels", "toplevels"],
  handle: async ({
    command, reply, pushname, sender, getUserName,
    loadLevelingSafe, getLevelingUser, calculateNextLevelXp, MESSAGES
  }) => {
    const cmd = command.toLowerCase();

    if (cmd === 'level') {
      const data = loadLevelingSafe();
      const user = getLevelingUser(data, sender);
      const nextXp = calculateNextLevelXp(user.level || 1);
      const progress = Math.floor(((user.xp || 0) / nextXp) * 100);
      const barLen = 10;
      const filled = Math.round((progress / 100) * barLen);
      const bar = '#'.repeat(filled) + '-'.repeat(barLen - filled);

      return reply(MESSAGES.member.leveling.status(pushname, user.level || 1, user.patent || 'Bronze', user.xp || 0, nextXp, bar, progress, user.messages || 0));
    }

    const data = loadLevelingSafe();
    const users = Object.entries(data.users || {})
      .sort((a, b) => (b[1].xp || 0) - (a[1].xp || 0))
      .slice(0, 10);

    if (!users.length) return reply(MESSAGES.member.leveling.emptyRank);

    let text = MESSAGES.member.leveling.rankHeader;
    for (let i = 0; i < users.length; i++) {
      text += `${i + 1}. @${getUserName(users[i][0])} - Lvl ${users[i][1].level || 1}\n`;
    }

    return reply(text, { mentions: users.map(([userId]) => userId) });
  }
};
