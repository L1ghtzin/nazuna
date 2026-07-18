import { JID_LID_CACHE_FILE } from "../../utils/paths.js";
import { saveJidLidCache } from "../../utils/helpers.js";
import { readAsync } from '../../utils/database/io.js';

export default {
  name: "cachedebug",
  description: "Exibe informações de depuração do cache de conversão JID -> LID",
  commands: ["cachedebug", "debugcache"],
  usage: `${global.prefix}cachedebug`,
  handle: async ({ 
    reply,
    MESSAGES
  }) => {
    try {
      const cacheFilePath = JID_LID_CACHE_FILE;
      
      // Força salvar o cache atual
      saveJidLidCache();
      
      // Lê o arquivo de cache
      const cacheData = await readAsync(cacheFilePath, { mappings: {}, version: 'N/A', lastUpdate: 'N/A' });
      
      const mappings = cacheData.mappings || {};
      const entries = Object.entries(mappings);
      const totalEntries = entries.length;
      
      let msg = MESSAGES.owner.cachedebug.header;
      msg += MESSAGES.owner.cachedebug.stats(totalEntries, cacheData.lastUpdate || 'N/A', cacheData.version || 'N/A');
      
      if (totalEntries > 0) {
        msg += MESSAGES.owner.cachedebug.lastEntriesHeader;
        const lastTen = entries.slice(-10);
        lastTen.forEach(([jid, lid], idx) => {
          const jidShort = jid.substring(0, 15) + '...';
          const lidShort = lid.substring(0, 20) + '...';
          msg += MESSAGES.owner.cachedebug.entryLine(idx + 1, jidShort, lidShort);
        });
      } else {
        msg += MESSAGES.owner.cachedebug.empty;
      }
      
      msg += MESSAGES.owner.cachedebug.footer(cacheFilePath.split(/[\\/]/).slice(-2).join('/'));
      
      await reply(msg);
    } catch (e) {
      console.error('Erro no comando cachedebug:', e);
      await reply(MESSAGES.error.general);
    }
  }
};
