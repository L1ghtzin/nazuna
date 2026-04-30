import { isUserInMap } from '../utils/groupManager.js';

/**
 * Middleware para sistemas de controle de acesso, blacklists e limites
 */
export async function processAccessControl({
  nazu,
  from,
  sender,
  isGroup,
  isGroupAdmin,
  isOwner,
  isOwnerOrSub,
  isCmd,
  command,
  info,
  groupData,
  getUserName,
  reply,
  loadGlobalBlacklist,
  globalBlocks,
  isBotAdmin
}) {
  // Verificação de usuários bloqueados no grupo
  if (isGroup && groupData.blockedUsers && (isUserInMap(groupData.blockedUsers, sender) || groupData.blockedUsers[getUserName(sender)]) && isCmd) {
    const blockedReason = groupData.blockedUsers[sender] ? groupData.blockedUsers[sender].reason : groupData.blockedUsers[getUserName(sender)].reason;
    await reply(`🚫 Você não tem permissão para usar comandos neste grupo.\nMotivo: ${blockedReason}`);
    return true;
  }

  // Blacklist Global
  const globalBlacklist = loadGlobalBlacklist();
  if (isCmd && sender && globalBlacklist.users && (isUserInMap(globalBlacklist.users, sender) || globalBlacklist.users[getUserName(sender)])) {
    const blacklistEntry = globalBlacklist.users[sender] || globalBlacklist.users[getUserName(sender)];
    await reply(`🚫 Você está na blacklist global e não pode usar comandos.\nMotivo: ${blacklistEntry.reason}\nAdicionado por: ${blacklistEntry.addedBy}\nData: ${new Date(blacklistEntry.addedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    return true;
  }
  
  // Blacklist do Grupo
  if (isGroup && isCmd && groupData.blacklist && (groupData.blacklist[sender] || groupData.blacklist[getUserName(sender)])) {
    const blacklistEntry = groupData.blacklist[sender] || groupData.blacklist[getUserName(sender)];
    await reply(`🚫 Você está na blacklist deste grupo e não pode usar comandos.\nMotivo: ${blacklistEntry.reason}\nData: ${new Date(blacklistEntry.timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    return true;
  }

  // Bloqueios Globais (User/Command)
  if (sender && sender.includes('@') && globalBlocks.users && (globalBlocks.users[sender] || globalBlocks.users[getUserName(sender)]) && isCmd) {
    await reply(`🚫 Parece que você está bloqueado de usar meus comandos globalmente.\nMotivo: ${globalBlocks.users[sender] ? globalBlocks.users[sender].reason : globalBlocks.users[getUserName(sender)].reason}`);
    return true;
  }

  if (isCmd && globalBlocks.commands && globalBlocks.commands[command]) {
    await reply(`🚫 O comando *${command}* está temporariamente desativado globalmente.\nMotivo: ${globalBlocks.commands[command].reason}`);
    return true;
  }

  // AntiFlood (Limite de mensagens)
  if (isGroup && groupData.messageLimit?.enabled && !isGroupAdmin && !isOwnerOrSub && !info.key.fromMe) {
    try {
      groupData.messageLimit.warnings = groupData.messageLimit.warnings || {};
      groupData.messageLimit.users = groupData.messageLimit.users || {};
      const now = Date.now();
      const userData = groupData.messageLimit.users[sender] || {
        count: 0,
        lastReset: now
      };

      if (now - userData.lastReset >= groupData.messageLimit.interval * 1000) {
        userData.count = 0;
        userData.lastReset = now;
      }

      userData.count++;
      groupData.messageLimit.users[sender] = userData;

      if (userData.count > groupData.messageLimit.limit) {
        if (groupData.messageLimit.action === 'ban' && isBotAdmin) {
          await nazu.groupParticipantsUpdate(from, [sender], 'remove');
          await reply(`🚨 @${getUserName(sender)} foi banido por exceder o limite de ${groupData.messageLimit.limit} mensagens em ${groupData.messageLimit.interval}s!`, {
            mentions: [sender]
          });
          delete groupData.messageLimit.users[sender];
          return true;
        } else if (groupData.messageLimit.action === 'adv') {
          groupData.messageLimit.warnings[sender] = (groupData.messageLimit.warnings[sender] || 0) + 1;
          const warnings = groupData.messageLimit.warnings[sender];
          if (warnings >= 3 && isBotAdmin) {
            await nazu.groupParticipantsUpdate(from, [sender], 'remove');
            await reply(`🚨 @${getUserName(sender)} foi banido por exceder o limite de mensagens (${groupData.messageLimit.limit} em ${groupData.messageLimit.interval}s) 3 vezes!`, {
              mentions: [sender]
            });
            delete groupData.messageLimit.warnings[sender];
            delete groupData.messageLimit.users[sender];
            return true;
          } else {
            await reply(`⚠️ @${getUserName(sender)}, você excedeu o limite de ${groupData.messageLimit.limit} mensagens em ${groupData.messageLimit.interval}s! Advertência ${warnings}/3.`, {
              mentions: [sender]
            });
            return true;
          }
        }
      }
    } catch (e) {
      console.error("Erro no sistema de limite de mensagens:", e);
    }
  }

  return false;
}
