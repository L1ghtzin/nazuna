import fs from 'fs';
import { CONFIG_FILE } from '../../utils/paths.js';

export default {
  name: "prefix",
  description: "Altera o prefixo global do bot",
  commands: ["prefix", "prefixo", "setprefix"],
  usage: `${global.prefixo}prefix <novo_prefixo>`,
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
      if (!q) return reply(`📌 *Configuração de Prefixo*\n\n📝 *Como usar:*\n  Digite o novo prefixo após o comando\n  Ex: ${prefix}${command} /\n  Ex: ${prefix}${command} !\n\n⚠️ O prefixo do bot será atualizado para o valor especificado!`);
      
      let newPrefix = q.trim();
      
      // Bloqueia o uso de $ como prefixo e converte automaticamente para /
      if (newPrefix === '$') {
        newPrefix = '/';
        await reply(`💔 O símbolo "$" é reservado e não pode ser usado como prefixo.\n✅ Prefixo alterado automaticamente para "/" globalmente!`);
      } else {
        await reply(`✅ Prefixo alterado globalmente para: "${newPrefix}"`);
      }
      
      let config = JSON.parse(fs.readFileSync(CONFIG_FILE));
      config.prefixo = newPrefix;
      
      await optimizer.saveJsonWithCache(CONFIG_FILE, config);
      
    } catch (e) {
      console.error(e);
      reply(MESSAGES.error.simple);
    }
  }
};
