import pathz from 'path';
import { readJsonFileAsync, writeJsonFileAsync } from '../utils/asyncFs.js';
import { addCaptcha, removeCaptcha } from '../utils/captchaIndex.js';
import { addJidLidToCache, getJidFromLid, getUserName } from '../utils/helpers.js';
import { MESSAGES } from '../utils/messages.js';

const normalizeWhatsAppId = (value, defaultSuffix = '') => {
  if (!value) return '';

  const textValue = String(value).trim().replace(/^['"]|['"]$/g, '');
  if (!textValue || textValue === '[object Object]') return '';

  if (textValue.includes('@')) {
    const baseId = textValue.split(':')[0];
    if (textValue.includes('@lid')) return `${baseId.split('@')[0]}@lid`;
    if (textValue.includes('@s.whatsapp.net')) return `${baseId.split('@')[0]}@s.whatsapp.net`;
    return textValue;
  }

  if (defaultSuffix && /^\d+$/.test(textValue)) {
    return `${textValue}${defaultSuffix}`;
  }

  return textValue;
};

const assignParticipantField = (ids, key, value) => {
  const normalizedKey = String(key || '').toLowerCase();
  const defaultSuffix = normalizedKey === 'lid' ? '@lid' : '@s.whatsapp.net';
  const normalizedId = normalizeWhatsAppId(value, defaultSuffix);
  if (!normalizedId) return;

  if (normalizedId.endsWith('@lid')) {
    ids.lid = ids.lid || normalizedId;
    return;
  }

  if (normalizedId.endsWith('@s.whatsapp.net')) {
    ids.id = ids.id || normalizedId;
    return;
  }

  ids.participant = ids.participant || normalizedId;
};

const parseParticipantStringObject = (rawParticipant) => {
  const textValue = rawParticipant.trim();

  try {
    return JSON.parse(textValue);
  } catch {
    const parsedFields = {};
    const fieldRegex = /["']?(jid|pn|id|participantPn|participant|lid)["']?\s*:\s*["']?([^"',}\s]+)["']?/gi;
    let fieldMatch;

    while ((fieldMatch = fieldRegex.exec(textValue)) !== null) {
      parsedFields[fieldMatch[1]] = fieldMatch[2];
    }

    return Object.keys(parsedFields).length ? parsedFields : null;
  }
};

export const parseJoinRequestParticipant = (rawParticipant) => {
  const ids = { id: '', lid: '', participant: '' };
  const parsedParticipant = typeof rawParticipant === 'string' && rawParticipant.trim().startsWith('{')
    ? parseParticipantStringObject(rawParticipant)
    : rawParticipant;

  if (parsedParticipant && typeof parsedParticipant === 'object') {
    const fieldPriority = ['pn', 'jid', 'id', 'participantPn', 'participant', 'lid'];
    for (const fieldName of fieldPriority) {
      assignParticipantField(ids, fieldName, parsedParticipant[fieldName]);
    }
  } else if (typeof rawParticipant === 'string') {
    assignParticipantField(ids, 'participant', rawParticipant);
  }

  if (ids.id && ids.lid) {
    addJidLidToCache(ids.id, ids.lid);
  }

  const resolvedJidFromLid = ids.lid ? getJidFromLid(ids.lid) : null;
  const participantJid = ids.id || resolvedJidFromLid || ids.lid || ids.participant;
  const mentionJid = ids.id || resolvedJidFromLid || ids.lid || participantJid;
  const displayUser = getUserName(mentionJid || participantJid);

  return {
    participantJid,
    mentionJid,
    displayUser,
    ids: {
      ...ids,
      participant: participantJid || ids.participant
    }
  };
};

/**
 * Middleware para processar solicitações de entrada de grupos (join requests via messageStubType)
 * 
 * @param {object} bot - Instância do bot
 * @param {object} info - Informações da mensagem (stub)
 * @param {string} from - ID do grupo
 * @param {boolean} isGroup - Se a mensagem é num grupo
 * @param {string} GRUPOS_DIR - Caminho para os dados dos grupos
 * @param {boolean} debug - Modo debug
 * @returns {Promise<boolean>} Retorna true se a mensagem foi tratada (deve interromper o fluxo)
 */
export async function handleJoinRequest(bot, info, from, isGroup, GRUPOS_DIR, debug = false) {
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
    
    // O primeiro parâmetro identifica o participante. Em alguns eventos o Baileys
    // envia um objeto stringificado com pn/jid/lid; pn/jid devem ter prioridade
    // para que a menção não vire o número interno do LID.
    const participantInfo = parseJoinRequestParticipant(messageStubParameters[0]);
    const { participantJid, mentionJid, displayUser, ids: participantIds } = participantInfo;
    
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
    
    if (debug) {
      console.log(`[JOIN REQUEST] Nova solicitação detectada: ${participantJid} (ação: ${action})`);
    }
    
    // Processa apenas novas solicitações (action === 'created')
    if (action === 'created') {
      // Auto-aceitar (com ou sem captcha)
      if (groupSettings.autoAcceptRequests) {
        if (groupSettings.captchaEnabled) {
          // Pega o nome do grupo
          const groupMetadata = await bot.groupMetadata(from).catch(() => null);
          const groupNameCaptcha = groupMetadata?.subject || 'Desconhecido';
          
          // Gera captcha e envia para o usuário
          const num1 = Math.floor(Math.random() * 10) + 1;
          const num2 = Math.floor(Math.random() * 10) + 1;
          const correctAnswer = num1 + num2;
          
          const captchaMessage = MESSAGES.middleware.joinRequest.captchaChallenge(groupNameCaptcha, num1, num2);
          
          // Salva captcha pendente
          groupSettings.pendingCaptchas = groupSettings.pendingCaptchas || {};
          groupSettings.pendingCaptchas[participantJid] = {
            answer: correctAnswer,
            groupId: from,
            expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutos
          };
          
          // Adiciona ao índice de captcha para busca rápida
          addCaptcha(participantIds, from, correctAnswer, Date.now() + (5 * 60 * 1000), participantIds.lid || participantJid);
          
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
            await bot.sendMessage(participantJid, { text: captchaMessage });
            if (debug) {
              console.log(`[JOIN REQUEST] Captcha enviado para ${participantJid}`);
            }
          } catch (err) {
            console.error(`[JOIN REQUEST] Erro ao enviar captcha para ${participantJid}:`, err);
          }
        } else {
          // Auto-aceitar sem captcha
          try {
            await bot.groupRequestParticipantsUpdate(from, [participantJid], 'approve');
            if (debug) {
              console.log(`[JOIN REQUEST] ✅ Aprovado automaticamente: ${participantJid}`);
            }
            
            // Notificação X9
            if (groupSettings.x9) {
              await bot.sendMessage(from, {
                text: MESSAGES.middleware.joinRequest.approved(displayUser),
                mentions: [mentionJid],
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
            await bot.sendMessage(from, {
              text: MESSAGES.middleware.joinRequest.pending(displayUser),
              mentions: [mentionJid],
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
          await bot.sendMessage(from, {
            text: MESSAGES.middleware.joinRequest.statusUpdate(displayUser, statusText),
            mentions: [mentionJid],
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
