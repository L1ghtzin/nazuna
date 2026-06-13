export default {
  name: "nuke",
  description: "Remove todos os membros do grupo (exceto o dono e o bot)",
  commands: ["nuke"],
  usage: `${global.prefix}nuke`,
  handle: async ({ 
    reply, isOwner, isGroup, isBotAdmin, AllgroupMembers, bot, from, sender,
    botNumber, botNumberLid, idsMatch, MESSAGES
  }) => {
    try {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      
      const membersToBan = AllgroupMembers.filter(m => {
        if (idsMatch && (idsMatch(m, botNumber) || (botNumberLid && idsMatch(m, botNumberLid)))) return false;
        if (idsMatch && idsMatch(m, sender)) return false;
        return true;
      });
      
      if (membersToBan.length === 0) return reply(MESSAGES.owner.nuke.noMembers);
      
      await bot.groupParticipantsUpdate(from, membersToBan, 'remove');
    } catch (e) {
      console.error('Erro no nuke:', e);
      await reply(MESSAGES.owner.nuke.error);
    }
  }
};
