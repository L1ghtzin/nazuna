import { normalizeUserId, getUserName } from '../../utils/helpers.js';

export default {
  name: "mute2",
  description: "Muta um usuário no grupo (mensagens serão apagadas)",
  commands: ["mute2", "mutar2"],
  usage: `${global.prefixo}mute2 @usuário`,
  handle: async ({ 
    bot,
    from,
    reply,
    isGroup,
    isGroupAdmin,
    isBotAdmin,
    menc_os2,
    info,
    MESSAGES,
    optimizer,
    buildGroupFilePath
  }) => {
    try {

      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      if (!menc_os2) return reply(MESSAGES.error.missing('alguém'));
      
      const groupFilePath = buildGroupFilePath(from);
      let groupData = await optimizer.loadJsonWithCache(groupFilePath, { mutedUsers2: {} });
      
      groupData.mutedUsers2 = groupData.mutedUsers2 || {};
      const targetId = await normalizeUserId(bot, menc_os2);
      groupData.mutedUsers2[targetId] = true;
      
      if (targetId !== menc_os2) {
        groupData.mutedUsers2[menc_os2] = true;
      }
      
      await optimizer.saveJsonWithCache(groupFilePath, groupData);
      
      await bot.sendMessage(from, {
        text: MESSAGES.admin.mute2.success(getUserName(menc_os2)),
        mentions: [menc_os2]
      }, {
        quoted: info
      });
      
    } catch (e) {
      console.error(e);
      reply(MESSAGES.error.general);
    }
  }
};
