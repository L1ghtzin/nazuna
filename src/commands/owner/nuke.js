export default {
  name: "nuke",
  description: "Remove todos os membros do grupo (exceto o dono e o bot)",
  commands: ["nuke"],
  usage: `${global.prefix}nuke`,
  handle: async ({ 
    reply, isOwner, isGroup, isBotAdmin, AllgroupMembers, nazu, from, sender,
    botNumber, botNumberLid, idsMatch, MESSAGES
  }) => {
    try {
      if (!isOwner) return reply('Apenas o dono pode usar este comando.');
      if (!isGroup) return reply('Apenas em grupos.');
      if (!isBotAdmin) return reply('Preciso ser admin para isso.');
      
      const membersToBan = AllgroupMembers.filter(m => {
        if (idsMatch && (idsMatch(m, botNumber) || (botNumberLid && idsMatch(m, botNumberLid)))) return false;
        if (idsMatch && idsMatch(m, sender)) return false;
        return true;
      });
      
      if (membersToBan.length === 0) return reply('Nenhum membro para banir.');
      
      await nazu.groupParticipantsUpdate(from, membersToBan, 'remove');
    } catch (e) {
      console.error('Erro no nuke:', e);
      await reply('Ocorreu um erro ao banir 💔');
    }
  }
};
