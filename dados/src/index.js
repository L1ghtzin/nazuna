// ==================== NAZUNA BOT - DISPATCHER MODULAR ====================
// index.js — Ponto de entrada do NazuninhaBotExec (chamado pelo connect.js)
// Toda a lógica pesada foi extraída para módulos em utils/ e middleware/.

import { exec } from 'child_process';
import pathz from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { PerformanceOptimizer } from './utils/performanceOptimizer.js';
import { initJidLidCache, saveJidLidCache } from './utils/helpers.js';
import { runDatabaseSelfTest } from './utils/database.js';
import { PACKAGE_JSON_PATH, JID_LID_CACHE_FILE } from './utils/paths.js';

// Middlewares
import { processReactionMessage } from './middleware/reactionHandler.js';
import { processAntiLink } from './middleware/antiLinkHandler.js';
import { processGroupSecurity } from './middleware/groupSecurityHandler.js';
import { processAutomation } from './middleware/automationHandler.js';
import { processStats } from './middleware/statsHandler.js';
import { processInteraction } from './middleware/interactionHandler.js';
import { processGames } from './middleware/gameHandler.js';
import { processSecurity } from './middleware/securityMiddleware.js';
import { processAccessControl } from './middleware/accessControlMiddleware.js';
import { processMediaSecurity } from './middleware/mediaSecurityMiddleware.js';
import { processPartnership } from './middleware/partnershipMiddleware.js';
import { startAllWorkers } from './workers/index.js';

// Módulos extraídos
import { buildMessageContext } from './utils/contextBuilder.js';
import { handleCustomCommand } from './middleware/customCommandHandler.js';
import { dispatchCommand } from './middleware/commandDispatcher.js';

// ==================== INICIALIZAÇÃO ====================
const __filename = fileURLToPath(import.meta.url);
const __dirname = pathz.dirname(__filename);

let performanceOptimizerInstance = null;
let performanceOptimizerInitPromise = null;
async function initializePerformanceOptimizer() {
  if (performanceOptimizerInstance) return performanceOptimizerInstance;
  if (!performanceOptimizerInitPromise) {
    performanceOptimizerInitPromise = (async () => {
      try {
        const inst = new PerformanceOptimizer();
        await inst.initialize();
        performanceOptimizerInstance = inst;
        return inst;
      } catch (e) {
        console.error('Falha PerformanceOptimizer:', e.message);
        performanceOptimizerInstance = null;
        return null;
      }
    })();
  }
  const inst = await performanceOptimizerInitPromise;
  if (!inst) performanceOptimizerInitPromise = null;
  return inst;
}
initializePerformanceOptimizer();

let dbTestResult = null;
const ensureDatabaseIntegrity = ({ log = false, force = false } = {}) => {
  if (force || log || !dbTestResult) dbTestResult = runDatabaseSelfTest({ log });
  return dbTestResult;
};
ensureDatabaseIntegrity();

let packageJson = {};
try { packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8')); } catch (e) {}
const botVersion = packageJson.version;

initJidLidCache(JID_LID_CACHE_FILE);
setInterval(() => saveJidLidCache(), 5 * 60 * 1000);

// ==================== FUNÇÃO PRINCIPAL ====================
async function NazuninhaBotExec(nazu, info, store, messagesCache, rentalExpirationManager = null) {
  const msgId = info?.key?.id?.slice(-6) || '?';
  try {
    // 1. Constrói contexto completo (parsing, permissões, cache, reply)
    const ctx = await buildMessageContext(nazu, info, store, messagesCache, rentalExpirationManager, {
      initializePerformanceOptimizer, ensureDatabaseIntegrity, botVersion, __dirname
    });
    if (!ctx) return;

    // 2. Pre-checks (já computados no contextBuilder)
    if (ctx.joinRequestHandled) return;
    if (ctx.captchaHandled) return;
    if (ctx.pvBlocked) return;
    if (ctx.isGroup && ctx.banGpIds[ctx.from] && !ctx.isOwner && !ctx.isPremium) return;

    // 3. Reações
    if (ctx.type === 'reactionMessage') {
      await processReactionMessage(ctx);
      return;
    }

    // 4. Segurança de grupo
    if ((await processGroupSecurity(ctx))?.stopProcessing) return;
    await processStats(ctx);

    // 5. Workers
    startAllWorkers(nazu);

    // 6. Automação (auto-download, anti-flood, etc.)
    if ((await processAutomation(ctx))?.stopProcessing) return;

    // 7. Eval do dono ($ e >>)
    if (ctx.body.startsWith('$') && ctx.isOwner) {
      exec(ctx.q, (err, stdout) => {
        if (err) return ctx.reply(`❌ *Erro*\n\n${err}`);
        if (stdout) ctx.reply(`✅ *Resultado*\n\n${stdout}`);
      });
      return;
    }
    if (ctx.body.startsWith('>>') && ctx.isOwner) {
      try {
        const code = ctx.body.slice(2).trim();
        const result = await eval(`(async () => { return ${code} })()`);
        await ctx.reply(`✅ *Resultado*\n\n${typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}`);
      } catch (e) { await ctx.reply(`❌ *Erro*\n\n${e}`); }
      return;
    }

    // 8. Anti-link + Estado do bot
    if ((await processAntiLink(ctx))?.stopProcessing) return;
    if (ctx.botState.status === 'off' && !ctx.isOwner) return;
    if (ctx.botState.viewMessages) nazu.readMessages([info.key]);

    // 9. Middlewares restantes
    await processInteraction(ctx);
    if (await processGames(ctx)) return;
    if (await processSecurity(ctx)) return;
    if (await processMediaSecurity(ctx)) return;
    if (await processAccessControl(ctx)) return;
    if (await processPartnership(ctx)) return;

    // 10. Comandos personalizados e sem prefixo
    if (await handleCustomCommand(ctx)) return;

    // 11. Despacho de comandos dinâmicos + não encontrado + pós-processamento
    await dispatchCommand(ctx);

  } catch (error) {
    console.error(`❌ [${msgId}] ERRO NO PROCESSAMENTO`);
    console.error('Tipo:', error.name, '| Msg:', error.message);
    console.error('Stack:', error.stack);
  }
}

export default NazuninhaBotExec;
