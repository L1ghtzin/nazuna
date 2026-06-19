export default {
  name: "rebaixar",
  description: "Remove um membro de administrador do grupo",
  commands: ["rebaixar", "demote"],
  usage: `${global.prefixo}rebaixar @usuário`,
  handle: async ({ 
    bot,
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
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      if (!menc_os2) return reply(MESSAGES.error.missing('alguém'));
      
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
      
      await bot.groupParticipantsUpdate(from, [targetId], 'demote');
      
      // Notificação X9 para rebaixamento
      if (groupData?.x9) {
        await bot.sendMessage(from, {
          text: MESSAGES.admin.rebaixar.x9(menc_os2.split('@')[0], sender.split('@')[0]),
          mentions: [menc_os2, sender],
        }).catch(err => console.error(`❌ Erro ao enviar X9: ${err.message}`));
      }
      
      reply(MESSAGES.admin.rebaixar.success);
    } catch (e) {
      console.error(e);
      reply(MESSAGES.error.general);
    }
  }
};
