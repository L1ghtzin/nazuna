import { PREFIX } from "../../config.js";

export default {
  name: "rental_system",
  description: "Gerenciamento de aluguel de grupos",
  commands: ["addaluguel", "adddiasaluguel", "aluguelist", "cancelaraluguel", "dayfree", "deletaraluguel", "detalhesaluguel", "estenderaluguel", "extenderrental", "infoaluguel", "listaaluguel", "listaluguel", "listaralugueis", "listaraluguel", "listrentals", "removeraluguel", "statusaluguel", "veralugueis"],
  handle: async ({ 
    nazu, from, info, command, args, reply, q, isOwner, isGroup, prefix,
    loadRentalData, saveRentalData, setGroupRental, extendGroupRental,
    getCachedGroupMetadata, OWNER_ONLY_MESSAGE, optimizer,
    MESSAGES
  }) => {
    if (!isOwner) return reply(OWNER_ONLY_MESSAGE);

    const cmd = command.toLowerCase();

    // 📊 LISTAGEM
    if (['listaralugueis', 'aluguelist', 'listaluguel', 'listaaluguel', 'listaraluguel', 'veralugueis', 'listrentals', 'listarentals', 'aluguel.lista', 'aluguel.ver'].includes(cmd)) {
      const data = loadRentalData();
      const groups = Object.entries(data.groups || {});
      if (!groups.length) return reply("📪 Sem aluguéis registrados.");

      let text = `╭━━━━⊱ 📋 *LISTA DE ALUGUÉIS* ⊱━━━━╮\n`;
      text += `│\n`;
      
      for (let i = 0; i < groups.length; i++) {
        const [id, info] = groups[i];
        const meta = await getCachedGroupMetadata(id).catch(() => ({ subject: 'Grupo Desconhecido' }));
        const status = (info.expiresAt === 'permanent' || new Date(info.expiresAt) > new Date()) ? '✅' : '❌';
        const exp = info.expiresAt === 'permanent' ? '∞ Permanente' : new Date(info.expiresAt).toLocaleDateString('pt-BR');
        
        text += `│ ${i + 1}. ${status} *${meta.subject}*\n`;
        text += `│    🆔 ${id}\n`;
        text += `│    ⏳ Expira: ${exp}\n`;
        if (i < groups.length - 1) text += `│\n`;
      }
      
      text += `│\n`;
      text += `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      text += `💡 Total de ${groups.length} grupos registrados.`;
      return reply(text);
    }

    // ➕ ADICIONAR
    if (cmd === 'addaluguel') {
      const parts = q?.trim().split(' ') || [];
      let targetGroupId, durationArg;

      if (isGroup && parts.length === 1) {
        targetGroupId = from;
        durationArg = parts[0];
      } else if (parts.length >= 2) {
        targetGroupId = parts[1].includes('@g.us') ? parts[1] : parts[1] + '@g.us';
        durationArg = parts[0];
      } else {
        return reply(`💡 *Uso:* ${prefix}${cmd} <dias|permanent> (no grupo) ou ${prefix}${cmd} <dias|permanent> <id_grupo>`);
      }

      const duration = durationArg === 'permanent' ? 'permanent' : parseInt(durationArg);
      if (duration !== 'permanent' && (isNaN(duration) || duration <= 0)) {
        return reply("❌ Duração inválida. Use um número de dias ou 'permanent'.");
      }

      const res = setGroupRental(targetGroupId, duration, prefix);
      return reply(res.message);
    }

    // 🗑️ REMOVER
    if (['removeraluguel', 'deletaraluguel', 'cancelaraluguel', 'delaluguel', 'aluguel.remover'].includes(cmd)) {
      const target = q?.trim() || (isGroup ? from : null);
      if (!target) return reply("Informe o ID!");
      const data = loadRentalData();
      const targetJid = target.includes('@g.us') ? target : target + '@g.us';
      if (!data.groups[targetJid]) return reply("❌ Este grupo não possui aluguel.");
      delete data.groups[targetJid];
      saveRentalData(data);
      return reply("✅ Registro de aluguel removido com sucesso.");
    }

    // ℹ️ INFO / STATUS
    if (['infoaluguel', 'statusaluguel', 'detalhesaluguel'].includes(cmd)) {
      let targetGroupId = q.trim();
      if (!targetGroupId) {
        if (!isGroup) return reply(`💡 *Uso:* ${prefix}${cmd} <id_do_grupo>`);
        targetGroupId = from;
      } else if (!targetGroupId.includes('@g.us')) {
        targetGroupId += '@g.us';
      }

      const rentalData = loadRentalData();
      const rental = rentalData.groups?.[targetGroupId];
      if (!rental) return reply(`❌ Este grupo não possui aluguel ativo.\n\n💡 Use ${prefix}addaluguel para adicionar.`);

      const meta = await getCachedGroupMetadata(targetGroupId).catch(() => ({ subject: targetGroupId, participants: [] }));
      const groupName = meta.subject || targetGroupId;
      const memberCount = meta.participants?.length || 0;
      const now = Date.now();
      const isPermanent = rental.expiresAt === 'permanent';

      let message = `╭━━━⊱ 📋 *DETALHES DO ALUGUEL* ⊱━━━╮\n`;
      message += `│\n`;
      message += `│ 📱 *GRUPO:* ${groupName}\n`;
      message += `│ 🆔 *ID:* ${targetGroupId}\n`;
      message += `│ 👥 *Membros:* ${memberCount}\n`;
      message += `│\n`;
      message += `╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;

      if (isPermanent) {
        message += `♾️ *STATUS:* PERMANENTE\n\n`;
        message += `✨ Este grupo tem aluguel permanente!\n`;
        message += `⏰ Não há data de expiração.`;
      } else {
        const expiresAt = typeof rental.expiresAt === 'string' ? parseInt(rental.expiresAt) : rental.expiresAt;
        const isExpired = expiresAt < now;
        const diffMs = Math.abs(expiresAt - now);
        
        const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hoursLeft = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutesLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        message += `📅 *STATUS:* ${isExpired ? '❌ EXPIRADO' : '✅ ATIVO'}\n\n`;
        message += `⏰ *Expiração:* ${new Date(expiresAt).toLocaleString('pt-BR')}\n`;
        message += `⏳ *${isExpired ? 'Expirado há' : 'Restante'}:* ${daysLeft}d ${hoursLeft}h ${minutesLeft}m\n`;
        
        // Barra de progresso (opcional, mas premium)
        if (!isExpired) {
            const addedAt = rental.addedAt || (expiresAt - (30 * 24 * 60 * 60 * 1000)); // fallback 30 dias
            const total = expiresAt - addedAt;
            const elapsed = now - addedAt;
            const percentage = Math.min(100, Math.max(0, (elapsed / total) * 100));
            const progress = Math.floor(percentage / 10);
            const progressBar = '▓'.repeat(progress) + '░'.repeat(10 - progress);
            message += `\n📊 *Progresso:* [${progressBar}] ${Math.floor(percentage)}%`;
        }
      }
      return reply(message);
    }

    // ⏳ ESTENDER / ADICIONAR DIAS
    if (['adddiasaluguel', 'estenderaluguel', 'extenderrental'].includes(cmd)) {
      const parts = q?.trim().split(' ') || [];
      let targetGroupId, daysToAdd;

      if (isGroup && parts.length === 1) {
        targetGroupId = from;
        daysToAdd = parseInt(parts[0]);
      } else if (parts.length >= 2) {
        targetGroupId = parts[0].includes('@g.us') ? parts[0] : parts[0] + '@g.us';
        daysToAdd = parseInt(parts[1]);
      } else {
        return reply(`💡 *Uso:* ${prefix}${cmd} <dias> (no grupo) ou ${prefix}${cmd} <id> <dias>`);
      }

      if (isNaN(daysToAdd) || daysToAdd <= 0) return reply("❌ Dias inválidos.");
      const result = extendGroupRental(targetGroupId, daysToAdd);
      return reply(result.message);
    }

    // 🎁 DAYFREE (Adicionar dias para TODOS os grupos)
    if (cmd === 'dayfree') {
      const parts = q.trim().split(' ');
      const extraDays = parseInt(parts[0]);
      if (isNaN(extraDays) || extraDays <= 0) return reply('O argumento deve ser um número positivo de dias.');
      
      const motivo = parts.slice(1).join(' ') || 'Não especificado';
      const rentalData = loadRentalData();
      const groupIds = Object.keys(rentalData.groups || {});
      if (!groupIds.length) return reply('Não há grupos com aluguel configurado.');

      await reply(`🔄 Processando bônus de ${extraDays} dias para ${groupIds.length} grupos...`);

      let successCount = 0;
      for (const groupId of groupIds) {
        const res = extendGroupRental(groupId, extraDays);
        if (res.success) {
          successCount++;
          const meta = await getCachedGroupMetadata(groupId).catch(() => ({ subject: 'Grupo' }));
          const msg = `🎉 *BÔNUS DE ALUGUEL!* 🎉\n\nOlá, *${meta.subject}*!\nForam adicionados *${extraDays} dias* extras de aluguel para este grupo.\n\n📝 *Motivo:* ${motivo}\n✨ Aproveitem!`;
          nazu.sendMessage(groupId, { text: msg }).catch(() => {});
        }
      }
      return reply(`✅ Sucesso! Foram adicionados ${extraDays} dias em ${successCount} grupos.`);
    }

    // 🔘 MODO ALUGUEL (Toggle Global)
    if (cmd === 'modoaluguel') {
      const action = q?.trim().toLowerCase();
      if (action === 'on' || action === 'ativar') {
        setRentalMode(true);
        return reply("✅ *MODO ALUGUEL ATIVADO!*\nO bot agora só responderá em grupos com aluguel ativo.");
      } else if (action === 'off' || action === 'desativar') {
        setRentalMode(false);
        return reply("✅ *MODO ALUGUEL DESATIVADO!*\nO bot responderá em todos os grupos permitidos.");
      } else {
        const current = isRentalModeActive() ? 'ATIVADO' : 'DESATIVADO';
        return reply(`💡 *Status atual:* ${current}\n\nUso: ${prefix}${cmd} on|off`);
      }
    }

    // 🔑 GERAR CÓDIGO
    if (['gerarcodigo', 'gerarcod', 'gerarcodigobr', 'geraraluguel'].includes(cmd)) {
      const parts = q.trim().split(' ');
      const durationArg = parts[0]?.toLowerCase();
      const targetGroupArg = parts[1];

      if (!durationArg) {
        return reply(`💡 *Uso:* ${prefix}${cmd} <dias|permanente> [id_grupo_opcional]`);
      }

      let duration = durationArg === 'permanente' ? 'permanent' : parseInt(durationArg);
      if (duration !== 'permanent' && (isNaN(duration) || duration <= 0)) {
        return reply("❌ Duração inválida. Use um número de dias ou 'permanente'.");
      }

      let targetGroupId = null;
      if (targetGroupArg) {
        targetGroupId = targetGroupArg.includes('@g.us') ? targetGroupArg : targetGroupArg + '@g.us';
      }

      const res = generateActivationCode(duration, targetGroupId);
      return reply(res.message);
    }

    // 🧹 LIMPAR ALUGUEL (Remover expirados e sair)
    if (cmd === 'limparaluguel') {
      await reply("🔄 Iniciando faxina nos aluguéis... Isso pode levar um momento.");
      
      const rentalData = loadRentalData();
      const rentalGroupIds = Object.keys(rentalData.groups || {});
      const currentGroups = await nazu.groupFetchAllParticipating().catch(() => ({}));
      const currentGroupIds = Object.keys(currentGroups);

      let cleaned = 0;
      let expiredLeft = 0;

      // 1. Limpar registros de grupos onde o bot não está mais
      for (const gid of rentalGroupIds) {
        if (!currentGroupIds.includes(gid)) {
          delete rentalData.groups[gid];
          cleaned++;
        }
      }
      saveRentalData(rentalData);

      // 2. Sair de grupos expirados
      for (const gid of currentGroupIds) {
        const status = getGroupRentalStatus(gid);
        if (!status.active && !status.permanent) {
          try {
            const meta = await getCachedGroupMetadata(gid).catch(() => ({ subject: 'Grupo' }));
            await nazu.sendMessage(gid, { text: "⏰ *Aluguel Expirado!* \n\nO tempo de uso deste bot expirou. Estou saindo agora. Para renovar, contate o dono." });
            await nazu.groupLeave(gid);
            await deleteChatByLastMessage(gid).catch(() => {});
            expiredLeft++;
            await new Promise(r => setTimeout(r, 1000)); // Delay preventivo
          } catch (e) {
            console.error(`Erro ao sair do grupo ${gid}:`, e);
          }
        }
      }

      return reply(`✅ *FAXINA CONCLUÍDA!*\n\n🗑️ Registros órfãos limpos: ${cleaned}\n🚪 Grupos expirados abandonados: ${expiredLeft}`);
    }
  }
};
