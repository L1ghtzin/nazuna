import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeUserId, getUserName } from '../../utils/helpers.js';
import { removeUserFromMap } from '../../utils/groupManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "unmute",
  description: "Desmuta um usuário no grupo",
  commands: ["desmutar", "desmute", "unmute"],
  usage: `${global.prefixo}unmute @usuário`,
  handle: async ({ 
    bot,
    from,
    reply,
    isGroup,
    isGroupAdmin,
    menc_os2,
    info,
    MESSAGES,
    optimizer,
    buildGroupFilePath,
    writeJsonFile
  }) => {
    try {
      if (!menc_os2) return reply(MESSAGES.error.missing('alguém'));
      
      const groupFilePath = buildGroupFilePath(from);
      let groupData = await optimizer.loadJsonWithCache(groupFilePath, { mutedUsers: {} });
      
      groupData.mutedUsers = groupData.mutedUsers || {};
      const targetId = await normalizeUserId(bot, menc_os2);
      
      const removed = removeUserFromMap(groupData.mutedUsers, targetId) || 
                      removeUserFromMap(groupData.mutedUsers, menc_os2);
      
      if (removed) {
        await optimizer.saveJsonWithCache(groupFilePath, groupData);
        optimizer.invalidateGroup(from);
        await bot.sendMessage(from, {
          text: MESSAGES.admin.unmute.success(getUserName(menc_os2)),
          mentions: [menc_os2]
        }, {
          quoted: info
        });
      } else {
        reply(MESSAGES.admin.unmute.notMuted);
      }
      
    } catch (e) {
      console.error(e);
      reply(MESSAGES.error.general);
    }
  }
};
