export async function processInteraction(context) {
    const { 
        nazu, from, sender, body, groupPrefix, relationshipManager, reply
    } = context;

    if (relationshipManager && relationshipManager.hasPendingRequest && relationshipManager.processResponse) {
      try {
        if (relationshipManager.hasPendingRequest(from) && body) {
          const relResponse = relationshipManager.processResponse(from, sender, body);
          if (relResponse) {
            if (relResponse.success && relResponse.message) {
              await nazu.sendMessage(from, {
                text: relResponse.message,
                mentions: relResponse.mentions || []
              });
            }
          }
        }

        if (relationshipManager.hasPendingBetrayal && relationshipManager.processBetrayalResponse) {
          if (relationshipManager.hasPendingBetrayal(from) && body) {
            const betrayalResponse = relationshipManager.processBetrayalResponse(from, sender, body, groupPrefix);
            if (betrayalResponse) {
              if (betrayalResponse.success && betrayalResponse.message) {
                await nazu.sendMessage(from, {
                  text: betrayalResponse.message,
                  mentions: betrayalResponse.mentions || []
                });
              }
            }
          }
        }
      } catch (error) {
        console.error("Erro ao processar interações de relacionamento:", error);
      }
    }

    return { success: true };
}
