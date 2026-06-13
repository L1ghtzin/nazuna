import fs from 'fs';

export default {
  name: "afk",
  description: "Define seu status como AFK (longe do teclado)",
  commands: ["afk"],
  usage: `${global.prefixo}afk [motivo]`,
  handle: async ({ 
    reply,
    q,
    isGroup,
    sender,
    groupData,
    groupFile,
    optimizer,
    MESSAGES
  }) => {
    try {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      
      const reason = q.trim();
      
      groupData.afkUsers = groupData.afkUsers || {};
      
      groupData.afkUsers[sender] = {
        reason: reason || 'Não especificado',
        since: Date.now()
      };
      await optimizer.saveJsonWithCache(groupFile, groupData);
      
      await reply(MESSAGES.member.afk.success(reason));
    } catch (e) {
      console.error('Erro no comando afk:', e);
      await reply(MESSAGES.member.afk.error);
    }
  }
};
