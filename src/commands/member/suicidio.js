export default {
  name: "suicidio",
  description: "Remove você mesmo do grupo (brincadeira)",
  commands: ["suicidio"],
  usage: `${global.prefix}suicidio`,
  handle: async ({  reply, isGroupAdmin, isBotAdmin, pushname, nazu, from, sender, isGroup, AllgroupMembers, idsMatch, MESSAGES }) => {
    try {
      if (!isGroup) return reply('❌ Este comando só funciona em grupos.');
      if (isGroupAdmin) return reply(`💔 Awn, admin, você é precioso demais para isso. Fica aqui com a gente, tá? <3`);
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      
      await reply(`*É uma pena que tenha tomado essa decisão ${pushname}, vamos sentir saudades... 😕*`);
      
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
        nazu.groupParticipantsUpdate(from, [targetId], "remove").then(() => {
          setTimeout(() => {
            reply(`*Ainda bem que morreu, não aguentava mais essa praga kkkkkk*`);
          }, 1000);
        });
      }, 2000);
      
    } catch (e) {
      console.error(e);
      await reply(MESSAGES.error.internal);
    }
  }
};
