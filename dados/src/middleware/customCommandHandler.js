// ==================== HANDLER DE COMANDOS PERSONALIZADOS ====================
// Extraído do index.js - Processa comandos sem prefixo e comandos custom do dono.

import { normalizar } from '../utils/helpers.js';
import { loadNoPrefixCommands, findCustomCommand } from '../utils/database.js';
import { parseArgsFromString, escapeRegExp, buildUsageFromParams, validateParamValue } from '../utils/helpers.js';

export async function handleCustomCommand(ctx) {
  const {
    isGroup, isOwner, isGroupAdmin, isOnlyAdmin, body, budy2,
    from, groupPrefix, nomedono, numerodono, nomebot, pushname,
    groupName, groupMetadata, quotedMessageContent, menc_os2,
    info, reply, nazu, getUserName, optimizer, args, q
  } = ctx;
  let { isCmd, command } = ctx;

  // === COMANDOS SEM PREFIXO ===
  if (!isCmd) {
    if (isGroup && isOnlyAdmin && !isGroupAdmin && !isOwner) return false;
    
    const noPrefixCommands = await optimizer.memoize(
      `noprefix:${from}`, () => Promise.resolve(loadNoPrefixCommands()), 10000
    );
    const splitRegex = optimizer.getRegex('commandSplit') || /\s+/;
    const firstWord = budy2.split(splitRegex)[0]?.trim();
    const matchedCommand = noPrefixCommands.find(item => firstWord === item.trigger);
    
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
  const normalizedTrigger = optimizer.normalizeCommand(command) || normalizar(command);
  const customCmd = await optimizer.memoize(
    `customcmd:${from}:${normalizedTrigger}`, () => Promise.resolve(findCustomCommand(normalizedTrigger)), 5000
  );
  
  if (!customCmd) return false;

  try {
    const responseData = customCmd.response;
    const settings = customCmd.settings || {};

    // Verificações de permissão
    if (settings.ownerOnly && !isOwner) { await reply('🚫 Este comando só pode ser usado pelo dono do bot.'); return true; }
    if (settings.adminOnly && !isGroup) { await reply('🚫 Este comando só pode ser usado por admins (em grupos).'); return true; }
    if (settings.adminOnly && isGroup && !isGroupAdmin) { await reply('🚫 Este comando só pode ser usado por admins.'); return true; }
    if (settings.context === 'group' && !isGroup) { await reply('⚠️ Comando restrito a grupos.'); return true; }
    if (settings.context === 'private' && isGroup) { await reply('⚠️ Comando restrito ao privado.'); return true; }

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
          if (!check.ok) { await reply(`❌ Parâmetro inválido: ${check.message}`); return true; }
        }
      }
      if (missing.length) {
        const usage = customCmd.usage || buildUsageFromParams(customCmd.trigger, settings.params);
        await reply(`❌ Parâmetros ausentes: ${missing.join(', ')}\nUso: ${usage}`);
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
            try { processedResponse = processedResponse.replace(new RegExp('\\{' + escapeRegExp(nm) + '\\}', 'gi'), val); } catch (e) {}
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
      await nazu.sendMessage(from, { image: Buffer.from(processedResponse.buffer, 'base64'), caption: processedResponse.caption || '' }, { quoted: info });
    } else if (processedResponse?.type === 'video' && processedResponse.buffer) {
      await nazu.sendMessage(from, { video: Buffer.from(processedResponse.buffer, 'base64'), caption: processedResponse.caption || '' }, { quoted: info });
    } else if (processedResponse?.type === 'audio' && processedResponse.buffer) {
      await nazu.sendMessage(from, { audio: Buffer.from(processedResponse.buffer, 'base64'), mimetype: 'audio/mp4', ptt: processedResponse.ptt || false }, { quoted: info });
    } else if (processedResponse?.type === 'sticker' && processedResponse.buffer) {
      await nazu.sendMessage(from, { sticker: Buffer.from(processedResponse.buffer, 'base64') }, { quoted: info });
    } else if (processedResponse?.type === 'text') {
      await reply(processedResponse.content || 'Resposta personalizada');
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao executar comando personalizado:', error);
    await reply('❌ Erro ao executar comando personalizado.');
    return true;
  }
}
