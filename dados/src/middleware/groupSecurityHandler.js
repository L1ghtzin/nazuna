const soadmBypassCommands = ['suporte', 'ticketsuporte', 'suporteticket', 'ticket'];

export async function processGroupSecurity(context) {
    const { 
        nazu, info, isGroup, sender, groupData, command, isCmd, isImage, isVideo, 
        isVisuU, isVisuU2, isBotAdmin, isGroupAdmin, isOwner, isStatusMention, isButtonMessage, 
        from, pushname, reply, messagesCache, type, body, isOwnerOrSub, antiSpamGlobal, writeJsonFile,
        DATABASE_DIR, optimizer, groupFile, getUserName, isUserWhitelisted, getGroupRentalStatus,
        isRentalModeActive, validateActivationCode, useActivationCode, isMuted, isMuted2
    } = context;

    let stopProcessing = false;

    // 1. MinMessage Check
    if (isGroup && groupData.minMessage && (isImage || isVideo || isVisuU || isVisuU2) && !isGroupAdmin && !isOwner) {
      let caption = '';
      if (isImage) {
        caption = info.message.imageMessage?.caption || '';
      } else if (isVideo) {
        caption = info.message.videoMessage?.caption || '';
      } else if (isVisuU) {
        caption = info.message.viewOnceMessage?.message?.imageMessage?.caption || info.message.viewOnceMessage?.message?.videoMessage?.caption || '';
      } else if (isVisuU2) {
        caption = info.message.viewOnceMessageV2?.message?.imageMessage?.caption || info.message.viewOnceMessageV2?.message?.videoMessage?.caption || '';
      }
      if (caption.length < groupData.minMessage.minDigits) {
        try {
          await nazu.sendMessage(from, { delete: info.key });
          if (groupData.minMessage.action === 'ban') {
            if (isBotAdmin) {
              await nazu.groupParticipantsUpdate(from, [sender], 'remove');
              await reply(`🚫 Usuário removido por enviar mídia sem legenda suficiente (mínimo: ${groupData.minMessage.minDigits} caracteres).`);
            } else {
              await reply(`⚠️ Mídia sem legenda suficiente detectada, mas não sou admin para remover o usuário.`);
            }
          } else { // adv
            await reply(`⚠️ Advertência: Envie mídias com pelo menos ${groupData.minMessage.minDigits} caracteres na legenda para evitar remoção.`);
          }
        } catch (error) {
          console.error('Erro ao processar minMessage:', error);
        }
      }
    }

    // 2. AntiStatus
    if (isGroup && isStatusMention && groupData.antistatus && !isGroupAdmin) {
      if (!isUserWhitelisted(sender, 'antistatus')) {
        if (isBotAdmin) {
          await nazu.groupParticipantsUpdate(from, [sender], 'remove');
          await nazu.sendMessage(from, { delete: info.key });
          await reply(`🚫 @${getUserName(sender)}, status não são permitidos neste grupo. Você foi removido.`, { mentions: [sender] });
        } else {
          await nazu.sendMessage(from, { delete: info.key });
          await reply(`🚫 Atenção, @${getUserName(sender)}! Status não são permitidos neste grupo. Não consigo remover você, mas evite compartilhar status aqui.`, { mentions: [sender] });
        }
      }
    }

    // 3. AntiBtn
    if (isGroup && isButtonMessage && groupData.antibtn && !isGroupAdmin) {
      if (!isUserWhitelisted(sender, 'antibtn')) {
        if (isBotAdmin) {
          await nazu.groupParticipantsUpdate(from, [sender], 'remove');
          await nazu.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: info.key.id, participant: sender } });
          await reply(`⚠️ @${getUserName(sender)}, mensagens com botões não são permitidas neste grupo. Você foi removido.`, { mentions: [sender] });
        } else {
          await nazu.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: info.key.id, participant: sender } });
          await reply(`⚠️ Atenção, @${getUserName(sender)}! Mensagens com botões não são permitidas. Não consigo remover você, mas evite usar esse tipo de mensagem.`, { mentions: [sender] });
        }
      }
    }

    // 4. SoAdmin Bypass
    if (isGroup && isCmd && groupData.soadm && !isGroupAdmin && !soadmBypassCommands.includes(command)) {
      return { stopProcessing: true };
    }

    // 5. AntiDel
    if (isGroup && info.message?.protocolMessage && info.message.protocolMessage.type === 0 && groupData.antidel) {
      const deletedMsgKey = info.message.protocolMessage.key;
      const cacheKey = `${deletedMsgKey.remoteJid || from}_${deletedMsgKey.id}`;
      const cachedInfo = messagesCache?.get(cacheKey);
      
      if (cachedInfo && cachedInfo.message) {
        const msgOriginal = cachedInfo.message;
        const clone = JSON.parse(JSON.stringify(msgOriginal).replaceAll('conversation', 'text').replaceAll('Message', ''));
        
        for (const key in clone) {
          const media = clone[key];
          if (media && typeof media === 'object' && media.url) {
            clone[key] = { url: media.url };
            for (const subkey in media) {
              if (subkey !== 'url') clone[subkey] = media[subkey];
            }
          }
        }
        
        const participant = cachedInfo.key.participant || info.message.protocolMessage.key.participant; 
        const fromGroup = cachedInfo.key.remoteJid; 
        
        if (participant) {
          let userName = 'Usuário Desconhecido';
          let profilePic = 'https://telegra.ph/file/b5427ea4b8701bc47e751.jpg';
          const pushNameFromMsg = cachedInfo?.pushName || ''; 
          
          if (pushNameFromMsg) {
            userName = pushNameFromMsg;
          } else {
            try {
              const fetchedName = await nazu.getName(fromGroup, participant); 
              const numeroLimpoFallback = participant.split('@')[0];
              if (fetchedName && fetchedName !== numeroLimpoFallback) {
                userName = fetchedName;
              } else {
                userName = numeroLimpoFallback;
              }
            } catch (e) {
              userName = participant.split('@')[0];
            }
          }
          
          try {
            profilePic = await nazu.profilePictureUrl(participant, 'image');
          } catch (e) {}
          
          clone.contextInfo = {
            isForwarded: false,
            mentionedJid: [participant],
            externalAdReply: {
              title: `MENSAGEM APAGADA POR: ${userName}`,      
              body: `Número: ${participant.split("@")[0]}`, 
              thumbnailUrl: profilePic,
              sourceUrl: '',
              mediaType: 1,
              renderLargerThumbnail: false,
            },
          };
          
          try {
            await nazu.sendMessage(fromGroup, clone);
          } catch (err) {
            console.error('ERRO CRÍTICO AO REENVIAR MENSAGEM:', err);
          }
        }
      }
    }

    // 6. Blocked Commands
    if (isGroup && isCmd && !isGroupAdmin && groupData.blockedCommands && groupData.blockedCommands[command]) {
      await reply('⛔ Este comando foi bloqueado pelos administradores do grupo.');
      return { stopProcessing: true };
    }

    // 7. Anti Spam Global
    if (isCmd && antiSpamGlobal?.enabled && !isOwnerOrSub) {
      try {
        const cfg = antiSpamGlobal;
        cfg.users = cfg.users || {};
        cfg.blocks = cfg.blocks || {};
        const now = Date.now();
        const blockInfo = cfg.blocks[sender];
        if (blockInfo && blockInfo.until && now < blockInfo.until) {
          const msLeft = blockInfo.until - now;
          const secs = Math.ceil(msLeft / 1000);
          const m = Math.floor(secs / 60), s = secs % 60;
          await reply(`🚫 Você está temporariamente bloqueado de usar comandos por anti-spam.\n⏳ Aguarde ${m > 0 ? `${m}m ${s}s` : `${secs}s`}.`);
          return { stopProcessing: true };
        } else if (blockInfo && blockInfo.until && now >= blockInfo.until) {
          delete cfg.blocks[sender];
        }
        const intervalMs = (cfg.interval || 10) * 1000;
        const limit = Math.max(1, parseInt(cfg.limit || 5));
        const arr = (cfg.users[sender]?.times || []).filter(ts => now - ts <= intervalMs);
        arr.push(now);
        cfg.users[sender] = { times: arr };
        if (arr.length > limit) {
          const blockMs = Math.max(1, parseInt(cfg.blockTime || 600)) * 1000;
          cfg.blocks[sender] = { until: now + blockMs, at: new Date().toISOString(), count: arr.length };
          if (writeJsonFile && DATABASE_DIR) writeJsonFile(DATABASE_DIR + '/antispam.json', cfg);
          await reply(`🚫 Anti-spam: você excedeu o limite de ${limit} comandos em ${cfg.interval}s.\n🔒 Bloqueado por ${Math.floor(blockMs/60000)} min.`);
          return { stopProcessing: true };
        }
        if (writeJsonFile && DATABASE_DIR) writeJsonFile(DATABASE_DIR + '/antispam.json', cfg);
      } catch (e) {
        console.error('Erro no AntiSpam Global:', e);
      }
    }

    // 8. AFK Check
    if (isGroup && groupData.afkUsers && groupData.afkUsers[sender]) {
      try {
        const afkReason = groupData.afkUsers[sender].reason;
        const afkSince = new Date(groupData.afkUsers[sender].since || Date.now()).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        delete groupData.afkUsers[sender];
        if (writeJsonFile && groupFile) writeJsonFile(groupFile, groupData);
        if (isGroup && optimizer) optimizer.invalidateGroup(from);
        await reply(`👋 *Bem-vindo(a) de volta!*\nSeu status AFK foi removido.\nVocê estava ausente desde: ${afkSince}`);
      } catch (error) {
        console.error("Erro ao processar remoção de AFK:", error);
      }
    }

    // 9. Muted Users (1 & 2)
    if (isGroup && isMuted && !isGroupAdmin && !isOwner) {
      try {
        await nazu.sendMessage(from, { text: `🤫 *Usuário mutado detectado*\n\n@${getUserName(sender)}, você está tentando falar enquanto está mutado neste grupo. Você será removido conforme as regras.`, mentions: [sender] }, { quoted: info });
        await nazu.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: info.key.id, participant: sender } });
        if (isBotAdmin) {
          await nazu.groupParticipantsUpdate(from, [sender], 'remove');
        } else {
          await reply("⚠️ Não posso remover o usuário porque não sou administrador.");
        }
        delete groupData.mutedUsers[sender];
        if (writeJsonFile && groupFile) writeJsonFile(groupFile, groupData);
        if (isGroup && optimizer) optimizer.invalidateGroup(from);
        return { stopProcessing: true };
      } catch (error) {
        console.error("Erro ao processar usuário mutado:", error);
      }
    }

    if (isGroup && isMuted2 && !isGroupAdmin && !isOwner) {
      try {
        await nazu.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: info.key.id, participant: sender } });
      } catch (error) {
        console.error("Erro ao deletar mensagem de usuário mutado2:", error);
      }
      return { stopProcessing: true };
    }

    // 10. Rental Mode Activation logic
    let groupHasActiveRental = false;
    if (isGroup && isRentalModeActive && isRentalModeActive()) {
      const rentalStatus = getGroupRentalStatus(from);
      groupHasActiveRental = rentalStatus.active;
      const allowedCommandsBypass = ['modoaluguel', 'addaluguel', 'gerarcodigo', 'addsubdono', 'remsubdono', 'listasubdonos'];
      if (!groupHasActiveRental && isCmd && !isOwnerOrSub && !allowedCommandsBypass.includes(command)) {
        await reply("⏳ O aluguel deste grupo expirou ou não está ativo. Para usar os comandos, ative com um código ou solicite ao dono a renovação.");
        return { stopProcessing: true };
      }
    }

    if (isGroup && !isCmd && body) {
      const upperBody = body.toUpperCase();
      const matchPattern = upperBody.match(/\b[A-F0-9]{8}\b/);
      if (matchPattern) {
        const potentialCode = matchPattern[0];
        const validation = validateActivationCode ? validateActivationCode(potentialCode) : { valid: false };
      if (validation.valid) {
        try {
          const activationResult = useActivationCode(potentialCode, from, sender);
          await reply(activationResult.message);
          if (activationResult.success) {
            return { stopProcessing: true };
          }
        } catch (e) {
          console.error(`Erro ao tentar usar código de ativação ${potentialCode} no grupo ${from}:`, e);
        }
      }
      }
    }

    return { stopProcessing: false };
}
