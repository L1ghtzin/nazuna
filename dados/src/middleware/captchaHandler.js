import pathz from 'path';
import { readJsonFileAsync, writeJsonFileAsync } from '../utils/asyncFs.js';
import CaptchaIndex, { getCaptcha, removeCaptcha } from '../utils/captchaIndex.js';


/**
 * Middleware para processar respostas de captcha no PV ou no Grupo
 * 
 * @param {object} nazu - Instância do bot
 * @param {string} sender - ID de quem enviou a mensagem
 * @param {string} body - Corpo da mensagem
 * @param {boolean} isGroup - Se a mensagem é num grupo
 * @param {object} info - Metadados da mensagem
 * @param {function} reply - Função para enviar resposta
 * @param {string} GRUPOS_DIR - Diretório dos grupos
 * @param {boolean} debug - Modo de depuração
 * @returns {Promise<boolean>} Retorna true se o fluxo principal deve ser interrompido (handled)
 */
export async function handleCaptchaResponse(nazu, sender, body, isGroup, info, reply, GRUPOS_DIR, debug = false) {
  if (info.key.fromMe) return false;

  await CaptchaIndex.init();

  const now = Date.now();
  const senderNormalized = (info.key?.participantAlt || sender)?.replace(/@.*/, '');

  const isCapUser = CaptchaIndex.get(senderNormalized);

  if (!isCapUser) {
    return false;
  }

  if (now >= isCapUser.expiresAt) {
    if (debug) console.log('[CAPTCHA] EXPIRADO');
    try {
      await nazu.sendMessage(isCapUser.groupId, {
        text: `⏰ @${senderNormalized} demorou demais e foi removido.`,
        mentions: [isCapUser.idOrigin]
      });
      await nazu.groupParticipantsUpdate(
        isCapUser.groupId,
        [isCapUser.idOrigin],
        'remove'
      );
    } catch (e) {
      console.log('[ERRO EXPIRAÇÃO]:', e.message);
    }
    CaptchaIndex.remove(senderNormalized);
    return true; // Interrompe
  }

  const text = body || '';
  const respInt = parseInt(text.trim());
  const answerInt = parseInt(isCapUser.answer);

  if (debug) console.log('[DEBUG] RESP:', respInt, '| CORRETO:', answerInt);

  if (respInt === answerInt) {
    CaptchaIndex.remove(senderNormalized);

    try {
      const groupMetadata = await nazu.groupMetadata(isCapUser.groupId).catch(() => null);
      const groupPath = pathz.join(GRUPOS_DIR, isCapUser.groupFile || `${isCapUser.groupId.replace('@g.us', '')}.json`);
      const groupSettings = await readJsonFileAsync(groupPath, {});

      if (groupSettings && groupSettings.bemvindo && groupMetadata) {
        // Envia boas vindas usando o formato original do captcha
        // Nota: se você tem o createGroupMessage disponível, importe-o. 
        // Caso contrário, enviamos uma resposta de aprovação padronizada.
        try {
            const { createGroupMessage } = await import('../connect.js').catch(() => ({}));
            if (createGroupMessage) {
                const message = await createGroupMessage(
                  nazu,
                  groupMetadata,
                  [isCapUser.idOrigin],
                  groupSettings.welcome || { text: groupSettings.textbv }
                );
                await nazu.sendMessage(isCapUser.groupId, message);
            } else {
                throw new Error("createGroupMessage não encontrado");
            }
        } catch (e) {
            await nazu.sendMessage(isCapUser.groupId, {
              text: `✅ @${senderNormalized} liberado com sucesso!`,
              mentions: [isCapUser.idOrigin]
            });
        }
      } else {
        await nazu.sendMessage(isCapUser.groupId, {
          text: `✅ @${senderNormalized} liberado com sucesso!`,
          mentions: [isCapUser.idOrigin]
        });
      }
    } catch (e) {
      console.log('[ERRO WELCOME PÓS-CAPTCHA]:', e.message);
      await nazu.sendMessage(isCapUser.groupId, {
        text: `✅ @${senderNormalized} liberado com sucesso!`,
        mentions: [isCapUser.idOrigin]
      }).catch(() => {});
    }
    
    // Se a lógica do nazuna aprova a requisição de grupo (para autoAccept), faz aqui também
    try {
        await nazu.groupRequestParticipantsUpdate(isCapUser.groupId, [isCapUser.idOrigin], 'approve').catch(() => {});
    } catch {}

    return true;
  }

  return false;
}
