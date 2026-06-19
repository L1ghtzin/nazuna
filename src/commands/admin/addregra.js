export default {
  name: "addregra",
  description: "Adiciona uma regra ao grupo",
  commands: ["addregra", "addrule"],
  usage: `${global.prefixo}addregra <texto da regra>`,
  handle: async ({ 
    reply,
    groupData,
    persistGroupDataLocal,
    q,
    prefix
  , MESSAGES }) => {
    try {
      if (!q) return reply(MESSAGES.admin.rules.addProvideText(prefix));
      
      groupData.rules = groupData.rules || [];
      groupData.rules.push(q);
      await persistGroupDataLocal();
      
      await reply(MESSAGES.admin.rules.addSuccess(groupData.rules.length, q));
    } catch (e) {
      console.error('Erro no comando addregra:', e);
      await reply(MESSAGES.admin.rules.addError);
    }
  }
};
