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
  usage: `${global.prefixo}mute @usuario`,
  handle: async ({ 
    nazu,
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
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.userAdminOnly);
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      if (!menc_os2) return reply(MESSAGES.permission.mentionRequired);
      
      const groupFilePath = buildGroupFilePath(from);
      let groupData = await optimizer.loadJsonWithCache(groupFilePath, { mutedUsers: {} });
      
      groupData.mutedUsers = groupData.mutedUsers || {};
      const targetId = await normalizeUserId(nazu, menc_os2);
      groupData.mutedUsers[targetId] = true;
      
      if (targetId !== menc_os2) {
        groupData.mutedUsers[menc_os2] = true;
      }
      
      writeJsonFile(groupFilePath, groupData);
      
      await nazu.sendMessage(from, {
        text: `✅ @${getUserName(menc_os2)} foi mutado. Se enviar mensagens, será banido.`,
        mentions: [menc_os2]
      }, {
        quoted: info
      });
      
    } catch (e) {
      console.error(e);
      reply(MESSAGES.error.simple);
    }
  }
};
