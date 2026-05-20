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
    groupFile
  , MESSAGES }) => {
    try {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      
      const reason = q.trim();
      
      groupData.afkUsers = groupData.afkUsers || {};
      
      groupData.afkUsers[sender] = {
        reason: reason || 'Não especificado',
        since: Date.now()
      };
      fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      
      let afkSetMessage = `😴 Você está AFK.`;
      if (reason) {
        afkSetMessage += `\nMotivo: ${reason}`;
      }
      await reply(afkSetMessage);
    } catch (e) {
      console.error('Erro no comando afk:', e);
      await reply("Ocorreu um erro ao definir AFK 💔");
    }
  }
};
