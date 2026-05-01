// ==================== NAZUNA BOT - DISPATCHER MODULAR ====================
// index.js — Ponto de entrada do NazuninhaBotExec (chamado pelo connect.js)
// Toda a lógica pesada foi extraída para módulos em utils/ e middleware/.

import { exec } from 'child_process';
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
try { packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8')); } catch (e) { }
const botVersion = packageJson.version;

initJidLidCache(JID_LID_CACHE_FILE);
setInterval(() => saveJidLidCache(), 5 * 60 * 1000);

// Deduplicação de mensagens recentes
const processedMessages = new Set();
const MAX_PROCESSED_CACHE = 200;

// ==================== FUNÇÃO PRINCIPAL ====================
async function NazuninhaBotExec(nazu, info, store, messagesCache, rentalExpirationManager = null) {
  const fullMsgId = info?.key?.id;
  if (fullMsgId && processedMessages.has(fullMsgId)) return;

  if (fullMsgId) {
    processedMessages.add(fullMsgId);
    if (processedMessages.size > MAX_PROCESSED_CACHE) {
      const firstValue = processedMessages.values().next().value;
      processedMessages.delete(firstValue);
    }
  }

  const msgId = info?.key?.id?.slice(-6) || '?';
  try {
    // 1. Constrói contexto completo (parsing, permissões, cache, reply)
    const ctx = await buildMessageContext(nazu, info, store, messagesCache, rentalExpirationManager, {
      initializePerformanceOptimizer, ensureDatabaseIntegrity, botVersion, __dirname
    });

    if (!ctx) return;

        // === LOGGING DE MENSAGENS E COMANDOS (ALINHADO)
        try {
          if (ctx.body && ctx.body.length > 1) {
            const timestamp = new Date().toLocaleTimeString('pt-BR', {
              hour12: false,
              timeZone: 'America/Sao_Paulo'
            });
            const messageType = ctx.isCmd ? 'COMANDO' : 'MENSAGEM';
            const context = ctx.isGroup ? 'GRUPO' : 'PRIVADO';
            const messagePreview = ctx.isCmd ? `${ctx.prefix}${ctx.command}${ctx.q ? ` ${ctx.q.substring(0, 25)}${ctx.q.length > 25 ? '...' : ''}` : ''}` : ctx.body.substring(0, 35) + (ctx.body.length > 35 ? '...' : '');

            // Função para calcular largura visual real (emojis = 2, texto/símbolos = 1)
            const getVisualWidth = (str) => {
              let width = 0;
              for (const char of str) {
                const cp = char.codePointAt(0);
                // Wide characters (Emojis e afins)
                if ((cp >= 0x1F300 && cp <= 0x1F9FF) || (cp >= 0x2600 && cp <= 0x27BF) || (cp >= 0x1F600 && cp <= 0x1F64F)) {
                  width += 2;
                } else {
                  width += 1;
                }
              }
              return width;
            };

            const boxWidth = 40;
            const formatLine = (label, content, icon = '') => {
              const prefix = `┃ ${icon}${icon ? ' ' : ''}${label}: ${content}`;
              const visualWidth = getVisualWidth(prefix);
              const padding = Math.max(0, boxWidth - visualWidth - 1);
              return `${prefix}${' '.repeat(padding)}┃`;
            };

            const titleLine = `┃ ${messageType} [${context}]`;
            const titlePadding = Math.max(0, boxWidth - getVisualWidth(titleLine) - 1);

            console.log('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
            console.log(`${titleLine}${' '.repeat(titlePadding)}┃`);
            console.log('┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫');
            console.log(formatLine('Conteúdo', messagePreview.substring(0, 25), '📜'));
            if (ctx.isGroup) {
              console.log(formatLine('Grupo', (ctx.groupName || 'Desconhecido').substring(0, 25), '👥'));
              console.log(formatLine('Usuário', (ctx.pushname || 'Sem Nome').substring(0, 25), '👤'));
            } else {
              console.log(formatLine('Usuário', (ctx.pushname || 'Sem Nome').substring(0, 25), '👤'));
              console.log(formatLine('Número', ctx.getUserName(ctx.sender).substring(0, 25), '📱'));
            }
            console.log('┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫');
            console.log(formatLine('Data/Hora', timestamp, '🕒'));
            console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n');
          }
        } catch (error) {
          console.error('┃ 🚨 Erro ao gerar logs:', error);
        }

    // 2. Inicialização dos workers (executará apenas na primeira mensagem)
    startAllWorkers(nazu);

    // 3. Eval do dono ($ e >>)
    if (ctx.body.startsWith('$') && ctx.isOwner) {
      const shellCmd = ctx.body.slice(1).trim();
      if (!shellCmd) return;
      exec(shellCmd, (err, stdout) => {
        if (err) return ctx.reply(`❌ *Erro na execução*\n\n${String(err)}`);
        if (stdout) ctx.reply(`✅ *Resultado da execução*\n\n${stdout}`);
      });
      return;
    }
    if (ctx.body.startsWith('>>') && ctx.isOwner) {
      try {
        const codeLines = ctx.body.slice(2).trim().split('\n');
        if (codeLines.length > 1) {
          if (!codeLines[codeLines.length - 1].includes('return')) {
            codeLines[codeLines.length - 1] = 'return ' + codeLines[codeLines.length - 1];
          }
        } else {
          if (!codeLines[0].includes('return')) {
            codeLines[0] = 'return ' + codeLines[0];
          }
        }
        const result = await eval(`(async () => { ${codeLines.join('\n')} })()`);

        let output;
        if (typeof result === 'object' && result !== null) {
          output = JSON.stringify(result, null, 2);
        } else if (typeof result === 'function') {
          output = result.toString();
        } else {
          output = String(result);
        }

        await ctx.reply(`✅ *Resultado da execução*\n\n${output}`).catch(e => ctx.reply(String(e)));
      } catch (e) {
        await ctx.reply(`❌ *Erro na execução*\n\n${String(e)}`);
      }
      return;
    }

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
