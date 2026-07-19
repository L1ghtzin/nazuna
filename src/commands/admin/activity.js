import { writeAsync } from '../../utils/database/io.js';
import { loadActivityData, saveActivityData } from '../../utils/groupManager.js';

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
    MESSAGES,
    menc_os2,
    sender
  }) => {

    const groupFile = buildGroupFilePath(from);

    // Carrega atividade do arquivo dedicado (objeto { userId: stats })
    const contador = await loadActivityData(from);

    const getTotal = (u) => (u.msg || 0) + (u.cmd || 0) + (u.figu || 0);

    // Converte objeto para array filtrado pelos membros atuais e ordena
    const getSortedUsers = (order = 'desc') => {
      return Object.entries(contador)
        .filter(([id]) => AllgroupMembers.includes(id))
        .map(([id, u]) => ({ id, ...u, total: getTotal(u) }))
        .sort((a, b) => order === 'desc' ? b.total - a.total : a.total - b.total);
    };

    // --- RANK ATIVOS / INATIVOS ---
    if (['rankativos', 'rankativo', 'rankinativos', 'rankinativo'].includes(command)) {
      const order = command.includes('inativo') ? 'asc' : 'desc';
      const sorted = getSortedUsers(order);
      if (sorted.length === 0) return reply(MESSAGES.admin.activity.noData);

      const limit = Math.min(sorted.length, 10);
      let msg = MESSAGES.admin.activity.rankHeader(limit, order === 'desc');
      const mentions = [];

      if (!groupData.mark) groupData.mark = {};
      for (let i = 0; i < limit; i++) {
        const u = sorted[i];
        msg += MESSAGES.admin.activity.rankItem(i + 1, getUserName(u.id), u.msg || 0, u.cmd || 0, u.figu || 0);
        if (!['0', 'marca'].includes(groupData.mark[u.id])) mentions.push(u.id);
      }

      return bot.sendMessage(from, { text: msg, mentions }, { quoted: info });
    }

    // --- CHECK ATIVO ---
    if (command === 'checkativo') {
      const target = menc_os2 || sender;
      if (!AllgroupMembers.includes(target)) return reply(MESSAGES.admin.activity.notInGroup);

      const u = contador[target];
      if (!u) return reply(MESSAGES.admin.activity.userNoData(getUserName(target)), { mentions: [target] });

      const lastActivity = u.lastActivity ? new Date(u.lastActivity).toLocaleString('pt-BR') : 'N/A';
      const total = getTotal(u);
      const msg = MESSAGES.admin.activity.userActivity(getUserName(target), u.msg || 0, u.cmd || 0, u.figu || 0, total, lastActivity);
      return reply(msg, { mentions: [target] });
    }

    // --- ATIVIDADE (Lista Completa) ---
    if (command === 'atividade') {
      const sorted = getSortedUsers('desc');
      if (sorted.length === 0) return reply(MESSAGES.admin.activity.noData);

      let msg = MESSAGES.admin.activity.groupActivityHeader(sorted.length);
      const mentions = [];
      if (!groupData.mark) groupData.mark = {};

      sorted.slice(0, 30).forEach((u, i) => {
        msg += MESSAGES.admin.activity.groupActivityItem(i + 1, getUserName(u.id), u.msg || 0, u.cmd || 0, u.total);
        if (!['0', 'marca'].includes(groupData.mark[u.id])) mentions.push(u.id);
      });

      return bot.sendMessage(from, { text: msg, mentions }, { quoted: info });
    }

    // --- CONFIGS ---

    if (['limparatividade', 'resetatividade'].includes(command)) {
      await saveActivityData(from, {});
      return reply(MESSAGES.admin.activity.resetSuccess);
    }

    if (command === 'preservarcontador') {
      const sub = args[0]?.toLowerCase();
      if (!sub) return reply(MESSAGES.admin.activity.preserveUsage(prefix));
      groupData.preservarContador = sub === 'on';
      await writeAsync(groupFile, groupData);
      return reply(MESSAGES.admin.activity.preserveToggle(groupData.preservarContador));
    }
  },
};
