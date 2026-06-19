import { CONFIG_FILE } from '../../utils/paths.js';

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
    optimizer,
    MESSAGES
  }) => {
    try {
      if (!q) return reply(MESSAGES.owner.nomebot.missingName(prefix, command));
      
      const nextConfig = { ...(config || await optimizer.loadJsonWithCache(CONFIG_FILE, {})), nomebot: q };
      
      await optimizer.saveJsonWithCache(CONFIG_FILE, nextConfig);
      
      await reply(MESSAGES.owner.nomebot.success(q));
      
    } catch (e) {
      console.error(e);
      await reply(MESSAGES.error.general);
    }
  }
};
