/**
 * Middleware para lidar com AntiPV (Anti Privado)
 * 
 * @param {object} nazu - Instância do bot
 * @param {string} sender - ID de quem enviou a mensagem
 * @param {string} command - Comando executado
 * @param {boolean} isGroup - Se a mensagem é num grupo
 * @param {boolean} isCmd - Se a mensagem é um comando
 * @param {boolean} isOwner - Se é o dono do bot
 * @param {boolean} isPremium - Se o usuário é premium
 * @param {object} antipvData - Configurações de AntiPV
 * @param {function} reply - Função para enviar resposta
 * @returns {Promise<boolean>} Retorna true se a mensagem foi bloqueada pelo AntiPV
 */
export async function handleAntiPV(nazu, sender, command, isGroup, isCmd, isOwner, isPremium, antipvData, reply) {
  // Se for grupo, AntiPV não se aplica
  if (isGroup) return false;
  // Se não houver configuração, não aplica
  if (!antipvData || !antipvData.mode) return false;

  // Exceção para comandos de transmissão que devem funcionar no PV e botões/tickets
  const tm2Commands = ['inscrevertm', 'inscrevertm2', 'desinscrever', 'desinscrevertm', 'cancelartm'];
  const supportAdminCommands = ['ticketaceitar', 'aceitarticket', 'suporteaceitar', 'ticket.aceitar'];
  const isSupportAdminCommand = supportAdminCommands.some(cmd => command === cmd);
  const isTm2Command = tm2Commands.some(cmd => command === cmd) || isSupportAdminCommand;
  
  // Se for autorizado, libera
  if (isOwner || isPremium || isTm2Command) return false;

  // Aplica as regras de acordo com o modo
  if (antipvData.mode === 'antipv') {
    return true; // Apenas ignora
  }
  
  if (antipvData.mode === 'antipv2' && isCmd) {
    await reply(antipvData.message || '🚫 Este comando só funciona em grupos!');
    return true;
  }
  
  if (antipvData.mode === 'antipv3' && isCmd) {
    await nazu.updateBlockStatus(sender, 'block');
    await reply('🚫 Você foi bloqueado por usar comandos no privado!');
    return true;
  }
  
  if (antipvData.mode === 'antipv4') {
    await reply(antipvData.message || '🚫 Este comando só funciona em grupos!');
    return true;
  }

  return false;
}
