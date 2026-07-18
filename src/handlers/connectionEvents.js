import { existsSync, readFileSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import qrcode from 'qrcode-terminal';
import { Boom } from '@hapi/boom';
import { DisconnectReason } from 'baileys';
import { updateOwnerLid, performMigration, migrateBlacklists } from '../utils/migration.js';
import { loadMsgBotOn } from '../utils/database.js';
import { buildUserId } from '../utils/helpers.js';
import log from '../utils/logger.js';

function trimQrMargin(qrOutput) {
  const lines = qrOutput.split(/\r?\n/);
  const top = lines.findIndex((line) => line.trim().length > 0);

  if (top === -1) return qrOutput;

  let bottom = lines.length - 1;
  while (bottom > top && lines[bottom].trim().length === 0) {
    bottom -= 1;
  }

  const content = lines.slice(top, bottom + 1);
  const bounds = content.reduce(
    (acc, line) => {
      const first = line.search(/\S/);
      if (first === -1) return acc;

      return {
        left: Math.min(acc.left, Math.max(0, first - 1)),
        right: Math.max(acc.right, line.length),
      };
    },
    { left: Number.POSITIVE_INFINITY, right: 0 },
  );

  if (!Number.isFinite(bounds.left)) return qrOutput;

  return content.map((line) => line.slice(bounds.left, bounds.right)).join("\n");
}

function printCompactQr(qr) {
  qrcode.generate(qr, { small: true }, (output) => {
    console.log(trimQrMargin(output));
  });
}

export async function handleConnectionUpdate(ChainySock, update, {
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
  authDir
}) {
  const {
    connection,
    lastDisconnect,
    qr
  } = update;

  const hasSessionNow = ChainySock.authState.creds.me || ChainySock.authState.creds.registered || existsSync(path.join(AUTH_DIR, 'creds.json'));
  
  if (connection === 'connecting') {
    log.info('CONNECTION', 'Conectando ao WhatsApp...');
  }

  if (qr && !hasSessionNow && !codeMode) {
    log.box("QR", "Código QR Recebido", [
      "Escaneie o código QR compacto abaixo com o WhatsApp do seu celular.",
      "Mantenha a distância ideal se o leitor falhar."
    ], "magenta");
    printCompactQr(qr);
  }

  if (connection === 'open') {
    try {
      reconnectState.reconnectAttempts = 0;
      reconnectState.forbidden403Attempts = 0;
      log.success('CONNECTION', 'Conexão aberta com sucesso!');
      log.info('CONNECTION', 'Inicializando caches e otimizações...');
      
      await initializeOptimizedCaches(ChainySock);
      
      await updateOwnerLid(ChainySock, numerodono, config, configPath);
      
      setTimeout(() => {
        performMigration(ChainySock, DATABASE_DIR, configPath).catch(err => {
          console.error('❌ Erro na migração (não-bloqueante):', err.message);
        });
        migrateBlacklists(ChainySock, DATABASE_DIR).catch(err => {
          console.error('❌ Erro na migração de blacklists (não-bloqueante):', err.message);
        });
      }, 10000);
      
      rentalExpirationManager.bot = ChainySock;
      await rentalExpirationManager.initialize();
      
      attachMessagesListener();
      setupMessagesCacheCleanup(); // Inicia o sistema de limpeza de cache

      // Verifica se há alguma atualização pendente de finalização visual
      try {
        const pendingUpdatePath = path.join(process.cwd(), 'dados', 'database', 'pendingUpdate.json');
        if (existsSync(pendingUpdatePath)) {
          const data = JSON.parse(readFileSync(pendingUpdatePath, 'utf8'));
          if (data && data.key && data.from) {
            const successText = `⚙️ *PROCESSO DE ATUALIZAÇÃO DO BOT* ⚙️\n\n` +
              `✅ *1.* 🔍 Verificando requisitos\n` +
              `✅ *2.* 📁 Criando backup\n` +
              `✅ *3.* 📥 Baixando do GitHub\n` +
              `✅ *4.* 🧹 Limpando arquivos\n` +
              `✅ *5.* 🚀 Aplicando nova versão\n` +
              `✅ *6.* 📂 Restaurando backup\n` +
              `✅ *7.* 📦 Instalando dependências\n` +
              `✅ *8.* 🎉 Finalizando atualização\n\n` +
              `🎉 *ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!*`;
            
            await ChainySock.sendMessage(data.from, { edit: data.key, text: successText });
            console.log('✅ Mensagem de atualização finalizada com sucesso!');
          }
          await fs.unlink(pendingUpdatePath).catch(() => {});
        }
      } catch (updateErr) {
        console.error('❌ Erro ao finalizar mensagem de atualização pendente:', updateErr.message);
      }
      
      // Envia mensagem de boas-vindas para o dono
      try {
        const msgBotOnConfig = loadMsgBotOn();
        
        if (msgBotOnConfig.enabled) {
          if (reconnectState.ownerMsgTimer) clearTimeout(reconnectState.ownerMsgTimer);
          // Aguarda 3 segundos para garantir que o bot está totalmente conectado
          reconnectState.ownerMsgTimer = setTimeout(async () => {
            reconnectState.ownerMsgTimer = null;
            try {
              const ownerJid = buildUserId(numerodono, config);
              const finalMessage = msgBotOnConfig.message
                .replace(/{prefix}/g, config.prefixo || '!')
                .replace(/{botName}/g, config.nomebot || 'Chainy')
                .replace(/{ownerName}/g, config.nomedono || 'Dono');
              await ChainySock.sendMessage(ownerJid, { text: finalMessage });
              console.log('✅ Mensagem de inicialização enviada para o dono');
            } catch (sendError) {
              console.error('❌ Erro ao enviar mensagem de inicialização:', sendError.message);
            }
          }, 3000);
        } else {
          console.log('ℹ️ Mensagem de inicialização desativada');
        }
      } catch (msgError) {
        console.error('❌ Erro ao processar mensagem de inicialização:', msgError.message);
      }
      
      log.box("SUCCESS", `${config.nomebot || 'Chainy'} Iniciado!`, [
        `Prefixo: ${config.prefixo || '!'}`,
        `Dono: ${config.nomedono || ''}`,
        `Status: Conectado e operacional`
      ], "green");
    } catch (initErr) {
      log.error('CONNECTION', 'Erro crítico na inicialização pós-conexão:', initErr.message);
      setTimeout(() => startChainy(), 5000);
    }
  }

  if (connection === 'close') {
    const isIntentional = !lastDisconnect?.error;
    const reason = isIntentional ? 200 : new Boom(lastDisconnect.error)?.output?.statusCode;
    const info = getDisconnectInfo(reason);

    log.box("CONNECTION", "Conexão Encerrada", [
      `Código de Status: ${reason}`,
      `Motivo: ${info.title}`,
      `Descrição: ${info.description}`,
      `Ação Requerida: ${info.action}`
    ], info.color);
    
    // Limpa recursos antes de reconectar
    if (reconnectState.cacheCleanupInterval) {
      clearInterval(reconnectState.cacheCleanupInterval);
      reconnectState.cacheCleanupInterval = null;
    }
    
    if (reconnectState.ownerMsgTimer) {
      clearTimeout(reconnectState.ownerMsgTimer);
      reconnectState.ownerMsgTimer = null;
    }
    
    // Tratamento especial para erro 403 (Forbidden)
    if (reason === 403) {
      reconnectState.forbidden403Attempts++;
      log.warn('CONNECTION', `Erro 403 detectado. Tentativa ${reconnectState.forbidden403Attempts}/${reconnectState.MAX_403_ATTEMPTS}`);
      
      if (reconnectState.forbidden403Attempts >= reconnectState.MAX_403_ATTEMPTS) {
        log.error('CONNECTION', 'Máximo de tentativas para erro 403 atingido. Apagando QR code e parando...');
        await clearAuthDir(authDir);
        log.info('CONNECTION', 'Autenticação removida. Reinicie o bot para gerar um novo QR code.');
        process.exit(1);
      }
      
      log.info('CONNECTION', 'Tentando reconectar em 5 segundos...');
      if (reconnectState.reconnectTimer) {
        clearTimeout(reconnectState.reconnectTimer);
      }
      reconnectState.reconnectTimer = setTimeout(() => {
        startChainy();
      }, 5000);
      return;
    }
    
    reconnectState.forbidden403Attempts = 0;
    
    if (reason === DisconnectReason.badSession || reason === DisconnectReason.loggedOut) {
      await clearAuthDir(authDir);
      log.warn('CONNECTION', 'Nova autenticação será necessária na próxima inicialização.');
    }
    
    if (reason === DisconnectReason.connectionReplaced) {
      log.warn('CONNECTION', 'Conexão substituída por outra instância. Não reconectando para evitar conflito.');
      return;
    }
    
    let reconnectDelay = 5000;
    if (reason === DisconnectReason.timedOut) {
      reconnectDelay = 3000;
    } else if (reason === DisconnectReason.connectionLost) {
      reconnectDelay = 2000;
    } else if (reason === DisconnectReason.loggedOut || reason === DisconnectReason.badSession) {
      reconnectDelay = 10000;
    }
    
    if (info.shouldReconnect) {
      log.info('CONNECTION', `Aguardando ${reconnectDelay / 1000} segundos antes de reconectar...`);
      
      if (reconnectState.reconnectTimer) {
        clearTimeout(reconnectState.reconnectTimer);
      }
      
      reconnectState.reconnectTimer = setTimeout(() => {
        reconnectState.reconnectAttempts = 0;
        reconnectState.forbidden403Attempts = 0;
        startChainy();
      }, reconnectDelay);
    }
  }
}

function getDisconnectInfo(statusCode) {
  switch (statusCode) {
    case DisconnectReason.loggedOut:
      return {
        title: 'Desconectado pelo Celular',
        description: 'A sessão foi desvinculada ou encerrada no aparelho.',
        action: 'Gere um novo QR code para autenticar.',
        shouldReconnect: false,
        color: 'red'
      };
    case 403:
    case DisconnectReason.forbidden:
      return {
        title: 'Acesso Proibido (Forbidden)',
        description: 'Acesso rejeitado pelo servidor do WhatsApp.',
        action: 'Verifique se o número foi banido ou limpe a pasta de login.',
        shouldReconnect: false,
        color: 'red'
      };
    case DisconnectReason.connectionLost:
      return {
        title: 'Conexão Perdida',
        description: 'A conexão com os servidores do WhatsApp caiu.',
        action: 'Tentando reconectar automaticamente...',
        shouldReconnect: true,
        color: 'yellow'
      };
    case DisconnectReason.multideviceMismatch:
      return {
        title: 'Conflito de Dispositivo',
        description: 'Incompatibilidade de múltiplos dispositivos detectada.',
        action: 'Limpe a sessão e tente autenticar novamente.',
        shouldReconnect: false,
        color: 'red'
      };
    case DisconnectReason.connectionClosed:
      return {
        title: 'Conexão Fechada',
        description: 'A conexão de rede foi fechada de forma inesperada.',
        action: 'Reconectando em instantes...',
        shouldReconnect: true,
        color: 'yellow'
      };
    case DisconnectReason.connectionReplaced:
      return {
        title: 'Conexão Substituída',
        description: 'Outra instância do bot iniciou no mesmo número.',
        action: 'Encerrando processo para evitar conflito de envio.',
        shouldReconnect: false,
        color: 'red'
      };
    case DisconnectReason.badSession:
      return {
        title: 'Sessão Corrompida',
        description: 'Os arquivos de credenciais localizados estão corrompidos.',
        action: 'Limpando sessão antiga... Reinicie o bot.',
        shouldReconnect: false,
        color: 'red'
      };
    case DisconnectReason.restartRequired:
      return {
        title: 'Reinicialização Requerida',
        description: 'O servidor do WhatsApp solicitou atualização do socket.',
        action: 'Reiniciando conexão imediatamente...',
        shouldReconnect: true,
        color: 'yellow'
      };
    case DisconnectReason.timedOut:
      return {
        title: 'Tempo Esgotado',
        description: 'O servidor demorou muito para responder.',
        action: 'Reconectando...',
        shouldReconnect: true,
        color: 'yellow'
      };
    default:
      return {
        title: 'Desconexão Desconhecida',
        description: 'Conexão encerrada por motivo não catalogado.',
        action: 'Tentando reconectar...',
        shouldReconnect: true,
        color: 'yellow'
      };
  }
}
