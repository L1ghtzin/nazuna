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
  antipalavra
}) {
  // AntiToxic
  if (antitoxic && antitoxic.isEnabled && antitoxic.isEnabled(from) && body) {
    antitoxic.analyzeMessage(body).then(toxicResult => {
      if (toxicResult.isToxic) {
        const action = antitoxic.getGroupAction ? antitoxic.getGroupAction(from) : 'avisar';
        if (action === 'apagar') {
          nazu.sendMessage(from, { delete: info.key }).then(() => {
            nazu.sendMessage(from, {
              text: `⚠️ @${sender.split('@')[0]}, sua mensagem foi removida por conteúdo tóxico.\n\n_Detecção baseada em palavras-chave._`,
              mentions: [sender]
            });
          });
        } else if (action === 'avisar') {
          nazu.sendMessage(from, {
            text: `⚠️ @${sender.split('@')[0]}, evite mensagens tóxicas!\n\n_Detecção baseada em palavras-chave._`,
            mentions: [sender]
          });
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
