import {
  addCommandLimit,
  removeCommandLimit,
  getCommandLimits,
  checkCommandLimit,
  formatTimeLeft
} from '../../utils/database.js';
import { MESSAGES } from '../../utils/messages.js';

async function cmdLimitAdd(bot, from, q, reply, prefix, isOwnerOrSub) {
  if (!isOwnerOrSub) return reply(MESSAGES.funcs.cmdLimit.onlyOwnerLimit);
  
  const args = q.split(' ');
  if (args.length < 3) {
    return reply(MESSAGES.funcs.cmdLimit.invalidFormat(prefix));
  }
  
  const commandName = args[0];
  const maxUses = parseInt(args[1]);
  const timeFrame = args[2];
  
  const result = addCommandLimit(commandName, maxUses, timeFrame);
  return reply(result.message);
}

async function cmdLimitRemove(bot, from, q, reply, prefix, isOwnerOrSub) {
  if (!isOwnerOrSub) return reply(MESSAGES.funcs.cmdLimit.onlyOwnerRemoveLimit);
  
  if (!q) {
    return reply(MESSAGES.funcs.cmdLimit.specifyCommand(prefix));
  }
  
  const result = removeCommandLimit(q.trim());
  return reply(result.message);
}

async function cmdLimitList(bot, from, q, reply, prefix, isOwnerOrSub) {
  if (!isOwnerOrSub) return reply(MESSAGES.funcs.cmdLimit.onlyOwnerViewLimits);
  
  const limits = getCommandLimits();
  const commandNames = Object.keys(limits);
  
  if (commandNames.length === 0) {
    return reply(MESSAGES.funcs.cmdLimit.noLimits);
  }
  
  let message = MESSAGES.funcs.cmdLimit.listHeader;
  
  for (const cmdName of commandNames) {
    const limit = limits[cmdName];
    
    message += `• *${prefix}${cmdName}*\n`;
    message += `  📊 Máx por usuário: ${limit.maxUses}\n`;
    message += `  ⏰ Período: ${limit.timeFrame}\n`;
    message += `  🎯 Sistema: Por usuário\n`;
    message += `  📅 Criado: ${new Date(limit.createdAt).toLocaleDateString('pt-BR')}\n\n`;
  }
  
  message += MESSAGES.funcs.cmdLimit.listFooter;
  
  return reply(message);
}

export {
  cmdLimitAdd,
  cmdLimitRemove,
  cmdLimitList
};