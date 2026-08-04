import { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, makeWASocket, isJidBroadcast, isJidStatusBroadcast, isJidNewsletter } from 'baileys';
import { Boom } from '@hapi/boom';
import NodeCache from 'node-cache';
import readline from 'readline';
import pino from 'pino';
import fs from 'fs/promises';
import path, { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';

// Filtro de ruído de console para silenciar avisos do libsignal/baileys (como fechamento de sessões)
const originalConsoleInfo = console.info.bind(console);
console.info = (...args) => {
    if (args[0] && typeof args[0] === 'string' && (
        args[0].includes('Closing session:') ||
        args[0].includes('Removing old closed session') ||
        args[0].includes('Closing stale open session')
    )) {
        return;
    }
    originalConsoleInfo(...args);
};

import RentalExpirationManager from './utils/rentalExpirationManager.js';
import { groupCache } from './utils/groupCache.js';
import { loadMsgBotOn } from './utils/database.js';
import db from './utils/database/io.js';
import { buildUserId, normalizeMessageContent } from './utils/helpers.js';
import { initCaptchaIndex } from './utils/captchaIndex.js';
import CaptchaIndex from './utils/captchaIndex.js';
import MessageQueue from './utils/messageQueue.js';
import { performMigration, updateOwnerLid, migrateBlacklists } from './utils/migration.js';
import { handleGroupParticipantsUpdate } from './handlers/groupParticipantsUpdate.js';
import { handleGroupJoinRequest } from './handlers/groupJoinRequest.js';
import { handleConnectionUpdate } from './handlers/connectionEvents.js';
import { handleMessagesUpdate, handleMessagesUpsert } from './handlers/messageEvents.js';
import { loadGroupData } from './utils/groupManager.js';
import { MESSAGES } from './utils/messages.js';
import { ensureModulesLoaded } from './funcs/exports.js';
import { processAntiStealth, registerMainBotReceivedMsg } from './middleware/antiStealth.js';
import { startWatcher } from './services/watcherService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Inicialização global de caches de segurança
global.CAPTCHA_LOCK = global.CAPTCHA_LOCK || new Set();



const messageQueue = new MessageQueue(8, 10, 2); // 8 workers, 10 lotes, 2 mensagens por lote

import config, { CONFIG_PATH as configPath } from './config.js';
let DEBUG_MODE = false; // Modo debug para logs detalhados

// Ativa modo debug se configurado
DEBUG_MODE = config.debug === true || process.env.CHAINY_DEBUG === '1' || process.env.NAZUNA_DEBUG === '1';
if (DEBUG_MODE) {
    console.log('🐛 Modo DEBUG ativado - Logs detalhados habilitados');
}

const indexModule = (await import('./index.js')).default ?? (await import('./index.js'));



const {
    prefixo,
    nomebot,
    nomedono,
    numerodono
} = config;

const rentalExpirationManager = new RentalExpirationManager(null, {
    ownerNumber: numerodono,
    ownerName: nomedono,
    checkInterval: '0 */6 * * *',
    warningDays: 3,
    finalWarningDays: 1,
    cleanupDelayHours: 24,
    enableNotifications: true,
    enableAutoCleanup: true,
    logFile: path.join(__dirname, '../logs/rental_expiration.log')
});

const logger = pino({
    level: 'error'
}, {
    write: (msgStr) => {
        try {
            const obj = JSON.parse(msgStr);
            if (obj.msg === 'failed to decrypt message' && obj.key && sock) {
                try {
                    console.log(`\n🛡️ [ANTI-STEALTH INTERCEPTOR] Falha de decriptação interceptada!`);
                    console.log(`👥 Grupo: ${obj.key.remoteJid}`);
                    console.log(`👤 Participante: ${obj.key.participant || obj.author || 'Desconhecido'}`);
                    console.log(`❌ Erro: ${obj.err?.message || obj.err || 'Chave duplicada ou não preenchida'}\n`);

                    // NOTA: NÃO chamamos mais registerMainBotReceivedMsg(obj.key.id) aqui!
                    // Isso impedia o Watcher de repassar a mensagem descriptografada.

                    const mockUpsert = {
                        type: 'notify',
                        messages: [
                            {
                                key: obj.key,
                                messageStubType: 2, // CIPHERTEXT
                                messageStubParameters: [obj.err?.message || obj.err || 'Key used already or never filled'],
                                messageTimestamp: Math.floor(Date.now() / 1000)
                            }
                        ]
                    };
                    processAntiStealth(sock, mockUpsert).catch(e => 
                        console.error('[ANTI-STEALTH] Erro no interceptador:', e)
                    );
                } catch (e) {
                    console.error('[ANTI-STEALTH] Erro crítico no interceptador de log:', e);
                }
            }
        } catch (e) {}
    }
});

const AUTH_DIR = path.join(__dirname, '..', 'dados', 'database', 'qr-code');
const WATCHER_AUTH_DIR = path.join(__dirname, '..', 'dados', 'database', 'watcher-qr-code');
const DATABASE_DIR = path.join(__dirname, '..', 'dados', 'database');
const GLOBAL_BLACKLIST_PATH = path.join(__dirname, '..', 'dados', 'database', 'dono', 'globalBlacklist.json');

let msgRetryCounterCache;
let messagesCache;
let sock = null;
let watcherSock = null;

const reconnectState = {
  reconnectAttempts: 0,
  isReconnecting: false,
  reconnectTimer: null,
  forbidden403Attempts: 0,
  MAX_RECONNECT_ATTEMPTS: 10,
  MAX_403_ATTEMPTS: 3,
  RECONNECT_DELAY_BASE: 5000,
  ownerMsgTimer: null,
  cacheCleanupInterval: null
};

async function initializeOptimizedCaches(ChainySock) {
    try {
        // Inicializa índice de captcha para busca rápida
        const requestCaptchaMsg = async (dataCaptcha) => {
            await ChainySock.sendMessage(dataCaptcha.groupId, { text: MESSAGES.middleware.captcha.expired(dataCaptcha.idOrigin.split('@')[0]), mentions: [dataCaptcha.idOrigin] });
            await ChainySock.groupParticipantsUpdate(dataCaptcha.groupId, [dataCaptcha.idOrigin], 'remove').catch(() => { });
        };
        await initCaptchaIndex(requestCaptchaMsg);

        msgRetryCounterCache = new NodeCache({
            stdTTL: 5 * 60,
            useClones: false
        });

        messagesCache = new Map();

    } catch (error) {
        console.error('❌ Erro ao inicializar caches:', error.message);

        msgRetryCounterCache = new NodeCache({
            stdTTL: 5 * 60,
            useClones: false
        });
        messagesCache = new Map();

    }
}
let codeMode = process.argv.includes('--code') || process.env.CHAINY_CODE_MODE === '1' || process.env.NAZUNA_CODE_MODE === '1';

// Cleanup otimizado do cache de mensagens
const setupMessagesCacheCleanup = () => {
    if (reconnectState.cacheCleanupInterval) clearInterval(reconnectState.cacheCleanupInterval);
    
    reconnectState.cacheCleanupInterval = setInterval(() => {
    if (!messagesCache || messagesCache.size <= 500) return;
    
    const keysToDelete = Math.floor(messagesCache.size * 0.4); // Remove 40% dos mais antigos
    const keys = Array.from(messagesCache.keys()).slice(0, keysToDelete);
    keys.forEach(key => messagesCache.delete(key));
    
    console.log(`🧹 Cache limpo: ${keysToDelete} mensagens removidas (total: ${messagesCache.size})`);
    }, 300000); // A cada 5 minutos
};



const ask = (question) => {
    const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
    });
    return new Promise((resolve) => rl.question(question, (answer) => {
    rl.close();
    resolve(answer.trim());
    }));
};

