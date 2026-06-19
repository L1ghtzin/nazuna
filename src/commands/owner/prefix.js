import fs from 'fs';
import { CONFIG_FILE } from '../../utils/paths.js';

export default {
  name: "prefix",
  description: "Altera o prefixo global do bot",
  commands: ["prefix", "prefixo"],
  usage: `${global.prefixo}prefix <novo_prefixo>`,
  handle: async ({
    reply,
    isOwner,
    q,
    prefix,
    command,
    optimizer,
    MESSAGES
  }) => {
    try {

      if (!q) return reply(MESSAGES.owner.prefix.usage(prefix, command));
      
      let newPrefix = q.trim();
      
      // Bloqueia o uso de $ como prefixo e converte automaticamente para /
      if (newPrefix === '$') {
        newPrefix = '/';
        await reply(MESSAGES.owner.prefix.reserved);
      } else {
        await reply(MESSAGES.owner.prefix.success(newPrefix));
      }
      
      let config = JSON.parse(fs.readFileSync(CONFIG_FILE));
      config.prefixo = newPrefix;
      
      await optimizer.saveJsonWithCache(CONFIG_FILE, config);
      
    } catch (e) {
      console.error(e);
      reply(MESSAGES.error.general);
    }
  }
};
