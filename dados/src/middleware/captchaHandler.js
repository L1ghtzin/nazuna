import pathz from 'path';
import { readJsonFileAsync, writeJsonFileAsync } from '../utils/asyncFs.js';
import { getCaptcha, removeCaptcha } from '../utils/captchaIndex.js';

/**
 * Middleware para processar respostas de captcha no PV
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
  // Ignora mensagens de grupo ou do próprio bot
  if (isGroup || info.key.fromMe) {
    return false;
  }

  const captchaData = getCaptcha(sender);
  if (!captchaData) {
    return false; // Não tem captcha pendente
  }

  if (debug) {
    console.log('[DEBUG CAPTCHA] Captcha pendente encontrado via índice:', {
      sender,
      body: body?.trim(),
      expectedAnswer: captchaData.answer,
      groupId: captchaData.groupId
    });
  }

  const userAnswer = parseInt(body?.trim());

  if (debug) {
    console.log('[DEBUG CAPTCHA] Resposta do usuário:', userAnswer, 'É número?', !isNaN(userAnswer));
  }

  if (isNaN(userAnswer)) {
    await reply('❌ Resposta inválida! Por favor, envie apenas o número da resposta.');
    return true; // Interrompe pois processamos a mensagem
  }

  const groupPath = pathz.join(GRUPOS_DIR, captchaData.groupFile || `${captchaData.groupId.replace('@g.us', '')}.json`);

  if (userAnswer === captchaData.answer) {
    // Resposta correta - aprovar no grupo
    try {
      if (debug) {
        console.log('[DEBUG CAPTCHA] ✅ Resposta correta! Aprovando no grupo:', captchaData.groupId);
      }
      await nazu.groupRequestParticipantsUpdate(captchaData.groupId, [sender], 'approve');
      await reply('✅ *Correto!* Você foi aprovado no grupo. Bem-vindo! 🎉');
      
      // Limpar captcha pendente do índice
      removeCaptcha(sender);
      
      // Também limpa do arquivo do grupo (async para não bloquear)
      readJsonFileAsync(groupPath, {}).then(async groupDataCaptcha => {
        if (groupDataCaptcha.pendingCaptchas?.[sender]) {
          delete groupDataCaptcha.pendingCaptchas[sender];
          await writeJsonFileAsync(groupPath, groupDataCaptcha);
        }
        
        // Notificação X9
        if (groupDataCaptcha.x9) {
          await nazu.sendMessage(captchaData.groupId, {
            text: `✅ *X9 Report:* @${sender.split('@')[0]} passou na verificação de captcha e foi aprovado automaticamente.`,
            mentions: [sender],
          }).catch(err => console.error(`❌ Erro ao enviar X9: ${err.message}`));
        }
      }).catch(err => console.error('Erro ao limpar captcha do arquivo:', err));
      
    } catch (err) {
      await reply('❌ Erro ao aprovar sua solicitação. Tente novamente mais tarde.');
      console.error('Erro ao aprovar após captcha:', err);
    }
  } else {
    // Resposta incorreta - recusar
    try {
      if (debug) {
        console.log('[DEBUG CAPTCHA] ❌ Resposta incorreta! Recusando no grupo:', captchaData.groupId);
      }
      await nazu.groupRequestParticipantsUpdate(captchaData.groupId, [sender], 'reject');
      await reply('❌ *Resposta incorreta!* Sua solicitação foi recusada. Você pode tentar solicitar novamente.');
      
      // Limpar captcha pendente do índice
      removeCaptcha(sender);
      
      // Também limpa do arquivo do grupo (async)
      readJsonFileAsync(groupPath, {}).then(async groupDataCaptcha => {
        if (groupDataCaptcha.pendingCaptchas?.[sender]) {
          delete groupDataCaptcha.pendingCaptchas[sender];
          await writeJsonFileAsync(groupPath, groupDataCaptcha);
        }
      }).catch(err => console.error('Erro ao limpar captcha do arquivo:', err));
      
    } catch (err) {
      await reply('❌ Resposta incorreta!');
      console.error('Erro ao recusar após captcha:', err);
    }
  }

  // Interrompe execução pois lidamos com o captcha
  return true;
}
