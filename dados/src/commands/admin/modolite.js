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
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      
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
        await reply('🔞 *Modo Lite ativado!* O conteúdo inapropriado para crianças será filtrado neste grupo.');
      } else {
        await reply('🔓 *Modo Lite desativado!* O conteúdo do menu de brincadeiras será exibido completamente.');
      }
    } catch (e) {
      console.error(e);
      await reply(MESSAGES.error.simple);
    }
  }
};
