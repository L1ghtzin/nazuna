import fs from 'fs';

export default {
  name: "modolite",
  description: "Ativa/desativa o modo lite para filtrar conteúdo inapropriado",
  commands: ["modolite", "litemode"],
  usage: `${global.prefixo}modolite`,
  handle: async ({ 
    from,
    reply,
    isGroup,
    isGroupAdmin,
    groupData,
    buildGroupFilePath,
    MESSAGES,
    optimizer,
    groupFile
  }) => {
    try {
      if (!groupData.modolite) {
        groupData.modolite = true;
        if (groupData.hasOwnProperty('modoliteOff')) {
          delete groupData.modoliteOff;
        }
      } else {
        groupData.modolite = !groupData.modolite;
        if (!groupData.modolite) {
          groupData.modoliteOff = true;
        } else if (groupData.hasOwnProperty('modoliteOff')) {
          delete groupData.modoliteOff;
        }
      }
      
      await optimizer.saveJsonWithCache(groupFile || buildGroupFilePath(from), groupData);
      
      if (groupData.modolite) {
        await reply(MESSAGES.admin.modolite.on);
      } else {
        await reply(MESSAGES.admin.modolite.off);
      }
    } catch (e) {
      console.error(e);
      await reply(MESSAGES.error.general);
    }
  }
};
