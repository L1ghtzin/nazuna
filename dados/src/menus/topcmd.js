async function menuTopCmd(prefix, botName = "MeuBot", userName = "Usuário", topCommands = []) {
  if (!topCommands || topCommands.length === 0) {
    return `
╭┈⊰ 🌸 『 *${botName}* 』
┊Olá, *${userName}*!
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯

╭┈❪🍧ฺꕸ▸ *MAIS USADOS*
┊
┊ Nenhum comando foi registrado ainda.
┊ Use ${prefix}menu para ver a lista
┊ de comandos disponíveis!
┊
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯
`;
  }

  const commandsList = topCommands.map((cmd, index) => {
      const position = index + 1;
      const emoji = position <= 3 ? ['🥇', '🥈', '🥉'][index] : '🏅';
      return `┊${emoji} ${position}º: *${prefix}${cmd.name}*\n┊   ↳ ${cmd.count} usos por ${cmd.uniqueUsers} usuários`;
    }).join('\n┊\n');

  return `
╭┈⊰ 🌸 『 *${botName}* 』
┊Olá, *${userName}*!
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯

╭┈❪🍧ฺꕸ▸ *Top ${topCommands.length} Comandos*
${commandsList}
┊
┊╭─▸ *Informações:*
┊
┊🔍 Use ${prefix}cmdinfo [comando]
┊   ↳ Para ver estatísticas detalhadas
┊   ↳ Ex: ${prefix}cmdinfo menu
┊
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯
`;
}

module.exports = menuTopCmd; 