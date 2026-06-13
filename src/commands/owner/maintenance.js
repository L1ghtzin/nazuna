import pathz from 'path';
import fs from 'fs';
import { diagnosticDatabase, saveMenuDesign, getMenuDesignWithDefaults } from '../../utils/database.js';

export default {
  name: "system_maintenance",
  description: "Comandos de manutenção e estilos do sistema",
  commands: [
    "limpardb", "limparrank", "resetrank", "limparrankg", "repairdb", 
    "fixdb", "diagnosticrpg", "set", "style", "preview", "reset", "resetgold"
  ],
  handle: async ({ 
    bot, from, reply, isOwner, command, DATABASE_DIR, optimizer, nomedono,
    sender, loadEconomy, getEcoUser, saveEconomy, prefix,
    info, q, args, isGroup, groupData,
    MESSAGES
  }) => {
    const cmd = command.toLowerCase();

    // --- APOSTAS PET ---
    if (['apostarpet', 'petbet'].includes(cmd)) {
      if (!isGroup) return reply(MESSAGES.owner.maintenance.apostarpet.groupOnly);
      if (!groupData?.modorpg) return reply(MESSAGES.owner.maintenance.apostarpet.rpgDisabled(prefix));
      
      if (!loadEconomy) return reply(MESSAGES.owner.maintenance.apostarpet.ecoDisabled);
      
      const econ = loadEconomy();
      const me = getEcoUser(econ, sender);
      const target = (info.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) || null;
      
      if (!target) return reply(MESSAGES.owner.maintenance.apostarpet.noTarget(prefix));
      if (target === sender) return reply(MESSAGES.owner.maintenance.apostarpet.selfBet);
      
      const argsArr = q.split(' ');
      const betAmount = parseInt(argsArr[0]) || 0;
      const petIndex = parseInt(argsArr[1]) - 1;
      
      if (betAmount <= 0) return reply(MESSAGES.owner.maintenance.apostarpet.invalidAmount);
      if (betAmount > me.wallet) return reply(MESSAGES.owner.maintenance.apostarpet.insufficientFunds);
      
      const opponent = getEcoUser(econ, target);
      if (betAmount > opponent.wallet) return reply(MESSAGES.owner.maintenance.apostarpet.opponentInsufficient);
      
      if (!me.pets || me.pets.length === 0) return reply(MESSAGES.owner.maintenance.apostarpet.noPets);
      if (!opponent.pets || opponent.pets.length === 0) return reply(MESSAGES.owner.maintenance.apostarpet.opponentNoPets);
      
      if (isNaN(petIndex) || petIndex < 0 || petIndex >= me.pets.length) {
        return reply(MESSAGES.owner.maintenance.apostarpet.invalidPet(prefix));
      }
      
      const myPet = me.pets[petIndex];
      const oppPet = opponent.pets[Math.floor(Math.random() * opponent.pets.length)];
      
      // Batalha
      let myHp = myPet.hp;
      let oppHp = oppPet.hp;
      
      while (myHp > 0 && oppHp > 0) {
        const myDmg = Math.max(1, myPet.attack - Math.floor(oppPet.defense / 2) + Math.floor(Math.random() * 10));
        oppHp -= myDmg;
        if (oppHp <= 0) break;
        
        const oppDmg = Math.max(1, oppPet.attack - Math.floor(myPet.defense / 2) + Math.floor(Math.random() * 10));
        myHp -= oppDmg;
      }
      
      const won = myHp > oppHp;
      
      const resultMsg = MESSAGES.owner.maintenance.apostarpet.resultMsg(myPet, oppPet, betAmount, won);
      
      saveEconomy(econ);
      return reply(resultMsg, { mentions: [target] });
    }

    // Comandos abaixo são apenas para dono
    if (!isOwner) return reply(MESSAGES.permission.ownerOnly);

    // --- LIMPEZA DE GRUPOS ---
    if (cmd === 'limpardb') {
      try {
        const allGroups = await bot.groupFetchAllParticipating();
        const currentGroupIds = Object.keys(allGroups);
        const gruposDir = pathz.join(DATABASE_DIR, 'grupos');
        
        const files = fs.readdirSync(gruposDir).filter(f => f.endsWith('.json'));
        let count = 0;
        
        for (const file of files) {
          const gid = file.replace('.json', '');
          if (!currentGroupIds.includes(gid)) {
            fs.unlinkSync(pathz.join(gruposDir, file));
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
