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
      if (!q) return reply(`📝 Por favor, forneça o texto da regra. Ex: ${prefix}addregra Proibido spam.`);
      
      groupData.rules = groupData.rules || [];
      groupData.rules.push(q);
      fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
      
      await reply(`✅ Regra adicionada com sucesso!\n${groupData.rules.length}. ${q}`);
    } catch (e) {
      console.error('Erro no comando addregra:', e);
      await reply("Ocorreu um erro ao adicionar a regra 💔");
    }
  }
};
