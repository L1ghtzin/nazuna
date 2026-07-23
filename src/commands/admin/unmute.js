import { normalizeUserId, getUserName } from '../../utils/helpers.js';
import { removeUserFromMap } from '../../utils/groupManager.js';
import { readAsync, writeAsync } from '../../utils/database/io.js';

export default {
  name: "unmute",
  description: "Desmuta um usuário no grupo (/unmute ou /unmute 2)",
  commands: ["desmutar", "desmute", "unmute"],
  usage: `${global.prefixo}unmute @usuário ou ${global.prefixo}unmute 2 @usuário`,
  handle: async ({ 
    bot,
    from,
    reply,
    menc_os2,
    args,
    info,
    MESSAGES,
    buildGroupFilePath
  }) => {
    try {
      if (!menc_os2) return reply(MESSAGES.error.missing('alguém'));
      
      const isUnmute2 = Array.isArray(args) && args[0] === '2';
      const groupFilePath = buildGroupFilePath(from);
      let groupData = await readAsync(groupFilePath, { mutedUsers: {}, mutedUsers2: {} });
      
      groupData.mutedUsers = groupData.mutedUsers || {};
      groupData.mutedUsers2 = groupData.mutedUsers2 || {};
      const targetId = await normalizeUserId(bot, menc_os2);
      
      if (isUnmute2) {
        const removed = removeUserFromMap(groupData.mutedUsers2, targetId) || 
                        removeUserFromMap(groupData.mutedUsers2, menc_os2);
        
        if (removed) {
          await writeAsync(groupFilePath, groupData);
          await bot.sendMessage(from, {
            text: MESSAGES.admin.unmute2.success(getUserName(menc_os2)),
            mentions: [menc_os2]
          }, {
            quoted: info
          });
        } else {
          reply(MESSAGES.admin.unmute2.notMuted);
        }
      } else {
        const removed1 = removeUserFromMap(groupData.mutedUsers, targetId) || 
                         removeUserFromMap(groupData.mutedUsers, menc_os2);
        const removed2 = removeUserFromMap(groupData.mutedUsers2, targetId) || 
                         removeUserFromMap(groupData.mutedUsers2, menc_os2);
        const removed = removed1 || removed2;

        if (removed) {
          await writeAsync(groupFilePath, groupData);
          await bot.sendMessage(from, {
            text: MESSAGES.admin.unmute.success(getUserName(menc_os2)),
            mentions: [menc_os2]
          }, {
            quoted: info
          });
        } else {
          reply(MESSAGES.admin.unmute.notMuted);
        }
      }
      
    } catch (e) {
      console.error(e);
      reply(MESSAGES.error.general);
    }
  }
};
