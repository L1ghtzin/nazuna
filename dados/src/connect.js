import { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, makeWASocket } from 'baileys';
import { Boom } from '@hapi/boom';
import NodeCache from 'node-cache';
import readline from 'readline';
import pino from 'pino';
import fs from 'fs/promises';
import path, { dirname, join } from 'path';
import qrcode from 'qrcode-terminal';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';


import PerformanceOptimizer from './utils/performanceOptimizer.js';
import RentalExpirationManager from './utils/rentalExpirationManager.js';
import { loadMsgBotOn } from './utils/database.js';
import { buildUserId } from './utils/helpers.js';
import { initCaptchaIndex, loadCaptchaJson, saveCaptchaJson } from './utils/captchaIndex.js';
import CaptchaIndex from './utils/captchaIndex.js';
import MessageQueue from './utils/messageQueue.js';
import { performMigration, updateOwnerLid } from './utils/migration.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Inicialização global de caches de segurança
global.CAPTCHA_LOCK = global.CAPTCHA_LOCK || new Set();



const messageQueue = new MessageQueue(8, 10, 2); // 8 workers, 10 lotes, 2 mensagens por lote

const configPath = path.join(__dirname, "config.json");
let config;
let DEBUG_MODE = false; // Modo debug para logs detalhados

// Validação de configuração
try {
    const configContent = readFileSync(configPath, "utf8");
    config = JSON.parse(configContent);
    
    // Valida campos obrigatórios
    if (!config.prefixo || !config.nomebot || !config.numerodono) {
    throw new Error('Configuração inválida: campos obrigatórios ausentes (prefixo, nomebot, numerodono)');
    }
    
    // Ativa modo debug se configurado
    DEBUG_MODE = config.debug === true || process.env.NAZUNA_DEBUG === '1';
    if (DEBUG_MODE) {
    console.log('🐛 Modo DEBUG ativado - Logs detalhados habilitados');
    }
} catch (err) {
    console.error(`❌ Erro ao carregar configuração: ${err.message}`);
    process.exit(1);
}

const indexModule = (await import('./index.js')).default ?? (await import('./index.js'));

const performanceOptimizer = new PerformanceOptimizer();

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
    level: 'silent'
});

const AUTH_DIR = path.join(__dirname, '..', 'database', 'qr-code');
const DATABASE_DIR = path.join(__dirname, '..', 'database');
const GLOBAL_BLACKLIST_PATH = path.join(__dirname, '..', 'database', 'dono', 'globalBlacklist.json');

let msgRetryCounterCache;
let messagesCache;

async function initializeOptimizedCaches(NazunaSock) {
    try {
        await performanceOptimizer.initialize();

        // Inicializa índice de captcha para busca rápida
        const requestCaptchaMsg = async (dataCaptcha) => {
            /*
                Vai receber apenas os ids expirados
            */
            await NazunaSock.sendMessage(dataCaptcha.groupId, { text: `⚠️ @${dataCaptcha.idOrigin.split('@')[0]} não resolveu o captcha a tempo e foi removido.` });
            await NazunaSock.groupParticipantsUpdate(dataCaptcha.groupId, [dataCaptcha.idOrigin], 'remove').catch(() => { });
        };
        await initCaptchaIndex(requestCaptchaMsg);

        msgRetryCounterCache = {
            get: (key) => performanceOptimizer.cacheGet('msgRetry', key),
            set: (key, value, ttl) => performanceOptimizer.cacheSet('msgRetry', key, value, ttl),
            del: (key) => performanceOptimizer.modules.cacheManager?.del('msgRetry', key)
        };

        messagesCache = new Map();

    } catch (error) {
        console.error('❌ Erro ao inicializar sistema de otimização:', error.message);

        msgRetryCounterCache = new NodeCache({
            stdTTL: 5 * 60,
            useClones: false
        });
        messagesCache = new Map();

    }
}
const codeMode = process.argv.includes('--code') || process.env.NAZUNA_CODE_MODE === '1';

