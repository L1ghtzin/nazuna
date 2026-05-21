

export default {
  name: "admintools",
  description: "Ferramentas administrativas adicionais",
  commands: ["add", "blockuser", "buscar", "criar", "d", "del", "deletar", "delete", "fixar", "mention", "nota", "note", "pin", "remover", "search", "unblockuser", "ver", "view"],
  usage: "{prefix}mention Olá grupo!",
  handle: async ({  
    nazu, 
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
      if (!q) return reply(`🔔 *Configuração de Marcações*\n\n🔔 Escolha como deseja ser mencionado:\n\n🔘 *${prefix}mention all*   Marcado em tudo (marcações e jogos).\n🔔 *${prefix}mention marca*   Apenas em marcações de administradores.\n🎮 *${prefix}mention games*   Somente em jogos do bot.\n📴 *${prefix}mention 0*   Não será mencionado em nenhuma ocasião.`);
      
      const options = {
        all: '✅ Você agora será mencionado em todas as interações do bot, incluindo marcações de administradores e os jogos!',
        marca: '🔔 A partir de agora, você será mencionado apenas quando um administrador marcar.',
        games: '🎮 Você optou por ser mencionado somente em jogos do bot.',
        0: '📴 Silêncio ativado! Você não será mais mencionado pelo bot, nem em marcações nem em jogos.'
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
      return reply(`❌ Opção inválida! Use *${prefix}mention* para ver as opções.`);
    }

    if (!isGroupAdmin && !isOwner) return reply(MESSAGES.permission.adminOnly);

    // --- DELETAR (Apagar mensagem do bot ou de outros se for admin) ---
    if (['deletar', 'del', 'd', 'delete'].includes(command)) {
      if (!info.message.extendedTextMessage?.contextInfo?.quotedMessage) return reply("❌ Responda à mensagem que deseja deletar.");
      
      const key = {
        remoteJid: from,
        fromMe: info.message.extendedTextMessage.contextInfo.participant === nazu.user.id.split(':')[0] + '@s.whatsapp.net',
        id: info.message.extendedTextMessage.contextInfo.stanzaId,
        participant: info.message.extendedTextMessage.contextInfo.participant
      };

      try {
        await nazu.sendMessage(from, { delete: key });
      } catch (e) {
        return reply("❌ Não consegui deletar a mensagem. Verifique se sou administrador.");
      }
    }

    // --- BLOCK / UNBLOCK USER (No bot) ---
    if (['blockuser', 'unblockuser'].includes(command)) {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      const target = menc_os2;
      if (!target) return reply("❌ Marque o usuário que deseja bloquear/desbloquear.");
      
      try {
        if (command === 'blockuser') {
          await nazu.updateBlockStatus(target, "block");
          return reply("✅ Usuário bloqueado com sucesso!");
        } else {
          await nazu.updateBlockStatus(target, "unblock");
          return reply("✅ Usuário desbloqueado com sucesso!");
        }
      } catch (e) {
        return reply("❌ Erro ao atualizar status de bloqueio.");
      }
    }
  },
};
