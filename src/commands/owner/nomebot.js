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
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      if (!q) return reply(`Por favor, digite o novo nome do bot.\nExemplo: ${prefix}${command} Nazuna`);
      
      let config = JSON.parse(fs.readFileSync(CONFIG_FILE));
      config.nomebot = q;
      
      await optimizer.saveJsonWithCache(CONFIG_FILE, config);
      
      await reply(`Nome do bot alterado com sucesso para "${q}"!`);
      
    } catch (e) {
      console.error(e);
      await reply(MESSAGES.error.unexpected);
    }
  }
};
