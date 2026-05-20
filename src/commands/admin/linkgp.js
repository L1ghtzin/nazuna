export default {
  name: "linkgp",
  description: "Gera e exibe o link de convite do grupo",
  commands: ["linkgp", "linkgroup", "link"],
  usage: `${global.prefixo}linkgp`,
  handle: async ({ 
    nazu,
    from,
    reply,
    isGroup,
    isGroupAdmin,
    isBotAdmin,
    sender
  , MESSAGES }) => {
    try {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      
      const linkgc = await nazu.groupInviteCode(from);
      const linkCompleto = 'https://chat.whatsapp.com/' + linkgc;
      
      const groupMetadata = await nazu.groupMetadata(from);
      const groupName = groupMetadata.subject;
      const participantCount = groupMetadata.participants.length;
      const adminCount = groupMetadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin').length;
      
      let mensagem = `*🔗 LINK DO GRUPO 🔗*\n\n`;
      mensagem += `📝 *Informações:*\n\n`;
      mensagem += `👥 *Grupo:* ${groupName}\n`;
      mensagem += `👤 *Membros:* ${participantCount}\n`;
      mensagem += `👑 *Admins:* ${adminCount}\n`;
      mensagem += `🕒 *Gerado em:* ${new Date().toLocaleString('pt-BR')}\n\n`;
      mensagem += `_🌐 *Link de convite:*_\n`;
      mensagem += `${linkCompleto}\n\n`;
      mensagem += `_⚠️ *Avisos:*_\n`;
      mensagem += `  Compartilhe apenas com quem confia\n`;
      mensagem += `  Administradores podem revogar o link nas configurações do grupo\n`;
      mensagem += `_📱 *Compartilhe com responsabilidade!* 📱_`;
  
      await nazu.sendMessage(from, {
        text: mensagem,
        mentions: [sender]
      });
      
    } catch (e) {
      console.error(e);
      reply(MESSAGES.error.simple);
    }
  }
};