async function clearAuthDir(dirToRemove = AUTH_DIR) {
    // Mantém compatibilidade com múltiplas instâncias (ex: sub-bots) e com versões antigas do Node.
    try {
    const normalized = path.resolve(dirToRemove);

    // Guardrails: evita apagar diretórios perigosos.
    const rootPath = path.parse(normalized).root;
    if (normalized === rootPath) {
    console.error(`❌ Abortando limpeza: caminho inválido (${normalized})`);
    return;
    }

    const normalizedParts = normalized.split(path.sep).filter(Boolean);
    const looksLikeAuthDir = normalizedParts.includes('qr-code') || normalizedParts.includes('auth');
    if (!looksLikeAuthDir) {
    console.error(`❌ Abortando limpeza: caminho não parece diretório de auth/qr-code (${normalized})`);
    return;
    }

    if (typeof fs.rm === 'function') {
    await fs.rm(normalized, { recursive: true, force: true });
    } else if (typeof fs.rmdir === 'function') {
    // Node antigo: rmdir recursivo
    await fs.rmdir(normalized, { recursive: true }).catch(() => {});
    } else {
    throw new Error('API de remoção de diretório não disponível (fs.rm/fs.rmdir)');
    }

    console.log(`🗑️ Pasta de autenticação (${normalized}) excluída com sucesso.`);
    } catch (err) {
    console.error(`❌ Erro ao excluir pasta de autenticação (${dirToRemove}): ${err.message}`);
    }
}

