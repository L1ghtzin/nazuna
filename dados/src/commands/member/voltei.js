import fs from 'fs';

export default {
  name: "voltei",
  description: "Remove seu status AFK",
  commands: ["voltei"],
  usage: `${global.prefixo}voltei`,
  handle: async ({ 
    reply,
    isGroup,
    sender,
    groupData,
    groupFile
  , MESSAGES }) => {
    try {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      
      if (groupData.afkUsers && groupData.afkUsers[sender]) {
        delete groupData.afkUsers[sender];
        fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
        await reply(`👋 Bem-vindo(a) de volta! Seu status AFK foi removido.`);
      } else {
        await reply("Você não estava AFK.");
      }
    } catch (e) {
      console.error('Erro no comando voltei:', e);
      await reply("Ocorreu um erro ao remover AFK 💔");
    }
  }
};
