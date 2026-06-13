import fs from 'fs';

export default {
  name: "addregra",
  description: "Adiciona uma regra ao grupo",
  commands: ["addregra", "addrule"],
  usage: `${global.prefixo}addregra <texto da regra>`,
  handle: async ({ 
    reply,
    isGroup,
    isGroupAdmin,
    groupData,
    groupFile,
    q,
    prefix
  , MESSAGES }) => {
    try {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!q) return reply(MESSAGES.admin.rules.addProvideText(prefix));
      
      groupData.rules = groupData.rules || [];
      groupData.rules.push(q);
      fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      
      await reply(MESSAGES.admin.rules.addSuccess(groupData.rules.length, q));
    } catch (e) {
      console.error('Erro no comando addregra:', e);
      await reply(MESSAGES.admin.rules.addError);
    }
  }
};
