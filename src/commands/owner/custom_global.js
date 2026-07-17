export default {
  name: "custom_global",
  description: "Gerenciamento global de aliases, noprefix e comandos personalizados",
  commands: ["addalias", "addcmd", "addcmdmedia", "addcmdmidia", "addnopref", "addnoprefix", "adicionarcmd", "delalias", "delcmd", "delnopref", "delnoprefix", "listnopref", "listnoprefix", "removercmd"],
  handle: async ({
    command, reply, q, groupPrefix, from, sender,
    loadCustomCommands, saveCustomCommands,
    addNoPrefix, removeNoPrefix, listNoPrefix,
    addAlias, removeAlias, MESSAGES,
    quotedMessageContent, getFileBuffer,
    parseCustomCommandMeta, buildUsageFromParams,
    normalizar, findCustomCommand
  }) => {
    const cmd = command.toLowerCase();

    if (['addnoprefix', 'addnopref'].includes(cmd)) {
      if (!q || !q.includes('/')) return reply(MESSAGES.admin.custom.noPrefAddUsage(groupPrefix, cmd));

      const [trigger, ...targetParts] = q.split('/');
      const target = targetParts.join('/').trim();
      const targetCmd = target.split(' ')[0].toLowerCase();
      const fixedParams = target.split(' ').slice(1).join(' ');

      if (addNoPrefix(trigger.trim(), targetCmd, fixedParams)) {        return reply(MESSAGES.admin.custom.noPrefAddSuccess(trigger.trim(), target));
      }
      return reply(MESSAGES.admin.custom.noPrefAddError);
    }

    if (['listnoprefix', 'listnopref'].includes(cmd)) {
      const items = listNoPrefix();
      if (!items.length) return reply(MESSAGES.admin.custom.noPrefListEmpty);

      let msg = MESSAGES.admin.custom.noPrefListHeader;
      items.forEach((item, index) => {
        msg += `${index + 1}. ${item.trigger} -> ${item.command}${item.fixedParams ? ' ' + item.fixedParams : ''}\n`;
      });
      return reply(msg);
    }

    if (['delnoprefix', 'delnopref'].includes(cmd)) {
      if (!q || Number.isNaN(Number(q))) return reply(MESSAGES.admin.custom.noPrefDelUsage(groupPrefix, cmd));

      const index = parseInt(q, 10) - 1;
      if (removeNoPrefix(index)) {        return reply(MESSAGES.admin.custom.noPrefDelSuccess);
      }
      return reply(MESSAGES.admin.custom.noPrefDelInvalid);
    }

    if (cmd === 'addalias') {
      if (!q || !q.includes('/')) return reply(MESSAGES.admin.custom.aliasAddUsage(groupPrefix));

      const [alias, target] = q.split('/').map(part => part.trim());
      if (addAlias(alias, target)) {        return reply(MESSAGES.admin.custom.aliasAddSuccess(alias, target));
      }
      return reply(MESSAGES.admin.custom.aliasAddError);
    }

    if (cmd === 'delalias') {
      if (!q) return reply(MESSAGES.admin.custom.aliasDelProvide);
      if (removeAlias(q.trim())) {        return reply(MESSAGES.admin.custom.aliasDelSuccess);
      }
      return reply(MESSAGES.admin.custom.aliasDelNotFound);
    }

    if (['addcmd', 'adicionarcmd'].includes(cmd)) {
      if (!q) return reply(`Uso: ${groupPrefix}${cmd} <comando> [meta...] <resposta>\nExemplo: ${groupPrefix}${cmd} saudacao [admin] Olá {user}!`);

      const allTokens = q.trim().split(/ +/);
      const trigger = allTokens.shift();
      if (!trigger) return reply(`Uso: ${groupPrefix}${cmd} <comando> [meta...] <resposta>`);

      const normalizedTrigger = normalizar(trigger).replace(/\s+/g, '');
      const existingCmd = findCustomCommand(normalizedTrigger);
      if (existingCmd) {
        return reply(`❌ Já existe um comando com o gatilho "${trigger}".\nUse ${groupPrefix}removercmd ${trigger} para removê-lo primeiro.`);
      }

      const parsed = parseCustomCommandMeta(allTokens);
      const settings = parsed.settings || {};
      const responseText = parsed.rest.join(' ');

      if (!responseText) {
        return reply(`❌ Por favor, insira a resposta do comando.\nUso: ${groupPrefix}${cmd} <comando> [meta...] <resposta>`);
      }

      const usage = buildUsageFromParams(trigger, settings.params || []);
      const commands = loadCustomCommands();
      const filtered = commands.filter(item => item.trigger !== trigger);
      filtered.push({
        id: Date.now().toString(),
        trigger: normalizedTrigger,
        response: responseText,
        createdAt: new Date().toISOString(),
        createdBy: sender,
        settings: settings,
        usage: usage
      });

      saveCustomCommands(filtered);

      const flagList = [];
      if (settings.ownerOnly) flagList.push('Dono');
      if (settings.adminOnly) flagList.push('Admin');
      if (settings.context === 'group') flagList.push('Grupo');
      if (settings.context === 'private') flagList.push('Privado');
      const flagsStr = flagList.length ? `\n*Flags:* ${flagList.join(', ')}` : '';
      const usageStr = usage ? `\n*Uso:* ${usage}` : '';

      return reply(`✅ Comando personalizado criado!\n\n*Gatilho:* ${trigger}\n*Resposta:* ${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}${flagsStr}${usageStr}\n\n_Digite "${trigger}" para testar!_`);
    }

    if (['addcmdmedia', 'addcmdmidia'].includes(cmd)) {
      if (!q) {
        return reply(`📝 *Como usar o comando addcmdmidia:*\n\n1️⃣ Responda uma mídia (imagem, vídeo, áudio ou figurinha)\n2️⃣ Use: ${groupPrefix}${cmd} <comando> [meta...] <legenda opcional>\n\n*Exemplo:*\n${groupPrefix}${cmd} logo [private] [param:string:filename:optional] Minha Legenda`);
      }

      const allTokens = q.trim().split(/ +/);
      const trigger = allTokens.shift();
      if (!trigger) {
        return reply(`❌ Por favor, informe o nome do comando.`);
      }

      const normalizedTrigger = normalizar(trigger).replace(/\s+/g, '');
      const existingCmd = findCustomCommand(normalizedTrigger);
      if (existingCmd) {
        return reply(`❌ Já existe um comando com o gatilho "${trigger}".\nUse ${groupPrefix}removercmd ${trigger} para removê-lo primeiro.`);
      }

      const parsed = parseCustomCommandMeta(allTokens);
      const settings = parsed.settings || {};
      const caption = parsed.rest.join(' ') || '';

      let responseData = null;

      // Verificar se respondeu uma mídia
      if (quotedMessageContent) {
        if (quotedMessageContent.imageMessage) {
          const imageBuffer = await getFileBuffer(quotedMessageContent.imageMessage, 'image');
          if (imageBuffer) {
            responseData = {
              type: 'image',
              buffer: imageBuffer.toString('base64'),
              caption: caption
            };
          }
        } else if (quotedMessageContent.videoMessage) {
          const videoBuffer = await getFileBuffer(quotedMessageContent.videoMessage, 'video');
          if (videoBuffer) {
            responseData = {
              type: 'video',
              buffer: videoBuffer.toString('base64'),
              caption: caption
            };
          }
        } else if (quotedMessageContent.audioMessage) {
          const audioBuffer = await getFileBuffer(quotedMessageContent.audioMessage, 'audio');
          if (audioBuffer) {
            responseData = {
              type: 'audio',
              buffer: audioBuffer.toString('base64'),
              ptt: quotedMessageContent.audioMessage.ptt || false
            };
          }
        } else if (quotedMessageContent.stickerMessage) {
          const stickerBuffer = await getFileBuffer(quotedMessageContent.stickerMessage, 'sticker');
          if (stickerBuffer) {
            responseData = {
              type: 'sticker',
              buffer: stickerBuffer.toString('base64')
            };
          }
        } else {
          return reply('❌ Por favor, responda a uma mídia válida (imagem, vídeo, áudio ou sticker)!');
        }
      } else {
        return reply('❌ Por favor, responda a uma mídia para adicionar como comando!');
      }

      if (!responseData) {
        return reply('❌ Não foi possível obter o arquivo de mídia. Verifique se ele ainda está disponível.');
      }

      await reply('⏳ Baixando e processando mídia, aguarde...');

      const usage = buildUsageFromParams(trigger, settings.params || []);
      const commands = loadCustomCommands();
      const filtered = commands.filter(item => item.trigger !== trigger);
      filtered.push({
        id: Date.now().toString(),
        trigger: normalizedTrigger,
        response: responseData,
        createdAt: new Date().toISOString(),
        createdBy: sender,
        settings: settings,
        usage: usage
      });

      saveCustomCommands(filtered);

      const flagList = [];
      if (settings.ownerOnly) flagList.push('Dono');
      if (settings.adminOnly) flagList.push('Admin');
      if (settings.context === 'group') flagList.push('Grupo');
      if (settings.context === 'private') flagList.push('Privado');
      const flagsStr = flagList.length ? `\n*Flags:* ${flagList.join(', ')}` : '';
      const usageStr = usage ? `\n*Uso:* ${usage}` : '';

      return reply(`✅ Comando personalizado com mídia criado!\n\n*Gatilho:* ${trigger}\n*Tipo:* ${responseData.type}\n${caption ? `*Legenda:* ${caption}\n` : ''}${flagsStr}${usageStr}\n\n_Digite "${trigger}" para testar!_`);
    }

    if (['delcmd', 'removercmd'].includes(cmd)) {
      if (!q) return reply(MESSAGES.admin.custom.cmdDelProvide);
      const commands = loadCustomCommands();
      const filtered = commands.filter(item => item.trigger !== q.trim());
      if (filtered.length === commands.length) return reply(MESSAGES.admin.custom.cmdDelNotFound);
      saveCustomCommands(filtered);
      return reply(MESSAGES.admin.custom.cmdDelSuccess);
    }
  }
};
