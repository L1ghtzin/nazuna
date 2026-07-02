import { normalizeUserId, getUserName } from '../../utils/helpers.js';
import { removeUserFromMap } from '../../utils/groupManager.js';
import { readJsonFileAsync, writeJsonFileAsync } from '../../utils/asyncFs.js';

export default {
  name: "unmute2",
  description: "Desmuta um usuário no grupo (sistema mute2)",
  commands: ["unmute2", "desmute2", "desmutar2"],
  usage: `${global.prefixo}unmute2 @usuário`,
  handle: async ({ 
    bot,
    from,
    reply,
    isGroup,
    isGroupAdmin,
    menc_os2,
    info,
    MESSAGES,
    buildGroupFilePath
  }) => {
    try {

      if (!menc_os2) return reply(MESSAGES.error.missing('alguém'));
      
      const groupFilePath = buildGroupFilePath(from);
      let groupData = await readJsonFileAsync(groupFilePath, { mutedUsers2: {} });
      
      groupData.mutedUsers2 = groupData.mutedUsers2 || {};
      const targetId = await normalizeUserId(bot, menc_os2);
      
      const removed = removeUserFromMap(groupData.mutedUsers2, targetId) || 
                      removeUserFromMap(groupData.mutedUsers2, menc_os2);
      
      if (removed) {
        await writeJsonFileAsync(groupFilePath, groupData);
        await bot.sendMessage(from, {
          text: MESSAGES.admin.unmute2.success(getUserName(menc_os2)),
          mentions: [menc_os2]
        }, {
          quoted: info
        });
      } else {
        reply(MESSAGES.admin.unmute2.notMuted);
      }
      
    } catch (e) {
      console.error(e);
      reply(MESSAGES.error.general);
    }
  }
};
