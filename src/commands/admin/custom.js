export default {
  name: "custom",
  description: "Gerenciamento administrativo de auto-respostas e consultas de customizacoes",
  commands: ["addauto", "addautoadm", "addautoadmidia", "addautoadmin", "addautoadmmidia", "addautomedia", "addautomidia", "addautoresponse", "autoresponses", "autorespostas", "comandospersonalizados", "delauto", "delautoadm", "delautoadmin", "delautoresponse", "edcmd", "edcmdmidia", "editcmd", "editcmdmidia", "listalias", "listarcmd", "listauto", "listautoadm", "listautoadmin", "listautoresponses", "listcmd", "testarcmd", "testcmd"],
  handle: async ({
    command, reply, q, isGroup, isOwner, sender, from, groupPrefix,
    loadCustomCommands, loadGroupAutoResponses, saveGroupAutoResponses,
    loadCustomAutoResponses, saveCustomAutoResponses, listAliases, MESSAGES
  }) => {
    const cmd = command.toLowerCase();

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
      }

      const responses = loadGroupAutoResponses(from);
      responses.push({ trigger: trigger.trim(), response: responseText, addedBy: sender });
      saveGroupAutoResponses(from, responses);
      return reply(MESSAGES.admin.custom.autoAddGroupSuccess(trigger.trim()));
    }

    if (['listauto', 'listautoadmin', 'autoresponses', 'autorespostas'].includes(cmd)) {
      const globalResponses = loadCustomAutoResponses();
      const groupResponses = isGroup ? loadGroupAutoResponses(from) : [];

      let msg = MESSAGES.admin.custom.autoListHeader;
      if (globalResponses.length) {
        msg += MESSAGES.admin.custom.autoListGlobal + globalResponses.map((item, index) => `${index + 1}. ${item.trigger}`).join('\n') + '\n\n';
      }
      if (groupResponses.length) {
        msg += MESSAGES.admin.custom.autoListGroup + groupResponses.map((item, index) => `${index + 1}. ${item.trigger}`).join('\n');
      }
      if (!globalResponses.length && !groupResponses.length) return reply(MESSAGES.admin.custom.autoListEmpty);
      return reply(msg);
    }

    if (['listalias', 'listaralias'].includes(cmd)) {
      const aliases = listAliases();
      if (!aliases.length) return reply(MESSAGES.admin.custom.aliasListEmpty);
      return reply(MESSAGES.admin.custom.aliasListHeader + aliases.map((item, index) => `${index + 1}. ${item.alias} -> ${item.command}`).join('\n'));
    }

    if (['listcmd', 'listarcmd', 'comandospersonalizados', 'comandoscustom'].includes(cmd)) {
      const commands = loadCustomCommands();
      if (!commands.length) return reply(MESSAGES.admin.custom.cmdListEmpty);
      return reply(MESSAGES.admin.custom.cmdListHeader + commands.map((item, index) => `${index + 1}. ${item.trigger}`).join('\n'));
    }
  }
};
