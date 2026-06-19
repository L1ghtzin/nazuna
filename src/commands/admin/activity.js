

export default {
  name: "activity",
  description: "Monitoramento de atividade do grupo",
  commands: ["atividade", "checkativo", "mantercontador", "preservarcontador", "rankativo", "rankativos", "rankinativo", "rankinativos"],
  usage: "{prefix}rankativos",
  handle: async ({ 
    bot, 
    from, 
    info, 
    command,
    reply, 
    isGroup, 
    isGroupAdmin, 
    args, 
    prefix, 
    groupData,
    buildGroupFilePath,
    AllgroupMembers,
    getUserName,
    optimizer,
    MESSAGES,
    menc_os2,
    sender
  }) => {
    // command já vem desestruturado dos parâmetros do handle

    const groupFile = buildGroupFilePath(from);
    const preservarContador = groupData.preservarContador === true;
    const currentMembers = AllgroupMembers;

    // Função auxiliar para filtrar e ordenar usuários
    const getSortedUsers = (order = 'desc') => {
      let users = (groupData.contador || []).filter(u => u && u.id && currentMembers.includes(u.id));
      return users.sort((a, b) => {
        const totalA = (a.msg || 0) + (a.cmd || 0) + (a.figu || 0);
        const totalB = (b.msg || 0) + (b.cmd || 0) + (b.figu || 0);
        return order === 'desc' ? totalB - totalA : totalA - totalB;
      });
    };

    // --- RANK ATIVOS / INATIVOS ---
    if (['rankativos', 'rankativo', 'rankinativos', 'rankinativo'].includes(command)) {
      const order = command.includes('inativo') ? 'asc' : 'desc';
      const sorted = getSortedUsers(order);
      if (sorted.length === 0) return reply(MESSAGES.admin.activity.noData);

      const limit = Math.min(sorted.length, 10);
      let msg = MESSAGES.admin.activity.rankHeader(limit, order === 'desc');
      const mentions = [];

      // Respeitar preferência de mention (igual ao Tokyo)
      if (!groupData.mark) groupData.mark = {};

      for (let i = 0; i < limit; i++) {
        const u = sorted[i];
        msg += MESSAGES.admin.activity.rankItem(i + 1, getUserName(u.id), u.msg || 0, u.cmd || 0, u.figu || 0);
        if (!['0', 'marca'].includes(groupData.mark[u.id])) {
          mentions.push(u.id);
        }
      }

      return bot.sendMessage(from, { text: msg, mentions }, { quoted: info });
    }

    // --- CHECK ATIVO ---
    if (command === 'checkativo') {
      const target = menc_os2 || sender;
      if (!currentMembers.includes(target)) return reply(MESSAGES.admin.activity.notInGroup);

      const u = (groupData.contador || []).find(it => it.id === target);
      if (!u) return reply(MESSAGES.admin.activity.userNoData(getUserName(target)), { mentions: [target] });

      const lastActivity = u.lastActivity ? new Date(u.lastActivity).toLocaleString('pt-BR') : 'N/A';
      const msg = MESSAGES.admin.activity.userActivity(getUserName(target), u.msg || 0, u.cmd || 0, u.figu || 0, (u.msg || 0) + (u.cmd || 0) + (u.figu || 0), lastActivity);
      return reply(msg, { mentions: [target] });
    }

    // --- ATIVIDADE (Lista Completa) ---
    if (command === 'atividade') {
      const sorted = getSortedUsers('desc');
      if (sorted.length === 0) return reply(MESSAGES.admin.activity.noData);

      let msg = MESSAGES.admin.activity.groupActivityHeader(sorted.length);
      const mentions = [];
      if (!groupData.mark) groupData.mark = {};
      sorted.slice(0, 30).forEach((u, i) => { // Limitado a 30 para evitar mensagem gigante
        msg += MESSAGES.admin.activity.groupActivityItem(i + 1, getUserName(u.id), u.msg || 0, u.cmd || 0, (u.msg || 0) + (u.cmd || 0) + (u.figu || 0));
        if (!['0', 'marca'].includes(groupData.mark[u.id])) {
          mentions.push(u.id);
        }
      });

      return bot.sendMessage(from, { text: msg, mentions }, { quoted: info });
    }

    // --- CONFIGS (Admin) ---

    if (['limparatividade', 'resetatividade'].includes(command)) {
      groupData.contador = [];
      await optimizer.saveJsonWithCache(groupFile, groupData);
      return reply(MESSAGES.admin.activity.resetSuccess);
    }

    if (command === 'preservarcontador') {
      const sub = args[0]?.toLowerCase();
      if (!sub) return reply(MESSAGES.admin.activity.preserveUsage(prefix));
      groupData.preservarContador = sub === 'on';
      await optimizer.saveJsonWithCache(groupFile, groupData);
      return reply(MESSAGES.admin.activity.preserveToggle(groupData.preservarContador));
    }
  },
};
