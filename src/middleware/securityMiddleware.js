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
  antitoxic,
  antipalavra,
  groupData,
  groupFile,
  optimizer,
  MESSAGES
}) {
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
            if (groupData && optimizer && groupFile) {
              groupData.mutedUsers = groupData.mutedUsers || {};
              groupData.mutedUsers[sender] = true;
              optimizer.saveJsonWithCache(groupFile, groupData).catch(() => {});
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
      if (antipalavra.isActive(from) && !isGroupAdmin) {
        const detectionResult = antipalavra.checkMessage(from, body);
        
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
          
          antipalavra.registerBan(from, sender, detectionResult.palavra);
          
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
