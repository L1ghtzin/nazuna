import { normalizeUserId, getUserName } from '../../utils/helpers.js';
import { readAsync, writeAsync } from '../../utils/database/io.js';

export default {
  name: "mute",
  description: "Muta um usuário no grupo",
  commands: ["mute", "mutar"],
  usage: `${global.prefixo}mute @usuário`,
  handle: async ({ 
    bot,
    from,
    reply,
    isGroup,
    isGroupAdmin,
    isBotAdmin,
    menc_os2,
    info,
    MESSAGES,
    buildGroupFilePath
  }) => {
    try {
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      if (!menc_os2) return reply(MESSAGES.error.missing('alguém'));
      
      const groupFilePath = buildGroupFilePath(from);
      let groupData = await readAsync(groupFilePath, { mutedUsers: {} });
      
      groupData.mutedUsers = groupData.mutedUsers || {};
      const targetId = await normalizeUserId(bot, menc_os2);
      groupData.mutedUsers[targetId] = true;
      
      if (targetId !== menc_os2) {
        groupData.mutedUsers[menc_os2] = true;
      }
      
      await writeAsync(groupFilePath, groupData);
      
      await bot.sendMessage(from, {
        text: MESSAGES.admin.mute.success(getUserName(menc_os2)),
        mentions: [menc_os2]
      }, {
        quoted: info
      });
      
    } catch (e) {
      console.error(e);
      reply(MESSAGES.error.general);
    }
  }
};
