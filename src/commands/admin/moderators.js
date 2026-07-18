import fs from 'fs';
import { writeAsync } from '../../utils/database/io.js';

export default {
  name: "moderadores",
  description: "Gerencia moderadores do grupo e suas permissões globais",
  commands: ["addmod", "addmodcmd", "delmod", "delmodcmd", "grantmodcmd", "listmodcmds", "listmods", "modlist", "revokemodcmd"],
  usage: `${global.prefix}addmod @usuário\n${global.prefix}grantmodcmd ban`,
  handle: async ({  reply, isGroup, isGroupAdmin, command, menc_os2, q, prefix, groupData, groupFile, getUserName, groupName, MESSAGES }) => {
    const cmd = command.toLowerCase();
    groupData.moderators = groupData.moderators || [];
    groupData.allowedModCommands = groupData.allowedModCommands || [];

    if (['addmod'].includes(cmd)) {
      if (!menc_os2) return reply(MESSAGES.admin.moderators.addUsage(prefix));
      const modToAdd = menc_os2;
      
      if (groupData.moderators.includes(modToAdd)) {
        return reply(MESSAGES.admin.moderators.alreadyMod(getUserName(modToAdd)), { mentions: [modToAdd] });
      }
      groupData.moderators.push(modToAdd);
      await writeAsync(groupFile, groupData);
      return reply(MESSAGES.admin.moderators.addSuccess(getUserName(modToAdd)), { mentions: [modToAdd] });
    }

    if (['delmod', 'rmmod'].includes(cmd)) {
      if (!menc_os2) return reply(MESSAGES.admin.moderators.delUsage(prefix));
      const modToRemove = menc_os2;
      const modIndex = groupData.moderators.indexOf(modToRemove);
      if (modIndex === -1) {
        return reply(MESSAGES.admin.moderators.notMod(getUserName(modToRemove)), { mentions: [modToRemove] });
      }
      groupData.moderators.splice(modIndex, 1);
      await writeAsync(groupFile, groupData);
      return reply(MESSAGES.admin.moderators.delSuccess(getUserName(modToRemove)), { mentions: [modToRemove] });
    }

    if (['listmods', 'modlist', 'listmod'].includes(cmd)) {
      if (groupData.moderators.length === 0) {
        return reply(MESSAGES.admin.moderators.listEmpty);
      }
      let modsMessage = MESSAGES.admin.moderators.listHeader(groupName);
      const mentionedUsers = [];
      groupData.moderators.forEach(modJid => {
        modsMessage += MESSAGES.admin.moderators.listItem(getUserName(modJid));
        mentionedUsers.push(modJid);
      });
      return reply(modsMessage, { mentions: mentionedUsers });
    }

    if (['grantmodcmd', 'addmodcmd', 'grantmodcmds'].includes(cmd)) {
      if (!q) return reply(MESSAGES.admin.moderators.grantUsage(prefix));
      const cmdToAllow = q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replaceAll(prefix, "");
      
      if (groupData.allowedModCommands.includes(cmdToAllow)) {
        return reply(MESSAGES.admin.moderators.alreadyGranted(cmdToAllow));
      }
      groupData.allowedModCommands.push(cmdToAllow);
      await writeAsync(groupFile, groupData);
      return reply(MESSAGES.admin.moderators.grantSuccess(prefix, cmdToAllow));
    }

    if (['revokemodcmd', 'delmodcmd', 'rmmodcmd', 'revokemodcmds'].includes(cmd)) {
      if (!q) return reply(MESSAGES.admin.moderators.revokeUsage(prefix));
      const cmdToDeny = q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replaceAll(prefix, "");
      const cmdIndex = groupData.allowedModCommands.indexOf(cmdToDeny);
      if (cmdIndex === -1) {
        return reply(MESSAGES.admin.moderators.notGranted(cmdToDeny));
      }
      groupData.allowedModCommands.splice(cmdIndex, 1);
      await writeAsync(groupFile, groupData);
      return reply(MESSAGES.admin.moderators.revokeSuccess(prefix, cmdToDeny));
    }

    if (['listmodcmds', 'listmodcmd'].includes(cmd)) {
      if (groupData.allowedModCommands.length === 0) {
        return reply(MESSAGES.admin.moderators.cmdsEmpty);
      }
      let cmdsMessage = MESSAGES.admin.moderators.cmdsHeader(groupName);
      groupData.allowedModCommands.forEach(c => {
        cmdsMessage += MESSAGES.admin.moderators.cmdsItem(prefix, c);
      });
      return reply(cmdsMessage);
    }
  }
};
