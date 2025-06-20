async function menuMembros(prefix, botName = "MeuBot", userName = "Usuário") {
  return `
╭┈⊰ 🌸 『 *${botName}* 』
┊Olá, *${userName}*!
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯

╭┈❪🍧ฺꕸ▸ *INFORMAÇÕES*
┊
┊•.̇𖥨֗🍓⭟${prefix}perfil
┊•.̇𖥨֗🍓⭟${prefix}dono
┊•.̇𖥨֗🍓⭟${prefix}ping
┊•.̇𖥨֗🍓⭟${prefix}rvisu
┊•.̇𖥨֗🍓⭟${prefix}totalcmd
┊•.̇𖥨֗🍓⭟${prefix}topcmd
┊•.̇𖥨֗🍓⭟${prefix}cmdinfo
┊•.̇𖥨֗🍓⭟${prefix}statusgp
┊•.̇𖥨֗🍓⭟${prefix}statusbot
┊•.̇𖥨֗🍓⭟${prefix}meustatus
┊•.̇𖥨֗🍓⭟${prefix}regras
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯

╭┈❪🍧ฺꕸ▸ *CONFIGURAÇÕES*
┊
┊•.̇𖥨֗🍓⭟${prefix}mention
┊•.̇𖥨֗🍓⭟${prefix}afk
┊•.̇𖥨֗🍓⭟${prefix}voltei
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯

╭┈❪🍧ฺꕸ▸ *RANKS*
┊
┊•.̇𖥨֗🍓⭟${prefix}rankativo
┊•.̇𖥨֗🍓⭟${prefix}rankinativo
┊•.̇𖥨֗🍓⭟${prefix}rankativog
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯
`;
}

module.exports = menuMembros;