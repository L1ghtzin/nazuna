import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { writeAsync } from '../../utils/database/io.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "x9",
  description: "Ativa/desativa o modo X9 de reportar ações administrativas",
  commands: ["x9"],
  usage: `${global.prefixo}x9`,
  handle: async ({ 
    bot,
    from,
    reply,
    isGroup,
    isGroupAdmin,
    groupData,
    groupFile,
    MESSAGES
  }) => {
    try {
      groupData.x9 = !groupData.x9;
      await writeAsync(groupFile, groupData);
      
      const status = groupData.x9 ? 'ativado' : 'desativado';
      const emoji = groupData.x9 ? '✅' : '❌';
      
      let msg = MESSAGES.admin.x9.statusMessage(emoji, status);
      
      if (groupData.x9) {
        msg += MESSAGES.admin.x9.onInfo;
      } else {
        msg += MESSAGES.admin.x9.offInfo;
      }
      
      await reply(msg);
    } catch (e) {
      console.error(e);
      await reply(MESSAGES.admin.x9.error);
    }
  }
};
