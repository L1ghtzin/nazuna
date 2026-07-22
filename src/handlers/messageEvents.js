import { processAntiStealth, processAntiStealthUpdate, isNoSessionDecryptMessage, registerMainBotReceivedMsg } from '../middleware/antiStealth.js';
import { recordMessageEnvelope } from '../utils/messageEnvelopeRegistry.js';
import { hasPaymentMessage } from '../utils/paymentMessage.js';

export async function handleMessagesUpdate(ChainySock, updates) {
  try {
    await processAntiStealthUpdate(ChainySock, updates);
  } catch (e) {
    console.error('[ANTI-STEALTH] Erro no processador de updates:', e);
  }
}

export async function handleMessagesUpsert(ChainySock, m, { messageQueue, processMessage }) {
  if (!m.messages || !Array.isArray(m.messages)) return;

  // Registra o envelope e o ID de toda mensagem recebida pelo bot principal
  for (const msg of m.messages) {
    if (msg.key?.id) {
      registerMainBotReceivedMsg(msg.key.id);
    }
    try {
      recordMessageEnvelope(msg, hasPaymentMessage(msg));
    } catch (e) {
      console.error('[ANTI-STEALTH] Erro ao registrar envelope:', e);
    }
  }
  
  // --- ANTI-STEALTH (Anti Msg Criptografada) ---
  // Fire-and-forget: não bloqueia o processamento de mensagens normais
  processAntiStealth(ChainySock, m).catch(e => console.error('[ANTI-STEALTH] Erro crítico no módulo:', e));
  // ---------------------------------------------
  
  // Se for 'append', só processa se for solicitação de entrada (messageStubType 172)
  if (m.type === 'append') {
    const isJoinRequest = m.messages.some(info => info?.messageStubType === 172);
    if (!isJoinRequest) return;
  }
  
  // Processa 'notify' (mensagens normais) e 'append' (apenas solicitações de entrada)
  if (m.type !== 'notify' && m.type !== 'append') return;

  // Filtra mensagens stealth (stubType 2 / falha de decriptação) do pipeline normal.
  // Elas já foram tratadas pelo processAntiStealth acima. Sem este filtro, cada stealth
  // entra no messageQueue e dispara buildMessageContext -> convertIdsToLid para TODOS
  // os membros/admins do grupo, saturando o socket durante rajadas de stealth.
  const messagesToProcess = m.messages.filter(info => !isNoSessionDecryptMessage(info));
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
