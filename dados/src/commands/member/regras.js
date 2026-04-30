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
        return reply("📜 Nenhuma regra definida para este grupo ainda.");
      }
      
      let rulesMessage = `📜 *Regras do Grupo ${groupName}* 📜\n\n`;
      groupData.rules.forEach((rule, index) => {
        rulesMessage += `${index + 1}. ${rule}\n`;
      });
      
      await reply(rulesMessage);
    } catch (e) {
      console.error('Erro no comando regras:', e);
      await reply("Ocorreu um erro ao buscar as regras 💔");
    }
  }
};
