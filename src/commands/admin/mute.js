import { normalizeUserId, getUserName } from '../../utils/helpers.js';
import { removeUserFromMap } from '../../utils/groupManager.js';
import { readAsync, writeAsync } from '../../utils/database/io.js';

export default {
  name: "mute",
  description: "Muta um usuário no grupo (/mute para banir se falar, /mute 2 para apenas apagar mensagens)",
  commands: ["mute", "mutar"],
  usage: `${global.prefixo}mute @usuário ou ${global.prefixo}mute 2 @usuário`,
  handle: async ({ 
    bot,
    from,
    reply,
    isBotAdmin,
    menc_os2,
    args,
    info,
    MESSAGES,
    buildGroupFilePath
  }) => {
    try {
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      if (!menc_os2) return reply(MESSAGES.error.missing('alguém'));
      
      const isMute2 = Array.isArray(args) && args[0] === '2';
      const groupFilePath = buildGroupFilePath(from);
      let groupData = await readAsync(groupFilePath, { mutedUsers: {}, mutedUsers2: {} });
      
      groupData.mutedUsers = groupData.mutedUsers || {};
      groupData.mutedUsers2 = groupData.mutedUsers2 || {};
      const targetId = await normalizeUserId(bot, menc_os2);
      
      if (isMute2) {
        removeUserFromMap(groupData.mutedUsers, targetId);
        removeUserFromMap(groupData.mutedUsers, menc_os2);

        groupData.mutedUsers2[targetId] = true;
        if (targetId !== menc_os2) {
          groupData.mutedUsers2[menc_os2] = true;
        }

        await writeAsync(groupFilePath, groupData);

        await bot.sendMessage(from, {
          text: MESSAGES.admin.mute2.success(getUserName(menc_os2)),
          mentions: [menc_os2]
        }, {
          quoted: info
        });
      } else {
        removeUserFromMap(groupData.mutedUsers2, targetId);
        removeUserFromMap(groupData.mutedUsers2, menc_os2);

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
      }
      
    } catch (e) {
      console.error(e);
      reply(MESSAGES.error.general);
    }
  }
};
