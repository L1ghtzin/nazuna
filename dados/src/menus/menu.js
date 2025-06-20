async function menu(prefix, botName = "MeuBot", userName = "Usuário") {
  return `
╭┈⊰ 🌸 『 *${botName}* 』
┊Olá, *${userName}*!
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯

╭┈❪🍧ฺꕸ▸ *MENU PRINCIPAL*
┊
┊•.̇𖥨֗🍓⭟${prefix}menuia
┊•.̇𖥨֗🍓⭟${prefix}menudown
┊•.̇𖥨֗🍓⭟${prefix}menuadm
┊•.̇𖥨֗🍓⭟${prefix}menubn
┊•.̇𖥨֗🍓⭟${prefix}menudono
┊•.̇𖥨֗🍓⭟${prefix}menumemb
┊•.̇𖥨֗🍓⭟${prefix}ferramentas
┊•.̇𖥨֗🍓⭟${prefix}menufig
┊•.̇𖥨֗🍓⭟${prefix}alteradores
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯
`;
}

module.exports = menu;
