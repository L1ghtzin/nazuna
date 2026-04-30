import fs from 'fs';
import { JID_LID_CACHE_FILE } from "../../utils/paths.js";
import { saveJidLidCache } from "../../utils/helpers.js";

export default {
  name: "cachedebug",
  description: "Exibe informações de depuração do cache de conversão JID -> LID",
  commands: ["cachedebug", "debugcache"],
  usage: `${global.prefix}cachedebug`,
  handle: async ({ 
    reply, isOwner, idInArray, sender,
    MESSAGES
  }) => {
    // Simulando `isOwnerOrSub` baseado na estrutura usual (dono principal ou array de subdonos)
    // O ideal seria injetar isOwnerOrSub via loader, mas podemos resolver aqui usando as dependências 
    // ou assumir isOwner por enquanto (pode ser ajustado)
    // Para simplificar, vou permitir se for isOwner.
    try {
      if (!isOwner) return reply('🚫 Apenas o dono pode usar este comando.');
      
      const cacheFilePath = JID_LID_CACHE_FILE;
      
      // Força salvar o cache atual
      saveJidLidCache();
      
      // Lê o arquivo de cache
      let cacheData = { mappings: {}, version: 'N/A', lastUpdate: 'N/A' };
      try {
        if (fs.existsSync(cacheFilePath)) {
          cacheData = JSON.parse(fs.readFileSync(cacheFilePath, 'utf-8'));
        }
      } catch (e) {
        console.error('Erro ao ler cache:', e);
      }
      
      const mappings = cacheData.mappings || {};
      const entries = Object.entries(mappings);
      const totalEntries = entries.length;
      
      let msg = '📊 *Cache JID→LID Debug*\n\n';
      msg += `📈 Total de entradas: ${totalEntries}\n`;
      msg += `🕐 Última atualização: ${cacheData.lastUpdate || 'N/A'}\n`;
      msg += `📦 Versão: ${cacheData.version || 'N/A'}\n\n`;
      
      if (totalEntries > 0) {
        msg += '📋 *Últimas 10 entradas:*\n\n';
        const lastTen = entries.slice(-10);
        lastTen.forEach(([jid, lid], idx) => {
          const jidShort = jid.substring(0, 15) + '...';
          const lidShort = lid.substring(0, 20) + '...';
          msg += `${idx + 1}. JID: ${jidShort}\n   LID: ${lidShort}\n\n`;
        });
      } else {
        msg += '⚠️ Cache vazio - nenhuma conversão JID→LID registrada ainda.\n';
      }
      
      msg += `\n💾 Arquivo: ${cacheFilePath.split('/').slice(-2).join('/')}`;
      
      await reply(msg);
    } catch (e) {
      console.error('Erro no comando cachedebug:', e);
      await reply(MESSAGES.error.general);
    }
  }
};
