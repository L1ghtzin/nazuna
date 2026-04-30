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
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!q || isNaN(parseInt(q))) return reply(`🔢 Por favor, forneça o número da regra a ser removida. Ex: ${prefix}delregra 3`);
      
      groupData.rules = groupData.rules || [];
      const ruleNumber = parseInt(q);
      
      if (ruleNumber < 1 || ruleNumber > groupData.rules.length) {
        return reply(`❌ Número de regra inválido. Use ${prefix}regras para ver a lista. Atualmente existem ${groupData.rules.length} regras.`);
      }
      
      const removedRule = groupData.rules.splice(ruleNumber - 1, 1);
      fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      
      await reply(`🗑️ Regra "${removedRule}" removida com sucesso!`);
    } catch (e) {
      console.error('Erro no comando delregra:', e);
      await reply("Ocorreu um erro ao remover a regra 💔");
    }
  }
};
