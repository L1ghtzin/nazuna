// ==================== COMMAND DISPATCHER ====================
// Extraído do index.js - Despacha comandos dinâmicos e trata comando não encontrado.

import { execDynamicCommand } from '../utils/dynamicCommand.js';
import { Commands, getTotalCommands, getTopSimilarCommands } from '../utils/commandSearch.js';
import * as vipCommandsManager from '../utils/vipCommandsManager.js';
import { loadCmdNotFoundConfig, checkCommandLimit, loadMsgPrefix, loadCustomReacts, processAutoResponse } from '../utils/database.js';

export async function dispatchCommand(ctx) {
  const {
    isCmd, command, reply, nazu, info, from, prefix, groupPrefix,
    pushname, sender, isOwner, isPremium, budy2, isAutoRepo, body,
    getUserName, args, q
  } = ctx;

  // === LIMITES DE COMANDO ===
  if (isCmd && !['cmdlimitar', 'cmdlimit', 'limitarcmd', 'cmddeslimitar', 'cmdremovelimit', 'rmcmdlimit', 'cmdlimites', 'cmdlimits', 'listcmdlimites'].includes(command)) {
    const globalLimitCheck = checkCommandLimit(command, sender);
    if (globalLimitCheck.limited) { await reply(globalLimitCheck.message); return; }
  }

  // === VERIFICAÇÃO VIP ===
  if (isCmd && vipCommandsManager.isVipCommand(command) && !isPremium) {
    await reply(`🔒 *Comando VIP Exclusivo*\n\nEste comando é apenas para usuários VIP/Premium!\n\n💎 Use ${prefix}menuvip para ver os comandos VIP!\n📞 Contate o dono: ${prefix}dono`);
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
      
      let msg = `📊 *Total de comandos:* ${totalCommands}\n\n`;
      if (topSimilar.length > 0) {
        msg += '💡 *Você quis dizer?*\n';
        topSimilar.forEach((cmd, i) => {
          const bar = '▰'.repeat(Math.floor(cmd.similarity / 10)) + '▱'.repeat(10 - Math.floor(cmd.similarity / 10));
          msg += `${i + 1}. ${groupPrefix}${cmd.command}\n   📊 ${cmd.similarity}% ${bar}\n\n`;
        });
      } else {
        msg += `💡 Nenhum similar encontrado\n✨ Use ${groupPrefix}menu para ver todos\n\n`;
      }
      msg += '💭 Verifique se digitou corretamente!';
      
      try {
        await reply(msg);
        const topSim = topSimilar[0]?.similarity || 0;
        await nazu.react(topSim > 60 ? '💡' : topSim > 0 ? '🔍' : '❌', { key: info.key });
      } catch (e) { await nazu.react('⚠️', { key: info.key }); }
    } else {
      await nazu.react('❌', { key: info.key });
    }
  }

  // === PÓS-PROCESSAMENTO ===
  const msgPrefix = loadMsgPrefix();
  if (['prefix', 'prefixo'].includes(budy2) && msgPrefix) {
    await reply(msgPrefix.replace('#prefixo#', prefix));
  }

  const customReacts = loadCustomReacts();
  for (const react of customReacts) {
    if (budy2.includes(react.trigger)) {
      await nazu.react(react.emoji, { key: info.key });
      break;
    }
  }

  if (!isCmd && isAutoRepo) {
    await processAutoResponse(nazu, from, body, info);
  }
}
