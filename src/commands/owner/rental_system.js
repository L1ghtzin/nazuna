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
    const ensureOwner = (fallback = MESSAGES.owner.rental_system.permission.ownerOnly) => {
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
      if (!ensureOwner(MESSAGES.owner.rental_system.permission.mode)) return;
      try {
        const action = query.toLowerCase();
        if (action === "on" || action === "ativar") {
          return reply(setRentalMode(true)
            ? MESSAGES.owner.rental_system.mode.on
            : MESSAGES.owner.rental_system.mode.onFail);
        }

        if (action === "off" || action === "desativar") {
          return reply(setRentalMode(false)
            ? MESSAGES.owner.rental_system.mode.off
            : MESSAGES.owner.rental_system.mode.offFail);
        }

        const currentStatus = isRentalModeActive() ? "ATIVADO" : "DESATIVADO";
        return reply(MESSAGES.owner.rental_system.mode.usage(prefix, currentStatus));
      } catch (error) {
        console.error("Erro no comando modoaluguel:", error);
        return reply(MESSAGES.owner.rental_system.mode.error);
      }
    }

    if (["aluguelaviso"].includes(cmd)) {
      if (!ensureOwner(MESSAGES.owner.rental_system.permission.ownerOnly)) return;
      try {
        const action = query.toLowerCase();
        if (["grupo", "pv", "ambos"].includes(action)) {
          const rentalData = loadRentalData();
          rentalData.notificationTarget = action;
          saveRentalData(rentalData);
          return reply(MESSAGES.owner.rental_system.notification.success(action));
        }
        
        const currentTarget = loadRentalData().notificationTarget || "ambos";
        return reply(MESSAGES.owner.rental_system.notification.usage(prefix, currentTarget));
      } catch (error) {
        console.error("Erro no comando aluguelaviso:", error);
        return reply(MESSAGES.owner.rental_system.notification.error);
      }
    }

    if (["listaraluguel", "listaraluguéis", "aluguelist", "listaluguel", "listaaluguel", "veraluguéis", "listrentals"].includes(cmd)) {
      if (!ensureOwner(MESSAGES.owner.rental_system.permission.list)) return;
      try {
        const rentalData = loadRentalData();
        const groupIds = Object.keys(rentalData.groups || {});

        if (!groupIds.length) {
          return reply(MESSAGES.owner.rental_system.list.empty);
        }

        let message = MESSAGES.owner.rental_system.list.header(groupIds.length);

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

            message += MESSAGES.owner.rental_system.list.itemHeader(statusIcon, groupName);
            message += MESSAGES.owner.rental_system.list.itemId(groupId);
            message += MESSAGES.owner.rental_system.list.itemStatus(statusText);

            if (!isPermanent && Number.isFinite(expiresAtMs)) {
              const daysLeft = Math.ceil((expiresAtMs - now) / (1000 * 60 * 60 * 24));
              message += MESSAGES.owner.rental_system.list.itemExpires(new Date(expiresAtMs).toLocaleDateString("pt-BR"));
              message += MESSAGES.owner.rental_system.list.itemDaysLeft(daysLeft > 0 ? daysLeft : 0);
            }

            if (rental?.addedAt) {
              message += MESSAGES.owner.rental_system.list.itemAddedAt(new Date(rental.addedAt).toLocaleDateString("pt-BR"));
            }

            message += MESSAGES.owner.rental_system.list.itemFooter;
          } catch {
            message += MESSAGES.owner.rental_system.list.notFound;
            message += MESSAGES.owner.rental_system.list.itemHeader("⚠️", groupId);
            message += MESSAGES.owner.rental_system.list.itemError;
            message += MESSAGES.owner.rental_system.list.itemFooter;
          }
        }

        message += MESSAGES.owner.rental_system.list.stats(activeCount, permanentCount, expiredCount, groupIds.length);
        message += MESSAGES.owner.rental_system.list.commands(prefix);

        return reply(message);
      } catch (error) {
        console.error("Erro no comando listaraluguel:", error);
        return reply(MESSAGES.owner.rental_system.list.error);
      }
    }

    if (["addaluguel"].includes(cmd)) {
      if (!ensureOwner(MESSAGES.owner.rental_system.permission.ownerOnly)) return;
      if (!isGroup) return reply(MESSAGES.owner.rental_system.permission.groupOnly);

      try {
        const durationArg = query.toLowerCase().split(" ")[0];
        if (!durationArg) {
          return reply(MESSAGES.owner.rental_system.add.invalidDuration(prefix));
        }

        let durationDays = null;
        if (durationArg === "permanente") {
          durationDays = "permanent";
        } else if (!Number.isNaN(parseInt(durationArg, 10)) && parseInt(durationArg, 10) > 0) {
          durationDays = parseInt(durationArg, 10);
        } else {
          return reply(MESSAGES.owner.rental_system.add.invalidDuration(prefix));
        }

        const result = setGroupRental(from, durationDays, prefix);
        return reply(result.message);
      } catch (error) {
        console.error("Erro no comando addaluguel:", error);
        return reply(MESSAGES.owner.rental_system.add.error);
      }
    }

    if (["removeraluguel", "deletaraluguel", "cancelaraluguel"].includes(cmd)) {
      if (!ensureOwner(MESSAGES.owner.rental_system.permission.remove)) return;
      try {
        let targetGroupId = query || (isGroup ? from : "");

        if (!targetGroupId) {
          return reply(MESSAGES.owner.rental_system.remove.usage(prefix));
        }

        targetGroupId = normalizeGroupId(targetGroupId);
        const rentalData = loadRentalData();

        if (!rentalData.groups || !rentalData.groups[targetGroupId]) {
          return reply(MESSAGES.owner.rental_system.remove.notFound(prefix));
        }

        let groupName = targetGroupId;
        try {
          const groupMeta = await getCachedGroupMetadata(targetGroupId);
          groupName = groupMeta?.subject || targetGroupId;
        } catch {
        }

        delete rentalData.groups[targetGroupId];
        saveRentalData(rentalData);

        await reply(MESSAGES.owner.rental_system.remove.success(groupName, targetGroupId));

        try {
          await bot.sendMessage(targetGroupId, {
            text: MESSAGES.owner.rental_system.remove.groupWarning
          });
        } catch (error) {
          console.log("Não foi possível notificar o grupo:", error.message);
        }
      } catch (error) {
        console.error("Erro no comando removeraluguel:", error);
        return reply(MESSAGES.owner.rental_system.remove.error);
      }
      return;
    }

    if (["estenderaluguel", "adddiasaluguel", "extenderrental"].includes(cmd)) {
      if (!ensureOwner(MESSAGES.owner.rental_system.permission.extend)) return;
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
          return reply(MESSAGES.owner.rental_system.extend.usage(prefix));
        }

        if (Number.isNaN(daysToAdd) || daysToAdd <= 0) {
          return reply(MESSAGES.owner.rental_system.extend.invalidDays);
        }

        targetGroupId = normalizeGroupId(targetGroupId);

        const result = extendGroupRental(targetGroupId, daysToAdd);
        if (!result.success) {
          return reply(MESSAGES.owner.rental_system.extend.fail(result.message));
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

        await reply(MESSAGES.owner.rental_system.extend.success(groupName, daysToAdd, newExpirationDate, daysLeft));

        try {
          await bot.sendMessage(targetGroupId, {
            text: MESSAGES.owner.rental_system.extend.groupWarning(daysToAdd, newExpirationDate, daysLeft)
          });
        } catch (error) {
          console.log("Não foi possível notificar o grupo:", error.message);
        }
      } catch (error) {
        console.error("Erro no comando estenderaluguel:", error);
        return reply(MESSAGES.owner.rental_system.extend.error);
      }
      return;
    }

    if (["dayfree"].includes(cmd)) {
      if (!ensureOwner(MESSAGES.owner.rental_system.permission.extend)) return;
      try {
        if (!query) {
          return reply(MESSAGES.owner.rental_system.dayfree.usage(prefix, command));
        }

        const parts = query.split(" ");
        const extraDays = parseInt(parts[0], 10);
        if (Number.isNaN(extraDays) || extraDays <= 0) {
          return reply(MESSAGES.owner.rental_system.dayfree.invalidDays);
        }

        const motivo = parts.slice(1).join(" ") || "Não especificado";
        const rentalData = loadRentalData();
        const groupIds = Object.keys(rentalData.groups || {});
        if (!groupIds.length) return reply(MESSAGES.owner.rental_system.dayfree.noRentals);

        let successCount = 0;
        let failCount = 0;
        let summary = MESSAGES.owner.rental_system.dayfree.summaryHeader;

        for (const groupId of groupIds) {
          const extendResult = extendGroupRental(groupId, extraDays);
          if (extendResult.success) {
            successCount++;
            summary += MESSAGES.owner.rental_system.dayfree.successItem(groupId, extendResult.message);
            try {
              const groupMeta = await getCachedGroupMetadata(groupId);
              const freshData = loadRentalData();
              const expiresAtMs = typeof freshData?.groups?.[groupId]?.expiresAt === "string"
                ? Date.parse(freshData.groups[groupId].expiresAt)
                : Number(freshData?.groups?.[groupId]?.expiresAt);
              const formattedDate = Number.isFinite(expiresAtMs)
                ? new Date(expiresAtMs).toLocaleDateString("pt-BR")
                : "N/A";

              const msg = MESSAGES.owner.rental_system.dayfree.groupWarning(groupMeta?.subject || "grupo", extraDays, formattedDate, motivo);
              await bot.sendMessage(groupId, { text: msg });
            } catch (error) {
              console.error(`Erro ao enviar mensagem para ${groupId}:`, error);
              summary += MESSAGES.owner.rental_system.dayfree.failNotify;
            }
          } else {
            failCount++;
            summary += MESSAGES.owner.rental_system.dayfree.failItem(groupId, extendResult.message);
          }
        }

        summary += MESSAGES.owner.rental_system.dayfree.summaryFooter(successCount, failCount);
        return reply(summary);
      } catch (error) {
        console.error("Erro no comando dayfree:", error);
        return reply(MESSAGES.owner.rental_system.dayfree.error);
      }
    }

    if (["infoaluguel", "statusaluguel", "detalhesaluguel"].includes(cmd)) {
      if (!ensureOwner(MESSAGES.owner.rental_system.permission.info)) return;
      try {
        let targetGroupId = query;

        if (!targetGroupId) {
          if (!isGroup) {
            return reply(MESSAGES.owner.rental_system.info.usage(prefix));
          }
          targetGroupId = from;
        }

        targetGroupId = normalizeGroupId(targetGroupId);

        const rentalData = loadRentalData();
        const rental = rentalData.groups?.[targetGroupId];

        if (!rental) {
          return reply(MESSAGES.owner.rental_system.info.notFound(prefix));
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

        let message = MESSAGES.owner.rental_system.info.header(groupName, targetGroupId, memberCount);

        if (isPermanent) {
          message += MESSAGES.owner.rental_system.info.permanent;
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

          message += MESSAGES.owner.rental_system.info.status(isExpired);
          message += MESSAGES.owner.rental_system.info.expiration(expirationDate, expirationTime);

          if (!isExpired) {
            message += MESSAGES.owner.rental_system.info.daysLeft(daysLeft);
            if (daysLeft <= 3) {
              message += MESSAGES.owner.rental_system.info.warning;
            }
          } else {
            const daysExpired = Math.abs(daysLeft);
            message += MESSAGES.owner.rental_system.info.expiredAgo(daysExpired);
          }
        }

        if (rental.addedAt) {
          message += MESSAGES.owner.rental_system.info.addedAt(new Date(rental.addedAt).toLocaleDateString("pt-BR"));
        }

        message += MESSAGES.owner.rental_system.info.commands(prefix, targetGroupId);

        return reply(message);
      } catch (error) {
        console.error("Erro no comando infoaluguel:", error);
        return reply(MESSAGES.owner.rental_system.info.error);
      }
    }

    if (["gerarcodigo", "gerarcodigobr", "gerarcod", "geraraluguel"].includes(cmd)) {
      if (!ensureOwner(MESSAGES.owner.rental_system.permission.code)) return;
      try {
        const parts = query ? query.split(" ") : [];
        const durationArg = parts[0]?.toLowerCase();
        const targetGroupArg = parts[1];

        if (!durationArg) {
          return reply(MESSAGES.owner.rental_system.code.usage(prefix));
        }

        let durationDays = null;
        if (durationArg === "permanente") {
          durationDays = "permanent";
        } else if (!Number.isNaN(parseInt(durationArg, 10)) && parseInt(durationArg, 10) > 0) {
          durationDays = parseInt(durationArg, 10);
        } else {
          return reply(MESSAGES.owner.rental_system.code.invalidDuration);
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
              return reply(MESSAGES.owner.rental_system.code.invalidTarget);
            }
          }
        }

        const result = generateActivationCode(durationDays, targetGroupId);
        return reply(result.message);
      } catch (error) {
        console.error("Erro no comando gerarcodigo:", error);
        return reply(MESSAGES.owner.rental_system.code.error);
      }
    }

    if (["limparaluguel"].includes(cmd)) {
      if (!ensureOwner(MESSAGES.owner.rental_system.permission.cleanup)) return;
      try {
        await reply(MESSAGES.owner.rental_system.cleanup.start);

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
                text: MESSAGES.owner.rental_system.cleanup.groupWarning(groupMetadata.subject, symbols[Math.floor(Math.random() * symbols.length)])
              });
            }

            if (currentTarget === 'pv' || currentTarget === 'ambos') {
              const admins = (groupMetadata.participants || []).filter(p => p.admin).map(p => p.id);
              for (const admin of admins) {
                const delay = Math.floor(Math.random() * (500 - 100 + 1)) + 100;
                await new Promise(resolve => setTimeout(resolve, delay));
                try {
                  await bot.sendMessage(admin, {
                    text: MESSAGES.owner.rental_system.cleanup.adminWarning(groupMetadata.subject, symbols[Math.floor(Math.random() * symbols.length)])
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
              text: MESSAGES.owner.rental_system.cleanup.noRentalWarning(symbols[Math.floor(Math.random() * symbols.length)])
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

        let leftListStr = "";
        if (groupsLeft.length > 0) {
          leftListStr = MESSAGES.owner.rental_system.cleanup.leftListHeader + groupsLeft.slice(0, 10).map(id => `- ${id.split("@")[0]}`).join("\n");
          if (groupsLeft.length > 10) {
            leftListStr += MESSAGES.owner.rental_system.cleanup.leftListMore(groupsLeft.length - 10);
          }
        }

        let summary = MESSAGES.owner.rental_system.cleanup.summary(
          groupsCleaned, groupsExpired, groupsWithoutRental, adminsNotified, chatsDeleted, groupConversationsCleared, groupsLeft.length, leftListStr
        );
        return reply(summary);
      } catch (error) {
        console.error("Erro no comando limparaluguel:", error);
        return reply(MESSAGES.owner.rental_system.cleanup.error);
      }
    }
  }
};