// Busca a versão mais recente do WhatsApp via Baileys com cache persistente em disco, TTL (6h) e timeout.
const WA_VERSION_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 horas
const WA_VERSION_CACHE_FILE = path.join(__dirname, '../dados/database/wa_version_cache.json');
let _waVersionCache = null;

async function loadWAVersionCacheFromDisk() {
    if (_waVersionCache) return _waVersionCache;
    try {
        const saved = await db.readAsync(WA_VERSION_CACHE_FILE, null);
        if (saved && Array.isArray(saved.version)) {
            _waVersionCache = saved;
        }
    } catch {
        // Ignora erros de leitura inicial de cache
    }
    return _waVersionCache;
}

async function getWAVersion() {
    const now = Date.now();
    await loadWAVersionCacheFromDisk();

    // Se houver cache válido em memória/disco dentro do TTL de 6h, reaproveita
    if (_waVersionCache && (now - _waVersionCache.fetchedAt < WA_VERSION_CACHE_TTL)) {
        return _waVersionCache.version;
    }

    try {
        // Timeout de 7 segundos para evitar travamentos em conexões ou redes instáveis
        const fetchPromise = fetchLatestBaileysVersion();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout na consulta de versão Baileys')), 7000)
        );

        const { version } = await Promise.race([fetchPromise, timeoutPromise]);
        _waVersionCache = { version, fetchedAt: now };
        
        // Persiste a nova versão em disco
        db.queue(WA_VERSION_CACHE_FILE, _waVersionCache);

        return version;
    } catch (err) {
        // Se a busca remota falhar, tenta usar a versão salva no cache persistente (disco/memória)
        if (_waVersionCache?.version) {
            console.warn(`⚠️ Falha ao buscar nova versão do WhatsApp online (${err.message}). Usando versão salva no cache: ${_waVersionCache.version.join('.')}`);
            return _waVersionCache.version;
        }

        // Se nem o cache em disco existir, retorna undefined (Baileys usará sua versão interna padrão)
        console.warn(`⚠️ Falha ao buscar versão do WhatsApp online e nenhum cache foi encontrado (${err.message}). Usando versão padrão interna do Baileys.`);
        return undefined;
    }
}

