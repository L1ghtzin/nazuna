import axios from 'axios';

export async function processAutomation(context) {
    const { 
        nazu, info, isGroup, sender, groupData, type, budy2, body, isCmd, isGroupAdmin, isBotAdmin, 
        from, getUserName, isUserWhitelisted, reply, getMediaInfo, getFileBuffer, upload, 
        handleAutoDownload, youtube, tiktok, igdl, kwai, facebook, pinterest, spotify, soundcloud,
        sendSticker, pushname, nomebot, nomedono, antifloodData
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
                await reply(`🚨 Conteúdo impróprio detectado! (${reason})`);
                if (isBotAdmin) {
                  try {
                    await nazu.sendMessage(from, { delete: info.key });
                    await nazu.groupParticipantsUpdate(from, [sender], 'remove');
                    await reply(`🔞 @${getUserName(sender)}, conteúdo impróprio detectado. Você foi removido do grupo.`, { mentions: [sender] });
                  } catch (adminError) {
                    console.error(`Erro ao remover usuário por anti-porn: ${adminError}`);
                    await reply(`⚠️ Não consegui remover @${getUserName(sender)} automaticamente. Admins, por favor, verifiquem!`, { mentions: [sender] });
                  }
                } else {
                  await reply(`@${getUserName(sender)} enviou conteúdo impróprio (${reason}), mas não posso removê-lo sem ser admin.`, { mentions: [sender] });
                }
                return { stopProcessing: true };
              }
            }
          } catch (error) {
            console.error("Erro na verificação anti-porn:", error);
          }
        }
      }
    }

    // 2. Anti-Location
    if (isGroup && groupData.antiloc && !isGroupAdmin && type === 'locationMessage') {
      if (!isUserWhitelisted(sender, 'antiloc')) {
        try {
          await nazu.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: info.key.id, participant: sender } });
          await nazu.groupParticipantsUpdate(from, [sender], 'remove');
          await reply(`🗺️ @${getUserName(sender)}, localização não permitida. Você foi removido do grupo.`, { mentions: [sender] });
          return { stopProcessing: true };
        } catch (e) {
          console.error("Erro no anti-location:", e);
        }
      }
    }

    // 3. Anti-Flood (Command Interval)
    if (isGroup && antifloodData[from]?.enabled && isCmd && !isGroupAdmin) {
      antifloodData[from].users = antifloodData[from].users || {};
      const now = Date.now();
      const lastCmd = antifloodData[from].users[sender]?.lastCmd || 0;
      const interval = antifloodData[from].interval * 1000;
      if (now - lastCmd < interval) {
        await reply(`⏳ Aguarde ${Math.ceil((interval - (now - lastCmd)) / 1000)} segundos antes de usar outro comando.`);
        return { stopProcessing: true };
      }
      antifloodData[from].users[sender] = { lastCmd: now };
    }

    // 4. Anti-Document
    if (isGroup && groupData.antidoc && !isGroupAdmin && (type === 'documentMessage' || type === 'documentWithCaptionMessage')) {
      if (!isUserWhitelisted(sender, 'antidoc')) {
        try {
          await nazu.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: info.key.id, participant: sender } });
          await nazu.groupParticipantsUpdate(from, [sender], 'remove');
          await reply(`📄 @${getUserName(sender)}, documentos não são permitidos. Você foi removido do grupo.`, { mentions: [sender] });
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
          handleAutoDownload(nazu, from, urlMatch[0], info, { youtube, tiktok, igdl, kwai, facebook, pinterest, spotify, soundcloud })
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
          await sendSticker(nazu, from, {
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
