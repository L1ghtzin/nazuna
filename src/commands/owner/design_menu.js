

export default {
  name: "design_menu",
  description: "Personalização do design do menu do bot",
  commands: ["configmenu", "designmenu", "resetarmenu", "resetdesign", "resetdesignmenu", "setborda", "setbordabaixo", "setbordafim", "setbordameio", "setbordamiddle", "setbordatopo", "setbottomborder", "setcabecalho", "setheader", "setheadermenu", "seticoneitem", "seticoneseparador", "seticonetitulo", "setitem", "setitemicon", "setmiddleborder", "setseparador", "setseparatoricon", "settitleicon", "settitulo", "settopborder", "verdesign"],
  handle: async ({ 
    reply, command, q, isOwner, prefix, pushname,
    loadMenuDesign, saveMenuDesign, nomebot
  , MESSAGES }) => {
    const cmd = command.toLowerCase();
    const currentDesign = loadMenuDesign();

    if (['designmenu', 'verdesign', 'configmenu'].includes(cmd)) {
      const headerPreview = currentDesign.header.replace(/{botName}/g, nomebot).replace(/{userName}/g, pushname);
      const designText = MESSAGES.owner.design_menu.menuPreview(headerPreview, currentDesign, prefix);
      return reply(designText);
    }

    if (['resetdesign', 'resetarmenu', 'resetdesignmenu'].includes(cmd)) {
      const defaultDesign = {
        header: `╭┈⊰ 🌸 『 *{botName}* 』\n┊Olá, {userName}!\n╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯`,
        menuTopBorder: "╭┈",
        bottomBorder: "╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯",
        menuTitleIcon: "🍧ฺꕸ▸",
        menuItemIcon: "•.̇𖥨֗🍓⭟",
        separatorIcon: "❁",
        middleBorder: "┊"
      };
      await saveMenuDesign(defaultDesign);
      return reply(MESSAGES.owner.design_menu.resetSuccess);
    }

    if (!q) return reply(MESSAGES.owner.design_menu.usage(prefix, cmd));

    if (['setborda', 'setbordatopo', 'settopborder'].includes(cmd)) {
      currentDesign.menuTopBorder = q;
    } else if (['setbordafim', 'setbottomborder', 'setbordabaixo'].includes(cmd)) {
      currentDesign.bottomBorder = q;
    } else if (['setbordameio', 'setmiddleborder', 'setbordamiddle'].includes(cmd)) {
      currentDesign.middleBorder = q;
    } else if (['setitemicon', 'seticoneitem', 'setitem'].includes(cmd)) {
      currentDesign.menuItemIcon = q;
    } else if (['setseparador', 'setseparatoricon', 'seticoneseparador'].includes(cmd)) {
      currentDesign.separatorIcon = q;
    } else if (['settitleicon', 'seticonetitulo', 'settitulo'].includes(cmd)) {
      currentDesign.menuTitleIcon = q;
    } else if (['setheader', 'setcabecalho', 'setheadermenu'].includes(cmd)) {
      currentDesign.header = q.replace(/\\n/g, '\n');
    }

    await saveMenuDesign(currentDesign);
    return reply(MESSAGES.owner.design_menu.success);
  }
};
