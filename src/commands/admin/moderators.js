import fs from 'fs';

export default {
  name: "moderadores",
  description: "Gerencia moderadores do grupo e suas permissões globais",
  commands: ["addmod", "addmodcmd", "delmod", "delmodcmd", "grantmodcmd", "listmodcmds", "listmods", "modlist", "revokemodcmd"],
  usage: `${global.prefix}addmod @usuário\n${global.prefix}grantmodcmd ban`,
  handle: async ({  reply, isGroup, isGroupAdmin, command, menc_os2, q, prefix, groupData, groupFile, getUserName, groupName, optimizer , MESSAGES }) => {
    if (!isGroup) return reply(MESSAGES.permission.groupOnly);
    if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);

    const cmd = command.toLowerCase();
    groupData.moderators = groupData.moderators || [];
    groupData.allowedModCommands = groupData.allowedModCommands || [];

    if (['addmod'].includes(cmd)) {
      if (!menc_os2) return reply(`Marque o usuário que deseja promover a moderador. Ex: ${prefix}addmod @usuário`);
      const modToAdd = menc_os2;
      
      if (groupData.moderators.includes(modToAdd)) {
        return reply(`@${getUserName(modToAdd)} já é um moderador.`, { mentions: [modToAdd] });
      }
      groupData.moderators.push(modToAdd);
      await optimizer.saveJsonWithCache(groupFile, groupData);
      return reply(`✅ @${getUserName(modToAdd)} foi promovido a moderador do grupo!`, { mentions: [modToAdd] });
    }

    if (['delmod', 'rmmod'].includes(cmd)) {
      if (!menc_os2) return reply(`Marque o usuário que deseja remover de moderador. Ex: ${prefix}delmod @usuário`);
      const modToRemove = menc_os2;
      const modIndex = groupData.moderators.indexOf(modToRemove);
      if (modIndex === -1) {
        return reply(`@${getUserName(modToRemove)} não é um moderador.`, { mentions: [modToRemove] });
      }
      groupData.moderators.splice(modIndex, 1);
      await optimizer.saveJsonWithCache(groupFile, groupData);
      return reply(`✅ @${getUserName(modToRemove)} não é mais um moderador do grupo.`, { mentions: [modToRemove] });
    }

    if (['listmods', 'modlist', 'listmod'].includes(cmd)) {
      if (groupData.moderators.length === 0) {
        return reply("🛡️ Não há moderadores definidos para este grupo.");
      }
      let modsMessage = `🛡️ *Moderadores do Grupo ${groupName}* 🛡️\n\n`;
      const mentionedUsers = [];
      groupData.moderators.forEach(modJid => {
        modsMessage += `➥ @${getUserName(modJid)}\n`;
        mentionedUsers.push(modJid);
      });
      return reply(modsMessage, { mentions: mentionedUsers });
    }

    if (['grantmodcmd', 'addmodcmd', 'grantmodcmds'].includes(cmd)) {
      if (!q) return reply(`Por favor, especifique o comando para permitir aos moderadores. Ex: ${prefix}grantmodcmd ban`);
      const cmdToAllow = q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replaceAll(prefix, "");
      
      if (groupData.allowedModCommands.includes(cmdToAllow)) {
        return reply(`Comando "${cmdToAllow}" já está permitido para moderadores.`);
      }
      groupData.allowedModCommands.push(cmdToAllow);
      await optimizer.saveJsonWithCache(groupFile, groupData);
      return reply(`✅ Moderadores agora podem usar o comando: ${prefix}${cmdToAllow}`);
    }

    if (['revokemodcmd', 'delmodcmd', 'rmmodcmd', 'revokemodcmds'].includes(cmd)) {
      if (!q) return reply(`Por favor, especifique o comando para proibir aos moderadores. Ex: ${prefix}revokemodcmd ban`);
      const cmdToDeny = q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replaceAll(prefix, "");
      const cmdIndex = groupData.allowedModCommands.indexOf(cmdToDeny);
      if (cmdIndex === -1) {
        return reply(`Comando "${cmdToDeny}" não estava permitido para moderadores.`);
      }
      groupData.allowedModCommands.splice(cmdIndex, 1);
      await optimizer.saveJsonWithCache(groupFile, groupData);
      return reply(`✅ Moderadores não podem mais usar o comando: ${prefix}${cmdToDeny}`);
    }

    if (['listmodcmds', 'listmodcmd'].includes(cmd)) {
      if (groupData.allowedModCommands.length === 0) {
        return reply("🔧 Nenhum comando específico permitido para moderadores neste grupo.");
      }
      let cmdsMessage = `🔧 *Comandos Permitidos para Moderadores em ${groupName}* 🔧\n\n`;
      groupData.allowedModCommands.forEach(c => {
        cmdsMessage += `➥ ${prefix}${c}\n`;
      });
      return reply(cmdsMessage);
    }
  }
};
