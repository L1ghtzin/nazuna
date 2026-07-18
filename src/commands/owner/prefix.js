import { CONFIG_FILE } from '../../utils/paths.js';
import { readAsync, writeAsync } from '../../utils/database/io.js';

export default {
  name: "prefix",
  description: "Altera o prefixo global do bot",
  commands: ["prefix", "prefixo"],
  usage: `${global.prefixo}prefix <novo_prefixo>`,
  handle: async ({
    reply,
    q,
    prefix,
    command,
    config,
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
      
      const nextConfig = { ...(config || await readAsync(CONFIG_FILE, {})), prefixo: newPrefix };
      
      await writeAsync(CONFIG_FILE, nextConfig);
      
    } catch (e) {
      console.error(e);
      reply(MESSAGES.error.general);
    }
  }
};
