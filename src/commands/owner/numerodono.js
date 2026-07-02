import { CONFIG_FILE } from '../../utils/paths.js';
import { readJsonFileAsync, writeJsonFileAsync } from '../../utils/asyncFs.js';

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
    MESSAGES
  }) => {
    try {
      if (!q) return reply(MESSAGES.owner.numerodono.missingParams(prefix, command));
      
      const nextConfig = { ...(config || await readJsonFileAsync(CONFIG_FILE, {})), numerodono: q };
      
      await writeJsonFileAsync(CONFIG_FILE, nextConfig);
      
      await reply(MESSAGES.owner.numerodono.success(q));
    } catch (e) {
      console.error(e);
      await reply(MESSAGES.error.general);
    }
  }
};
