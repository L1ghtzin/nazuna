import pathz from 'path';

export default {
  name: "group_admin_extra",
  description: "Comandos extras de administração de grupo",
  commands: [
    "legendabv", "textbv", "welcomemsg", "autosticker", "autorepo", "autoresposta"
  ],
  handle: async ({ 
    reply, command, isGroup, isGroupAdmin, isBotAdmin, from, q, 
    groupData, DATABASE_DIR, optimizer, prefix, MESSAGES
  }) => {
    if (!isGroup) return reply(MESSAGES.permission.groupOnly);
    if (!isGroupAdmin) return reply(MESSAGES.permission.userAdminOnly);

    const cmd = command.toLowerCase();
    const groupFilePath = pathz.join(DATABASE_DIR, `grupos/${from}.json`);

    // --- AUTOSTICKER ---
    if (cmd === 'autosticker') {
      groupData.autoSticker = !groupData.autoSticker;
      await optimizer.saveJsonWithCache(groupFilePath, groupData);
      return reply(MESSAGES.admin.group_admin_extra.autostickerToggle(groupData.autoSticker));
    }

    // --- AUTOREPO / AUTOREPOSTA ---
    if (['autorepo', 'autoresposta'].includes(cmd)) {
      groupData.autorepo = !groupData.autorepo;
      await optimizer.saveJsonWithCache(groupFilePath, groupData);
      return reply(MESSAGES.admin.group_admin_extra.autorepoToggle(groupData.autorepo));
    }

    // --- BOAS-VINDAS ---
    if (['legendabv', 'textbv', 'welcomemsg'].includes(cmd)) {
      if (!q) return reply(MESSAGES.admin.group_admin_extra.welcomeUsage(prefix));
      groupData.textbv = q;
      await optimizer.saveJsonWithCache(groupFilePath, groupData);
      return reply(MESSAGES.admin.group_admin_extra.welcomeSuccess(groupData.textbv));
    }

    return reply(MESSAGES.admin.group_admin_extra.genericUpdate(cmd));
  }
};
