import fs from 'fs';
import { CONFIG_FILE } from '../../utils/paths.js';

export default {
  name: "numerodono",
  description: "Altera o número do dono do bot",
  commands: ["numerodono", "numero-dono"],
  usage: `${global.prefixo}numerodono <novo_numero>`,
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
      if (!q) return reply(`Por favor, digite o novo número do dono.\nExemplo: ${prefix}${command} +559681361714`);
      
      let config = JSON.parse(fs.readFileSync(CONFIG_FILE));
      config.numerodono = q;
      
      await optimizer.saveJsonWithCache(CONFIG_FILE, config);
      
      await reply(`Número do dono alterado com sucesso para "${q}"!`);
    } catch (e) {
      console.error(e);
      await reply(MESSAGES.error.unexpected);
    }
  }
};
