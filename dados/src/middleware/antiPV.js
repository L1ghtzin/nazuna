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
  // Se não houver configuração ou modo, não aplica
  if (!antipvData || !antipvData.mode) return false;

  // Exceção para comandos de transmissão que devem funcionar no PV e botões/tickets
  const tm2Commands = ['inscrevertm', 'inscrevertm2', 'desinscrever', 'desinscrevertm', 'cancelartm'];
  const supportAdminCommands = ['ticketaceitar', 'aceitarticket', 'suporteaceitar', 'ticket.aceitar'];
  const isSupportAdminCommand = supportAdminCommands.some(cmd => command === cmd);
  const isTm2Command = tm2Commands.some(cmd => command === cmd) || isSupportAdminCommand;
  
  // Se for autorizado, libera
  if (isOwner || isPremium || isTm2Command) return false;

  const defaultMsg = antipvData.message || '🚫 Este comando só funciona em grupos!';

  // --- MODO 1: ANTIPV (Ignora e avisa) ---
  if (antipvData.mode === 'antipv') {
    await reply(defaultMsg);
    return true;
  }
  
  // --- MODO 2: ANTIPV2 (Apenas comandos) ---
  if (antipvData.mode === 'antipv2') {
    if (isCmd) return false; // Permite se for comando
    // Se não for comando, ignora silenciosamente ou avisa? 
    // Geralmente antipv2 permite comandos e ignora conversa fiada.
    return true; 
  }
  
  // --- MODO 3: ANTIPV3 (Silencioso) ---
  if (antipvData.mode === 'antipv3') {
    return true; // Apenas ignora sem responder nada
  }
  
  // --- MODO 4: ANTIPV4 (Bloqueio total) ---
  if (antipvData.mode === 'antipv4') {
    await reply(defaultMsg + '\n\n⚠️ Você será bloqueado.');
    await new Promise(r => setTimeout(r, 2000));
    await nazu.updateBlockStatus(sender, 'block');
    return true;
  }

  return false;
}
