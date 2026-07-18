import { writeAsync } from '../utils/database/io.js';

/**
 * Middleware para sistemas de moderação visual e mídias
 */
export async function processMediaSecurity({
  bot,
  from,
  info,
  groupData,
  isGroup,
  isGroupAdmin,
  isOwner,
  isBotAdmin,
  isParceiro,
  reply,
  getUserName,
  antistickerplus,
  type,
  sender,
  groupFile,
  isUserWhitelisted,
  MESSAGES
}) {
  // AntiSticker Plus (Lottie)
  if (isGroup && antistickerplus) {
    try {
      await antistickerplus.checkSticker(bot, from, info, groupData, {
        isGroupAdmin,
        isOwner,
        isParceiro,
        isBotAdmin,
        reply,
        getUserName
      });
    } catch (stickerErr) {
      console.error('[ANTISTICKERPLUS] Erro ao processar:', stickerErr.message);
    }
  }

  // AntiFigurinhas
  if (isGroup && groupData.antifig && groupData.antifig.enabled && type === "stickerMessage" && !isGroupAdmin && !info.key.fromMe) {
    if (!isUserWhitelisted(sender, 'antifig')) {
      try {
        await bot.sendMessage(from, {
          delete: {
            remoteJid: from,
            fromMe: false,
            id: info.key.id,
            participant: sender
          }
        });
        
        groupData.warnings = groupData.warnings || {};
        groupData.warnings[sender] = groupData.warnings[sender] || {
          count: 0,
          lastWarned: null
        };
        groupData.warnings[sender].count += 1;
        groupData.warnings[sender].lastWarned = new Date().toISOString();
        
        const warnCount = groupData.warnings[sender].count;
        const warnLimit = groupData.antifig.warnLimit || 3;
        let warnMessage = MESSAGES.security.antifigWarn(getUserName(sender), warnCount, warnLimit);
        
        if (warnCount >= warnLimit && isBotAdmin) {
          warnMessage += MESSAGES.security.antifigRemoveSuffix;
          await bot.groupParticipantsUpdate(from, [sender], 'remove');
          delete groupData.warnings[sender];
        }
        
        await bot.sendMessage(from, {
          text: warnMessage,
          mentions: [sender]
        });
        
        await writeAsync(groupFile, groupData);
        return true;
      } catch (error) {
        console.error("Erro no sistema antifig:", error);
      }
    }
  }

  return false;
}
