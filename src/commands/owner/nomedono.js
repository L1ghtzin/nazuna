import { CONFIG_FILE } from '../../utils/paths.js';
import { readAsync, writeAsync } from '../../utils/database/io.js';

export default {
  name: "nomedono",
  description: "Altera o nome global do dono",
  commands: ["nomedono", "nome-dono"],
  usage: `${global.prefixo}nomedono <novo_nome>`,
  handle: async ({
    reply,
    q,
    prefix,
    command,
    config,
    MESSAGES
  }) => {
    try {
      if (!q) return reply(MESSAGES.owner.nomedono.missingName(prefix, command));
      
      const nextConfig = { ...(config || await readAsync(CONFIG_FILE, {})), nomedono: q };
      
      await writeAsync(CONFIG_FILE, nextConfig);
      
      await reply(MESSAGES.owner.nomedono.success(q));
      
    } catch (e) {
      console.error(e);
      await reply(MESSAGES.error.general);
    }
  }
};
