import { processAntiStealth, processAntiStealthUpdate } from '../middleware/antiStealth.js';
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

  // Registra o envelope de toda mensagem de grupo recebida para corroborar marcações de pagamento
  for (const msg of m.messages) {
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
      
  try {
    const messageProcessingPromises = m.messages.map(info =>
      messageQueue.add(info, processMessage).catch(err => {
        console.error(`❌ Failed to queue message ${info.key?.id}: ${err.message}`);
      })
    );
    
    await Promise.allSettled(messageProcessingPromises);
  } catch (err) {
    console.error(`❌ Error in message upsert handler: ${err.message}`);
  }
}
