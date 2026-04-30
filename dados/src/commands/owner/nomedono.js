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
      if (!q) return reply(`Por favor, digite o novo nome do dono.\nExemplo: ${prefix}${command} Hiudy`);
      
      let config = JSON.parse(fs.readFileSync(CONFIG_FILE));
      config.nomedono = q;
      
      await optimizer.saveJsonWithCache(CONFIG_FILE, config);
      
      await reply(`Nome do dono alterado com sucesso para "${q}"!`);
      
    } catch (e) {
      console.error(e);
      await reply(MESSAGES.error.unexpected);
    }
  }
};
