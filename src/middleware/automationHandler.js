import axios from 'axios';

export async function processAutomation(context) {
    const { 
        bot, info, isGroup, sender, groupData, type, budy2, body, isCmd, isGroupAdmin, isBotAdmin, 
        from, getUserName, isUserWhitelisted, reply, getMediaInfo, getFileBuffer, upload, 
        handleAutoDownload, youtube, tiktok, igdl, kwai, facebook, pinterest, spotify, soundcloud,
        sendSticker, pushname, nomebot, nomedono, antifloodData, MESSAGES
    } = context;

    // 1. Anti-Porn (Image Only)
    const isAntiPorn = groupData.antiporn;
    if (isGroup && isAntiPorn && !info.key.fromMe) {
      if (!isGroupAdmin && !isUserWhitelisted(sender, 'antiporn')) {
        const mediaInfo = getMediaInfo(info.message);
        if (mediaInfo && mediaInfo.type === 'image') {
          try {
            const imageBuffer = await getFileBuffer(mediaInfo.media, 'image');
            const mediaURL = await upload(imageBuffer, true);
            if (mediaURL) {
              const apiResponse = await axios.get(`https://nsfw-demo.sashido.io/api/image/classify?url=${encodeURIComponent(mediaURL)}`);
              let scores = { Porn: 0, Hentai: 0 };
              if (Array.isArray(apiResponse.data)) {
                scores = apiResponse.data.reduce((acc, item) => {
                  if (item && typeof item.className === 'string' && typeof item.probability === 'number') {
                    if (item.className === 'Porn' || item.className === 'Hentai') {
                      acc[item.className] = Math.max(acc[item.className] || 0, item.probability);
                    }
                  }
                  return acc;
                }, { Porn: 0, Hentai: 0 });
              }
              const pornThreshold = 0.7;
              const hentaiThreshold = 0.7;
              const isPorn = scores.Porn >= pornThreshold;
              const isHentai = scores.Hentai >= hentaiThreshold;
              if (isPorn || isHentai) {
                const reason = isPorn ? 'Pornografia' : 'Hentai';
                await reply(MESSAGES.middleware.automation.pornDetected(reason));
                if (isBotAdmin) {
                  try {
                    await bot.sendMessage(from, { delete: info.key });
                    await bot.groupParticipantsUpdate(from, [sender], 'remove');
                    await reply(MESSAGES.middleware.automation.pornRemoved(getUserName(sender)), { mentions: [sender] });
                  } catch (adminError) {
                    console.error(`Erro ao remover usuário por anti-porn: ${adminError}`);
                    await reply(MESSAGES.middleware.automation.pornRemoveError(getUserName(sender)), { mentions: [sender] });
                  }
                } else {
                  await reply(MESSAGES.middleware.automation.pornAdminNeeded(getUserName(sender), reason), { mentions: [sender] });
                }
                return { stopProcessing: true };
              }
            }
          } catch (e) {
            console.error("Erro no anti-porn:", e);
          }
        }
      }
    }

    // 2. Anti-Location
    if (isGroup && groupData.antiloc && !isGroupAdmin && type === 'locationMessage') {
      if (!isUserWhitelisted(sender, 'antiloc')) {
        try {
          await bot.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: info.key.id, participant: sender } });
          await bot.groupParticipantsUpdate(from, [sender], 'remove');
          await reply(MESSAGES.middleware.automation.locationRemoved(getUserName(sender)), { mentions: [sender] });
          return { stopProcessing: true };
        } catch (e) {
          console.error("Erro no anti-location:", e);
        }
      }
    }

    // 3. Anti-Flood (Command Interval)
    if (isGroup && groupData.antiflood?.enabled && isCmd && !isGroupAdmin) {
      groupData.antiflood.users = groupData.antiflood.users || {};
      const now = Date.now();
      const lastCmd = groupData.antiflood.users[sender]?.lastCmd || 0;
      const interval = groupData.antiflood.interval * 1000;
      if (now - lastCmd < interval) {
        await reply(MESSAGES.middleware.automation.floodCooldown(Math.ceil((interval - (now - lastCmd)) / 1000)));
        return { stopProcessing: true };
      }
      groupData.antiflood.users[sender] = { lastCmd: now };
      if (persistGroupData) {
        await persistGroupData();
      }
    }

    // 4. Anti-Document
    if (isGroup && groupData.antidoc && !isGroupAdmin && (type === 'documentMessage' || type === 'documentWithCaptionMessage')) {
      if (!isUserWhitelisted(sender, 'antidoc')) {
        try {
          await bot.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: info.key.id, participant: sender } });
          await bot.groupParticipantsUpdate(from, [sender], 'remove');
          await reply(MESSAGES.middleware.automation.documentRemoved(getUserName(sender)), { mentions: [sender] });
          return { stopProcessing: true };
        } catch (e) {
          console.error("Erro no anti-document:", e);
        }
      }
    }

    // 5. Auto-Download (Links)
    if (isGroup && groupData.autodl && budy2.includes('http') && !isCmd) {
      const urlMatch = body.match(/(https?:\/\/[^\s]+)/g);
      if (urlMatch && urlMatch.length > 0) {
        try {
          handleAutoDownload(bot, from, urlMatch[0], info, { youtube, tiktok, igdl, kwai, facebook, pinterest, spotify, soundcloud })
            .catch((e) => console.error('Erro no autodl promise:', e));
        } catch (e) {
          console.error('Erro no autodl:', e);
        }
      }
    }

    // 6. Auto-Sticker
    if (isGroup && groupData.autoSticker && !info.key.fromMe) {
      try {
        const mediaImage = info.message?.imageMessage || info.message?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessage?.message?.imageMessage;
        const mediaVideo = info.message?.videoMessage || info.message?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessage?.message?.videoMessage;
        if (mediaImage || mediaVideo) {
          const isVid = !!mediaVideo;
          if (isVid && mediaVideo.seconds > 9.9) return { stopProcessing: false };
          
          const buffer = await getFileBuffer(isVid ? mediaVideo : mediaImage, isVid ? 'video' : 'image');
          const shouldForceSquare = global.autoStickerMode === 'square';
          await sendSticker(bot, from, {
            sticker: buffer,
            author: pushname,
            packname: nomebot,
            type: isVid ? 'video' : 'image',
            forceSquare: shouldForceSquare
          }, { quoted: info });
        }
      } catch (e) {
        console.error("Erro ao converter mídia em figurinha automática:", e);
      }
    }

    return { stopProcessing: false };
}
