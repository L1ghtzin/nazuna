/**
 * Middleware para sistemas de parceria e divulgação
 */
export async function processPartnership({
  nazu,
  from,
  sender,
  body,
  info,
  isGroup,
  isGroupAdmin,
  parceriasData,
  getUserName,
  reply,
  saveParceriasData
}) {
  // SISTEMA DE PARCERIA
  if (isGroup && parceriasData.active && !isGroupAdmin && body.includes('chat.whatsapp.com') && !info.key.fromMe) {
    if (parceriasData.partners[sender]) {
      const partnerData = parceriasData.partners[sender];
      if (partnerData.count < partnerData.limit) {
        partnerData.count++;
        saveParceriasData(from, parceriasData);
      } else {
        await nazu.sendMessage(from, {
          delete: info.key
        });
        await reply(`@${getUserName(sender)}, você atingiu o limite de ${partnerData.limit} links de grupos.`, {
          mentions: [sender]
        });
        return true;
      }
    } else {
      await nazu.sendMessage(from, {
        delete: info.key
      });
      await reply(`@${getUserName(sender)}, você não é um parceiro e não pode enviar links de grupos.`, {
        mentions: [sender]
      });
      return true;
    }
  }

  return false;
}
