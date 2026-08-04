import { processAntiStealth, processAntiStealthUpdate, isNoSessionDecryptMessage, registerMainBotReceivedMsg } from '../middleware/antiStealth.js';

const processedMessagesCache = new Set();

export async function handleMessagesUpdate(ChainySock, updates) {
  try {
    await processAntiStealthUpdate(ChainySock, updates);
  } catch (e) {
    console.error('[ANTI-STEALTH] Erro no processador de updates:', e);
  }
}

export async function handleMessagesUpsert(ChainySock, m, { messageQueue, processMessage }) {
  if (!m.messages || !Array.isArray(m.messages)) return;

  // Registra o ID de toda mensagem recebida pelo bot principal
  for (const msg of m.messages) {
    if (msg.key?.id && !isNoSessionDecryptMessage(msg)) {
      registerMainBotReceivedMsg(msg.key.id);
    }
  }
  
  // --- ANTI-STEALTH (Anti Msg Criptografada do Bot Principal) ---
  if (!m.fromWatcher) {
    processAntiStealth(ChainySock, m).catch(e => console.error('[ANTI-STEALTH] Erro crítico no módulo:', e));
  }
  // ---------------------------------------------
  
  // Se for 'append', só processa se for solicitação de entrada (messageStubType 172)
  if (m.type === 'append') {
    const isJoinRequest = m.messages.some(info => info?.messageStubType === 172);
    if (!isJoinRequest) return;
  }
  
  // Processa 'notify' (mensagens normais) e 'append' (apenas solicitações de entrada)
  if (m.type !== 'notify' && m.type !== 'append') return;

  // Filtra mensagens stealth (stubType 2 / falha de decriptação) do pipeline normal.
  // Também faz a deduplicação instantânea (O(1)) para evitar Race Conditions
  // entre o Watcher e a conexão nativa, eliminando qualquer atraso artificial.
  const messagesToProcess = m.messages.filter(info => {
    if (isNoSessionDecryptMessage(info)) return false;
    
    const msgId = info.key?.id;
    if (!msgId) return true; // Se não tem ID, deixa passar

    if (processedMessagesCache.has(msgId)) return false; // Já processada, descarta
    
    processedMessagesCache.add(msgId);
    if (processedMessagesCache.size > 5000) {
      // Limpa os IDs mais antigos para não vazar memória
      const first = processedMessagesCache.values().next().value;
      processedMessagesCache.delete(first);
    }
    
    return true;
  });

  if (messagesToProcess.length === 0) return;

  try {
    const messageProcessingPromises = messagesToProcess.map(info =>
      messageQueue.add(info, processMessage).catch(err => {
        console.error(`❌ Failed to queue message ${info.key?.id}: ${err.message}`);
      })
    );
    
    await Promise.allSettled(messageProcessingPromises);
  } catch (err) {
    console.error(`❌ Error in message upsert handler: ${err.message}`);
  }
}
