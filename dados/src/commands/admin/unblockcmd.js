import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "unblockcmd",
  description: "Desbloqueia um comando específico no grupo",
  commands: ["unblockcmd"],
  usage: `${global.prefixo}unblockcmd <nome_do_comando>`,
  handle: async ({ 
    from,
    reply,
    isGroup,
    isGroupAdmin,
    q,
    prefix,
    MESSAGES,
    groupData,
    groupFile,
    optimizer
  }) => {
    try {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.userAdminOnly);
      if (!q) return reply(`❌ Digite o comando que deseja desbloquear. Exemplo: ${prefix}unblockcmd sticker`);
      
      groupData.blockedCommands = groupData.blockedCommands || {};
      const cmdKey = q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll(prefix, '');
      
      if (groupData.blockedCommands[cmdKey]) {
        delete groupData.blockedCommands[cmdKey];
        await optimizer.saveJsonWithCache(groupFile, groupData);
        reply(`🔓 O comando *${q.trim()}* foi desbloqueado e pode ser usado por todos.`);
      } else {
        reply('❌ Este comando não está bloqueado.');
      }
    } catch (e) {
      console.error(e);
      reply(MESSAGES.error.simple);
    }
  }
};
