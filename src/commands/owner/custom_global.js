export default {
  name: "custom_global",
  description: "Gerenciamento global de aliases, noprefix e comandos personalizados",
  commands: ["addalias", "addcmd", "addcmdmedia", "addcmdmidia", "addnopref", "addnoprefix", "adicionarcmd", "delalias", "delcmd", "delnopref", "delnoprefix", "listnopref", "listnoprefix", "removercmd"],
  handle: async ({
    command, reply, q, groupPrefix, from, sender,
    loadCustomCommands, saveCustomCommands,
    addNoPrefix, removeNoPrefix, listNoPrefix,
    addAlias, removeAlias, MESSAGES
  }) => {
    const cmd = command.toLowerCase();

    if (['addnoprefix', 'addnopref'].includes(cmd)) {
      if (!q || !q.includes('/')) return reply(MESSAGES.admin.custom.noPrefAddUsage(groupPrefix, cmd));

      const [trigger, ...targetParts] = q.split('/');
      const target = targetParts.join('/').trim();
      const targetCmd = target.split(' ')[0].toLowerCase();
      const fixedParams = target.split(' ').slice(1).join(' ');

      if (addNoPrefix(trigger.trim(), targetCmd, fixedParams)) {        return reply(MESSAGES.admin.custom.noPrefAddSuccess(trigger.trim(), target));
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
      if (removeNoPrefix(index)) {        return reply(MESSAGES.admin.custom.noPrefDelSuccess);
      }
      return reply(MESSAGES.admin.custom.noPrefDelInvalid);
    }

    if (cmd === 'addalias') {
      if (!q || !q.includes('/')) return reply(MESSAGES.admin.custom.aliasAddUsage(groupPrefix));

      const [alias, target] = q.split('/').map(part => part.trim());
      if (addAlias(alias, target)) {        return reply(MESSAGES.admin.custom.aliasAddSuccess(alias, target));
      }
      return reply(MESSAGES.admin.custom.aliasAddError);
    }

    if (cmd === 'delalias') {
      if (!q) return reply(MESSAGES.admin.custom.aliasDelProvide);
      if (removeAlias(q.trim())) {        return reply(MESSAGES.admin.custom.aliasDelSuccess);
      }
      return reply(MESSAGES.admin.custom.aliasDelNotFound);
    }

    if (['addcmd', 'adicionarcmd', 'addcmdmedia', 'addcmdmidia'].includes(cmd)) {
      if (!q || !q.includes('|')) return reply(MESSAGES.admin.custom.cmdAddUsage(groupPrefix));

      const [trigger, ...resp] = q.split('|').map(part => part.trim());
      const commands = loadCustomCommands();
      commands.push({ trigger, response: resp.join('|'), addedBy: sender });
      saveCustomCommands(commands);
      return reply(MESSAGES.admin.custom.cmdAddSuccess(trigger));
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
