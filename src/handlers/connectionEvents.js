import { existsSync, readFileSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import qrcode from 'qrcode-terminal';
import { Boom } from '@hapi/boom';
import { DisconnectReason } from 'baileys';
import { updateOwnerLid, performMigration, migrateBlacklists } from '../utils/migration.js';
import { loadMsgBotOn } from '../utils/database.js';
import { buildUserId } from '../utils/helpers.js';

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
  
  if (qr && !hasSessionNow && !codeMode) {
    console.log('🔗 QR Code gerado para autenticação:');
    qrcode.generate(qr, { small: true }, (qrcodeText) => {
      console.log(qrcodeText);
    });
    console.log('📱 Escaneie o QR code acima com o WhatsApp para autenticar o bot.');
  }

  if (connection === 'open') {
    try {
      reconnectState.reconnectAttempts = 0;
      reconnectState.forbidden403Attempts = 0;
      console.log(`🔄 Conexão aberta. Inicializando sistema de otimização...`);
      
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
      
      console.log(`✅ Bot ${config.nomebot || 'Chainy'} iniciado com sucesso! Prefixo: ${config.prefixo || '!'} | Dono: ${config.nomedono || ''}`);
    } catch (initErr) {
      console.error('❌ Erro crítico na inicialização pós-conexão:', initErr.message);
      setTimeout(() => startChainy(), 5000);
    }
  }

  if (connection === 'close') {
    const isIntentional = !lastDisconnect?.error;
    const reason = isIntentional ? 200 : new Boom(lastDisconnect.error)?.output?.statusCode;
    const reasonMessage = {
      200: 'Fechamento intencional',
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
      console.log(`⚠️ Erro 403 detectado. Tentativa ${reconnectState.forbidden403Attempts}/${reconnectState.MAX_403_ATTEMPTS}`);
      
      if (reconnectState.forbidden403Attempts >= reconnectState.MAX_403_ATTEMPTS) {
        console.log('❌ Máximo de tentativas para erro 403 atingido. Apagando QR code e parando...');
        await clearAuthDir(authDir);
        console.log('🗑️ Autenticação removida. Reinicie o bot para gerar um novo QR code.');
        process.exit(1);
      }
      
      console.log('🔄 Tentando reconectar em 5 segundos...');
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
      console.log('🔄 Nova autenticação será necessária na próxima inicialização.');
    }
    
    if (reason === DisconnectReason.connectionReplaced) {
      console.log('⚠️ Conexão substituída por outra instância. Não reconectando para evitar conflito.');
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
    
    console.log(`🔄 Aguardando ${reconnectDelay / 1000} segundos antes de reconectar...`);
    
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