async function createBotSocket(authDir) {
    try {
    await fs.mkdir(path.join(DATABASE_DIR, 'grupos'), { recursive: true });
    await fs.mkdir(authDir, { recursive: true });
    const {
    state,
    saveCreds,
    signalRepository
    } = await useMultiFileAuthState(authDir, makeCacheableSignalKeyStore);

    const hasSession = state.creds.me || state.creds.registered || existsSync(path.join(authDir, 'creds.json'));

    if (!hasSession && !codeMode) {
        console.log('\x1b[33m🔧 Escolha o método de conexão:\x1b[0m');
        console.log('\x1b[33m1. 📷 Conectar via QR Code\x1b[0m');
        console.log('\x1b[33m2. 🔑 Conectar via código de pareamento\x1b[0m');
        console.log('\x1b[33m3. 🚪 Sair\x1b[0m');
        
        const answer = await ask('➡️ Digite o número da opção desejada: ');
        console.log();
        
        switch (answer) {
            case '1':
                console.log('📷 Iniciando conexão via QR Code...');
                codeMode = false;
                break;
            case '2':
                console.log('🔑 Iniciando conexão via código de pareamento...');
                codeMode = true;
                break;
            case '3':
                console.log('👋 Encerrando... Até mais!');
                process.exit(0);
            default:
                console.log('⚠️ Opção inválida! Usando conexão via QR Code como padrão.');
                codeMode = false;
        }
    }
    
    // Busca a versão mais recente do WhatsApp
    // CORREÇÃO: Usa versão cacheada em vez de buscar na rede a cada reconexão.
    const version = await getWAVersion();
    console.log(`📱 Usando versão do WhatsApp: ${version ? version.join('.') : 'padrão (Baileys)'}`);
    
    const ChainySock = makeWASocket({
        version: version,
        auth: state,
        signalRepository,
        logger: logger,
        syncFullHistory: false,
        fireInitQueries: false,
        generateHighQualityLinkPreview: false
    });

    // Envelopamento do sendMessage para converter LIDs em JIDs em menções
    const originalSendMessage = ChainySock.sendMessage.bind(ChainySock);
    ChainySock.sendMessage = async (jid, content, options) => {
      const normalizedContent = normalizeMessageContent(content);
      return originalSendMessage(jid, normalizedContent, options);
    };

    sock = ChainySock;
    global.sockAdmin = ChainySock;
    groupCache.registerEvents(ChainySock);

    if (codeMode && !hasSession) {
    console.log('📱 Insira o número de telefone (com código de país, ex: +5511912345678 ou +554112345678): ');
    let phoneNumber = await ask('--> ');
    phoneNumber = phoneNumber.replace(/\D/g, '');
    if (!/^\d{10,15}$/.test(phoneNumber)) {
    console.log('⚠️ Número inválido! Use um número válido com código de país (ex: 551199999999).');
    process.exit(1);
    }
    const rawCode = await ChainySock.requestPairingCode(phoneNumber);
    const formattedCode = rawCode?.match(/.{1,4}/g)?.join('-') || rawCode;
    console.log(`🔑 Código de pareamento: ${formattedCode}`);
    console.log('📲 Envie este código no WhatsApp para autenticar o bot.');
    }

    ChainySock.ev.on('creds.update', saveCreds);

    ChainySock.ev.on('groups.update', async (updates) => {
    if (!Array.isArray(updates) || updates.length === 0) return;
    
    if (DEBUG_MODE) {
    console.log('\n🐛 ========== GROUPS UPDATE ==========');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('📊 Number of updates:', updates.length);
    updates.forEach((update, index) => {
        console.log(`\n--- Update ${index + 1} ---`);
        console.log('📦 Update data:', JSON.stringify(update, null, 2));
    });
    console.log('🐛 ====================================\n');
    }
    });

    ChainySock.ev.on('group-participants.update', async (inf) => {
    if (DEBUG_MODE) {
    console.log('\n🐛 ========== GROUP PARTICIPANTS UPDATE ==========');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('🆔 Group ID:', inf.id || inf.jid || 'unknown');
    console.log('⚡ Action:', inf.action);
    console.log('👥 Participants:', inf.participants);
    console.log('� Author:', inf.author || 'N/A');
    console.log('�📦 Full event data:', JSON.stringify(inf, null, 2));
    console.log('🐛 ================================================\n');
    }
    await handleGroupParticipantsUpdate(ChainySock, inf);
    });
    
    // Listener para solicitações de entrada em grupos (join requests)
    ChainySock.ev.on('group.join-request', async (inf) => {
    if (DEBUG_MODE) {
    console.log('\n🐛 ========== GROUP JOIN REQUEST ==========');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('🆔 Group ID:', inf.id);
    console.log('⚡ Action:', inf.action);
    console.log('👤 Participant:', inf.participant);
    console.log('📱 Participant Phone:', inf.participantPn);
    console.log('👮 Author:', inf.author);
    console.log('📝 Method:', inf.method);
    console.log('📦 Full event data:', JSON.stringify(inf, null, 2));
    console.log('🐛 ===========================================\n');
    }
    await handleGroupJoinRequest(ChainySock, inf);
    });

    const queueErrorHandler = async (item, error) => {
        console.error(`❌ Critical error processing message ${item.id}:`, error);
        
        console.error({
            messageId: item.id,
            errorType: error.constructor.name,
            errorMessage: error.message,
            stack: error.stack,
            messageTimestamp: item.timestamp,
            queueStatus: messageQueue.getStatus()
        });
    };

    messageQueue.setErrorHandler(queueErrorHandler);

    const processMessage = async (info) => {
    // Verifica se é uma solicitação de entrada (messageStubType no info, não em message)
    const isJoinRequest = info?.messageStubType === 172; // GROUP_MEMBERSHIP_JOIN_APPROVAL_REQUEST_NON_ADMIN_ADD
      
    // Solicitações de entrada não têm message, apenas messageStubType
    if (isJoinRequest) {
    // Cria um objeto message fake para o index.js processar
    info.message = {
        messageStubType: info.messageStubType,
        messageStubParameters: info.messageStubParameters
    };
    }
    
    if (!info || !info.message || !info.key?.remoteJid) {
    return;
    }
    
    // Cache da mensagem para uso posterior no processamento (anti-delete, resumirchat, etc)
    if (messagesCache && info.key?.id && info.key?.remoteJid) {
    // Adicionar limite de inserção
    if (messagesCache.size >= 500) {
      const keysToDelete = Math.floor(messagesCache.size * 0.3);
      const keys = Array.from(messagesCache.keys()).slice(0, keysToDelete);
      keys.forEach(key => messagesCache.delete(key));
    }
    // Chave composta: remoteJid_messageId para permitir filtrar por grupo
    const cacheKey = `${info.key.remoteJid}_${info.key.id}`;
    messagesCache.set(cacheKey, info);
    }
    
    // Processa mensagem
    if (typeof indexModule === 'function') {
    await indexModule(ChainySock, info, null, messagesCache, rentalExpirationManager);
    } else {
    throw new Error('Módulo index.js não é uma função válida. Verifique o arquivo index.js.');
    }
    };

    const mainHandlers = { messageQueue, processMessage };

    global.dispatchMainBotUpsert = async (upsertPayload) => {
        const mainSock = global.sockAdmin || ChainySock;
        if (mainSock && upsertPayload) {
            await handleMessagesUpsert(mainSock, upsertPayload, mainHandlers).catch(err => {
                console.error('[MAIN-BOT-UPSERT] Erro ao processar mensagens repassadas pelo Watcher:', err);
            });
        }
    };

    const attachMessagesListener = () => {
    if (ChainySock.messagesListenerAttached) return;
    ChainySock.messagesListenerAttached = true;

    ChainySock.ev.on('messages.update', async (updates) => {
        await handleMessagesUpdate(ChainySock, updates);
    });

    ChainySock.ev.on('messages.upsert', async (m) => {
        await handleMessagesUpsert(ChainySock, m, mainHandlers);
    });
    };

    ChainySock.ev.on('connection.update', async (update) => {
        await handleConnectionUpdate(ChainySock, update, {
            AUTH_DIR,
            codeMode,
            numerodono,
            config,
            configPath,
            rentalExpirationManager,
            attachMessagesListener,
            setupMessagesCacheCleanup,
            initializeOptimizedCaches,
            DATABASE_DIR,
            reconnectState,
            startChainy,
            clearAuthDir,
            authDir: AUTH_DIR
        });
    });
    return ChainySock;
    } catch (err) {
    console.error(`❌ Erro ao criar socket do bot: ${err.message}`);
    throw err;
    }
}



