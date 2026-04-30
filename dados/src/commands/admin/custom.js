export default {
  name: "custom",
  description: "Gerenciamento de comandos personalizados e auto-respostas",
  commands: ["addalias", "addauto", "addautoadm", "addautoadmidia", "addautoadmin", "addautoadmmidia", "addautomedia", "addautomidia", "addautoresponse", "addcmd", "addcmdmedia", "addcmdmidia", "addnopref", "addnoprefix", "adicionarcmd", "autoresponses", "autorespostas", "comandospersonalizados", "delalias", "delauto", "delautoadm", "delautoadmin", "delautoresponse", "delcmd", "delnopref", "delnoprefix", "edcmd", "edcmdmidia", "editcmd", "editcmdmidia", "listalias", "listarcmd", "listauto", "listautoadm", "listautoadmin", "listautoresponses", "listcmd", "listnopref", "listnoprefix", "removercmd", "testarcmd", "testcmd"],
  handle: async ({ 
    nazu, from, info, command, args, reply, q, isGroup, isGroupAdmin, isBotAdmin, isOwner,
    pushname, sender, menc_os2, groupData, groupFile, optimizer,
    isQuotedImage, isQuotedVideo, isQuotedSticker, isImage, isVideo, isSticker, getFileBuffer, upload,
    loadCustomCommands, saveCustomCommands, loadAutoResponses, saveAutoResponses
  , MESSAGES }) => {
    const cmd = command.toLowerCase();

    // 🤖 AUTO-RESPOSTAS
    if (['addauto', 'addautoadm', 'addautoadmin', 'addautoresponse', 'addautoresposta', 'addautoresp'].includes(cmd)) {
      if (!isGroup) return reply("Grupo apenas 💔");
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      const isAdmOnly = ['addautoadm', 'addautoadmin'].includes(cmd);
      if (!q) return reply(`Uso: ${prefix}${cmd} trigger | resposta`);
      const [trigger, ...resp] = q.split('|').map(p => p.trim());
      if (!trigger || !resp.length) return reply("Trigger e resposta são obrigatórios.");
      const responses = loadAutoResponses(from);
      responses[trigger] = { text: resp.join('|'), admOnly: isAdmOnly, addedBy: sender };
      saveAutoResponses(from, responses);
      return reply(`✅ Auto-resposta '${trigger}' adicionada!`);
    }

    if (['listauto', 'listautoadm', 'listautoadmin', 'listautoresponses', 'listautoresposta', 'listautoresp', 'autoresponses', 'autorespostas'].includes(cmd)) {
      if (!isGroupAdmin && !isOwner) return reply(MESSAGES.permission.adminOnly);
      const responses = loadAutoResponses(from);
      const keys = Object.keys(responses);
      if (!keys.length) return reply("📪 Sem auto-respostas.");
      return reply(`📋 *AUTO-RESPOSTAS*\n\n` + keys.map(k => `• ${k}${responses[k].admOnly ? ' (Admin)' : ''}`).join('\n'));
    }

    if (['delauto', 'delautoadm', 'delautoadmin', 'delautoresponse', 'delautoresposta', 'delautoresp', 'rmautoresposta', 'rmautoresp'].includes(cmd)) {
      if (!isGroup) return reply("Grupo apenas 💔");
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!q) return reply("Informe o trigger.");
      const responses = loadAutoResponses(from);
      if (!responses[q.trim()]) return reply("Não encontrado.");
      delete responses[q.trim()];
      saveAutoResponses(from, responses);
      return reply("✅ Removida.");
    }

    // 🛠️ COMANDOS PERSONALIZADOS
    if (['addcmd', 'adicionarcmd', 'addcmdmidia', 'addcmdmedia'].includes(cmd)) {
      if (!isGroup) return reply("Grupo apenas 💔");
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!q) return reply("Uso: addcmd trigger | resposta");
      const [trigger, ...resp] = q.split('|').map(p => p.trim());
      const commands = loadCustomCommands(from);
      commands[trigger] = { text: resp.join('|'), addedBy: sender };
      saveCustomCommands(from, commands);
      return reply(`✅ Comando '${trigger}' adicionado!`);
    }

    if (['listcmd', 'listarcmd', 'listacmd', 'listarcustom', 'listarcustoms', 'comandoscustom', 'cmds', 'customs', 'comandospersonalizados'].includes(cmd)) {
      const commands = loadCustomCommands(from);
      const keys = Object.keys(commands);
      if (!keys.length) return reply("📪 Sem comandos personalizados.");
      return reply(`📋 *COMANDOS PERSONALIZADOS*\n\n` + keys.map(k => `• ${k}`).join('\n'));
    }

    if (['delcmd', 'removercmd', 'removercustom'].includes(cmd)) {
      if (!isGroup) return reply("Grupo apenas 💔");
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      const commands = loadCustomCommands(from);
      if (!commands[q.trim()]) return reply("Não encontrado.");
      delete commands[q.trim()];
      saveCustomCommands(from, commands);
      return reply("✅ Removido.");
    }
    // ...
  }
};
