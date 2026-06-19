import fs from 'fs';

export default {
  name: "delregra",
  description: "Remove uma regra do grupo",
  commands: ["delregra", "delrule"],
  usage: `${global.prefixo}delregra <número>`,
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
      if (!q || isNaN(parseInt(q))) return reply(MESSAGES.admin.rules.delProvideNum(prefix));
      
      groupData.rules = groupData.rules || [];
      const ruleNumber = parseInt(q);
      
        return reply(MESSAGES.admin.rules.delInvalidNum(prefix, groupData.rules.length));
      
      const removedRule = groupData.rules.splice(ruleNumber - 1, 1);
      fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      
      await reply(MESSAGES.admin.rules.delSuccess(removedRule[0]));
    } catch (e) {
      console.error('Erro no comando delregra:', e);
      await reply(MESSAGES.admin.rules.delError);
    }
  }
};
