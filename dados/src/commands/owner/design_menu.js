import { PREFIX } from "../../config.js";

export default {
  name: "design_menu",
  description: "Personalização do design do menu do bot",
  commands: ["configmenu", "designmenu", "resetarmenu", "resetdesign", "resetdesignmenu", "setborda", "setbordabaixo", "setbordafim", "setbordameio", "setbordamiddle", "setbordatopo", "setbottomborder", "setcabecalho", "setheader", "setheadermenu", "seticoneitem", "seticoneseparador", "seticonetitulo", "setitem", "setitemicon", "setmiddleborder", "setseparador", "setseparatoricon", "settitleicon", "settitulo", "settopborder", "verdesign"],
  handle: async ({ 
    reply, command, q, isOwner, prefix, pushname,
    loadMenuDesign, saveMenuDesign, nomebot
  , MESSAGES }) => {
    if (!isOwner) return reply(MESSAGES.permission.ownerOnly);

    const cmd = command.toLowerCase();
    const currentDesign = loadMenuDesign();

    if (['designmenu', 'verdesign', 'configmenu'].includes(cmd)) {
      const headerPreview = currentDesign.header.replace(/{botName}/g, nomebot).replace(/{userName}/g, pushname);
      const designText = `╭─⊰ 🎨 *CONFIGURAÇÕES DO DESIGN* 🎨 ⊱─╮
┊
┊ 🔸 *Cabeçalho:*
┊ ${headerPreview}
┊
┊ 🔸 *Borda Superior:* ${currentDesign.menuTopBorder}
┊ 🔸 *Borda Inferior:* ${currentDesign.bottomBorder}
┊ 🔸 *Borda do Meio:* ${currentDesign.middleBorder}
┊ 🔸 *Ícone do Item:* ${currentDesign.menuItemIcon}
┊ 🔸 *Ícone Separador:* ${currentDesign.separatorIcon}
┊ 🔸 *Ícone do Título:* ${currentDesign.menuTitleIcon}
┊
┊ 📝 *Comandos:*
┊ ${prefix}setborda, ${prefix}setbordafim, ${prefix}setbordameio,
┊ ${prefix}setitem, ${prefix}setseparador, ${prefix}settitulo,
┊ ${prefix}setheader, ${prefix}resetdesign
┊
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯`;
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
      return reply("✅ Design do menu resetado!");
    }

    if (!q) return reply(`Uso: ${prefix}${cmd} <texto/emoji>`);

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
    return reply(`✅ Alteração realizada no design do menu!`);
  }
};
