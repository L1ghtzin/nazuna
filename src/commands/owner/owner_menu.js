import { sendMenuWithMedia } from '../../utils/menuSender.js';

export default {
  name: "owner_menu",
  description: "Menu do dono do bot",
  commands: ["menudono", "ownermenu"],
  handle: async ({
    bot, from, info, reply, prefix, pushname, isGroup,
    nomebot, menus, getGroupCustomization, isGroupCustomizationEnabled,
    getMenuDesignWithDefaults, getMenuLerMaisText, isMenuAudioEnabled,
    getMenuAudioPath, MESSAGES
  }) => {
    try {
      await sendMenuWithMedia({
        bot,
        from,
        info,
        prefix,
        pushname,
        isGroup,
        nomebot,
        getGroupCustomization,
        isGroupCustomizationEnabled,
        getMenuDesignWithDefaults,
        getMenuLerMaisText,
        isMenuAudioEnabled,
        getMenuAudioPath,
        menuFunction: menus.menuDono
      });
    } catch (error) {
      console.error('Erro ao enviar menu do dono:', error);
      return reply(MESSAGES.error.general);
    }
  }
};
