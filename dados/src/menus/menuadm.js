async function menuadm(prefix, botName = "MeuBot", userName = "Usuário", isLiteMode = false) {
  return `
╭┈⊰ 🌸 『 *${botName}* 』
┊Olá, *${userName}*!
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯

╭┈❪🍧ฺꕸ▸ *ADMINISTRAÇÃO*
┊
┊•.̇𖥨֗🍓⭟${prefix}ban
┊•.̇𖥨֗🍓⭟${prefix}promover
┊•.̇𖥨֗🍓⭟${prefix}rebaixar
┊•.̇𖥨֗🍓⭟${prefix}mute
┊•.̇𖥨֗🍓⭟${prefix}desmute
┊•.̇𖥨֗🍓⭟${prefix}adv
┊•.̇𖥨֗🍓⭟${prefix}rmadv
┊•.̇𖥨֗🍓⭟${prefix}listadv
┊•.̇𖥨֗🍓⭟${prefix}blockuser
┊•.̇𖥨֗🍓⭟${prefix}unblockuser
┊•.̇𖥨֗🍓⭟${prefix}listblocksgp
┊•.̇𖥨֗🍓⭟${prefix}addblacklist
┊•.̇𖥨֗🍓⭟${prefix}delblacklist
┊•.̇𖥨֗🍓⭟${prefix}listblacklist
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯

╭┈❪🍧ฺꕸ▸ *GERENCIAMENTO*
┊
┊•.̇𖥨֗🍓⭟${prefix}banghost [msgs]
┊•.̇𖥨֗🍓⭟${prefix}del
┊•.̇𖥨֗🍓⭟${prefix}hidetag
┊•.̇𖥨֗🍓⭟${prefix}marcar
┊•.̇𖥨֗🍓⭟${prefix}linkgp
┊•.̇𖥨֗🍓⭟${prefix}limpar
┊•.̇𖥨֗🍓⭟${prefix}grupo A/F
┊•.̇𖥨֗🍓⭟${prefix}setname
┊•.̇𖥨֗🍓⭟${prefix}setdesc
┊•.̇𖥨֗🍓⭟${prefix}addregra
┊•.̇𖥨֗🍓⭟${prefix}delregra
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯

╭┈❪🍧ฺꕸ▸ *COMANDOS BLOCK*
┊
┊•.̇𖥨֗🍓⭟${prefix}blockcmd
┊•.̇𖥨֗🍓⭟${prefix}unblockcmd
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯

╭┈❪🍧ฺꕸ▸ *MODERADORES*
┊
┊•.̇𖥨֗🍓⭟${prefix}addmod
┊•.̇𖥨֗🍓⭟${prefix}delmod
┊•.̇𖥨֗🍓⭟${prefix}listmods
┊•.̇𖥨֗🍓⭟${prefix}grantmodcmd
┊•.̇𖥨֗🍓⭟${prefix}revokemodcmd
┊•.̇𖥨֗🍓⭟${prefix}listmodcmds
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯

╭┈❪🍧ฺꕸ▸ *ATIVAÇÕES*
┊
┊•.̇𖥨֗🍓⭟${prefix}autodl
┊•.̇𖥨֗🍓⭟${prefix}modobn
┊•.̇𖥨֗🍓⭟${prefix}modonsfw
┊•.̇𖥨֗🍓⭟${prefix}bemvindo
┊•.̇𖥨֗🍓⭟${prefix}saida
┊•.̇𖥨֗🍓⭟${prefix}autosticker
┊•.̇𖥨֗🍓⭟${prefix}soadm
┊•.̇𖥨֗🍓⭟${prefix}x9
┊•.̇𖥨֗🍓⭟${prefix}modolite
┊•.̇𖥨֗🍓⭟${prefix}cmdlimit
┊•.̇𖥨֗🍓⭟${prefix}antilinkgp
┊•.̇𖥨֗🍓⭟${prefix}antilinkhard
┊•.̇𖥨֗🍓⭟${prefix}antiporn
┊•.̇𖥨֗🍓⭟${prefix}antiflood
┊•.̇𖥨֗🍓⭟${prefix}antifake
┊•.̇𖥨֗🍓⭟${prefix}antipt
┊•.̇𖥨֗🍓⭟${prefix}antidoc
┊•.̇𖥨֗🍓⭟${prefix}antiloc
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯

╭┈❪🍧ฺꕸ▸ *CONFIGURAÇÕES*
┊
┊•.̇𖥨֗🍓⭟${prefix}legendasaiu
┊•.̇𖥨֗🍓⭟${prefix}legendabv
┊•.̇𖥨֗🍓⭟${prefix}fotobv
┊•.̇𖥨֗🍓⭟${prefix}rmfotobv
┊•.̇𖥨֗🍓⭟${prefix}fotosaiu
┊•.̇𖥨֗🍓⭟${prefix}rmfotosaiu
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯
`;
}

module.exports = menuadm;

