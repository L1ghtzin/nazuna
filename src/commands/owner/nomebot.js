import { CONFIG_FILE } from '../../utils/paths.js';
import { readJsonFileAsync, writeJsonFileAsync } from '../../utils/asyncFs.js';

export default {
  name: "nomebot",
  description: "Altera o nome global do bot",
  commands: ["nomebot", "botname", "nome-bot"],
  usage: `${global.prefixo}nomebot <novo_nome>`,
  handle: async ({
    reply,
    q,
    prefix,
    command,
    config,
    MESSAGES
  }) => {
    try {
      if (!q) return reply(MESSAGES.owner.nomebot.missingName(prefix, command));
      
      const nextConfig = { ...(config || await readJsonFileAsync(CONFIG_FILE, {})), nomebot: q };
      
      await writeJsonFileAsync(CONFIG_FILE, nextConfig);
      
      await reply(MESSAGES.owner.nomebot.success(q));
      
    } catch (e) {
      console.error(e);
      await reply(MESSAGES.error.general);
    }
  }
};
