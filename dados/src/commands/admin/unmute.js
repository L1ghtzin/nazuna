import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeUserId, getUserName } from '../../utils/helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function removeUserFromMap(map, userId) {
  if (!map) return false;
  if (map[userId]) {
    delete map[userId];
    return true;
  }
  return false;
}

export default {
  name: "unmute",
  description: "Desmuta um usuário no grupo",
  commands: ["desmutar", "desmute", "unmute"],
  usage: `${global.prefixo}unmute @usuario`,
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
      let groupData = await optimizer.loadJsonWithCache(groupFilePath, { mutedUsers: {} });
      
      groupData.mutedUsers = groupData.mutedUsers || {};
      const targetId = await normalizeUserId(nazu, menc_os2);
      
      const removed = removeUserFromMap(groupData.mutedUsers, targetId) || 
                      removeUserFromMap(groupData.mutedUsers, menc_os2);
      
      if (removed) {
        writeJsonFile(groupFilePath, groupData);
        await nazu.sendMessage(from, {
          text: `✅ @${getUserName(menc_os2)} foi desmutado e pode enviar mensagens novamente.`,
          mentions: [menc_os2]
        }, {
          quoted: info
        });
      } else {
        reply('❌ Este usuário não está mutado.');
      }
      
    } catch (e) {
      console.error(e);
      reply(MESSAGES.error.simple);
    }
  }
};
