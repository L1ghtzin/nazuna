import pathz from 'path';
import fs from 'fs/promises';
import { GRUPOS_DIR } from '../../utils/paths.js';
import { diagnosticDatabase, saveMenuDesign, getMenuDesignWithDefaults } from '../../utils/database.js';

export default {
  name: "system_maintenance",
  description: "Comandos de manutenção e estilos do sistema",
  commands: [
    "limpardb", "limparrank", "resetrank", "limparrankg", "repairdb", 
    "fixdb", "diagnosticrpg", "set", "style", "preview", "reset", "resetgold"
  ],
  handle: async ({ 
    bot, reply, command,
    loadEconomy, saveEconomy, prefix,
    q,
    MESSAGES
  }) => {
    const cmd = command.toLowerCase();


    // Comandos abaixo são apenas para dono
    // --- LIMPEZA DE GRUPOS ---
    if (cmd === 'limpardb') {
      try {
        const allGroups = await bot.groupFetchAllParticipating();
        const currentGroupIds = Object.keys(allGroups);
        
        const files = (await fs.readdir(GRUPOS_DIR)).filter(f => f.endsWith('.json'));
        let count = 0;
        
        for (const file of files) {
          const gid = file.replace('.json', '');
          if (!currentGroupIds.includes(gid)) {
            await fs.unlink(pathz.join(GRUPOS_DIR, file));
            count++;
          }
        }
        return reply(MESSAGES.owner.maintenance.limpardb.success(count));
      } catch (e) {
        return reply(MESSAGES.error.general);
      }
    }

    // --- REPARO E DIAGNÓSTICO ---
    if (['repairdb', 'fixdb', 'diagnosticrpg'].includes(cmd)) {
      try {
        await reply(MESSAGES.owner.maintenance.diagnostic.start);
        if (typeof diagnosticDatabase === 'function') {
          const econ = loadEconomy();
          const stats = diagnosticDatabase(econ);
          saveEconomy(econ);
          return reply(MESSAGES.owner.maintenance.diagnostic.success(stats.totalUsers, stats.usersMigrated, stats.petsFixed));
        } else {
          return reply(MESSAGES.owner.maintenance.diagnostic.fallback);
        }
      } catch (e) {
        return reply(MESSAGES.owner.maintenance.diagnostic.fail);
      }
    }

    // --- ESTILOS ---
    if (['set', 'style', 'preview'].includes(cmd)) {
      if (cmd === 'preview') {
        const design = typeof getMenuDesignWithDefaults === 'function' ? getMenuDesignWithDefaults() : { headerStyle: "Premium" };
        return reply(MESSAGES.owner.maintenance.style.preview(design.headerStyle || 'Padrão'));
      }
      if (!q) return reply(MESSAGES.owner.maintenance.style.missingStyle(prefix, cmd));
      
      if (typeof saveMenuDesign === 'function') {
        const design = getMenuDesignWithDefaults();
        design.headerStyle = q;
        saveMenuDesign(design);
      }
      return reply(MESSAGES.owner.maintenance.style.success(q));
    }

    return reply(MESSAGES.owner.maintenance.defaultSuccess(cmd));
  }
};
