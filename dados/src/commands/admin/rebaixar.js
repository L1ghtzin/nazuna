export default {
  name: "rebaixar",
  description: "Remove um membro de administrador do grupo",
  commands: ["rebaixar", "demote"],
  usage: `${global.prefixo}rebaixar @usuario`,
  handle: async ({ 
    nazu,
    from,
    reply,
    isGroup,
    isGroupAdmin,
    isBotAdmin,
    menc_os2,
    groupData,
    sender,
    AllgroupMembers,
    idsMatch
  , MESSAGES }) => {
    try {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      if (!menc_os2) return reply(MESSAGES.permission.mentionRequired);
      
      // Converte para LID se necessário para grupos ocultos
      let targetId = menc_os2;
      if (AllgroupMembers && idsMatch) {
         for (const member of AllgroupMembers) {
             if (idsMatch(member, menc_os2)) {
                 targetId = member;
                 break;
             }
         }
      }
      
      await nazu.groupParticipantsUpdate(from, [targetId], 'demote');
      
      // Notificação X9 para rebaixamento
      if (groupData?.x9) {
        await nazu.sendMessage(from, {
          text: `⬇️ *X9 Report:* @${menc_os2.split('@')[0]} foi rebaixado(a) de ADM por @${sender.split('@')[0]}.`,
          mentions: [menc_os2, sender],
        }).catch(err => console.error(`❌ Erro ao enviar X9: ${err.message}`));
      }
      
      reply(`✅ Usuário rebaixado com sucesso!`);
    } catch (e) {
      console.error(e);
      reply(MESSAGES.error.simple);
    }
  }
};
