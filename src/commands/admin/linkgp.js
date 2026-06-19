export default {
  name: "linkgp",
  description: "Gera e exibe o link de convite do grupo",
  commands: ["linkgp", "linkgroup", "link"],
  usage: `${global.prefixo}linkgp`,
  handle: async ({ 
    bot,
    from,
    reply,
    isGroup,
    isGroupAdmin,
    isBotAdmin,
    sender
  , MESSAGES }) => {
    try {
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      
      const linkgc = await bot.groupInviteCode(from);
      const linkCompleto = 'https://chat.whatsapp.com/' + linkgc;
      
      const groupMetadata = await bot.groupMetadata(from);
      const groupName = groupMetadata.subject;
      const participantCount = groupMetadata.participants.length;
      const adminCount = groupMetadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin').length;
      
      const mensagem = MESSAGES.admin.linkgp.message(groupName, participantCount, adminCount, new Date().toLocaleString('pt-BR'), linkCompleto);
  
      await bot.sendMessage(from, {
        text: mensagem,
        mentions: [sender]
      });
      
    } catch (e) {
      console.error(e);
      reply(MESSAGES.error.general);
    }
  }
};
