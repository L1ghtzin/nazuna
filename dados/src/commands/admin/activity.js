import { PREFIX } from "../../config.js";

export default {
  name: "activity",
  description: "Monitoramento de atividade do grupo",
  commands: ["atividade", "checkativo", "mantercontador", "preservarcontador", "rankativo", "rankativos", "rankinativo", "rankinativos"],
  usage: `${PREFIX}rankativos`,
  handle: async ({ 
    nazu, 
    from, 
    info, 
    command,
    reply, 
    isGroup, 
    isGroupAdmin, 
    isOwner, 
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
    if (!isGroup) return reply(MESSAGES.permission.groupOnly);

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
      if (sorted.length === 0) return reply("📊 Nenhum dado de atividade encontrado.");

      const limit = Math.min(sorted.length, 10);
      let msg = `*🏆 Rank dos ${limit} mais ${order === 'desc' ? 'ativos' : 'inativos'} do grupo:*\n`;
      const mentions = [];

      for (let i = 0; i < limit; i++) {
        const u = sorted[i];
        msg += `\n*🏅 ${i + 1}º Lugar:* @${getUserName(u.id)}\n- Mensagens: *${u.msg || 0}*\n- Comandos: *${u.cmd || 0}*\n- Figurinhas: *${u.figu || 0}*\n`;
        mentions.push(u.id);
      }

      return nazu.sendMessage(from, { text: msg, mentions }, { quoted: info });
    }

    // --- CHECK ATIVO ---
    if (command === 'checkativo') {
      const target = menc_os2 || sender;
      if (!currentMembers.includes(target)) return reply("❌ Este usuário não está no grupo.");

      const u = (groupData.contador || []).find(it => it.id === target);
      if (!u) return reply(`📊 @${getUserName(target)} ainda não possui dados no contador.`, { mentions: [target] });

      const lastActivity = u.lastActivity ? new Date(u.lastActivity).toLocaleString('pt-BR') : 'N/A';
      const msg = `📊 *Atividade de @${getUserName(target)}*\n\n💬 *Mensagens:* ${u.msg || 0}\n⚒️ *Comandos:* ${u.cmd || 0}\n🎨 *Figurinhas:* ${u.figu || 0}\n📈 *Total:* ${(u.msg || 0) + (u.cmd || 0) + (u.figu || 0)}\n🕐 *Última atividade:* ${lastActivity}`;
      return reply(msg, { mentions: [target] });
    }

    // --- ATIVIDADE (Lista Completa) ---
    if (command === 'atividade') {
      const sorted = getSortedUsers('desc');
      if (sorted.length === 0) return reply("📊 Nenhum dado encontrado.");

      let msg = `📊 *Atividade do Grupo*\n👥 *Total:* ${sorted.length}\n\n`;
      const mentions = [];
      sorted.slice(0, 30).forEach((u, i) => { // Limitado a 30 para evitar mensagem gigante
        msg += `${i + 1}. @${getUserName(u.id)} | 💬 ${u.msg || 0} | ⚒️ ${u.cmd || 0} | 📈 ${(u.msg || 0) + (u.cmd || 0) + (u.figu || 0)}\n`;
        mentions.push(u.id);
      });

      return nazu.sendMessage(from, { text: msg, mentions }, { quoted: info });
    }

    // --- CONFIGS (Admin) ---
    if (!isGroupAdmin && !isOwner) return;

    if (['limparatividade', 'resetatividade'].includes(command)) {
      groupData.contador = [];
      await optimizer.saveJsonWithCache(groupFile, groupData);
      return reply("✅ Contador de atividade resetado com sucesso!");
    }

    if (command === 'preservarcontador') {
      const sub = args[0]?.toLowerCase();
      if (!sub) return reply(`💡 Uso: ${prefix}preservarcontador on/off`);
      groupData.preservarContador = sub === 'on';
      await optimizer.saveJsonWithCache(groupFile, groupData);
      return reply(`✅ Preservação do contador: *${groupData.preservarContador ? 'ATIVADA' : 'DESATIVADA'}*`);
    }
  },
};
