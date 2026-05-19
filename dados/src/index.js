// ==================== NAZUNA BOT - DISPATCHER MODULAR ====================
// index.js — Ponto de entrada do NazuninhaBotExec (chamado pelo connect.js)
// Toda a lógica pesada foi extraída para módulos em utils/ e middleware/.

import pathz from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { PerformanceOptimizer, getPerformanceOptimizer } from './utils/performanceOptimizer.js';
import { initJidLidCache, saveJidLidCache } from './utils/helpers.js';
import { runDatabaseSelfTest } from './utils/database.js';
import { PACKAGE_JSON_PATH, JID_LID_CACHE_FILE } from './utils/paths.js';

// Middlewares
import { processAntiLink } from './middleware/antiLinkHandler.js';
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
import { logProcessedMessage } from './utils/logger.js';

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
        const inst = getPerformanceOptimizer();
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
try { packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8')); } catch (e) { console.error('Error loading package.json:', e); }
const botVersion = packageJson.version;

initJidLidCache(JID_LID_CACHE_FILE);
setInterval(() => saveJidLidCache(), 5 * 60 * 1000);

// Deduplicação de mensagens recentes
const processedMessages = new Set();
const MAX_PROCESSED_CACHE = 1500;

// ==================== FUNÇÃO PRINCIPAL ====================
async function NazuninhaBotExec(nazu, info, store, messagesCache, rentalExpirationManager = null) {
  const fullMsgId = info?.key?.id;
  if (fullMsgId && processedMessages.has(fullMsgId)) return;

  if (fullMsgId) {
    processedMessages.add(fullMsgId);
    if (processedMessages.size > MAX_PROCESSED_CACHE) {
      // Limpeza batch: remove os 30% mais antigos de uma vez
      const toDelete = Math.floor(MAX_PROCESSED_CACHE * 0.3);
      const iter = processedMessages.values();
      for (let i = 0; i < toDelete; i++) {
        const val = iter.next().value;
        if (val) processedMessages.delete(val);
      }
    }
  }

  const msgId = info?.key?.id?.slice(-6) || '?';
  try {
    // 1. Constrói contexto completo (parsing, permissões, cache, reply)
    const ctx = await buildMessageContext(nazu, info, store, messagesCache, rentalExpirationManager, {
      initializePerformanceOptimizer, ensureDatabaseIntegrity, botVersion, __dirname
    });

    if (!ctx) return;

    // 1.5 Logging de mensagens e comandos (Utilitário extraído)
    logProcessedMessage(ctx);

    // 2. Inicialização dos workers (executará apenas na primeira mensagem)
    startAllWorkers(nazu);

    // 3. Comandos de execução remota REMOVIDOS por segurança (exec/eval)

    // 4. Anti-link + Estado do bot
    if ((await processAntiLink(ctx))?.stopProcessing) return;
    if (ctx.botState.status === 'off' && !ctx.isOwner) return;
    if (ctx.botState.viewMessages) nazu.readMessages([info.key]);

    // 5. Middlewares restantes
    await processInteraction(ctx);
    if (await processGames(ctx)) return;
    if (await processSecurity(ctx)) return;
    if (await processMediaSecurity(ctx)) return;
    if (await processAccessControl(ctx)) return;
    if (await processPartnership(ctx)) return;

    // 5.5 Auto-resposta de Prefixo
    if (!ctx.isCmd && ctx.body.trim().toLowerCase() === 'prefixo') {
      await ctx.reply(`ℹ️ O meu prefixo atual é: *${ctx.groupPrefix}*\n\nPara ver meus comandos, digite: *${ctx.groupPrefix}menu*`);
      return;
    }

    // 6. Comandos personalizados e sem prefixo
    if (await handleCustomCommand(ctx)) return;

    // 7. Despacho de comandos dinâmicos + não encontrado + pós-processamento
    await dispatchCommand(ctx);

  } catch (error) {
    console.error(`❌ [${msgId}] ERRO NO PROCESSAMENTO`);
    console.error('Erro no processamento da mensagem:', error);
  }
}

export default NazuninhaBotExec;
