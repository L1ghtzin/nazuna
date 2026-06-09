export default {
  name: "rental_system",
  description: "Gerenciamento de aluguel de grupos",
  commands: [
    "addaluguel",
    "adddiasaluguel",
    "aluguelaviso",
    "aluguelist",
    "cancelaraluguel",
    "dayfree",
    "deletaraluguel",
    "detalhesaluguel",
    "estenderaluguel",
    "extenderrental",
    "gerarcod",
    "gerarcodigo",
    "gerarcodigobr",
    "geraraluguel",
    "infoaluguel",
    "limparaluguel",
    "listaaluguel",
    "listaluguel",
    "listaraluguéis",
    "listaraluguel",
    "listrentals",
    "modoaluguel",
    "removeraluguel",
    "statusaluguel",
    "veraluguéis"
  ],
  handle: async ({
    bot,
    from,
    info,
    command,
    args,
    reply,
    q,
    isGroup,
    isOwner,
    prefix,
    loadRentalData,
    saveRentalData,
    setGroupRental,
    extendGroupRental,
    setRentalMode,
    isRentalModeActive,
    getGroupRentalStatus,
    generateActivationCode,
    getCachedGroupMetadata,
    deleteChatByLastMessage,
    clearChatHistorySafe
  }) => {
    const cmd = (command || "").toLowerCase();
    const query = (q || "").trim();
    const rentalMsg = {
      ownerOnly: "🚫 Apenas o Dono e subdonos podem gerenciar o sistema de aluguel!",
      modeOwnerOnly: "🚫 Apenas o Dono e subdonos podem gerenciar o modo de aluguel!",
      codeOwnerOnly: "🚫 Apenas o Dono e subdonos podem gerar códigos!",
      listOwnerOnly: "🚫 Apenas o Dono e subdonos podem ver a lista de aluguéis!",
      removeOwnerOnly: "🚫 Apenas o Dono e subdonos podem remover aluguéis!",
      extendOwnerOnly: "🚫 Apenas o Dono e subdonos podem estender aluguéis!",
      infoOwnerOnly: "🚫 Apenas o Dono e subdonos podem ver informações de aluguel!",
      cleanupOwnerOnly: "🚫 Apenas o Dono e subdonos podem limpar aluguéis!",
      noRentals: "📭 Nenhum grupo com aluguel ativo no momento.",
      cleanupStart: "🔄 Iniciando limpeza completa de aluguéis...",
      cleanupError: "Ocorreu um erro ao limpar aluguéis."
    };

    const ensureOwner = (fallback = rentalMsg.ownerOnly) => {
      if (!isOwner) {
        reply(fallback);
        return false;
      }
      return true;
    };

    const normalizeGroupId = value => {
      if (!value) return null;
      const raw = String(value).trim();
      if (!raw) return null;
      return raw.includes("@g.us") ? raw : `${raw}@g.us`;
    };

    if (["modoaluguel"].includes(cmd)) {
      if (!ensureOwner(rentalMsg.modeOwnerOnly || rentalMsg.ownerOnly)) return;
      try {
        const action = query.toLowerCase();
        if (action === "on" || action === "ativar") {
          return reply(setRentalMode(true)
            ? "✅ Modo de aluguel global ATIVADO! O bot agora só responderá em grupos com aluguel ativo."
            : "❌ Erro ao ativar o modo de aluguel global.");
        }

        if (action === "off" || action === "desativar") {
          return reply(setRentalMode(false)
            ? "✅ Modo de aluguel global DESATIVADO! O bot responderá em todos os grupos permitidos."
            : "❌ Erro ao desativar o modo de aluguel global.");
        }

        const currentStatus = isRentalModeActive() ? "ATIVADO" : "DESATIVADO";
        return reply(`🤔 Uso: ${prefix}modoaluguel on|off\nStatus atual: ${currentStatus}`);
      } catch (error) {
        console.error("Erro no comando modoaluguel:", error);
        return reply("❌ Ocorreu um erro inesperado.");
      }
    }

    if (["aluguelaviso"].includes(cmd)) {
      if (!ensureOwner(rentalMsg.ownerOnly)) return;
      try {
        const action = query.toLowerCase();
        if (["grupo", "pv", "ambos"].includes(action)) {
          const rentalData = loadRentalData();
          rentalData.notificationTarget = action;
          saveRentalData(rentalData);
          return reply(`✅ O destino dos avisos de aluguel foi configurado para: *${action.toUpperCase()}*`);
        }
        
        const currentTarget = loadRentalData().notificationTarget || "ambos";
        return reply(`🤔 Uso: ${prefix}aluguelaviso <grupo|pv|ambos>\n\nStatus atual: *${currentTarget.toUpperCase()}*`);
      } catch (error) {
        console.error("Erro no comando aluguelaviso:", error);
        return reply("❌ Ocorreu um erro ao configurar os avisos.");
      }
    }

    if (["listaraluguel", "listaraluguéis", "aluguelist", "listaluguel", "listaaluguel", "veraluguéis", "listrentals"].includes(cmd)) {
      if (!ensureOwner(rentalMsg.listOwnerOnly || rentalMsg.ownerOnly)) return;
      try {
        const rentalData = loadRentalData();
        const groupIds = Object.keys(rentalData.groups || {});

        if (!groupIds.length) {
          return reply(rentalMsg.noRentals || "📭 Nenhum grupo com aluguel ativo no momento.");
        }

        let message = "╭━━━⊱ 📋 *LISTA DE ALUGUEIS* ⊰━━━╮\n";
        message += "│\n";
        message += `│ 📊 Total de grupos: ${groupIds.length}\n`;
        message += "│\n";
        message += "╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n";

        const now = Date.now();
        let activeCount = 0;
        let expiredCount = 0;
        let permanentCount = 0;

        for (const groupId of groupIds) {
          const rental = rentalData.groups[groupId];

          try {
            const groupMeta = await getCachedGroupMetadata(groupId);
            const groupName = groupMeta?.subject || groupId;
            const isPermanent = rental?.duration === "permanent" || rental?.expiresAt === "permanent";
            const expiresAtMs = typeof rental?.expiresAt === "string" ? Date.parse(rental.expiresAt) : Number(rental?.expiresAt);
            const isExpired = !isPermanent && Number.isFinite(expiresAtMs) && expiresAtMs < now;

            if (isPermanent) permanentCount++;
            else if (isExpired) expiredCount++;
            else activeCount++;

            let statusIcon = "✅";
            let statusText = "ATIVO";
            if (isPermanent) {
              statusIcon = "♾️";
              statusText = "PERMANENTE";
            } else if (isExpired) {
              statusIcon = "❌";
              statusText = "EXPIRADO";
            }

            message += `${statusIcon} *${groupName}*\n`;
            message += "┌─────────────────\n";
            message += `│ 📱 ID: ${groupId}\n`;
            message += `│ 📅 Status: ${statusText}\n`;

            if (!isPermanent && Number.isFinite(expiresAtMs)) {
              const daysLeft = Math.ceil((expiresAtMs - now) / (1000 * 60 * 60 * 24));
              message += `│ ⏰ Expira em: ${new Date(expiresAtMs).toLocaleDateString("pt-BR")}\n`;
              message += `│ ⏳ Dias restantes: ${daysLeft > 0 ? daysLeft : 0}\n`;
            }

            if (rental?.addedAt) {
              message += `│ 📆 Adicionado em: ${new Date(rental.addedAt).toLocaleDateString("pt-BR")}\n`;
            }

            message += "└─────────────────\n\n";
          } catch {
            message += "⚠️ Grupo não encontrado\n";
            message += "┌─────────────────\n";
            message += `│ 📱 ID: ${groupId}\n`;
            message += "│ ❌ Erro ao buscar dados\n";
            message += "└─────────────────\n\n";
          }
        }

        message += "╭━━━⊱ 📊 *ESTATÍSTICAS* ⊰━━━╮\n";
        message += "│\n";
        message += `│ ✅ Ativos: ${activeCount}\n`;
        message += `│ ♾️ Permanentes: ${permanentCount}\n`;
        message += `│ ❌ Expirados: ${expiredCount}\n`;
        message += `│ 📦 Total: ${groupIds.length}\n`;
        message += "│\n";
        message += "╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n";
        message += "💡 *Comandos disponíveis:*\n";
        message += `• ${prefix}removeraluguel <id>\n`;
        message += `• ${prefix}estenderaluguel <id> <dias>\n`;
        message += `• ${prefix}infoaluguel <id>`;

        return reply(message);
      } catch (error) {
        console.error("Erro no comando listaraluguel:", error);
        return reply("❌ Ocorreu um erro ao listar os aluguéis.");
      }
    }

    if (["addaluguel"].includes(cmd)) {
      if (!ensureOwner(rentalMsg.ownerOnly)) return;
      if (!isGroup) return reply("Este comando só pode ser usado em grupos.");

      try {
        const durationArg = query.toLowerCase().split(" ")[0];
        if (!durationArg) {
          return reply(`🤔 Duração inválida. Use um número de dias (ex: 30) ou a palavra \"permanente\".\nExemplo: ${prefix}addaluguel 30`);
        }

        let durationDays = null;
        if (durationArg === "permanente") {
          durationDays = "permanent";
        } else if (!Number.isNaN(parseInt(durationArg, 10)) && parseInt(durationArg, 10) > 0) {
          durationDays = parseInt(durationArg, 10);
        } else {
          return reply(`🤔 Duração inválida. Use um número de dias (ex: 30) ou a palavra \"permanente\".\nExemplo: ${prefix}addaluguel 30`);
        }

        const result = setGroupRental(from, durationDays, prefix);
        return reply(result.message);
      } catch (error) {
        console.error("Erro no comando addaluguel:", error);
        return reply("❌ Ocorreu um erro inesperado ao adicionar o aluguel.");
      }
    }

    if (["removeraluguel", "deletaraluguel", "cancelaraluguel"].includes(cmd)) {
      if (!ensureOwner(rentalMsg.removeOwnerOnly || rentalMsg.ownerOnly)) return;
      try {
        let targetGroupId = query || (isGroup ? from : "");

        if (!targetGroupId) {
          return reply(`💡 *Uso:* ${prefix}removeraluguel [id_do_grupo]\n\n📝 Use dentro de um grupo ou informe o ID.\n💡 Use ${prefix}listaraluguel para ver os IDs.`);
        }

        targetGroupId = normalizeGroupId(targetGroupId);
        const rentalData = loadRentalData();

        if (!rentalData.groups || !rentalData.groups[targetGroupId]) {
          return reply(`❌ Este grupo não possui aluguel ativo.\n\n💡 Use ${prefix}listaraluguel para ver os grupos com aluguel.`);
        }

        let groupName = targetGroupId;
        try {
          const groupMeta = await getCachedGroupMetadata(targetGroupId);
          groupName = groupMeta?.subject || targetGroupId;
        } catch {
        }

        delete rentalData.groups[targetGroupId];
        saveRentalData(rentalData);

        let message = "╭━━━⊱ ✅ *ALUGUEL REMOVIDO* ⊰━━━╮\n";
        message += "│\n";
        message += "│ 🗑️ O aluguel do grupo foi\n";
        message += "│    removido com sucesso!\n";
        message += "│\n";
        message += `│ 📱 Grupo: ${groupName}\n`;
        message += `│ 🆔 ID: ${targetGroupId}\n`;
        message += "│\n";
        message += "╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n";
        message += "⚠️ O bot não funcionará mais neste grupo ate que um novo aluguel seja adicionado.";

        await reply(message);

        try {
          await bot.sendMessage(targetGroupId, {
            text: "⚠️ *AVISO IMPORTANTE*\n\nO aluguel deste grupo foi removido pelo proprietário do bot.\n\n❌ O bot não funcionará mais neste grupo.\n\nPara mais informações, entre em contato com o dono."
          });
        } catch (error) {
          console.log("Não foi possível notificar o grupo:", error.message);
        }
      } catch (error) {
        console.error("Erro no comando removeraluguel:", error);
        return reply("❌ Ocorreu um erro ao remover o aluguel.");
      }
      return;
    }

    if (["estenderaluguel", "adddiasaluguel", "extenderrental"].includes(cmd)) {
      if (!ensureOwner(rentalMsg.extendOwnerOnly || rentalMsg.ownerOnly)) return;
      try {
        const parts = query ? query.split(" ") : [];
        let targetGroupId;
        let daysToAdd;

        if (isGroup && parts.length === 1) {
          targetGroupId = from;
          daysToAdd = parseInt(parts[0], 10);
        } else if (parts.length >= 2) {
          targetGroupId = parts[0];
          daysToAdd = parseInt(parts[1], 10);
        } else {
          return reply(`💡 *Uso:* ${prefix}estenderaluguel <dias> (no grupo)\nou\n${prefix}estenderaluguel <id_do_grupo> <dias>\n\n📝 *Exemplo:*\n${prefix}estenderaluguel 7 (no grupo)\n${prefix}estenderaluguel 5511999999999 7\n\n💡 Use ${prefix}listaraluguel para ver os IDs.`);
        }

        if (Number.isNaN(daysToAdd) || daysToAdd <= 0) {
          return reply("❌ O número de dias deve ser um valor positivo!");
        }

        targetGroupId = normalizeGroupId(targetGroupId);

        const result = extendGroupRental(targetGroupId, daysToAdd);
        if (!result.success) {
          return reply(`❌ ${result.message}`);
        }

        let groupName = targetGroupId;
        try {
          const groupMeta = await getCachedGroupMetadata(targetGroupId);
          groupName = groupMeta?.subject || targetGroupId;
        } catch {
        }

        const rentalData = loadRentalData();
        const rental = rentalData.groups[targetGroupId];
        const expiresAtMs = typeof rental?.expiresAt === "string" ? Date.parse(rental.expiresAt) : Number(rental?.expiresAt);
        const newExpirationDate = Number.isFinite(expiresAtMs)
          ? new Date(expiresAtMs).toLocaleDateString("pt-BR")
          : "N/A";
        const daysLeft = Number.isFinite(expiresAtMs)
          ? Math.max(0, Math.ceil((expiresAtMs - Date.now()) / (1000 * 60 * 60 * 24)))
          : 0;

        let message = "╭━━━⊱ ✅ *ALUGUEL ESTENDIDO* ⊰━━━╮\n";
        message += "│\n";
        message += `│ 📱 Grupo: ${groupName}\n`;
        message += `│ ➕ Dias adicionados: ${daysToAdd}\n`;
        message += `│ 📅 Nova expiração: ${newExpirationDate}\n`;
        message += `│ ⏳ Dias restantes: ${daysLeft}\n`;
        message += "│\n";
        message += "╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯";

        await reply(message);

        try {
          await bot.sendMessage(targetGroupId, {
            text: `🎉 *BOA NOTÍCIA!*\n\nSeu aluguel foi estendido!\n\n➕ Dias adicionados: *${daysToAdd}*\n📅 Nova data de expiração: *${newExpirationDate}*\n⏳ Dias restantes: *${daysLeft}*\n\n✨ Continue aproveitando o bot!`
          });
        } catch (error) {
          console.log("Não foi possível notificar o grupo:", error.message);
        }
      } catch (error) {
        console.error("Erro no comando estenderaluguel:", error);
        return reply("❌ Ocorreu um erro ao estender o aluguel.");
      }
      return;
    }

    if (["dayfree"].includes(cmd)) {
      if (!ensureOwner(rentalMsg.extendOwnerOnly || rentalMsg.ownerOnly)) return;
      try {
        if (!query) {
          return reply(`Uso: ${prefix}${command} <dias> [motivo opcional]\nEx: ${prefix}adddiasaluguel 7 Manutencao compensatoria`);
        }

        const parts = query.split(" ");
        const extraDays = parseInt(parts[0], 10);
        if (Number.isNaN(extraDays) || extraDays <= 0) {
          return reply("O primeiro argumento deve ser um número positivo de dias.");
        }

        const motivo = parts.slice(1).join(" ") || "Não especificado";
        const rentalData = loadRentalData();
        const groupIds = Object.keys(rentalData.groups || {});
        if (!groupIds.length) return reply("Não há grupos com aluguel configurado.");

        let successCount = 0;
        let failCount = 0;
        let summary = "📊 Resumo da extensão de aluguel:\n\n";

        for (const groupId of groupIds) {
          const extendResult = extendGroupRental(groupId, extraDays);
          if (extendResult.success) {
            successCount++;
            summary += `✅ ${groupId}: ${extendResult.message}\n`;
            try {
              const groupMeta = await getCachedGroupMetadata(groupId);
              const freshData = loadRentalData();
              const expiresAtMs = typeof freshData?.groups?.[groupId]?.expiresAt === "string"
                ? Date.parse(freshData.groups[groupId].expiresAt)
                : Number(freshData?.groups?.[groupId]?.expiresAt);
              const formattedDate = Number.isFinite(expiresAtMs)
                ? new Date(expiresAtMs).toLocaleDateString("pt-BR")
                : "N/A";

              const msg = `🎉 Aténcao, ${groupMeta?.subject || "grupo"}! Adicionados ${extraDays} dias extras de aluguel.\nNova expiração: ${formattedDate}.\nMotivo: ${motivo}`;
              await bot.sendMessage(groupId, { text: msg });
            } catch (error) {
              console.error(`Erro ao enviar mensagem para ${groupId}:`, error);
              summary += "   ⚠️ Falha ao avisar no grupo.\n";
            }
          } else {
            failCount++;
            summary += `❌ ${groupId}: ${extendResult.message}\n`;
          }
        }

        summary += `\nTotal: ${successCount} sucessos | ${failCount} falhas`;
        return reply(summary);
      } catch (error) {
        console.error("Erro no comando dayfree:", error);
        return reply("Ocorreu um erro ao estender aluguel em todos os grupos.");
      }
    }

    if (["infoaluguel", "statusaluguel", "detalhesaluguel"].includes(cmd)) {
      if (!ensureOwner(rentalMsg.infoOwnerOnly || rentalMsg.ownerOnly)) return;
      try {
        let targetGroupId = query;

        if (!targetGroupId) {
          if (!isGroup) {
            return reply(`💡 *Uso:* ${prefix}infoaluguel <id_do_grupo>\n\n📝 Ou use este comando dentro do grupo para ver o status dele.`);
          }
          targetGroupId = from;
        }

        targetGroupId = normalizeGroupId(targetGroupId);

        const rentalData = loadRentalData();
        const rental = rentalData.groups?.[targetGroupId];

        if (!rental) {
          return reply(`❌ Este grupo não possui aluguel ativo.\n\n💡 Use ${prefix}addaluguel para adicionar.`);
        }

        let groupName = targetGroupId;
        let memberCount = 0;
        try {
          const groupMeta = await getCachedGroupMetadata(targetGroupId);
          groupName = groupMeta?.subject || targetGroupId;
          memberCount = groupMeta?.participants?.length || 0;
        } catch {
        }

        const isPermanent = rental.duration === "permanent" || rental.expiresAt === "permanent";
        const now = Date.now();

        let message = "╭━━━⊱ 📋 *DETALHES DO ALUGUEL* ⊰━━━╮\n";
        message += "│\n";
        message += `│ 📱 *GRUPO:* ${groupName}\n`;
        message += `│ 🆔 *ID:* ${targetGroupId}\n`;
        message += `│ 👥 *Membros:* ${memberCount}\n`;
        message += "│\n";
        message += "╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n";

        if (isPermanent) {
          message += "♾️ *STATUS:* PERMANENTE\n\n";
          message += "✨ Este grupo tem aluguel permanente!\n";
          message += "⏰ Não há data de expiração.";
        } else {
          const expiresAtMs = typeof rental.expiresAt === "string" ? Date.parse(rental.expiresAt) : Number(rental.expiresAt);
          const isExpired = Number.isFinite(expiresAtMs) ? expiresAtMs < now : false;
          const daysLeft = Number.isFinite(expiresAtMs)
            ? Math.ceil((expiresAtMs - now) / (1000 * 60 * 60 * 24))
            : 0;
          const expirationDate = Number.isFinite(expiresAtMs)
            ? new Date(expiresAtMs).toLocaleDateString("pt-BR")
            : "N/A";
          const expirationTime = Number.isFinite(expiresAtMs)
            ? new Date(expiresAtMs).toLocaleTimeString("pt-BR")
            : "N/A";

          message += `📅 *STATUS:* ${isExpired ? "❌ EXPIRADO" : "✅ ATIVO"}\n\n`;
          message += "⏰ *Data de expiração:*\n";
          message += `   ${expirationDate} as ${expirationTime}\n\n`;

          if (!isExpired) {
            message += `⏳ *Tempo restante:* ${daysLeft} dia${daysLeft !== 1 ? "s" : ""}\n\n`;
            if (daysLeft <= 3) {
              message += "⚠️ *ATENÇÃO:* O aluguel está próximo de expirar!\n\n";
            }
          } else {
            const daysExpired = Math.abs(daysLeft);
            message += `⏳ *Expirado há:* ${daysExpired} dia${daysExpired !== 1 ? "s" : ""}\n\n`;
          }
        }

        if (rental.addedAt) {
          message += `\n📆 *Aluguel adicionado em:* ${new Date(rental.addedAt).toLocaleDateString("pt-BR")}`;
        }

        message += "\n\n💡 *Comandos disponíveis:*\n";
        message += `• ${prefix}estenderaluguel ${targetGroupId} <dias>\n`;
        message += `• ${prefix}removeraluguel ${targetGroupId}`;

        return reply(message);
      } catch (error) {
        console.error("Erro no comando infoaluguel:", error);
        return reply("❌ Ocorreu um erro ao buscar informações do aluguel.");
      }
    }

    if (["gerarcodigo", "gerarcodigobr", "gerarcod", "geraraluguel"].includes(cmd)) {
      if (!ensureOwner(rentalMsg.codeOwnerOnly || rentalMsg.ownerOnly)) return;
      try {
        const parts = query ? query.split(" ") : [];
        const durationArg = parts[0]?.toLowerCase();
        const targetGroupArg = parts[1];

        if (!durationArg) {
          return reply(`🤔 Uso: ${prefix}gerarcodigobr <dias|permanente> [id_do_grupo_opcional]`);
        }

        let durationDays = null;
        if (durationArg === "permanente") {
          durationDays = "permanent";
        } else if (!Number.isNaN(parseInt(durationArg, 10)) && parseInt(durationArg, 10) > 0) {
          durationDays = parseInt(durationArg, 10);
        } else {
          return reply("🤔 Duração inválida. Use um número de dias (ex: 7) ou a palavra \"permanente\".");
        }

        let targetGroupId = null;
        if (targetGroupArg) {
          if (targetGroupArg.includes("@g.us")) {
            targetGroupId = targetGroupArg;
          } else if (/^\d+$/.test(targetGroupArg)) {
            targetGroupId = `${targetGroupArg}@g.us`;
          } else {
            const mentionedJid = info?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            if (mentionedJid && mentionedJid.endsWith("@g.us")) {
              targetGroupId = mentionedJid;
            } else {
              return reply("🤔 ID do grupo alvo inválido. Forneça o ID completo (número@g.us) ou deixe em branco para um código genérico.");
            }
          }
        }

        const result = generateActivationCode(durationDays, targetGroupId);
        return reply(result.message);
      } catch (error) {
        console.error("Erro no comando gerarcodigo:", error);
        return reply("❌ Ocorreu um erro inesperado ao gerar o código.");
      }
    }

    if (["limparaluguel"].includes(cmd)) {
      if (!ensureOwner(rentalMsg.cleanupOwnerOnly || rentalMsg.ownerOnly)) return;
      try {
        await reply(rentalMsg.cleanupStart || "🔄 Iniciando limpeza completa de aluguéis...");

        const rentalData = loadRentalData();
        let groupsCleaned = 0;
        let groupsExpired = 0;
        let groupsWithoutRental = 0;
        const groupsLeft = [];
        let chatsDeleted = 0;
        let groupConversationsCleared = 0;
        let adminsNotified = 0;
        const symbols = ["✨", "🌟", "⚡", "🔥", "🌈", "🍀", "💫", "🎉"];

        const currentGroups = await bot.groupFetchAllParticipating().catch(() => ({}));
        const currentGroupIds = Object.keys(currentGroups);
        const rentalGroupIds = Object.keys(rentalData.groups || {});

        for (const groupId of Object.keys(rentalData.groups || {})) {
          if (!currentGroupIds.includes(groupId)) {
            delete rentalData.groups[groupId];
            groupsCleaned++;
          }
        }

        for (const groupId of Object.keys(rentalData.groups || {})) {
          const rentalStatus = getGroupRentalStatus(groupId);
          if (rentalStatus.active || rentalStatus.permanent) continue;

          const groupMetadata = await getCachedGroupMetadata(groupId).catch(() => null);
          if (!groupMetadata) {
            delete rentalData.groups[groupId];
            groupsCleaned++;
            continue;
          }

          groupsExpired++;
          groupsLeft.push(groupId);

          try {
            const currentTarget = rentalData.notificationTarget || 'ambos';
            
            if (currentTarget === 'grupo' || currentTarget === 'ambos') {
              await bot.sendMessage(groupId, {
                text: `⏰ O aluguel deste grupo (${groupMetadata.subject}) expirou. Estou saindo, mas vocês podem renovar o aluguel entrando em contato com o dono! Até mais! 😊${symbols[Math.floor(Math.random() * symbols.length)]}`
              });
            }

            if (currentTarget === 'pv' || currentTarget === 'ambos') {
              const admins = (groupMetadata.participants || []).filter(p => p.admin).map(p => p.id);
              for (const admin of admins) {
                const delay = Math.floor(Math.random() * (500 - 100 + 1)) + 100;
                await new Promise(resolve => setTimeout(resolve, delay));
                try {
                  await bot.sendMessage(admin, {
                    text: `⚠️ Olá, admin do grupo *${groupMetadata.subject}*! O aluguel do grupo expirou, e por isso saí. Para renovar, entre em contato com o dono. Obrigado! ${symbols[Math.floor(Math.random() * symbols.length)]}`
                  });
                  adminsNotified++;
                } catch (error) {
                  console.error(`Erro ao notificar admin ${admin}:`, error.message);
                }
              }
            }

            await bot.groupLeave(groupId);

            if (bot.chatModify && typeof deleteChatByLastMessage === "function") {
              try {
                await deleteChatByLastMessage(groupId);
                chatsDeleted++;
              } catch (error) {
                console.error(`Erro ao deletar chat ${groupId}:`, error.message);
              }
            }

            if (bot.chatModify && typeof clearChatHistorySafe === "function") {
              try {
                await clearChatHistorySafe(groupId);
                groupConversationsCleared++;
              } catch (error) {
                console.error(`Erro ao limpar conversa ${groupId}:`, error.message);
              }
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`Erro ao processar grupo ${groupId}:`, error.message);
          }
        }

        for (const groupId of currentGroupIds) {
          if (rentalGroupIds.includes(groupId)) continue;

          groupsWithoutRental++;
          groupsLeft.push(groupId);

          try {
            await bot.sendMessage(groupId, {
              text: `👋 Este grupo não possui aluguel registrado. Estou saindo. Até mais! ${symbols[Math.floor(Math.random() * symbols.length)]}`
            });

            await bot.groupLeave(groupId);

            if (bot.chatModify && typeof deleteChatByLastMessage === "function") {
              try {
                await deleteChatByLastMessage(groupId);
                chatsDeleted++;
              } catch (error) {
                console.error(`Erro ao deletar chat ${groupId}:`, error.message);
              }
            }

            if (bot.chatModify && typeof clearChatHistorySafe === "function") {
              try {
                await clearChatHistorySafe(groupId);
                groupConversationsCleared++;
              } catch (error) {
                console.error(`Erro ao limpar conversa ${groupId}:`, error.message);
              }
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`Erro ao processar grupo sem aluguel ${groupId}:`, error.message);
          }
        }

        if (bot.chatModify && typeof clearChatHistorySafe === "function") {
          try {
            const remainingGroups = await bot.groupFetchAllParticipating().catch(() => ({}));
            for (const groupId of Object.keys(remainingGroups)) {
              try {
                await clearChatHistorySafe(groupId);
                groupConversationsCleared++;
                await new Promise(resolve => setTimeout(resolve, 500));
              } catch (error) {
                console.error(`Erro ao limpar conversa do grupo ${groupId}:`, error.message);
              }
            }
          } catch (error) {
            console.error("Erro ao limpar conversas de grupos:", error.message);
          }
        }

        saveRentalData(rentalData);

        let summary = "🧹 *Resumo da Limpeza Completa de Alugueis* 🧹\n\n";
        summary += `✅ Grupos removidos dos registros: *${groupsCleaned}*\n`;
        summary += `⏰ Grupos vencidos processados: *${groupsExpired}*\n`;
        summary += `🚫 Grupos sem aluguel processados: *${groupsWithoutRental}*\n`;
        summary += `📩 Administradores notificados: *${adminsNotified}*\n`;
        summary += `🗑️ Chats excluídos: *${chatsDeleted}*\n`;
        summary += `🧽 Conversas de grupos limpas: *${groupConversationsCleared}*\n`;
        summary += `📋 Total de grupos dos quais sai: *${groupsLeft.length}*\n`;

        if (groupsLeft.length > 0) {
          summary += `\n📋 *Grupos processados:*\n${groupsLeft.slice(0, 10).map(id => `- ${id.split("@")[0]}`).join("\n")}`;
          if (groupsLeft.length > 10) {
            summary += `\n... e mais ${groupsLeft.length - 10} grupos`;
          }
        }

        summary += "\n\n✨ Limpeza concluída com sucesso!";
        return reply(summary);
      } catch (error) {
        console.error("Erro no comando limparaluguel:", error);
        return reply(rentalMsg.cleanupError || "Ocorreu um erro ao limpar aluguéis.");
      }
    }
  }
};

