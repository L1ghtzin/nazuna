export default {
  name: "reiniciar",
  description: "Reinicia o bot",
  commands: ["reiniciar", "restart", "reboot"],
  usage: `${global.prefixo}reiniciar`,
  handle: async ({ 
    reply,
    isOwner
  , MESSAGES }) => {
    try {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      
      await reply(MESSAGES.owner.reiniciar.success);
      
      try {
        // Pausa o processamento de mensagens
        const messageQueueModule = await import('../../connect.js');
        if (messageQueueModule.messageQueue && typeof messageQueueModule.messageQueue.pause === 'function') {
          messageQueueModule.messageQueue.pause();
        }
      } catch (e) {
        console.error("Aviso: Não foi possível pausar a fila de mensagens no reiniciar.", e);
      }

      // Aguarda 2 segundos para garantir que a mensagem foi enviada
      setTimeout(() => {
        if (process.env.DEBUG_MODE === 'true') {
          console.log('[RESTART] Reiniciando bot via comando...');
        }
        process.exit(0); // Exit code 0 indica reinício intencional
      }, 2000);
      
    } catch (e) {
      console.error(e);
      reply(MESSAGES.error.general);
    }
  }
};
