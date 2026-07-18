export default {
  name: "dpay",
  description: "Apaga mensagens de pagamento do WhatsApp Pay",
  commands: ["dpay"],
  usage: "{prefix}dpay (marcando a mensagem de pagamento)",
  handle: async ({
    bot,
    from,
    info,
    reply,
    isGroupAdmin,
    isOwner,
  }) => {
    if (!isGroupAdmin && !isOwner) return reply('Apenas admins podem usar.');

    const ctx = info.message?.extendedTextMessage?.contextInfo;
    if (!ctx?.quotedMessage || !ctx?.stanzaId) return reply('Marque a mensagem que deseja apagar.');

    const stanzaId = ctx.stanzaId;
    const quotedMessage = ctx.quotedMessage;

    const isPayment = !!(
      quotedMessage?.requestPaymentMessage ||
      quotedMessage?.sendPaymentMessage ||
      quotedMessage?.cancelPaymentRequestMessage
    );

    try {
      if (isPayment) {
        const msgTemp = await bot.sendMessage(from, { text: '' });
        const idTemp = msgTemp.key.id;

        await bot.sendMessage(from, {
          text: '💦',
          edit: { id: idTemp }
        }, { messageId: stanzaId });

        await new Promise(r => setTimeout(r, 500));

        await bot.sendMessage(from, {
          delete: {
            remoteJid: from,
            id: stanzaId,
            fromMe: false,
            participant: ctx.participant
          }
        });

        await new Promise(r => setTimeout(r, 500));

        try {
          await bot.sendMessage(from, {
            delete: { remoteJid: from, id: idTemp, fromMe: true }
          });
        } catch {
          await bot.sendMessage(from, {
            delete: {
              remoteJid: from,
              id: idTemp,
              fromMe: false,
              participant: bot.user.id
            }
          }).catch(() => {});
        }
      } else {
        await bot.sendMessage(from, {
          delete: {
            remoteJid: from,
            fromMe: false,
            id: stanzaId,
            participant: ctx.participant
          }
        });
      }
    } catch (e) {
      console.error('[dpay]', e.message);
      reply('Erro ao apagar a mensagem.');
    }
  },
};
