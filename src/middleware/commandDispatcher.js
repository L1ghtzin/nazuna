// ==================== COMMAND DISPATCHER ====================
// Extraído do index.js - Despacha comandos dinâmicos e trata comando não encontrado.

import { execDynamicCommand } from '../utils/dynamicCommand.js';
import { Commands, getTotalCommands, getTopSimilarCommands } from '../utils/commandSearch.js';
import * as vipCommandsManager from '../utils/vipCommandsManager.js';
import { loadCmdNotFoundConfig, checkCommandLimit, loadMsgPrefix, loadCustomReacts, processAutoResponse } from '../utils/database.js';

export async function dispatchCommand(ctx) {
  const {
    isCmd, command, reply, bot, info, from, prefix, groupPrefix,
    pushname, sender, isOwner, isPremium, budy2, isAutoRepo, body,
    getUserName, args, q, MESSAGES
  } = ctx;

  // === LIMITES DE COMANDO ===
  if (isCmd && !['cmdlimitar', 'cmdlimit', 'limitarcmd', 'cmddeslimitar', 'cmdremovelimit', 'rmcmdlimit', 'cmdlimites', 'cmdlimits', 'listcmdlimites'].includes(command)) {
    const globalLimitCheck = checkCommandLimit(command, sender);
    if (globalLimitCheck.limited) { await reply(globalLimitCheck.message); return; }
  }

  // === VERIFICAÇÃO VIP ===
  if (isCmd && vipCommandsManager.isVipCommand(command) && !isPremium) {
    await reply(MESSAGES.middleware.commandDispatcher.vipOnly(prefix));
    return;
  }

  // === DESPACHO DINÂMICO ===
  if (isCmd) {
    const handledByDynamic = await execDynamicCommand(command, ctx);
    if (handledByDynamic) return;
  }

  // === COMANDO NÃO ENCONTRADO ===
  if (isCmd) {
    const cmdNotFoundConfig = loadCmdNotFoundConfig();
    if (cmdNotFoundConfig.enabled) {
      const userName = pushname || getUserName(sender);
      const commandName = command || body.trim().slice(groupPrefix.length).split(/ +/).shift().trim();
      const topSimilar = getTopSimilarCommands(commandName);
      const totalCommands = getTotalCommands();
      const messages = MESSAGES.middleware.commandDispatcher;
      
      let msg = messages.notFoundTotal(totalCommands);
      if (topSimilar.length > 0) {
        msg += messages.notFoundSimilarHeader;
        topSimilar.forEach((cmd, i) => {
          const bar = '▰'.repeat(Math.floor(cmd.similarity / 10)) + '▱'.repeat(10 - Math.floor(cmd.similarity / 10));
          msg += messages.similarityLine(i + 1, groupPrefix, cmd.command, cmd.similarity, bar);
        });
      } else {
        msg += messages.notFoundNoSimilar(groupPrefix);
      }
      msg += messages.notFoundFooter;
      
      try {
        await reply(msg);
        const topSim = topSimilar[0]?.similarity || 0;
        await bot.react(topSim > 60 ? '💡' : topSim > 0 ? '🔍' : '❌', { key: info.key });
      } catch (e) { await bot.react('⚠️', { key: info.key }); }
    } else {
      await bot.react('❌', { key: info.key });
    }
    return; // Evitar o pós-processamento (reacts, auto-repo) se já identificou que era um comando falho
  }

  // === PÓS-PROCESSAMENTO ===
  const msgPrefix = loadMsgPrefix();
  if (['prefix', 'prefixo'].includes(budy2) && msgPrefix) {
    await reply(msgPrefix.replace('#prefixo#', prefix));
  }

  const customReacts = loadCustomReacts();
  for (const react of customReacts) {
    if (budy2.includes(react.trigger)) {
      await bot.react(react.emoji, { key: info.key });
      break;
    }
  }

  if (!isCmd && isAutoRepo) {
    await processAutoResponse(bot, from, body, info);
  }
}
