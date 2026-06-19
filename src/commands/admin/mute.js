import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeUserId, getUserName } from '../../utils/helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    optimizer,
    buildGroupFilePath,
    writeJsonFile
  }) => {
    try {
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      if (!menc_os2) return reply(MESSAGES.error.missing('alguém'));
      
      const groupFilePath = buildGroupFilePath(from);
      let groupData = await optimizer.loadJsonWithCache(groupFilePath, { mutedUsers: {} });
      
      groupData.mutedUsers = groupData.mutedUsers || {};
      const targetId = await normalizeUserId(bot, menc_os2);
      groupData.mutedUsers[targetId] = true;
      
      if (targetId !== menc_os2) {
        groupData.mutedUsers[menc_os2] = true;
      }
      
      await optimizer.saveJsonWithCache(groupFilePath, groupData);
      optimizer.invalidateGroup(from);
      
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
