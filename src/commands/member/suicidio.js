export default {
  name: "suicidio",
  description: "Remove você mesmo do grupo (brincadeira)",
  commands: ["suicidio"],
  usage: `${global.prefix}suicidio`,
  handle: async ({  reply, isGroupAdmin, isBotAdmin, pushname, bot, from, sender, isGroup, AllgroupMembers, idsMatch, MESSAGES }) => {
    try {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (isGroupAdmin) return reply(MESSAGES.member.suicidio.adminProtect);
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      
      await reply(MESSAGES.member.suicidio.goodbye(pushname));
      
      setTimeout(() => {
        let targetId = sender;
        if (AllgroupMembers && idsMatch) {
           for (const member of AllgroupMembers) {
               if (idsMatch(member, sender)) {
                   targetId = member;
                   break;
               }
           }
        }
        bot.groupParticipantsUpdate(from, [targetId], "remove").then(() => {
          setTimeout(() => {
            reply(MESSAGES.member.suicidio.joke);
          }, 1000);
        });
      }, 2000);
      
    } catch (e) {
      console.error(e);
      await reply(MESSAGES.error.general);
    }
  }
};
