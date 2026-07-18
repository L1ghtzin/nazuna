import { sendMenuWithMedia } from '../../utils/menuSender.js';

const MENU_CATEGORIES = [
  {
    aliases: ['menu', 'help', 'comandos', 'commands'],
    getMenu: (menus) => menus.menu
  },
  {
    aliases: ['alteradores', 'menualterador', 'menualteradores', 'changersmenu', 'changers'],
    getMenu: (menus) => menus.menuAlterador
  },
  {
    aliases: ['menubn', 'menubrincadeira', 'menubrincadeiras', 'gamemenu'],
    getMenu: (menus) => menus.menubn
  },
  {
    aliases: ['menudown', 'menudownload', 'menudownloads', 'downmenu', 'downloadmenu'],
    getMenu: (menus) => menus.menudown
  },
  {
    aliases: ['ferramentas', 'menuferramentas', 'menuferramenta', 'toolsmenu', 'tools'],
    getMenu: (menus) => menus.menuFerramentas
  },
  {
    aliases: ['menuadm', 'menuadmin', 'menuadmins', 'admmenu'],
    getMenu: (menus) => menus.menuadm
  },
  {
    aliases: ['menumembros', 'menumemb', 'menugeral', 'membmenu', 'membermenu'],
    getMenu: (menus) => menus.menuMembros
  },
  {
    aliases: ['stickermenu', 'menusticker', 'menufig'],
    getMenu: (menus) => menus.menuSticker
  },
  {
    aliases: ['menurpg'],
    getMenu: (menus) => menus.menuRPG
  },
  {
    aliases: ['menuvip'],
    getMenu: (menus) => menus.menuVIP
  }
];

const MENU_COMMAND_LOOKUP = new Map();
for (const category of MENU_CATEGORIES) {
  for (const alias of category.aliases) {
    MENU_COMMAND_LOOKUP.set(alias, category);
  }
}

export default {
  name: "menu",
  description: "Menus e guias do bot",
  commands: MENU_CATEGORIES.flatMap((category) => category.aliases),
  handle: async ({
    bot, from, info, command, reply, prefix, pushname, isGroup,
    nomebot, menus, getGroupCustomization, isGroupCustomizationEnabled,
    getMenuDesignWithDefaults, getMenuLerMaisText, isMenuAudioEnabled,
    getMenuAudioPath, MESSAGES
  }) => {
    const cmd = command.toLowerCase();

    const send = (menuFunction) => sendMenuWithMedia({
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
      menuFunction
    });

    try {
      const category = MENU_COMMAND_LOOKUP.get(cmd);
      if (category) {
        const menuFunction = category.getMenu(menus);
        await send(menuFunction);
      }
    } catch (error) {
      console.error('Erro ao enviar menu:', error);
      return reply(MESSAGES.error.general);
    }
  }
};
