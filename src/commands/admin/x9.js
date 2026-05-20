import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "x9",
  description: "Ativa/desativa o modo X9 de reportar ações administrativas",
  commands: ["x9"],
  usage: `${global.prefixo}x9`,
  handle: async ({ 
    nazu,
    from,
    reply,
    isGroup,
    isGroupAdmin,
    groupData,
    groupFile,
    optimizer,
    MESSAGES
  }) => {
    try {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      
      groupData.x9 = !groupData.x9;
      await optimizer.saveJsonWithCache(groupFile, groupData);
      
      const status = groupData.x9 ? 'ativado' : 'desativado';
      const emoji = groupData.x9 ? '✅' : '❌';
      
      let msg = `${emoji} *Modo X9 ${status}!*\n\n`;
      
      if (groupData.x9) {
        msg += `📋 *O que o modo X9 faz?*\n`;
        msg += `  Reporta quando alguém é promovido a ADM\n`;
        msg += `  Reporta quando alguém é removido como ADM\n`;
        msg += `  Reporta quando alguém é removido do grupo\n`;
        msg += `  Reporta quando alguém entra no grupo\n`;
        msg += `  Reporta quando o grupo é atualizado\n\n`;
        msg += `📢 *Os reports serão enviados no grupo com menções!*\n`;
        msg += `⚠️ *Use com responsabilidade* ⚠️`;
      } else {
        msg += `📋 Modo X9 desativado.\n`;
        msg += `Nenhuma ação administrativa será reportada no grupo.`;
      }
      
      await reply(msg);
    } catch (e) {
      console.error(e);
      await reply("❌ Ocorreu um erro ao configurar o modo X9.");
    }
  }
};
