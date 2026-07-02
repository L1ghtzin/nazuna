import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { writeJsonFileAsync } from '../../utils/asyncFs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "blockcmd",
  description: "Bloqueia um comando específico no grupo (só ADMs podem usar)",
  commands: ["blockcmd"],
  usage: `${global.prefixo}blockcmd <nome_do_comando>`,
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
      if (!q) return reply(MESSAGES.admin.blockcmd.missingCmd(prefix));
      
      groupData.blockedCommands = groupData.blockedCommands || {};
      groupData.blockedCommands[q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll(prefix, '')] = true;
      
      await writeJsonFileAsync(groupFile, groupData);
      reply(MESSAGES.admin.blockcmd.success(q.trim()));
    } catch (e) {
      console.error(e);
      reply(MESSAGES.error.general);
    }
  }
};
