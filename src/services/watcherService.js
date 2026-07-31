import fs, { existsSync } from 'fs';
import path, { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import makeWASocket, { 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore 
} from 'baileys';

import { hasMainBotReceivedMsg } from '../middleware/antiStealth.js';
import groupCache from '../utils/groupCache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WATCHER_AUTH_DIR = path.join(__dirname, '..', '..', 'dados', 'database', 'watcher-qr-code');

let watcherSock = null;
const recentRepassedKeys = new Set();

/**
 * Verifica se o Sensor Watcher está conectado e operacional.
 */
export function isWatcherConnected() {
    return Boolean(global.sockWatcher && (global.sockWatcher.ws?.isOpen || global.sockWatcher.user));
}

/**
 * Verifica se o Sensor Watcher está conectado E presente no grupo especificado.
 */
export function isWatcherInGroup(groupJid) {
    if (!groupJid || !global.sockWatcher || (!global.sockWatcher.ws?.isOpen && !global.sockWatcher.user)) return false;

    const watcherNum = global.sockWatcher.user?.id?.split(':')[0]?.split('@')[0];
    const watcherLid = global.sockWatcher.user?.lid?.split(':')[0]?.split('@')[0];
    if (!watcherNum && !watcherLid) return false;

    const meta = groupCache.get(groupJid);
    if (!meta?.participants) return true;

    return meta.participants.some(p => {
        const pNum = p.id?.split(':')[0]?.split('@')[0];
        return (watcherNum && pNum === watcherNum) || (watcherLid && pNum === watcherLid);
    });
}

function isAlreadyRepassed(msgId) {
    if (!msgId || recentRepassedKeys.has(msgId)) return true;
    recentRepassedKeys.add(msgId);
    if (recentRepassedKeys.size > 1000) {
        const first = recentRepassedKeys.values().next().value;
        recentRepassedKeys.delete(first);
    }
    return false;
}

async function getWAVersion() {
    try {
        const { version } = await fetchLatestBaileysVersion();
        return version;
    } catch {
        return [2, 3000, 1015901307];
    }
}

/**
 * Inicializa o Sensor Sombra Watcher.
 */
export async function startWatcher(codeMode = false, phoneNumber = null, ownerJid = null) {
    try {
        await fs.promises.mkdir(WATCHER_AUTH_DIR, { recursive: true });
        const { state, saveCreds } = await useMultiFileAuthState(WATCHER_AUTH_DIR, makeCacheableSignalKeyStore);
        const hasSession = state.creds.me || state.creds.registered || existsSync(path.join(WATCHER_AUTH_DIR, 'creds.json'));

        if (!hasSession && !codeMode) {
            console.log('👁️ [WATCHER] Sensor inativo. Use /watcher para registrá-lo.');
            return null;
        }

        console.log('👁️ [WATCHER] Inicializando Sensor Sombra...');
        const version = await getWAVersion();

        watcherSock = makeWASocket({
            version,
            auth: state,
            logger: pino({ level: 'error' }),
            syncFullHistory: false,
            fireInitQueries: false,
            generateHighQualityLinkPreview: false
        });

        global.sockWatcher = watcherSock;
        watcherSock.ev.on('creds.update', saveCreds);

        watcherSock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'close') {
                const statusCode = lastDisconnect?.error ? new Boom(lastDisconnect.error)?.output?.statusCode : null;
                const reasonTag = lastDisconnect?.error?.reasonNode?.tag || lastDisconnect?.error?.data?.reasonNode?.tag;
                const isConflict = statusCode === DisconnectReason.connectionReplaced || reasonTag === 'conflict' || lastDisconnect?.error?.output?.payload?.error === 'Conflict';
                const shouldReconnect = Boolean(lastDisconnect?.error) && !isConflict && statusCode !== DisconnectReason.loggedOut && statusCode !== DisconnectReason.badSession;

                console.log(`👁️ [WATCHER] Conexão fechada (Código: ${statusCode || 'N/A'}). Reconectando: ${shouldReconnect}`);
                global.sockWatcher = watcherSock = null;

                if (shouldReconnect) setTimeout(() => startWatcher(codeMode, phoneNumber, ownerJid), 5000);
            } else if (connection === 'open') {
                console.log(`👁️ [WATCHER] Sensor Sombra conectado e vigiando!`);
            }
        });

        watcherSock.ev.on('messages.upsert', async (m) => {
            if (m.type !== 'notify' && m.type !== 'append') return;
            if (!Array.isArray(m.messages)) return;

            // Filtra mensagens de grupo que o bot principal ainda NÃO recebeu/processou
            const unhandledMessages = m.messages.filter(info => 
                info.key?.remoteJid?.endsWith('@g.us') && 
                !info.key?.fromMe && 
                info.key?.id && 
                !hasMainBotReceivedMsg(info.key.id) &&
                !isAlreadyRepassed(info.key.id)
            );

            if (unhandledMessages.length === 0) return;

            // Repassa diretamente ao bot principal para processamento nos arquivos nativos do bot
            if (typeof global.dispatchMainBotUpsert === 'function') {
                console.log(`👁️ [WATCHER -> PRINCIPAL] Repassando ${unhandledMessages.length} mensagem(ns) capturada(s)...`);
                global.dispatchMainBotUpsert({
                    type: m.type,
                    messages: unhandledMessages,
                    fromWatcher: true
                }).catch(e => console.error('👁️ [WATCHER] Erro ao repassar ao principal:', e));
            }
        });

        if (codeMode && !hasSession && phoneNumber) {
            setTimeout(async () => {
                try {
                    if (!watcherSock || typeof watcherSock.requestPairingCode !== 'function') return;
                    const code = await watcherSock.requestPairingCode(phoneNumber);
                    console.log(`\n👁️ =============================================================\n🔑 CÓDIGO DE PAREAMENTO DO WATCHER: ${code}\n=============================================================\n`);

                    if (global.sockAdmin && ownerJid) {
                        await global.sockAdmin.sendMessage(ownerJid, {
                            text: `🔑 *[SENSOR WATCHER]*\n\nCódigo de pareamento gerado com sucesso!\n👉 Código: *${code}*`
                        });
                    }
                } catch (err) {
                    console.error(`👁️ [WATCHER] Erro ao obter código de pareamento:`, err);
                }
            }, 3000);
        }

        return watcherSock;
    } catch (err) {
        console.error(`👁️ [WATCHER] Erro crítico ao criar socket: ${err.message}`);
        return null;
    }
}
