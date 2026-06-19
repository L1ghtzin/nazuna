import fs from 'fs';
import { CONFIG_FILE } from '../../utils/paths.js';

export default {
  name: "nomebot",
  description: "Altera o nome global do bot",
  commands: ["nomebot", "botname", "nome-bot"],
  usage: `${global.prefixo}nomebot <novo_nome>`,
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
      if (!q) return reply(MESSAGES.owner.nomebot.missingName(prefix, command));
      
      let config = JSON.parse(fs.readFileSync(CONFIG_FILE));
      config.nomebot = q;
      
      await optimizer.saveJsonWithCache(CONFIG_FILE, config);
      
      await reply(MESSAGES.owner.nomebot.success(q));
      
    } catch (e) {
      console.error(e);
      await reply(MESSAGES.error.general);
    }
  }
};
