import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { writeAsync } from '../../utils/database/io.js';

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
    groupFile
  }) => {
    try {
      if (!q) return reply(MESSAGES.admin.unblockcmd.usage(prefix));
      
      groupData.blockedCommands = groupData.blockedCommands || {};
      const cmdKey = q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll(prefix, '');
      
      if (groupData.blockedCommands[cmdKey]) {
        delete groupData.blockedCommands[cmdKey];
        await writeAsync(groupFile, groupData);
        reply(MESSAGES.admin.unblockcmd.success(q.trim()));
      } else {
        reply(MESSAGES.admin.unblockcmd.notBlocked);
      }
    } catch (e) {
      console.error(e);
      reply(MESSAGES.error.general);
    }
  }
};
