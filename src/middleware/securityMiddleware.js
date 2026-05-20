/**
 * Middleware para sistemas de proteção e moderação de conteúdo
 */
export async function processSecurity({
  nazu,
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
  optimizer
}) {
  // AntiToxic
  if (isGroup && !isGroupAdmin && antitoxic && antitoxic.isEnabled && antitoxic.isEnabled(from) && body) {
    antitoxic.processMessage(from, sender, body).then(toxicResult => {
      if (toxicResult && toxicResult.action !== 'none') {
        const warningData = antitoxic.generateWarningMessage(sender, toxicResult);
        if (warningData) {
          if (toxicResult.action === 'apagar') {
            nazu.sendMessage(from, { delete: info.key }).then(() => {
              nazu.sendMessage(from, warningData).catch(() => {});
            }).catch(() => {});
          } else if (toxicResult.action === 'avisar') {
            nazu.sendMessage(from, warningData).catch(() => {});
          } else if (toxicResult.action === 'mute') {
            if (groupData && optimizer && groupFile) {
              groupData.mutedUsers = groupData.mutedUsers || {};
              groupData.mutedUsers[sender] = true;
              optimizer.saveJsonWithCache(groupFile, groupData).catch(() => {});
            }
            nazu.sendMessage(from, warningData).catch(() => {});
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
          console.log(`[ANTIPALAVRA] Palavra detectada: "${detectionResult.palavra}" de @${sender.split('@')[0]}`);
          
          if (!isBotAdmin) {
            await nazu.sendMessage(from, {
              text: `⚠️ *ANTIPALAVRA - DETECÇÃO*\n\n` +
                `👤 @${sender.split('@')[0]} usou uma palavra proibida!\n` +
                `⚠️ Palavra: "${detectionResult.palavra}"\n\n` +
                `❌ Não posso banir pois não sou administrador!`,
              mentions: [sender]
            }).catch(err => console.error('[ANTIPALAVRA] Erro ao enviar notificação:', err.message));
            return true;
          }
          
          await nazu.sendMessage(from, { delete: info.key }).catch(err => 
            console.error('[ANTIPALAVRA] Erro ao deletar mensagem:', err.message)
          );
          
          await nazu.groupParticipantsUpdate(from, [sender], 'remove').catch(err => 
            console.error('[ANTIPALAVRA] Erro ao remover usuário:', err.message)
          );
          
          antipalavra.registerBan(from, sender, detectionResult.palavra);
          
          await nazu.sendMessage(from, {
            text: `🚫 *ANTIPALAVRA - BANIMENTO AUTOMÁTICO*\n\n` +
            `👤 Usuário: @${sender.split('@')[0]}\n` +
            `⚠️ Palavra detectada: "${detectionResult.palavra}"\n` +
            `🔨 Ação: Banimento automático\n\n` +
            `_O sistema antipalavra protege este grupo._`,
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
