export default {
  name: "leveling_management",
  description: "Gerenciamento de experiencia e nivel",
  commands: ["addxp", "delxp", "setlevel"],
  handle: async ({
    bot, from, command, q, args, reply, menc_os2, getUserName,
    loadLevelingSafe, saveLevelingSafe, getLevelingUser,
    checkLevelUp, checkLevelDown, MESSAGES
  }) => {
    const cmd = command.toLowerCase();

    if (!menc_os2) return reply(MESSAGES.error.missing('alguem'));

    const value = parseInt(args.find(arg => /^-?\d+$/.test(arg)) ?? q, 10);
    if (Number.isNaN(value)) return reply(MESSAGES.member.leveling.requireNumber);

    const data = loadLevelingSafe();
    const user = getLevelingUser(data, menc_os2);

    if (cmd === 'addxp') {
      user.xp = (user.xp || 0) + value;
      checkLevelUp(menc_os2, user, data, bot, from);
    } else if (cmd === 'delxp') {
      user.xp = Math.max(0, (user.xp || 0) - value);
      checkLevelDown(menc_os2, user, data);
    } else if (cmd === 'setlevel') {
      user.level = value;
      user.xp = 0;
    }

    saveLevelingSafe(data);
    return reply(MESSAGES.member.leveling.updated(getUserName(menc_os2)), { mentions: [menc_os2] });
  }
};
