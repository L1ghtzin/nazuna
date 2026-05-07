export default {
  name: "custom",
  description: "Gerenciamento de comandos personalizados e auto-respostas",
  commands: ["addalias", "addauto", "addautoadm", "addautoadmidia", "addautoadmin", "addautoadmmidia", "addautomedia", "addautomidia", "addautoresponse", "addcmd", "addcmdmedia", "addcmdmidia", "addnopref", "addnoprefix", "adicionarcmd", "autoresponses", "autorespostas", "comandospersonalizados", "delalias", "delauto", "delautoadm", "delautoadmin", "delautoresponse", "delcmd", "delnopref", "delnoprefix", "edcmd", "edcmdmidia", "editcmd", "editcmdmidia", "listalias", "listarcmd", "listauto", "listautoadm", "listautoadmin", "listautoresponses", "listcmd", "listnopref", "listnoprefix", "removercmd", "testarcmd", "testcmd"],
  handle: async ({ 
    nazu, from, info, command, args, reply, q, isGroup, isGroupAdmin, isBotAdmin, isOwner,
    pushname, sender, menc_os2, groupData, groupFile, optimizer, prefix, groupPrefix,
    isQuotedImage, isQuotedVideo, isQuotedSticker, isImage, isVideo, isSticker, getFileBuffer, upload,
    loadCustomCommands, saveCustomCommands, loadGroupAutoResponses, saveGroupAutoResponses,
    loadCustomAutoResponses, saveCustomAutoResponses, addNoPrefix, removeNoPrefix, listNoPrefix,
    addAlias, removeAlias, listAliases, MESSAGES 
  }) => {
    const cmd = command.toLowerCase();

    // ==================== AUTO-RESPOSTAS ====================
    if (['addauto', 'addautoadmin', 'addautoresponse'].includes(cmd)) {
      if (!isGroupAdmin && !isOwner) return reply(MESSAGES.permission.adminOnly);
      if (!q || !q.includes('/')) return reply(`Uso: ${groupPrefix}${cmd} trigger/resposta`);
      
      const [trigger, ...respParts] = q.split('/');
      const responseText = respParts.join('/').trim();
      const isGlobal = cmd === 'addauto' && isOwner;
      
      if (isGlobal) {
        const responses = loadCustomAutoResponses();
        responses.push({ trigger: trigger.trim(), response: responseText, addedBy: sender });
        saveCustomAutoResponses(responses);
        return reply(`✅ Auto-resposta global '${trigger.trim()}' adicionada!`);
      } else {
        if (!isGroup) return reply("Comando para grupos 💔");
        const responses = loadGroupAutoResponses(from);
        responses.push({ trigger: trigger.trim(), response: responseText, addedBy: sender });
        saveGroupAutoResponses(from, responses);
        return reply(`✅ Auto-resposta do grupo '${trigger.trim()}' adicionada!`);
      }
    }

    if (['listauto', 'listautoadmin', 'autoresponses', 'autorespostas'].includes(cmd)) {
      if (!isGroupAdmin && !isOwner) return reply(MESSAGES.permission.adminOnly);
      const globalResponses = loadCustomAutoResponses();
      const groupResponses = isGroup ? loadGroupAutoResponses(from) : [];
      
      let msg = `📋 *AUTO-RESPOSTAS*\n\n`;
      if (globalResponses.length) {
        msg += `🌍 *Globais:*\n` + globalResponses.map((r, i) => `${i+1}. ${r.trigger}`).join('\n') + '\n\n';
      }
      if (groupResponses.length) {
        msg += `👥 *Do Grupo:*\n` + groupResponses.map((r, i) => `${i+1}. ${r.trigger}`).join('\n');
      }
      if (!globalResponses.length && !groupResponses.length) return reply("📪 Nenhuma cadastrada.");
      return reply(msg);
    }

    // ==================== COMANDOS SEM PREFIXO (NOPREFIX) ====================
    if (['addnoprefix', 'addnopref'].includes(cmd)) {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      if (!q || !q.includes('/')) return reply(`Uso: ${groupPrefix}${cmd} trigger/comando\nEx: menu/menu`);
      
      const [trigger, ...targetParts] = q.split('/');
      const target = targetParts.join('/').trim();
      const targetCmd = target.split(' ')[0].toLowerCase();
      const fixedParams = target.split(' ').slice(1).join(' ');

      if (addNoPrefix(trigger.trim(), targetCmd, fixedParams)) {
        optimizer.clearStatic(`noprefix:${from}`);
        return reply(`✅ NoPrefix '${trigger.trim()}' -> '${target}' adicionado!`);
      }
      return reply("❌ Erro ao salvar.");
    }

    if (['listnoprefix', 'listnopref'].includes(cmd)) {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      const list = listNoPrefix();
      if (!list.length) return reply("📜 Nenhum comando NoPrefix cadastrado.");
      
      let msg = `📋 *COMANDOS SEM PREFIXO*\n\n`;
      list.forEach((item, i) => {
        msg += `${i + 1}. ${item.trigger} ➔ ${item.command}${item.fixedParams ? ' ' + item.fixedParams : ''}\n`;
      });
      return reply(msg);
    }

    if (['delnoprefix', 'delnopref'].includes(cmd)) {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      if (!q || isNaN(q)) return reply(`Uso: ${groupPrefix}${cmd} [número]`);
      
      const index = parseInt(q) - 1;
      if (removeNoPrefix(index)) {
        optimizer.clearStatic(`noprefix:${from}`);
        return reply("✅ NoPrefix removido.");
      }
      return reply("❌ Posição inválida.");
    }

    // ==================== APELIDOS (ALIAS) ====================
    if (['addalias'].includes(cmd)) {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      if (!q || !q.includes('/')) return reply(`Uso: ${groupPrefix}addalias apelido/comando`);
      
      const [alias, target] = q.split('/').map(p => p.trim());
      if (addAlias(alias, target)) {
        optimizer.clearStatic('aliases:global');
        return reply(`✅ Alias '${alias}' -> '${target}' adicionado!`);
      }
      return reply("❌ Erro ao salvar.");
    }

    if (['listalias', 'listaralias'].includes(cmd)) {
      const aliases = listAliases();
      if (!aliases.length) return reply("📜 Nenhum alias cadastrado.");
      return reply(`📋 *APELIDOS DE COMANDOS*\n\n` + aliases.map((a, i) => `${i+1}. ${a.alias} ➔ ${a.command}`).join('\n'));
    }

    if (['delalias'].includes(cmd)) {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      if (!q) return reply("Informe o alias.");
      if (removeAlias(q.trim())) {
        optimizer.clearStatic('aliases:global');
        return reply("✅ Alias removido.");
      }
      return reply("❌ Não encontrado.");
    }

    // ==================== COMANDOS PERSONALIZADOS (CUSTOM CMD) ====================
    if (['addcmd', 'adicionarcmd'].includes(cmd)) {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      if (!q || !q.includes('|')) return reply(`Uso: ${groupPrefix}addcmd trigger | resposta`);
      
      const [trigger, ...resp] = q.split('|').map(p => p.trim());
      const commands = loadCustomCommands();
      commands.push({ trigger, response: resp.join('|'), addedBy: sender });
      saveCustomCommands(commands);
      return reply(`✅ Comando personalizado '${trigger}' adicionado!`);
    }

    if (['listcmd', 'comandoscustom'].includes(cmd)) {
      const commands = loadCustomCommands();
      if (!commands.length) return reply("📪 Sem comandos personalizados.");
      return reply(`📋 *COMANDOS PERSONALIZADOS*\n\n` + commands.map((c, i) => `${i+1}. ${c.trigger}`).join('\n'));
    }

    if (['delcmd'].includes(cmd)) {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      if (!q) return reply("Informe o trigger.");
      const commands = loadCustomCommands();
      const filtered = commands.filter(c => c.trigger !== q.trim());
      if (filtered.length === commands.length) return reply("❌ Não encontrado.");
      saveCustomCommands(filtered);
      return reply("✅ Removido.");
    }
  }
};
