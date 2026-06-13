export default {
  name: "regras",
  description: "Mostra as regras do grupo",
  commands: ["regras"],
  usage: `${global.prefixo}regras`,
  handle: async ({ 
    reply,
    isGroup,
    groupData,
    groupName
  , MESSAGES }) => {
    try {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      
      if (!groupData.rules || groupData.rules.length === 0) {
        return reply(MESSAGES.member.regras.noRules);
      }
      
      let rulesMessage = MESSAGES.member.regras.header(groupName);
      groupData.rules.forEach((rule, index) => {
        rulesMessage += `${index + 1}. ${rule}\n`;
      });
      
      await reply(rulesMessage);
    } catch (e) {
      console.error('Erro no comando regras:', e);
      await reply(MESSAGES.error.general);
    }
  }
};
