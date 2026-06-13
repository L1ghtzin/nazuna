import fs from 'fs';
import { CONFIG_FILE } from '../../utils/paths.js';

export default {
  name: "nomedono",
  description: "Altera o nome global do dono",
  commands: ["nomedono", "nome-dono"],
  usage: `${global.prefixo}nomedono <novo_nome>`,
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
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      if (!q) return reply(MESSAGES.owner.nomedono.missingName(prefix, command));
      
      let config = JSON.parse(fs.readFileSync(CONFIG_FILE));
      config.nomedono = q;
      
      await optimizer.saveJsonWithCache(CONFIG_FILE, config);
      
      await reply(MESSAGES.owner.nomedono.success(q));
      
    } catch (e) {
      console.error(e);
      await reply(MESSAGES.error.general);
    }
  }
};
