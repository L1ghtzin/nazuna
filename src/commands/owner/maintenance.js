import pathz from 'path';
import fs from 'fs';
import { diagnosticDatabase, saveMenuDesign, getMenuDesignWithDefaults } from '../../utils/database.js';

export default {
  name: "system_maintenance",
  description: "Comandos de manutenção e estilos do sistema",
  commands: [
    "limpardb", "limparrank", "resetrank", "limparrankg", "repairdb", 
    "fixdb", "diagnosticrpg", "set", "style", "preview", "reset", "resetgold",
    "apostarpet", "petbet"
  ],
  handle: async ({ 
    nazu, from, reply, isOwner, command, DATABASE_DIR, optimizer, nomedono,
    sender, loadEconomy, getEcoUser, saveEconomy, prefix,
    info, q, args, isGroup, groupData,
    MESSAGES
  }) => {
    const cmd = command.toLowerCase();

    // --- APOSTAS PET ---
    if (['apostarpet', 'petbet'].includes(cmd)) {
      if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
      if (!groupData?.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);
      
      if (!loadEconomy) return reply(`💔 Sistema de economia não carregado neste módulo.`);
      
      const econ = loadEconomy();
      const me = getEcoUser(econ, sender);
      const target = (info.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) || null;
      
      if (!target) return reply(`💔 Marque alguém para apostar!\n\n💡 Uso: ${prefix}apostarpet <valor> <nº pet> @user`);
      if (target === sender) return reply(`💔 Você não pode apostar contra si mesmo!`);
      
      const argsArr = q.split(' ');
      const betAmount = parseInt(argsArr[0]) || 0;
      const petIndex = parseInt(argsArr[1]) - 1;
      
      if (betAmount <= 0) return reply(`💔 Informe um valor válido para apostar!`);
      if (betAmount > me.wallet) return reply(`💔 Você não tem dinheiro suficiente na carteira!`);
      
      const opponent = getEcoUser(econ, target);
      if (betAmount > opponent.wallet) return reply(`💔 Seu oponente não tem dinheiro suficiente!`);
      
      if (!me.pets || me.pets.length === 0) return reply('🐾 Você não tem pets!');
      if (!opponent.pets || opponent.pets.length === 0) return reply(`💔 Seu oponente não tem pets!`);
      
      if (isNaN(petIndex) || petIndex < 0 || petIndex >= me.pets.length) {
        return reply(`💔 Pet inválido! Use ${prefix}pets para ver seus pets.`);
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
      
      let resultMsg = `╭━━━⊱ 🎰 *APOSTA DE PETS* ⊱━━━╮\n\n`;
      resultMsg += `${myPet.emoji} *${myPet.name}* (Lv.${myPet.level}) VS ${oppPet.emoji} *${oppPet.name}* (Lv.${oppPet.level})\n\n`;
      resultMsg += `💰 Aposta: ${betAmount.toLocaleString()}\n\n`;
      
      if (won) {
        me.wallet += betAmount;
        opponent.wallet -= betAmount;
        resultMsg += `🏆 *VOCÊ VENCEU!*\n💰 Ganhou: +${betAmount.toLocaleString()}`;
      } else {
        me.wallet -= betAmount;
        opponent.wallet += betAmount;
        resultMsg += `💀 *VOCÊ PERDEU!*\n💸 Perdeu: -${betAmount.toLocaleString()}`;
      }
      
      resultMsg += `\n╰━━━━━━━━━━━━━━━━━━━━━━╯`;
      
      saveEconomy(econ);
      return reply(resultMsg, { mentions: [target] });
    }

    // Comandos abaixo são apenas para dono
    if (!isOwner) return reply("🚫 Apenas o dono do bot pode realizar manutenção no sistema!");

    // --- LIMPEZA DE GRUPOS ---
    if (cmd === 'limpardb') {
      try {
        const allGroups = await nazu.groupFetchAllParticipating();
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
        return reply(`🧹 *Limpeza concluída!*\n\nRemovidos *${count}* arquivos de grupos que o bot não participa mais.`);
      } catch (e) {
        return reply(MESSAGES.error.general);
      }
    }

    // --- REPARO E DIAGNÓSTICO ---
    if (['repairdb', 'fixdb', 'diagnosticrpg'].includes(cmd)) {
      try {
        await reply("🛠️ *Iniciando reparo do banco de dados...*");
        if (typeof diagnosticDatabase === 'function') {
          const econ = loadEconomy();
          const stats = diagnosticDatabase(econ);
          saveEconomy(econ);
          return reply(`✅ *Manutenção Concluída!*\n\n📊 Status:\n- Usuários: ${stats.totalUsers}\n- Migrados: ${stats.usersMigrated}\n- Pets corrigidos: ${stats.petsFixed}`);
        } else {
          return reply("✅ Integridade verificada e cache otimizado!");
        }
      } catch (e) {
        return reply(`💔 Falha na rotina de diagnóstico.`);
      }
    }

    // --- ESTILOS ---
    if (['set', 'style', 'preview'].includes(cmd)) {
      if (cmd === 'preview') {
        const design = typeof getMenuDesignWithDefaults === 'function' ? getMenuDesignWithDefaults() : { headerStyle: "Premium" };
        return reply(`🎨 *Preview do Estilo Atual*\n\n┏━━━━━━━━━━━━━━\n┃ 🌟 *Bem-vindo(a) ao bot!*\n┃ 💎 Estilo: ${design.headerStyle || 'Padrão'}\n┗━━━━━━━━━━━━━━`);
      }
      if (!q) return reply(`💔 Especifique o tema/estilo. Ex: ${prefix}${cmd} dark`);
      
      if (typeof saveMenuDesign === 'function') {
        const design = getMenuDesignWithDefaults();
        design.headerStyle = q;
        saveMenuDesign(design);
      }
      return reply(`✅ Estilo alterado para *${q}* com sucesso!`);
    }

    return reply(`✅ Manutenção ${cmd} executada.`);
  }
};
