export default {
  name: "custom",
  description: "Gerenciamento de comandos personalizados e auto-respostas",
  commands: ["addalias", "addauto", "addautoadm", "addautoadmidia", "addautoadmin", "addautoadmmidia", "addautomedia", "addautomidia", "addautoresponse", "addcmd", "addcmdmedia", "addcmdmidia", "addnopref", "addnoprefix", "adicionarcmd", "autoresponses", "autorespostas", "comandospersonalizados", "delalias", "delauto", "delautoadm", "delautoadmin", "delautoresponse", "delcmd", "delnopref", "delnoprefix", "edcmd", "edcmdmidia", "editcmd", "editcmdmidia", "listalias", "listarcmd", "listauto", "listautoadm", "listautoadmin", "listautoresponses", "listcmd", "listnopref", "listnoprefix", "removercmd", "testarcmd", "testcmd"],
  handle: async ({ 
    bot, from, info, command, args, reply, q, isGroup, isGroupAdmin, isBotAdmin, isOwner,
    pushname, sender, menc_os2, groupData, groupFile, optimizer, prefix, groupPrefix,
    isQuotedImage, isQuotedVideo, isQuotedSticker, isImage, isVideo, isSticker, getFileBuffer, upload,
    loadCustomCommands, saveCustomCommands, loadGroupAutoResponses, saveGroupAutoResponses,
    loadCustomAutoResponses, saveCustomAutoResponses, addNoPrefix, removeNoPrefix, listNoPrefix,
    addAlias, removeAlias, listAliases, MESSAGES 
  }) => {
    const cmd = command.toLowerCase();

    // ==================== AUTO-RESPOSTAS ====================
    if (['addauto', 'addautoadmin', 'addautoresponse'].includes(cmd)) {

      if (!q || !q.includes('/')) return reply(MESSAGES.admin.custom.autoAddUsage(groupPrefix, cmd));
      
      const [trigger, ...respParts] = q.split('/');
      const responseText = respParts.join('/').trim();
      const isGlobal = cmd === 'addauto' && isOwner;
      
      if (isGlobal) {
        const responses = loadCustomAutoResponses();
        responses.push({ trigger: trigger.trim(), response: responseText, addedBy: sender });
        saveCustomAutoResponses(responses);
        return reply(MESSAGES.admin.custom.autoAddGlobalSuccess(trigger.trim()));
      } else {

        const responses = loadGroupAutoResponses(from);
        responses.push({ trigger: trigger.trim(), response: responseText, addedBy: sender });
        saveGroupAutoResponses(from, responses);
        return reply(MESSAGES.admin.custom.autoAddGroupSuccess(trigger.trim()));
      }
    }

    if (['listauto', 'listautoadmin', 'autoresponses', 'autorespostas'].includes(cmd)) {

      const globalResponses = loadCustomAutoResponses();
      const groupResponses = isGroup ? loadGroupAutoResponses(from) : [];
      
      let msg = MESSAGES.admin.custom.autoListHeader;
      if (globalResponses.length) {
        msg += MESSAGES.admin.custom.autoListGlobal + globalResponses.map((r, i) => `${i+1}. ${r.trigger}`).join('\n') + '\n\n';
      }
      if (groupResponses.length) {
        msg += MESSAGES.admin.custom.autoListGroup + groupResponses.map((r, i) => `${i+1}. ${r.trigger}`).join('\n');
      }
      if (!globalResponses.length && !groupResponses.length) return reply(MESSAGES.admin.custom.autoListEmpty);
      return reply(msg);
    }

    // ==================== COMANDOS SEM PREFIXO (NOPREFIX) ====================
    if (['addnoprefix', 'addnopref'].includes(cmd)) {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      if (!q || !q.includes('/')) return reply(MESSAGES.admin.custom.noPrefAddUsage(groupPrefix, cmd));
      
      const [trigger, ...targetParts] = q.split('/');
      const target = targetParts.join('/').trim();
      const targetCmd = target.split(' ')[0].toLowerCase();
      const fixedParams = target.split(' ').slice(1).join(' ');

      if (addNoPrefix(trigger.trim(), targetCmd, fixedParams)) {
        optimizer.clearStatic(`noprefix:${from}`);
        return reply(MESSAGES.admin.custom.noPrefAddSuccess(trigger.trim(), target));
      }
      return reply(MESSAGES.admin.custom.noPrefAddError);
    }

    if (['listnoprefix', 'listnopref'].includes(cmd)) {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      const list = listNoPrefix();
      if (!list.length) return reply(MESSAGES.admin.custom.noPrefListEmpty);
      
      let msg = MESSAGES.admin.custom.noPrefListHeader;
      list.forEach((item, i) => {
        msg += `${i + 1}. ${item.trigger} ➔ ${item.command}${item.fixedParams ? ' ' + item.fixedParams : ''}\n`;
      });
      return reply(msg);
    }

    if (['delnoprefix', 'delnopref'].includes(cmd)) {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      if (!q || isNaN(q)) return reply(MESSAGES.admin.custom.noPrefDelUsage(groupPrefix, cmd));
      
      const index = parseInt(q) - 1;
      if (removeNoPrefix(index)) {
        optimizer.clearStatic(`noprefix:${from}`);
        return reply(MESSAGES.admin.custom.noPrefDelSuccess);
      }
      return reply(MESSAGES.admin.custom.noPrefDelInvalid);
    }

    // ==================== APELIDOS (ALIAS) ====================
    if (['addalias'].includes(cmd)) {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      if (!q || !q.includes('/')) return reply(MESSAGES.admin.custom.aliasAddUsage(groupPrefix));
      
      const [alias, target] = q.split('/').map(p => p.trim());
      if (addAlias(alias, target)) {
        optimizer.clearStatic('aliases:global');
        return reply(MESSAGES.admin.custom.aliasAddSuccess(alias, target));
      }
      return reply(MESSAGES.admin.custom.aliasAddError);
    }

    if (['listalias', 'listaralias'].includes(cmd)) {
      const aliases = listAliases();
      if (!aliases.length) return reply(MESSAGES.admin.custom.aliasListEmpty);
      return reply(MESSAGES.admin.custom.aliasListHeader + aliases.map((a, i) => `${i+1}. ${a.alias} ➔ ${a.command}`).join('\n'));
    }

    if (['delalias'].includes(cmd)) {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      if (!q) return reply(MESSAGES.admin.custom.aliasDelProvide);
      if (removeAlias(q.trim())) {
        optimizer.clearStatic('aliases:global');
        return reply(MESSAGES.admin.custom.aliasDelSuccess);
      }
      return reply(MESSAGES.admin.custom.aliasDelNotFound);
    }

    // ==================== COMANDOS PERSONALIZADOS (CUSTOM CMD) ====================
    if (['addcmd', 'adicionarcmd'].includes(cmd)) {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      if (!q || !q.includes('|')) return reply(MESSAGES.admin.custom.cmdAddUsage(groupPrefix));
      
      const [trigger, ...resp] = q.split('|').map(p => p.trim());
      const commands = loadCustomCommands();
      commands.push({ trigger, response: resp.join('|'), addedBy: sender });
      saveCustomCommands(commands);
      return reply(MESSAGES.admin.custom.cmdAddSuccess(trigger));
    }

    if (['listcmd', 'comandoscustom'].includes(cmd)) {
      const commands = loadCustomCommands();
      if (!commands.length) return reply(MESSAGES.admin.custom.cmdListEmpty);
      return reply(MESSAGES.admin.custom.cmdListHeader + commands.map((c, i) => `${i+1}. ${c.trigger}`).join('\n'));
    }

    if (['delcmd'].includes(cmd)) {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      if (!q) return reply(MESSAGES.admin.custom.cmdDelProvide);
      const commands = loadCustomCommands();
      const filtered = commands.filter(c => c.trigger !== q.trim());
      if (filtered.length === commands.length) return reply(MESSAGES.admin.custom.cmdDelNotFound);
      saveCustomCommands(filtered);
      return reply(MESSAGES.admin.custom.cmdDelSuccess);
    }
  }
};
