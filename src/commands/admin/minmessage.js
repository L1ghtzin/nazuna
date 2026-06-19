import fs from 'fs';

export default {
  name: "minmessage",
  description: "Configura o limite mínimo de caracteres em legendas de mídias no grupo",
  commands: ["minmessage"],
  usage: `${global.prefix}minmessage <mínimo de dígitos> <ban/adv>\n${global.prefix}minmessage off`,
  handle: async ({  reply, isGroup, isGroupAdmin, args, prefix, groupData, groupFile , MESSAGES }) => {
    try {
      if (!args[0]) return reply(MESSAGES.admin.minmessage.usage(prefix));
      
      if (args[0].toLowerCase() === 'off') {
        delete groupData.minMessage;
        fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
        await reply(MESSAGES.admin.minmessage.off);
      } else {
        const minDigits = parseInt(args[0]);
        const action = args[1]?.toLowerCase();
        
        if (isNaN(minDigits) || minDigits < 1 || !['ban', 'adv'].includes(action)) {
          return reply(MESSAGES.admin.minmessage.invalid(prefix));
        }
        
        groupData.minMessage = { minDigits, action };
        fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
        
        await reply(MESSAGES.admin.minmessage.success(minDigits, action));
      }
    } catch (e) {
      console.error('Erro no comando minmessage:', e);
      await reply(MESSAGES.admin.minmessage.error);
    }
  }
};
