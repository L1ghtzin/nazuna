import pathz from 'path';


export default {
  name: "marcar",
  description: "Menciona membros ou administradores do grupo",
  commands: ["adm", "admin", "admins", "adms", "marcar", "mark"],
  usage: "{prefix}marcar <mensagem>",
  handle: async ({  
    bot, from, info, command, args, reply, pushname, isGroup, isGroupAdmin, isBotAdmin, 
    AllgroupMembers, groupAdmins, q, getUserName,
    checkMassMentionLimit, loadMassMentionConfig, registerMassMentionUse,
    MASS_MENTION_THRESHOLD, optimizer, buildGroupFilePath,
    MESSAGES
  }) => {
    const cmd = command.toLowerCase();

    if (!isGroup) return reply(MESSAGES.permission.groupOnly);

    // ═══════════════════════════════════════════════════════════════
    // 📢 MENCIONAR TODOS (MARCAR)
    // ═══════════════════════════════════════════════════════════════
    if (['marcar', 'mark', 'todos', 'all', 'mencionar'].includes(cmd)) {
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);



      const massMentionCheck = checkMassMentionLimit(from, AllgroupMembers.length);
      if (!massMentionCheck.allowed) {
        return reply(massMentionCheck.message);
      }

      const path = buildGroupFilePath(from);
      
      let data = await optimizer.loadJsonWithCache(path, { mark: {} });
      if (!data.mark) data.mark = {};

      let membros = AllgroupMembers.filter(m => !['0', 'games'].includes(data.mark[m]));
      if (!membros.length) return reply(MESSAGES.admin.marcar.empty);

      const configMarcar = loadMassMentionConfig();
      if (configMarcar[from]?.enabled && AllgroupMembers.length >= MASS_MENTION_THRESHOLD) {
        registerMassMentionUse(from);
      }

      let msg = MESSAGES.admin.marcar.membersHeader(q);
      return await bot.sendMessage(from, { 
        text: msg + membros.map(m => MESSAGES.admin.marcar.memberItem(getUserName(m))).join('\n'), 
        mentions: membros 
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // 🛡️ MENCIONAR/LISTAR ADMINS
    // ═══════════════════════════════════════════════════════════════
    if (['admin', 'adm', 'adms', 'admins', 'listadm', 'listadms', 'listadministradores', 'totais', 'totaisadms'].includes(cmd)) {
      let text = MESSAGES.admin.marcar.adminsHeader(q, pushname);
      for (let adm of groupAdmins) {
        text += MESSAGES.admin.marcar.adminItem(adm.split('@')[0]);
      }
      text += MESSAGES.admin.marcar.adminsTotal(groupAdmins.length);
      return await bot.sendMessage(from, { text, mentions: groupAdmins });
    }
  }
};