// Cleanup otimizado do cache de mensagens
let cacheCleanupInterval = null;
const setupMessagesCacheCleanup = () => {
    if (cacheCleanupInterval) clearInterval(cacheCleanupInterval);
    
    cacheCleanupInterval = setInterval(() => {
    if (!messagesCache || messagesCache.size <= 3000) return;
    
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

async function loadGroupSettings(groupId) {
    const groupFilePath = path.join(DATABASE_DIR, 'grupos', `${groupId}.json`);
    try {
        return await performanceOptimizer.getCachedFile(groupFilePath, 30000, async (filePath) => {
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        });
    } catch (e) {
        console.error(`❌ Erro ao ler configurações do grupo ${groupId}: ${e.message}`);
        return {};
    }
}

async function loadGlobalBlacklist() {
    try {
        return await performanceOptimizer.getCachedFile(GLOBAL_BLACKLIST_PATH, 30000, async (filePath) => {
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data).users || {};
        });
    } catch (e) {
        console.error(`❌ Erro ao ler blacklist global: ${e.message}`);
        return {};
    }
}

function formatMessageText(template, replacements) {
    let text = template;
    for (const [key, value] of Object.entries(replacements)) {
    text = text.replaceAll(key, value);
    }
    return text;
}

async function createGroupMessage(NazunaSock, groupMetadata, participants, settings, isWelcome = true) {
    const jsonGp = await loadGroupSettings(groupMetadata.id);
    const mentions = participants.map(p => p);
    const bannerName = participants.length === 1 ? participants[0].split('@')[0] : `${participants.length} Membros`;
    const replacements = {
    '#numerodele#': participants.map(p => `@${p.split('@')[0]}`).join(', '),
    '#nomedogp#': groupMetadata.subject,
    '#desc#': groupMetadata.desc || 'Nenhuma',
    '#membros#': groupMetadata.participants.length,
    };
    const defaultText = isWelcome ?
    (jsonGp.textbv ? jsonGp.textbv : "╭━━━⊱ 🌟 *BEM-VINDO(A/S)!* 🌟 ⊱━━━╮\n│\n│ 👤 #numerodele#\n│\n│ 🏠 Grupo: *#nomedogp#*\n│ 👥 Membros: *#membros#*\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n✨ *Seja bem-vindo(a/s) ao grupo!* ✨") :
    (jsonGp.exit.text ? jsonGp.exit.text : "╭━━━⊱ 👋 *ATÉ LOGO!* 👋 ⊱━━━╮\n│\n│ 👤 #numerodele#\n│\n│ 🚪 Saiu do grupo\n│ *#nomedogp#*\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n💫 *Até a próxima!* 💫");
    const text = formatMessageText(settings.text || defaultText, replacements);
    const message = {
    text,
    mentions
    };
    if (settings.image) {
    let profilePicUrl = 'https://raw.githubusercontent.com/nazuninha/uploads/main/outros/1747053564257_bzswae.bin';
    if (participants.length === 1 && isWelcome) {
    profilePicUrl = await NazunaSock.profilePictureUrl(participants[0], 'image').catch(() => profilePicUrl);
    }
       
    const image = settings.image !== 'banner' ? {
    url: settings.image
    } : null;
    
    if (image) {
    message.image = image;
    message.caption = text;
    delete message.text;
    }
    }
    return message;
}

async function handleGroupParticipantsUpdate(NazunaSock, inf) {
    try {
        const from = inf.id || inf.jid || (inf.participants?.length
            ? inf.participants[0].split('@')[0] + '@s.whatsapp.net'
            : null);

        if (DEBUG_MODE) {
            console.log('🐛 [EVENTO]');
            console.log('📌 Grupo:', from);
            console.log('📌 Ação:', inf.action);
        }

        if (!from) return;
        if (!inf.participants?.length) return;

        const botId = NazunaSock.user.id.split(':')[0];

        inf.participants = inf.participants.map(isValidParticipant).filter(Boolean);
        if (inf.participants.some(p => p.startsWith(botId))) return;

        const groupMetadata = await NazunaSock.groupMetadata(from).catch(() => null);
        if (!groupMetadata) return;

        const groupSettings = await loadGroupSettings(from);
        const globalBlacklist = await loadGlobalBlacklist();
        const captchaData = await loadCaptchaJson();

        switch (inf.action) {


            case 'add': {
                // CAPTCHA_LOCK já inicializado globalmente no topo do arquivo

                const membersToWelcome = [];
                const membersToRemove = [];
                const removalReasons = [];

                const entradaPorLink = !inf.author || inf.participants.includes(inf.author);


                for (const participant of inf.participants) {

                    const userId = participant.split('@')[0];


                    if (globalBlacklist?.[participant]) {
                        membersToRemove.push(participant);
                        removalReasons.push(`@${userId} (blacklist global)`);
                        continue;
                    }


                    if (groupSettings.blacklist?.[participant]) {
                        membersToRemove.push(participant);
                        removalReasons.push(`@${userId} (blacklist grupo)`);
                        continue;
                    }


                    const participantStripped = participant.replace(/@.*/, '');
                    let participantNumber = participantStripped;

                    let isLid = false;

                    if (participant.endsWith('@lid')) {
                        isLid = true;
                        try {
                            const resolved = await NazunaSock.onWhatsApp(participant);
                            if (resolved?.[0]?.jid) {
                                participantNumber = resolved[0].jid.replace(/@.*/, '');

                            }
                        } catch { }
                    }




                    const hasCaptchaJson = Object.values(captchaData).find(c => {
                        const lid = c.lid?.replace(/@.*/, '');
                        const id = c.id?.replace(/@.*/, '');
                        const idOrigin = c.idOrigin?.replace(/@.*/, '');

                        return (
                            lid === participantStripped ||
                            id === participantStripped ||
                            id === participantNumber ||
                            idOrigin === participantStripped ||
                            idOrigin === participantNumber
                        );
                    });


                    const hasCaptchaLock = [...global.CAPTCHA_LOCK].some(x => {
                        const xStripped = x.replace(/@.*/, '');
                        return xStripped === participantNumber;
                    });

                    if (groupSettings.captchaEnabled) {

                        if (hasCaptchaJson || hasCaptchaLock) {

                            continue;
                        }


                        if (!entradaPorLink) {

                            continue;
                        }

                        if (isLid && participantNumber === participantStripped) {

                            continue;
                        }



                        global.CAPTCHA_LOCK.add(`${participantNumber}@s.whatsapp.net`);

                        const typeIds = {
                            id: `${participantNumber}@s.whatsapp.net`,
                            lid: isLid ? participant : '',
                            participant
                        };

                        const num1 = Math.floor(Math.random() * 10) + 1;
                        const num2 = Math.floor(Math.random() * 10) + 1;

                        const answer = num1 + num2;
                        const expiresAt = Date.now() + 5 * 60 * 1000;

                        CaptchaIndex.add(typeIds, from, answer, expiresAt, participantNumber);

                        await NazunaSock.sendMessage(from, {
                            text: `🔐 *VERIFICAÇÃO*\n\nOlá @${participantNumber}\n\n❓ ${num1} + ${num2} = ?\n\n⏱️ 5 minutos.`,
                            mentions: [`${participantNumber}@s.whatsapp.net`]
                        });

                        continue; 
                    }


                    if (groupSettings.bemvindo) {
                        console.log(`✅ Enviando welcome para ${participantNumber}`);
                        membersToWelcome.push(participant);
                    }
                }


                if (membersToRemove.length) {
                    await NazunaSock.groupParticipantsUpdate(from, membersToRemove, 'remove');

                    await NazunaSock.sendMessage(from, {
                        text: `🚫 Removidos:\n- ${removalReasons.join('\n- ')}`,
                        mentions: membersToRemove
                    });
                }


                if (membersToWelcome.length) {
                    const message = await createGroupMessage(
                        NazunaSock,
                        groupMetadata,
                        membersToWelcome,
                        groupSettings.welcome || { text: groupSettings.textbv }
                    );

                    await NazunaSock.sendMessage(from, message);
                }

                break;
            }

            case 'remove': {
                if (groupSettings.exit?.enabled) {
                    const message = await createGroupMessage(
                        NazunaSock,
                        groupMetadata,
                        inf.participants,
                        groupSettings.exit,
                        false
                    );

                    await NazunaSock.sendMessage(from, message)
                        .catch(err => console.log('❌ erro saída:', err.message));
                }
                break;
            }

            case 'promote':
            case 'demote': {

                if (!groupSettings?.x9) return;

                const autor = inf.author || '';

                for (const user of inf.participants) {

                    const userNum = user.split('@')[0];
                    const autorNum = autor ? autor.split('@')[0] : 'desconhecido';

                    const texto =
                        inf.action === 'promote'
                            ? `⬆️ @${userNum} virou ADM por @${autorNum}`
                            : `⬇️ @${userNum} deixou de ser ADM por @${autorNum}`;

                    await NazunaSock.sendMessage(from, {
                        text: texto,
                        mentions: autor ? [user, autor] : [user]
                    }).catch(() => { });
                }

                break;
            }
        }

    } catch (error) {
        console.error('❌ ERRO GERAL:', error);
    }
}

async function handleGroupJoinRequest(NazunaSock, inf) {
    try {
        const typeIds = { id: '', lid: '', participant: '' };
        const from = inf.id;
        let participantJid = inf.participantPn || inf.participant;

        if (!from || !participantJid) return;


        if (typeof participantJid === "object") {
            Object.assign(typeIds, {
                id: participantJid?.pn?.endsWith("s.whatsapp.net") ? participantJid?.pn : '',
                lid: participantJid?.pn?.endsWith("lid") ? participantJid?.pn : participantJid?.lid,
            });
            participantJid = participantJid.pn || participantJid.lid;
        } else {
            typeIds.lid = participantJid.endsWith("lid") ? participantJid : '';
            typeIds.id = participantJid.endsWith("s.whatsapp.net") ? participantJid : '';
        }

        typeIds.participant = participantJid;


        global.CAPTCHA_LOCK.add(participantJid);

        if (typeIds.lid) {
            global.CAPTCHA_LOCK.add(typeIds.lid);

        }
        if (typeIds.id) {
            global.CAPTCHA_LOCK.add(typeIds.id);

        }


        const groupSettings = await loadGroupSettings(from);


        if (groupSettings.autoAcceptRequests) {
            if (DEBUG_MODE) console.log(`[Auto-Accept] Aceitando ${participantJid} no grupo ${from}`);
            await NazunaSock.groupRequestParticipantsUpdate(from, [participantJid], 'approve');
            if (!groupSettings.captchaEnabled) return;
        }


        if (groupSettings.captchaEnabled) {

            const num1 = Math.floor(Math.random() * 10) + 1;
            const num2 = Math.floor(Math.random() * 10) + 1;
            const answer = num1 + num2;
            const timeAt = 5 * 60 * 1000;
            const expiresAt = Date.now() + timeAt;

            const numero = participantJid.split('@')[0];

            let nome = inf.participant;
            try {
                nome = await NazunaSock.getName(participantJid);
            } catch { }



            CaptchaIndex.add(typeIds, from, answer, expiresAt, nome);

            await NazunaSock.sendMessage(from, {
                text: `🔐 *VERIFICAÇÃO DE SEGURANÇA*\n\n👋 Olá @${numero}!\n\nPara garantir que você não é um bot, resolva:\n❓ *${num1} + ${num2} = ?*\n\n⏱️ Você tem 5 minutos ou será removido.`,
                mentions: [participantJid]
            });
        }

    } catch (error) {
        console.error(`❌ Erro em handleGroupJoinRequest: ${error.message}`);
    }
}



/**
 * Validates if a participant object has a valid ID and extracts the ID
 * @param {object|string} participant - The participant object or string to validate
 * @returns {string|boolean} - The participant ID if valid, false otherwise
 */
function isValidParticipant(participant) {
    // If participant is already a string, validate it directly
    if (typeof participant === 'string') {
    if (participant.trim().length === 0) return false;
    return participant;
    }
    
    // If participant is an object with id property
    if (participant && typeof participant === 'object' && participant.hasOwnProperty('id')) {
    const id = participant.id;
    if (id === null || id === undefined || id === '') return false;
    if (typeof id === 'string' && id.trim().length === 0) return false;
    if (id === 0) return false;
    
    return id;
    }
    
    return false;
}

// Funções de migração e LID removidas para utils/migration.js

// Variáveis de controle de reconexão (declaradas aqui para evitar temporal dead zone)
let reconnectAttempts = 0;
let isReconnecting = false; // Flag para evitar múltiplas reconexões simultâneas
let reconnectTimer = null; // Timer de reconexão para poder cancelar
let forbidden403Attempts = 0; // Contador específico para erro 403
const MAX_RECONNECT_ATTEMPTS = 10;
const MAX_403_ATTEMPTS = 3; // Máximo de 3 tentativas para erro 403
const RECONNECT_DELAY_BASE = 5000; // 5 segundos base

async function createBotSocket(authDir) {
    try {
    await fs.mkdir(path.join(DATABASE_DIR, 'grupos'), { recursive: true });
    await fs.mkdir(authDir, { recursive: true });
    const {
    state,
    saveCreds,
    signalRepository
    } = await useMultiFileAuthState(authDir, makeCacheableSignalKeyStore);
    
    // Busca a versão mais recente do WhatsApp
    const { version } = await fetchLatestBaileysVersion();
    
    const NazunaSock = makeWASocket({
    version: version,
    emitOwnEvents: true,
    fireInitQueries: true,
    generateHighQualityLinkPreview: true,
    syncFullHistory: true,
    markOnlineOnConnect: true,
    connectTimeoutMs: 120000,
    retryRequestDelayMs: 5000,
    qrTimeout: 180000,
    keepAliveIntervalMs: 30_000,
    defaultQueryTimeoutMs: undefined,
    msgRetryCounterCache,
    auth: state,
    signalRepository,
    logger
    });

    if (codeMode && !NazunaSock.authState.creds.registered) {
    console.log('📱 Insira o número de telefone (com código de país, ex: 551199999999): ');
    let phoneNumber = await ask('--> ');
    phoneNumber = phoneNumber.replace(/\D/g, '');
    if (!/^\d{10,15}$/.test(phoneNumber)) {
    console.log('⚠️ Número inválido! Use um número válido com código de país (ex: 551199999999).');
    process.exit(1);
    }
    const code = await NazunaSock.requestPairingCode(phoneNumber.replaceAll('+', '').replaceAll(' ', '').replaceAll('-', ''));
    console.log(`🔑 Código de pareamento: ${code}`);
    console.log('📲 Envie este código no WhatsApp para autenticar o bot.');
    }

    NazunaSock.ev.on('creds.update', saveCreds);

    NazunaSock.ev.on('groups.update', async (updates) => {
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

    NazunaSock.ev.on('group-participants.update', async (inf) => {
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
    await handleGroupParticipantsUpdate(NazunaSock, inf);
    });
    
    // Listener para solicitações de entrada em grupos (join requests)
    NazunaSock.ev.on('group.join-request', async (inf) => {
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
    await handleGroupJoinRequest(NazunaSock, inf);
    });

    let messagesListenerAttached = false;

    const queueErrorHandler = async (item, error) => {
    console.error(`❌ Critical error processing message ${item.id}:`, error);
    
    if (error.message.includes('ENOSPC') || error.message.includes('ENOMEM')) {
    console.error('🚨 Critical system error detected, triggering emergency cleanup...');
    try {
        await performanceOptimizer.emergencyCleanup();
    } catch (cleanupErr) {
        console.error('❌ Emergency cleanup failed:', cleanupErr.message);
    }
    }
    
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
    // Chave composta: remoteJid_messageId para permitir filtrar por grupo
    const cacheKey = `${info.key.remoteJid}_${info.key.id}`;
    messagesCache.set(cacheKey, info);
    }
    
    // Processa mensagem
    if (typeof indexModule === 'function') {
    await indexModule(NazunaSock, info, null, messagesCache, rentalExpirationManager);
    } else {
    throw new Error('Módulo index.js não é uma função válida. Verifique o arquivo index.js.');
    }
    };

    const attachMessagesListener = () => {
    if (messagesListenerAttached) return;
    messagesListenerAttached = true;

    NazunaSock.ev.on('messages.upsert', async (m) => {
    if (!m.messages || !Array.isArray(m.messages)) return;
    
    // Se for 'append', só processa se for solicitação de entrada (messageStubType 172)
    if (m.type === 'append') {
        const isJoinRequest = m.messages.some(info => info?.messageStubType === 172);
        if (!isJoinRequest) return;
    }
    
    // Processa 'notify' (mensagens normais) e 'append' (apenas solicitações de entrada)
    if (m.type !== 'notify' && m.type !== 'append') return;
        
    try {
        
        const messageProcessingPromises = m.messages.map(info =>
        messageQueue.add(info, processMessage).catch(err => {
        console.error(`❌ Failed to queue message ${info.key?.id}: ${err.message}`);
        })
        );
        
        await Promise.allSettled(messageProcessingPromises);
        
    } catch (err) {
        console.error(`❌ Error in message upsert handler: ${err.message}`);
        
        if (err.message.includes('ENOSPC') || err.message.includes('ENOMEM')) {
        console.error('🚨 Critical system error detected, triggering emergency cleanup...');
        try {
        await performanceOptimizer.emergencyCleanup();
        } catch (cleanupErr) {
        console.error('❌ Emergency cleanup failed:', cleanupErr.message);
        }
        }
    }
    });
    };

    NazunaSock.ev.on('connection.update', async (update) => {
    const {
    connection,
    lastDisconnect,
    qr
    } = update;
    if (qr && !NazunaSock.authState.creds.registered && !codeMode) {
    console.log('🔗 QR Code gerado para autenticação:');
    qrcode.generate(qr, {
        small: true
    }, (qrcodeText) => {
        console.log(qrcodeText);
    });
    console.log('📱 Escaneie o QR code acima com o WhatsApp para autenticar o bot.');
    }
    if (connection === 'open') {
    console.log(`🔄 Conexão aberta. Bot ID: ${NazunaSock.user?.id.split(':')[0]}`);
    
    forbidden403Attempts = 0; // Reset contador de erro 403 em caso de sucesso
    await initializeOptimizedCaches(NazunaSock);
    
    await updateOwnerLid(NazunaSock, numerodono, config, configPath);
    await performMigration(NazunaSock, DATABASE_DIR, configPath);
    
    rentalExpirationManager.nazu = NazunaSock;
    await rentalExpirationManager.initialize();
    
    attachMessagesListener();
    setupMessagesCacheCleanup(); // Inicia o sistema de limpeza de cache
    
    // Envia mensagem de boas-vindas para o dono
    try {
        const msgBotOnConfig = loadMsgBotOn();
        
        if (msgBotOnConfig.enabled) {
        // Aguarda 3 segundos para garantir que o bot está totalmente conectado
        setTimeout(async () => {
        try {
        const ownerJid = buildUserId(numerodono, config);
        const finalMessage = msgBotOnConfig.message
            .replace(/{prefix}/g, config.prefixo || '!')
            .replace(/{botName}/g, config.nomebot || 'Nazuna')
            .replace(/{ownerName}/g, config.nomedono || 'Dono');
        await NazunaSock.sendMessage(ownerJid, { 
            text: finalMessage 
        });
        } catch (sendError) {
        console.error('❌ Erro ao enviar mensagem de inicialização:', sendError.message);
        }
        }, 3000);
        }
    } catch (msgError) {
        console.error('❌ Erro ao processar mensagem de inicialização:', msgError.message);
    }

    // Inicializa sub-bots automaticamente
    try {
        const subBotManagerModule = await import('./utils/subBotManager.js');
        const subBotManager = subBotManagerModule.default ?? subBotManagerModule;
        setTimeout(async () => {
        await subBotManager.initializeAllSubBots();
        }, 5000);
    } catch (error) {
        console.error('❌ Erro ao inicializar sub-bots:', error.message);
    }
    
    console.log(`✅ Bot ${nomebot} iniciado com sucesso! Prefixo: ${prefixo} | Dono: ${nomedono}`);
    }
    if (connection === 'close') {
    const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
    const reasonMessage = {
        [DisconnectReason.loggedOut]: 'Deslogado do WhatsApp',
        401: 'Sessão expirada',
        403: 'Acesso proibido (Forbidden)',
        [DisconnectReason.connectionClosed]: 'Conexão fechada',
        [DisconnectReason.connectionLost]: 'Conexão perdida',
        [DisconnectReason.connectionReplaced]: 'Conexão substituída',
        [DisconnectReason.timedOut]: 'Tempo de conexão esgotado',
        [DisconnectReason.badSession]: 'Sessão inválida',
        [DisconnectReason.restartRequired]: 'Reinício necessário',
    } [reason] || 'Motivo desconhecido';
    
    console.log(`❌ Conexão fechada. Código: ${reason} | Motivo: ${reasonMessage}`);
    
    // Limpa recursos antes de reconectar
    if (cacheCleanupInterval) {
        clearInterval(cacheCleanupInterval);
        cacheCleanupInterval = null;
    }
    
    // Tratamento especial para erro 403 (Forbidden)
    if (reason === 403) {
        forbidden403Attempts++;
        console.log(`⚠️ Erro 403 detectado. Tentativa ${forbidden403Attempts}/${MAX_403_ATTEMPTS}`);
        
        if (forbidden403Attempts >= MAX_403_ATTEMPTS) {
        console.log('❌ Máximo de tentativas para erro 403 atingido. Apagando QR code e parando...');
        await clearAuthDir(authDir);
        console.log('🗑️ Autenticação removida. Reinicie o bot para gerar um novo QR code.');
        process.exit(1);
        }
        
        // Aguarda antes de tentar reconectar
        console.log('🔄 Tentando reconectar em 5 segundos...');
        if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        }
        reconnectTimer = setTimeout(() => {
        startNazu();
        }, 5000);
        return;
    }
    
    // Reset do contador 403 se for outro tipo de erro
    forbidden403Attempts = 0;
    
    if (reason === DisconnectReason.badSession || reason === DisconnectReason.loggedOut) {
        await clearAuthDir(authDir);
        console.log('🔄 Nova autenticação será necessária na próxima inicialização.');
    }
    
    // Não reconecta se conexão foi substituída (outra instância assumiu)
    if (reason === DisconnectReason.connectionReplaced) {
        console.log('⚠️ Conexão substituída por outra instância. Não reconectando para evitar conflito.');
        return;
    }
    
    // Delay antes de reconectar baseado no motivo
    let reconnectDelay = 5000;
    if (reason === DisconnectReason.timedOut) {
        reconnectDelay = 3000; // Reconexão mais rápida para timeout
    } else if (reason === DisconnectReason.connectionLost) {
        reconnectDelay = 2000; // Reconexão ainda mais rápida para perda de conexão
    } else if (reason === DisconnectReason.loggedOut || reason === DisconnectReason.badSession) {
        reconnectDelay = 10000; // Delay maior para problemas de autenticação
    }
    
    console.log(`🔄 Aguardando ${reconnectDelay / 1000} segundos antes de reconectar...`);
    
    // Cancela timer anterior se existir
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
    }
    
    reconnectTimer = setTimeout(() => {
        reconnectAttempts = 0; // Reset ao reconectar por desconexão normal
        startNazu();
    }, reconnectDelay);
    }
    });
    return NazunaSock;
    } catch (err) {
    console.error(`❌ Erro ao criar socket do bot: ${err.message}`);
    throw err;
    }
}

async function startNazu() {
    // Evita múltiplas instâncias sendo criadas ao mesmo tempo
    if (isReconnecting) {
    console.log('⚠️ Reconexão já em andamento, ignorando chamada duplicada...');
    return;
    }
    
    isReconnecting = true;
    
    try {
    reconnectAttempts = 0; // Reset contador ao conectar com sucesso

    await createBotSocket(AUTH_DIR);
    isReconnecting = false; // Conexão estabelecida com sucesso
    } catch (err) {
    reconnectAttempts++;
    console.error(`❌ Erro ao iniciar o bot (tentativa ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}): ${err.message}`);
    
    // Se excedeu tentativas, para de tentar
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error(`❌ Máximo de tentativas de reconexão alcançado (${MAX_RECONNECT_ATTEMPTS}). Parando...`);
    isReconnecting = false;
    process.exit(1);
    }
    
    if (err.message.includes('ENOSPC') || err.message.includes('ENOMEM')) {
    console.log('🧹 Tentando limpeza de emergência...');
    try {
    await performanceOptimizer.emergencyCleanup();
    console.log('✅ Limpeza de emergência concluída');
    } catch (cleanupErr) {
    console.error('❌ Falha na limpeza de emergência:', cleanupErr.message);
    }
    }
    
    // Delay exponencial (backoff) para evitar spam de conexões
    const delay = Math.min(RECONNECT_DELAY_BASE * Math.pow(1.5, reconnectAttempts - 1), 60000);
    console.log(`🔄 Aguardando ${Math.round(delay / 1000)} segundos antes de tentar novamente...`);
    
    // Cancela timer anterior se existir
    if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    }
    
    // Permite nova tentativa de reconexão após o delay
    isReconnecting = false;
    reconnectTimer = setTimeout(() => {
    startNazu();
    }, delay);
    }
}

