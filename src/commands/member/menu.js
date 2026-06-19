import { sendMenuWithMedia } from '../../utils/menuSender.js';

export default {
  name: "menu",
  description: "Menus e guias do bot",
  commands: ["admmenu", "alteradores", "changers", "changersmenu", "comandos", "commands", "downloadmenu", "downmenu", "ferramentas", "gamemenu", "help", "membermenu", "membmenu", "menu", "menuadm", "menuadmin", "menuadmins", "menualterador", "menualteradores", "menubn", "menubrincadeira", "menubrincadeiras", "menudown", "menudownload", "menudownloads", "menuferramenta", "menuferramentas", "menufig", "menugeral", "menumemb", "menumembros", "menurpg", "menusticker", "menuvip", "stickermenu", "tools", "toolsmenu"],
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
      if (['menu', 'help', 'comandos', 'commands'].includes(cmd)) {
        await send(menus.menu);
      } else if (['alteradores', 'menualterador', 'menualteradores', 'changersmenu', 'changers'].includes(cmd)) {
        await send(menus.menuAlterador);
      } else if (['menubn', 'menubrincadeira', 'menubrincadeiras', 'gamemenu'].includes(cmd)) {
        await send(menus.menubn);
      } else if (['menudown', 'menudownload', 'menudownloads', 'downmenu', 'downloadmenu'].includes(cmd)) {
        await send(menus.menudown);
      } else if (['ferramentas', 'menuferramentas', 'menuferramenta', 'toolsmenu', 'tools'].includes(cmd)) {
        await send(menus.menuFerramentas);
      } else if (['menuadm', 'menuadmin', 'menuadmins', 'admmenu'].includes(cmd)) {
        await send(menus.menuadm);
      } else if (['menumembros', 'menumemb', 'menugeral', 'membmenu', 'membermenu'].includes(cmd)) {
        await send(menus.menuMembros);
      } else if (['stickermenu', 'menusticker', 'menufig'].includes(cmd)) {
        await send(menus.menuSticker);
      } else if (cmd === 'menurpg') {
        await send(menus.menuRPG);
      } else if (cmd === 'menuvip') {
        await send(menus.menuVIP);
      }
    } catch (error) {
      console.error('Erro ao enviar menu:', error);
      return reply(MESSAGES.error.general);
    }
  }
};
