export default {
  name: "admintools",
  description: "Ferramentas administrativas adicionais",
  commands: ["blockuser", "d", "del", "deletar", "delete", "mention", "unblockuser"],
  usage: "{prefix}mention Olá grupo!",
  handle: async ({  
    bot, 
    from, 
    info, 
    command,
    reply, 
    isGroup, 
    isGroupAdmin, 
    isOwner, 
    args, 
    q, 
    prefix,
    sender, 
    AllgroupMembers,
    quotedMessageContent,
    optimizer,
    buildGroupFilePath,
    menc_os2,
    MESSAGES
  }) => {
    if (!isGroup) return reply(MESSAGES.permission.groupOnly);
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
        return reply(`*${options[opt]}*`);
      }
      return reply(MESSAGES.admin.tools.mention.invalid(prefix));
    }

    if (!isGroupAdmin && !isOwner) return reply(MESSAGES.permission.adminOnly);

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

    // --- BLOCK / UNBLOCK USER (No bot) ---
    if (['blockuser', 'unblockuser'].includes(command)) {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      const target = menc_os2;
      if (!target) return reply(MESSAGES.admin.tools.block.missingTarget);
      
      try {
        if (command === 'blockuser') {
          await bot.updateBlockStatus(target, "block");
          return reply(MESSAGES.admin.tools.block.successBlock);
        } else {
          await bot.updateBlockStatus(target, "unblock");
          return reply(MESSAGES.admin.tools.block.successUnblock);
        }
      } catch (e) {
        return reply(MESSAGES.admin.tools.block.error);
      }
    }
  },
};
