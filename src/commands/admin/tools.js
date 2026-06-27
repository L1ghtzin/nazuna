export default {
  name: "admintools",
  description: "Ferramentas administrativas adicionais",
  commands: ["d", "del", "deletar", "delete", "mention"],
  usage: "{prefix}mention Olá grupo!",
  handle: async ({  
    bot, 
    from, 
    info, 
    command,
    reply, 
    isGroup, 
    isGroupAdmin, 
    args, 
    q, 
    prefix,
    sender, 
    AllgroupMembers,
    quotedMessageContent,
    optimizer,
    buildGroupFilePath,
    MESSAGES
  }) => {

    // command já vem desestruturado


    // --- MENTION (Configuração de Marcações) ---
    if (command === 'mention') {
      if (!q) return reply(MESSAGES.admin.tools.mention.usage(prefix));
      
      const options = {
        all: MESSAGES.admin.tools.mention.all,
        marca: MESSAGES.admin.tools.mention.marca,
        games: MESSAGES.admin.tools.mention.games,
        0: MESSAGES.admin.tools.mention['0']
      };
      
      const opt = q.toLowerCase();
      if (options[opt] !== undefined) {
        const path = buildGroupFilePath(from);
        let groupData = await optimizer.loadJsonWithCache(path, { mark: {} });
        groupData.mark = groupData.mark || {};
        groupData.mark[sender] = opt;
        await optimizer.saveJsonWithCache(path, groupData);
        return reply(MESSAGES.admin.tools.mention.selected(options[opt]));
      }
      return reply(MESSAGES.admin.tools.mention.invalid(prefix));
    }

    // --- DELETAR (Apagar mensagem do bot ou de outros se for admin) ---
    if (['deletar', 'del', 'd', 'delete'].includes(command)) {
      if (!info.message.extendedTextMessage?.contextInfo?.quotedMessage) return reply(MESSAGES.admin.tools.del.missingQuoted);
      
      const key = {
        remoteJid: from,
        fromMe: info.message.extendedTextMessage.contextInfo.participant === bot.user.id.split(':')[0] + '@s.whatsapp.net',
        id: info.message.extendedTextMessage.contextInfo.stanzaId,
        participant: info.message.extendedTextMessage.contextInfo.participant
      };

      try {
        await bot.sendMessage(from, { delete: key });
      } catch (e) {
        return reply(MESSAGES.admin.tools.del.error);
      }
    }
  },
};
