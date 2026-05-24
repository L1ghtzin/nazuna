import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeUserId, getUserName } from '../../utils/helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "mute2",
  description: "Muta um usuário no grupo (mensagens serão apagadas)",
  commands: ["mute2", "mutar2"],
  usage: `${global.prefixo}mute2 @usuario`,
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
      if (!menc_os2) return reply(MESSAGES.error.missing('alguém'));
      
      const groupFilePath = buildGroupFilePath(from);
      let groupData = await optimizer.loadJsonWithCache(groupFilePath, { mutedUsers2: {} });
      
      groupData.mutedUsers2 = groupData.mutedUsers2 || {};
      const targetId = await normalizeUserId(nazu, menc_os2);
      groupData.mutedUsers2[targetId] = true;
      
      if (targetId !== menc_os2) {
        groupData.mutedUsers2[menc_os2] = true;
      }
      
      writeJsonFile(groupFilePath, groupData);
      
      await nazu.sendMessage(from, {
        text: `✅ @${getUserName(menc_os2)} foi mutado. Suas mensagens serão apagadas automaticamente.`,
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
