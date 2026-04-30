export default {
  name: "ban",
  description: "Bane um usuário do grupo",
  commands: ["banir", "ban", "b", "kick"],
  usage: `${global.prefixo}ban @usuario`,
  handle: async ({ 
    nazu,
    from,
    reply,
    isGroup,
    isGroupAdmin,
    isBotAdmin,
    menc_os2,
    menc_jid2,
    ownerJid,
    lidowner,
    botNumber,
    botNumberLid,
    groupAdmins,
    q,
    groupData,
    sender,
    extractReason,
    idsMatch,
    idInArray,
    AllgroupMembers
  , MESSAGES }) => {
    try {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      if (!menc_os2) return reply(MESSAGES.permission.mentionRequired);
      if (idsMatch(menc_os2, ownerJid) || (lidowner && idsMatch(menc_os2, lidowner))) return reply(MESSAGES.permission.cantBanOwner);
      if (idsMatch(menc_os2, botNumber) || (botNumberLid && idsMatch(menc_os2, botNumberLid))) return reply(MESSAGES.permission.cantBanSelf);
      if (idInArray(menc_os2, groupAdmins)) return reply(MESSAGES.permission.cantBanAdmin);
      
      // Converte para LID se necessário para grupos ocultos
      let targetId = menc_os2;
      if (AllgroupMembers) {
         for (const member of AllgroupMembers) {
             if (idsMatch(member, menc_os2)) {
                 targetId = member;
                 break;
             }
         }
      }
      
      await nazu.groupParticipantsUpdate(from, [targetId], 'remove');
      
      const banReason = extractReason(q, menc_jid2);
      // Notificação X9 para banimento
      if (groupData?.x9) {
        const reasonText = `\n📝 Motivo: ${banReason}`;
        await nazu.sendMessage(from, {
          text: `🚪 *X9 Report:* @${menc_os2.split('@')[0]} foi removido(a) do grupo por @${sender.split('@')[0]}.${reasonText}`,
          mentions: [menc_os2, sender],
        }).catch(err => console.error(`❌ Erro ao enviar X9: ${err.message}`));
      }
      
      reply(`✅ Usuário banido com sucesso!\n\nMotivo: ${banReason}`);
    } catch (e) {
      console.error(e);
      reply(MESSAGES.error.simple);
    }
  }
};