/**
 * Função unificada para desligamento gracioso
 */
async function gracefulShutdown(signal) {
    const signalName = signal === 'SIGTERM' ? 'SIGTERM' : 'SIGINT';
    console.log(`📡 ${signalName} recebido, parando bot graciosamente...`);
    
    // Cancela qualquer timer de reconexão pendente
    if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
    }
    isReconnecting = false;
    
    let shutdownTimeout;
    
    // Timeout de segurança para forçar saída após 15 segundos
    shutdownTimeout = setTimeout(() => {
    console.error('⚠️ Timeout de shutdown, forçando saída...');
    process.exit(1);
    }, 15000);
    
    try {
    // Desconecta sub-bots
    try {
    const subBotManagerModule = await import('./utils/subBotManager.js');
    const subBotManager = subBotManagerModule.default ?? subBotManagerModule;
    await subBotManager.disconnectAllSubBots();
    console.log('✅ Sub-bots desconectados');
    } catch (error) {
    console.error('❌ Erro ao desconectar sub-bots:', error.message);
    }
    
    // Limpa recursos
    if (cacheCleanupInterval) {
    clearInterval(cacheCleanupInterval);
    cacheCleanupInterval = null;
    }
    
    // Finaliza fila de mensagens
    await messageQueue.shutdown();
    console.log('✅ MessageQueue finalizado');
    
    // Finaliza otimizador
    await performanceOptimizer.shutdown();
    console.log('✅ Performance optimizer finalizado');
    
    clearTimeout(shutdownTimeout);
    console.log('✅ Desligamento concluído');
    process.exit(0);
    } catch (error) {
      console.error('❌ Erro durante desligamento:', error.message);
      clearTimeout(shutdownTimeout);
      process.exit(1);
    }
}

export { performMigration, updateOwnerLid };

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', async (error) => {
    console.error('🚨 Erro não capturado:', error.message);
    
    if (error.message.includes('ENOSPC') || error.message.includes('ENOMEM')) {
    try {
    await performanceOptimizer.emergencyCleanup();
    } catch (cleanupErr) {
    console.error('❌ Falha na limpeza de emergência:', cleanupErr.message);
    }
    }
});

export { rentalExpirationManager, messageQueue };

startNazu();