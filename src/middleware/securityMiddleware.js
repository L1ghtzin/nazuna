import { writeAsync } from '../utils/database/io.js';

/**
 * Middleware para sistemas de proteção e moderação de conteúdo
 */
export async function processSecurity({
  bot,
  from,
  sender,
  body,
  info,
  isGroup,
  isGroupAdmin,
  isBotAdmin,
  isOwner,
  type,
  antitoxic,
  antipalavra,
  groupData,
  groupFile,
  MESSAGES,
  groupAdmins,
  ownerJid,
  lidowner,
  botNumber,
  botNumberLid
}) {
  // FiguBan (Sticker Ban)
  if (isGroup && type === 'stickerMessage' && groupData?.figuban?.enabled && groupData?.figuban?.stickerSha) {
    if (isGroupAdmin || isOwner) {
      const stickerSha = info.message.stickerMessage?.fileSha256
        ? Buffer.from(info.message.stickerMessage.fileSha256).toString('hex')
        : null;

      if (stickerSha === groupData.figuban.stickerSha) {
        const contextInfo = info.message.stickerMessage.contextInfo;
        let target = null;

        if (contextInfo?.participant) {
          target = contextInfo.participant;
        } else if (contextInfo?.mentionedJid?.length > 0) {
          target = contextInfo.mentionedJid[0];
        }

        if (target) {
          const isTargetOwner = target === ownerJid || (lidowner && target === lidowner);
          const isTargetBot = target === botNumber || (botNumberLid && target === botNumberLid);
          const isTargetAdmin = groupAdmins?.includes(target);

          if (isTargetOwner) {
            await bot.sendMessage(from, { text: MESSAGES.admin.figuban.cantBanOwner }, { quoted: info });
            return true;
          }
          if (isTargetBot) {
            await bot.sendMessage(from, { text: MESSAGES.admin.figuban.cantBanSelf }, { quoted: info });
            return true;
          }
          if (isTargetAdmin) {
            await bot.sendMessage(from, { text: MESSAGES.admin.figuban.cantBanAdmin }, { quoted: info });
            return true;
          }

          if (!isBotAdmin) {
            await bot.sendMessage(from, { text: MESSAGES.admin.figuban.botNotAdmin }, { quoted: info });
            return true;
          }

          // Realizar o ban
          await bot.sendMessage(from, { delete: info.key }).catch(() => {});
          
          await bot.groupParticipantsUpdate(from, [target], 'remove').catch(err => {
            console.error('[FIGUBAN] Erro ao remover usuário:', err.message);
          });

          await bot.sendMessage(from, {
            text: MESSAGES.admin.figuban.bannedMsg(sender.split('@')[0], target.split('@')[0]),
            mentions: [sender, target]
          });

          return true;
        }
      }
    }
  }
  // AntiToxic
  if (isGroup && !isGroupAdmin && antitoxic && antitoxic.isEnabled && antitoxic.isEnabled(from) && body) {
    antitoxic.processMessage(from, sender, body).then(toxicResult => {
      if (toxicResult && toxicResult.action !== 'none') {
        const warningData = antitoxic.generateWarningMessage(sender, toxicResult);
        if (warningData) {
          if (toxicResult.action === 'apagar') {
            bot.sendMessage(from, { delete: info.key }).then(() => {
              bot.sendMessage(from, warningData).catch(() => {});
            }).catch(() => {});
          } else if (toxicResult.action === 'avisar') {
            bot.sendMessage(from, warningData).catch(() => {});
          } else if (toxicResult.action === 'mute') {
            if (groupData && groupFile) {
              groupData.mutedUsers = groupData.mutedUsers || {};
              groupData.mutedUsers[sender] = true;
              writeAsync(groupFile, groupData).catch(() => {});
            }
            bot.sendMessage(from, warningData).catch(() => {});
          }
        }
      }
    }).catch(toxicErr => {
      console.warn('[ANTITOXIC] Error:', toxicErr.message);
    });
  }

  // AntiPalavra (Blacklist de palavras)
  if (isGroup && antipalavra && body) {
    try {
      const antipalavraPersistence = { groupData, groupFile };
      if (await antipalavra.isActive(from, antipalavraPersistence) && !isGroupAdmin) {
        const detectionResult = await antipalavra.checkMessage(from, body, antipalavraPersistence);
        
        if (detectionResult && detectionResult.detected) {
          if (process.env.DEBUG_MODE === 'true') {
            console.log(`[ANTIPALAVRA] Palavra detectada: "${detectionResult.palavra}" de @${sender.split('@')[0]}`);
          }
          
          if (!isBotAdmin) {
            await bot.sendMessage(from, {
              text: MESSAGES.middleware.antipalavra.detectedNoAdmin(sender.split('@')[0], detectionResult.palavra),
              mentions: [sender]
            }).catch(err => console.error('[ANTIPALAVRA] Erro ao enviar notificação:', err.message));
            return true;
          }
          
          await bot.sendMessage(from, { delete: info.key }).catch(err => 
            console.error('[ANTIPALAVRA] Erro ao deletar mensagem:', err.message)
          );
          
          await bot.groupParticipantsUpdate(from, [sender], 'remove').catch(err => 
            console.error('[ANTIPALAVRA] Erro ao remover usuário:', err.message)
          );
          
          await antipalavra.registerBan(from, sender, detectionResult.palavra, {
            ...antipalavraPersistence,
            groupData: detectionResult.groupData || groupData
          });
          
          await bot.sendMessage(from, {
            text: MESSAGES.middleware.antipalavra.banned(sender.split('@')[0], detectionResult.palavra),
            mentions: [sender]
          }).catch(err => console.error('[ANTIPALAVRA] Erro ao enviar notificação:', err.message));
          
          return true;
        }
      }
    } catch (antipalavraErr) {
      console.error('[ANTIPALAVRA] Erro ao processar:', antipalavraErr.message);
    }
  }

  return false;
}
