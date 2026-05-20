import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeUserId, getUserName } from '../../utils/helpers.js';
import { removeUserFromMap } from '../../utils/groupManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "unmute2",
  description: "Desmuta um usuário no grupo (sistema mute2)",
  commands: ["unmute2", "desmute2", "desmutar2"],
  usage: `${global.prefixo}unmute2 @usuario`,
  handle: async ({ 
    nazu,
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
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.userAdminOnly);
      if (!menc_os2) return reply(MESSAGES.permission.mentionRequired);
      
      const groupFilePath = buildGroupFilePath(from);
      let groupData = await optimizer.loadJsonWithCache(groupFilePath, { mutedUsers2: {} });
      
      groupData.mutedUsers2 = groupData.mutedUsers2 || {};
      const targetId = await normalizeUserId(nazu, menc_os2);
      
      const removed = removeUserFromMap(groupData.mutedUsers2, targetId) || 
                      removeUserFromMap(groupData.mutedUsers2, menc_os2);
      
      if (removed) {
        writeJsonFile(groupFilePath, groupData);
        await nazu.sendMessage(from, {
          text: `✅ @${getUserName(menc_os2)} foi desmutado e pode enviar mensagens novamente.`,
          mentions: [menc_os2]
        }, {
          quoted: info
        });
      } else {
        reply('❌ Este usuário não está mutado no sistema mute2.');
      }
      
    } catch (e) {
      console.error(e);
      reply(MESSAGES.error.simple);
    }
  }
};