async function startChainy() {
    // Evita múltiplas instâncias sendo criadas ao mesmo tempo
    if (reconnectState.isReconnecting) {
        console.log('⚠️ Reconexão já em andamento, ignorando chamada duplicada...');
        return;
    }

    reconnectState.isReconnecting = true;

    try {
        console.log('🚀 Iniciando Chainy...');

        // Garante que todos os módulos assíncronos (downloads, utils, private)
        // estão carregados antes de aceitar mensagens.
        await ensureModulesLoaded();

        await createBotSocket(AUTH_DIR);
        
        // Inicializa o Sensor Watcher em segundo plano se houver credenciais salvas
        const watcherCredsExist = existsSync(path.join(WATCHER_AUTH_DIR, 'creds.json'));
        if (watcherCredsExist) {
            startWatcher(false).catch(err => console.error('👁️ [WATCHER] Erro ao autoiniciar Watcher:', err));
        }
        // isReconnecting = false é feito no finally abaixo
    } catch (err) {
        reconnectState.reconnectAttempts++;
        console.error(`❌ Erro ao iniciar o bot (tentativa ${reconnectState.reconnectAttempts}/${reconnectState.MAX_RECONNECT_ATTEMPTS}): ${err.message}`);

        // Se excedeu tentativas, para de tentar
        if (reconnectState.reconnectAttempts >= reconnectState.MAX_RECONNECT_ATTEMPTS) {
            console.error(`❌ Máximo de tentativas de reconexão alcançado (${reconnectState.MAX_RECONNECT_ATTEMPTS}). Parando...`);
            process.exit(1);
        }

        // Delay exponencial (backoff) para evitar spam de conexões
        const delay = Math.min(reconnectState.RECONNECT_DELAY_BASE * Math.pow(1.5, reconnectState.reconnectAttempts - 1), 60000);
        console.log(`🔄 Aguardando ${Math.round(delay / 1000)} segundos antes de tentar novamente...`);

        // Cancela timer anterior se existir
        if (reconnectState.reconnectTimer) {
            clearTimeout(reconnectState.reconnectTimer);
        }

        reconnectState.reconnectTimer = setTimeout(() => {
            startChainy();
        }, delay);
    } finally {
        // CORREÇÃO: isReconnecting sempre liberado aqui — tanto em sucesso quanto em erro.
        reconnectState.isReconnecting = false;
    }
}

