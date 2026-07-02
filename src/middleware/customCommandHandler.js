// ==================== HANDLER DE COMANDOS PERSONALIZADOS ====================
// Extraído do index.js - Processa comandos sem prefixo e comandos custom do dono.

import { normalizar } from '../utils/helpers.js';
import { loadNoPrefixCommands, findCustomCommand } from '../utils/database.js';
import { parseArgsFromString, escapeRegExp, buildUsageFromParams, validateParamValue } from '../utils/helpers.js';

const normalizeCommand = (cmd) => {
  if (!cmd || typeof cmd !== 'string') return '';
  const prefixRegex = /^[!\.\/#\$\%\&\*\+\-\.\:\;\<\=\>\?\@\[\]\^\_\{\}\|\\]/;
  if (prefixRegex.test(cmd)) {
    cmd = cmd.substring(1);
  }
  return cmd.toLowerCase().trim();
};

export async function handleCustomCommand(ctx) {
  const {
    isGroup, isOwner, isGroupAdmin, isOnlyAdmin, body, budy2,
    from, groupPrefix, nomedono, numerodono, nomebot, pushname,
    groupName, groupMetadata, quotedMessageContent, menc_os2,
    info, reply, bot, getUserName, args, q, MESSAGES
  } = ctx;
  let { isCmd, command } = ctx;

  // === COMANDOS SEM PREFIXO ===
  if (!isCmd) {
    if (isGroup && isOnlyAdmin && !isGroupAdmin && !isOwner) return false;
    
    const noPrefixCommands = loadNoPrefixCommands();
    const splitRegex = /\s+/;
    const firstWord = budy2.split(splitRegex)[0]?.trim();
    const matchedCommand = noPrefixCommands.find(item => firstWord === (normalizeCommand(item.trigger) || normalizar(item.trigger)));
    
    if (!matchedCommand) return false;
    
    command = matchedCommand.command;
    isCmd = true;
    ctx.command = command;
    ctx.isCmd = true;
    const bodyParts = body.trim().split(/ +/);
    const dynamicArgs = bodyParts.slice(1);
    const fixedParams = matchedCommand.fixedParams || '';
    const allParams = fixedParams ? (fixedParams + (dynamicArgs.length > 0 ? ' ' + dynamicArgs.join(' ') : '')) : dynamicArgs.join(' ');
    ctx.args.length = 0;
    if (allParams) ctx.args.push(...allParams.split(/ +/));
    ctx.q = allParams;
  }

  if (!isCmd || !command) return false;

  // === COMANDOS PERSONALIZADOS DO DONO ===
  const normalizedTrigger = normalizeCommand(command) || normalizar(command);
  const customCmd = findCustomCommand(normalizedTrigger);
  
  if (!customCmd) return false;

  try {
    const responseData = customCmd.response;
    const settings = customCmd.settings || {};

    // Verificações de permissão
    if (settings.ownerOnly && !isOwner) { await reply(MESSAGES.middleware.customCommand.ownerOnly); return true; }
    if (settings.adminOnly && !isGroup) { await reply(MESSAGES.middleware.customCommand.adminOnlyGroup); return true; }
    if (settings.adminOnly && isGroup && !isGroupAdmin) { await reply(MESSAGES.middleware.customCommand.adminOnly); return true; }
    if (settings.context === 'group' && !isGroup) { await reply(MESSAGES.middleware.customCommand.groupOnly); return true; }
    if (settings.context === 'private' && isGroup) { await reply(MESSAGES.middleware.customCommand.privateOnly); return true; }

    // Processar parâmetros
    const allArgs = ctx.q || '';
    let argsList = parseArgsFromString(allArgs);
    
    if (Array.isArray(settings.params) && settings.params.length) {
      const restIndex = settings.params.findIndex(p => p.rest);
      if (restIndex !== -1 && argsList.length > restIndex) {
        const restVal = argsList.slice(restIndex).join(' ');
        argsList = argsList.slice(0, restIndex);
        argsList[restIndex] = restVal;
      }
      const missing = [];
      for (let i = 0; i < settings.params.length; i++) {
        const p = settings.params[i];
        let val = argsList[i] !== undefined ? argsList[i] : '';
        if ((val === '' || val === undefined) && p.default !== undefined) { val = p.default; argsList[i] = val; }
        if (p.required && (val === undefined || val === '')) missing.push(p.name);
        if (val !== undefined && val !== '') {
          const check = validateParamValue(val, p);
          if (!check.ok) { await reply(MESSAGES.middleware.customCommand.invalidParam(check.message)); return true; }
        }
      }
      if (missing.length) {
        const usage = customCmd.usage || buildUsageFromParams(customCmd.trigger, settings.params);
        await reply(MESSAGES.middleware.customCommand.missingParams(missing.join(', '), usage));
        return true;
      }
    }

    // Processar resposta
    let processedResponse = responseData;
    if (typeof processedResponse === 'string') {
      processedResponse = processedResponse
        .replace(/{prefixo}/gi, groupPrefix).replace(/{prefix}/gi, groupPrefix)
        .replace(/{nomedono}/gi, nomedono).replace(/{numerodono}/gi, numerodono)
        .replace(/{nomebot}/gi, nomebot).replace(/{user}/gi, pushname || 'Usuário')
        .replace(/{grupo}/gi, isGroup ? groupName : 'Privado')
        .replace(/\{(?:args|all)\}/gi, allArgs)
        .replace(/\{(\d+)\}/g, (m, idx) => argsList[parseInt(idx, 10) - 1] || '');
      
      if (Array.isArray(settings.params)) {
        for (let i = 0; i < settings.params.length; i++) {
          const nm = settings.params[i].name;
          const val = argsList[i] || '';
          if (val) {
            try { processedResponse = processedResponse.replace(new RegExp('\\{' + escapeRegExp(nm) + '\\}', 'gi'), val); } catch (e) { console.error('Error replacing param in custom cmd:', e); }
          }
        }
      }
      
      const mentionedJids = info.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      let mentions = Array.isArray(mentionedJids) ? mentionedJids : [];
      if (!mentions.length && menc_os2) mentions = [menc_os2];
      const mentionText = mentions.map(m => '@' + getUserName(m)).join(' ');
      processedResponse = processedResponse.replace(/\{mention\}/gi, mentionText).replace(/\{mentions\}/gi, mentionText);
      
      const quotedText = quotedMessageContent?.conversation || quotedMessageContent?.extendedTextMessage?.text || '';
      processedResponse = processedResponse.replace(/\{quoted\}/gi, quotedText);
      
      await reply(processedResponse, { mentions });
    } else if (processedResponse?.type === 'image' && processedResponse.buffer) {
      await bot.sendMessage(from, { image: Buffer.from(processedResponse.buffer, 'base64'), caption: processedResponse.caption || '' }, { quoted: info });
    } else if (processedResponse?.type === 'video' && processedResponse.buffer) {
      await bot.sendMessage(from, { video: Buffer.from(processedResponse.buffer, 'base64'), caption: processedResponse.caption || '' }, { quoted: info });
    } else if (processedResponse?.type === 'audio' && processedResponse.buffer) {
      await bot.sendMessage(from, { audio: Buffer.from(processedResponse.buffer, 'base64'), mimetype: 'audio/mp4', ptt: processedResponse.ptt || false }, { quoted: info });
    } else if (processedResponse?.type === 'sticker' && processedResponse.buffer) {
      await bot.sendMessage(from, { sticker: Buffer.from(processedResponse.buffer, 'base64') }, { quoted: info });
    } else if (processedResponse?.type === 'text') {
      await reply(processedResponse.content || 'Resposta personalizada');
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao executar comando personalizado:', error);
    await reply(MESSAGES.middleware.customCommand.executionError);
    return true;
  }
}
