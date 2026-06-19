import { CONFIG_FILE } from '../../utils/paths.js';

export default {
  name: "numerodono",
  description: "Altera o número do dono do bot",
  commands: ["numerodono", "numero-dono"],
  usage: `${global.prefixo}numerodono <novo_numero>`,
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
      if (!q) return reply(MESSAGES.owner.numerodono.missingParams(prefix, command));
      
      const nextConfig = { ...(config || await optimizer.loadJsonWithCache(CONFIG_FILE, {})), numerodono: q };
      
      await optimizer.saveJsonWithCache(CONFIG_FILE, nextConfig);
      
      await reply(MESSAGES.owner.numerodono.success(q));
    } catch (e) {
      console.error(e);
      await reply(MESSAGES.error.general);
    }
  }
};