/**
 * Função unificada para desligamento gracioso
 */
async function gracefulShutdown(signal) {
    const signalName = signal === 'SIGTERM' ? 'SIGTERM' : 'SIGINT';
    console.log(`📡 ${signalName} recebido, parando bot graciosamente...`);
    
    // Cancela qualquer timer de reconexão pendente
    if (reconnectState.reconnectTimer) {
    clearTimeout(reconnectState.reconnectTimer);
    reconnectState.reconnectTimer = null;
    }
    reconnectState.isReconnecting = false;
    
    let shutdownTimeout;
    
    // Timeout de segurança para forçar saída após 15 segundos
    shutdownTimeout = setTimeout(() => {
    console.error('⚠️ Timeout de shutdown, forçando saída...');
    process.exit(1);
    }, 15000);
    
    try {
        // Fecha conexão do socket graciosamente
        if (sock) {
            console.log('🔌 Fechando conexão com o WhatsApp...');
            sock.end(undefined);
            sock = null;
        }
        if (watcherSock) {
            console.log('🔌 Fechando conexão do Sensor (Watcher)...');
            watcherSock.end(undefined);
            watcherSock = null;
            global.sockWatcher = null;
        }

    // Limpa recursos
    if (reconnectState.cacheCleanupInterval) {
    clearInterval(reconnectState.cacheCleanupInterval);
    reconnectState.cacheCleanupInterval = null;
    }
    
    // Finaliza fila de mensagens
    await messageQueue.shutdown();
    console.log('✅ MessageQueue finalizado');
    
    clearTimeout(shutdownTimeout);
    console.log('✅ Desligamento concluído');
    process.exit(0);
    } catch (error) {
      console.error('❌ Erro durante desligamento:', error.message);
      clearTimeout(shutdownTimeout);
      process.exit(1);
    }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', async (error) => {
    console.error('🚨 Erro não capturado — reiniciando processo:', error.message);
    console.error(error.stack);
    
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Promise rejeitada sem tratamento:', reason);
});

export { rentalExpirationManager, messageQueue, startWatcher };

startChainy();