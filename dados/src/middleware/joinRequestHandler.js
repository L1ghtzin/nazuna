import pathz from 'path';
import { readJsonFileAsync, writeJsonFileAsync } from '../utils/asyncFs.js';
import { addCaptcha, removeCaptcha } from '../utils/captchaIndex.js';

/**
 * Middleware para processar solicitações de entrada de grupos (join requests via messageStubType)
 * 
 * @param {object} nazu - Instância do bot
 * @param {object} info - Informações da mensagem (stub)
 * @param {string} from - ID do grupo
 * @param {boolean} isGroup - Se a mensagem é num grupo
 * @param {string} GRUPOS_DIR - Caminho para os dados dos grupos
 * @param {boolean} debug - Modo debug
 * @returns {Promise<boolean>} Retorna true se a mensagem foi tratada (deve interromper o fluxo)
 */
export async function handleJoinRequest(nazu, info, from, isGroup, GRUPOS_DIR, debug = false) {
  // Verifica se é um evento do tipo GROUP_MEMBERSHIP_JOIN_APPROVAL_REQUEST_NON_ADMIN_ADD
  if (!isGroup || !info.message?.messageStubType || info.message.messageStubType !== 172) {
    return false;
  }

  try {
    const groupFile = pathz.join(GRUPOS_DIR, `${from}.json`);
    let groupSettings = {};
    
    // Carrega de forma assíncrona para não bloquear
    groupSettings = await readJsonFileAsync(groupFile, {});
    
    // Extrai dados da solicitação dos parâmetros do stub
    const messageStubParameters = info.message.messageStubParameters || [];
    
    if (debug) {
      console.log('[DEBUG STUB 172] messageStubParameters:', messageStubParameters);
    }
    
    // O primeiro parâmetro é o JID do participante
    const participantJid = messageStubParameters[0];
    // Para novas solicitações, assumimos 'created' se não houver segundo parâmetro
    const action = messageStubParameters[1] || 'created';
    
    if (!participantJid) {
      console.warn('[JOIN REQUEST] Parâmetros de solicitação inválidos:', messageStubParameters);
      return true; // Mensagem processada com erro, mas é do tipo join request
    }
    
    if (debug) {
      console.log('[DEBUG JOIN REQUEST] Processando solicitação:', {
        participantJid,
        action,
        autoAcceptRequests: groupSettings.autoAcceptRequests,
        captchaEnabled: groupSettings.captchaEnabled,
        x9: groupSettings.x9
      });
    }
    
    console.log(`[JOIN REQUEST] Nova solicitação detectada: ${participantJid} (ação: ${action})`);
    
    // Processa apenas novas solicitações (action === 'created')
    if (action === 'created') {
      // Auto-aceitar (com ou sem captcha)
      if (groupSettings.autoAcceptRequests) {
        if (groupSettings.captchaEnabled) {
          // Pega o nome do grupo
          const groupMetadata = await nazu.groupMetadata(from).catch(() => null);
          const groupNameCaptcha = groupMetadata?.subject || 'Desconhecido';
          
          // Gera captcha e envia para o usuário
          const num1 = Math.floor(Math.random() * 10) + 1;
          const num2 = Math.floor(Math.random() * 10) + 1;
          const correctAnswer = num1 + num2;
          
          const captchaMessage = `🤖 *Verificação de Entrada no Grupo*\n\n` +
            `Você solicitou entrada no grupo *${groupNameCaptcha}*.\n\n` +
            `Para confirmar que você é humano, resolva esta conta:\n\n` +
            `❓ *${num1} + ${num2} = ?*\n\n` +
            `Responda apenas com o número da resposta.`;
          
          // Salva captcha pendente
          groupSettings.pendingCaptchas = groupSettings.pendingCaptchas || {};
          groupSettings.pendingCaptchas[participantJid] = {
            answer: correctAnswer,
            groupId: from,
            expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutos
          };
          
          // Adiciona ao índice de captcha para busca rápida
          const groupFileName = `${from.replace('@g.us', '')}.json`;
          addCaptcha(participantJid, from, correctAnswer, Date.now() + (5 * 60 * 1000), groupFileName);
          
          // Salva arquivo de forma assíncrona para não bloquear
          writeJsonFileAsync(groupFile, groupSettings).catch(err => 
            console.error('Erro ao salvar captcha no arquivo:', err)
          );
          
          if (debug) {
            console.log('[DEBUG CAPTCHA] Captcha salvo:', {
              participantJid,
              num1,
              num2,
              correctAnswer,
              groupId: from
            });
          }
          
          try {
            await nazu.sendMessage(participantJid, { text: captchaMessage });
            console.log(`[JOIN REQUEST] Captcha enviado para ${participantJid}`);
          } catch (err) {
            console.error(`[JOIN REQUEST] Erro ao enviar captcha para ${participantJid}:`, err);
          }
        } else {
          // Auto-aceitar sem captcha
          try {
            await nazu.groupRequestParticipantsUpdate(from, [participantJid], 'approve');
            console.log(`[JOIN REQUEST] ✅ Aprovado automaticamente: ${participantJid}`);
            
            // Notificação X9
            if (groupSettings.x9) {
              await nazu.sendMessage(from, {
                text: `✅ *X9 Report:* @${participantJid.split('@')[0]} foi aprovado automaticamente (auto-aceitar ativo).`,
                mentions: [participantJid],
              }).catch(err => console.error(`❌ Erro ao enviar X9: ${err.message}`));
            }
          } catch (err) {
            console.error(`[JOIN REQUEST] Erro ao aprovar ${participantJid}:`, err);
          }
        }
      } else {
        // Auto-aceitar desativado - apenas notifica se X9 ativo
        if (groupSettings.x9) {
          try {
            await nazu.sendMessage(from, {
              text: `📬 *X9 Report:* Nova solicitação de entrada detectada.\n👤 Usuário: @${participantJid.split('@')[0]}\n\nAprovação manual necessária.`,
              mentions: [participantJid],
            }).catch(err => console.error(`❌ Erro ao enviar X9: ${err.message}`));
          } catch (err) {
            console.error(`[JOIN REQUEST] Erro ao enviar notificação X9:`, err);
          }
        }
      }
    } else if (action === 'revoked' || action === 'rejected') {
      // Solicitação cancelada ou recusada - limpa captcha se existir
      if (groupSettings.pendingCaptchas && groupSettings.pendingCaptchas[participantJid]) {
        delete groupSettings.pendingCaptchas[participantJid];
        // Remove do índice de captcha
        removeCaptcha(participantJid);
        // Salva de forma assíncrona
        writeJsonFileAsync(groupFile, groupSettings).catch(err => 
          console.error('Erro ao salvar após remover captcha:', err)
        );
      }
      
      // Notifica X9 se ativo
      if (groupSettings.x9) {
        const statusText = action === 'revoked' ? 'cancelou a solicitação' : 'teve a solicitação recusada';
        try {
          await nazu.sendMessage(from, {
            text: `🔔 *X9 Report:* @${participantJid.split('@')[0]} ${statusText}.`,
            mentions: [participantJid],
          }).catch(err => console.error(`❌ Erro ao enviar X9: ${err.message}`));
        } catch (err) {
          console.error(`[JOIN REQUEST] Erro ao enviar notificação X9:`, err);
        }
      }
    }
  } catch (error) {
    console.error('[JOIN REQUEST] Erro ao processar solicitação de entrada:', error);
  }
  
  // Como a mensagem é um stub de join request, informamos que já lidamos com ela
  return true;
}
