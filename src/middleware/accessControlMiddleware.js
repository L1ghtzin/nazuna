import { isUserInMap } from '../utils/groupManager.js';
import { findInBlacklistMap } from '../utils/helpers.js';

/**
 * Middleware para sistemas de controle de acesso, blacklists e limites
 */
export async function processAccessControl({
  bot,
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
  isBotAdmin,
  MESSAGES
}) {
  // Verificação de usuários bloqueados no grupo
  if (isGroup && groupData.blockedUsers && (isUserInMap(groupData.blockedUsers, sender) || groupData.blockedUsers[getUserName(sender)]) && isCmd) {
    const blockedReason = groupData.blockedUsers[sender] ? groupData.blockedUsers[sender].reason : groupData.blockedUsers[getUserName(sender)].reason;
    await reply(MESSAGES.middleware.accessControl.blockedInGroup(blockedReason));
    return true;
  }

  // Blacklist Global
  const globalBlacklist = loadGlobalBlacklist();
  const globalBlacklistEntry = findInBlacklistMap(globalBlacklist.users, sender);
  if (isCmd && sender && globalBlacklistEntry) {
    const rawDate = globalBlacklistEntry.addedAt || globalBlacklistEntry.date || globalBlacklistEntry.timestamp || globalBlacklistEntry.createdAt;
    let dateStr = 'Desconhecida';
    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        dateStr = d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      }
    }
    await reply(MESSAGES.middleware.accessControl.globalBlacklist(globalBlacklistEntry.reason, globalBlacklistEntry.addedBy, dateStr));
    return true;
  }
  
  // Blacklist do Grupo
  const groupBlacklistEntry = findInBlacklistMap(groupData.blacklist, sender);
  if (isGroup && isCmd && groupBlacklistEntry) {
    const rawDate = groupBlacklistEntry.date || groupBlacklistEntry.timestamp || groupBlacklistEntry.createdAt;
    let dateStr = 'Desconhecida';
    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        dateStr = d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      }
    }
    await reply(MESSAGES.middleware.accessControl.groupBlacklist(groupBlacklistEntry.reason, dateStr));
    return true;
  }

  // Bloqueios Globais (User/Command)
  if (sender && sender.includes('@') && globalBlocks.users && (globalBlocks.users[sender] || globalBlocks.users[getUserName(sender)]) && isCmd) {
    const reason = globalBlocks.users[sender] ? globalBlocks.users[sender].reason : globalBlocks.users[getUserName(sender)].reason;
    await reply(MESSAGES.middleware.accessControl.globalBlocked(reason));
    return true;
  }

  if (isCmd && globalBlocks.commands && globalBlocks.commands[command]) {
    await reply(MESSAGES.middleware.accessControl.globalCommandDisabled(command, globalBlocks.commands[command].reason));
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
          await bot.groupParticipantsUpdate(from, [sender], 'remove');
          await reply(MESSAGES.middleware.accessControl.floodBanned(getUserName(sender), groupData.messageLimit.limit, groupData.messageLimit.interval), {
            mentions: [sender]
          });
          delete groupData.messageLimit.users[sender];
          return true;
        } else if (groupData.messageLimit.action === 'adv') {
          groupData.messageLimit.warnings[sender] = (groupData.messageLimit.warnings[sender] || 0) + 1;
          const warnings = groupData.messageLimit.warnings[sender];
          if (warnings >= 3 && isBotAdmin) {
            await bot.groupParticipantsUpdate(from, [sender], 'remove');
            await reply(MESSAGES.middleware.accessControl.floodBannedWarnings(getUserName(sender), groupData.messageLimit.limit, groupData.messageLimit.interval), {
              mentions: [sender]
            });
            delete groupData.messageLimit.warnings[sender];
            delete groupData.messageLimit.users[sender];
            return true;
          } else {
            await reply(MESSAGES.middleware.accessControl.floodWarning(getUserName(sender), groupData.messageLimit.limit, groupData.messageLimit.interval, warnings), {
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
