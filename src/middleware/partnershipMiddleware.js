/**
 * Middleware para sistemas de parceria e divulgação
 */
export async function processPartnership({
  bot,
  from,
  sender,
  body,
  info,
  isGroup,
  isGroupAdmin,
  parceriasData,
  getUserName,
  reply,
  saveParceriasData,
  MESSAGES
}) {
  // SISTEMA DE PARCERIA
  if (isGroup && parceriasData.active && !isGroupAdmin && body.includes('chat.whatsapp.com') && !info.key.fromMe) {
    if (parceriasData.partners[sender]) {
      const partnerData = parceriasData.partners[sender];
      if (partnerData.count < partnerData.limit) {
        partnerData.count++;
        saveParceriasData(from, parceriasData);
      } else {
        await bot.sendMessage(from, {
          delete: info.key
        });
        await reply(MESSAGES.middleware.partnership.limitReached(getUserName(sender), partnerData.limit), {
          mentions: [sender]
        });
        return true;
      }
    } else {
      await bot.sendMessage(from, {
        delete: info.key
      });
      await reply(MESSAGES.middleware.partnership.notPartner(getUserName(sender)), {
        mentions: [sender]
      });
      return true;
    }
  }

  return false;
}
