export async function processAntiLink(context) {
    const { 
        bot, info, isGroup, sender, groupData, budy2, isGroupAdmin, isOwner, 
        isBotAdmin, from, getUserName, isUserWhitelisted, reply, AllgroupMembers, parceriasData, idInArray,
        MESSAGES
    } = context;

    const isParceiro = !!(parceriasData?.active && parceriasData?.partners?.[sender]);

    if (isGroup && groupData.antilinkgp && !isGroupAdmin && !isParceiro) {
      if (!isUserWhitelisted(sender, 'antilinkgp')) {
        let foundGroupLink = false;
        let link_dgp = null;
        try {
          if (budy2.includes('chat.whatsapp.com')) {
            foundGroupLink = true;
            link_dgp = await bot.groupInviteCode(from);
            if (budy2.includes(link_dgp)) foundGroupLink = false;
          }
          if (!foundGroupLink && info.message?.requestPaymentMessage) {
            const paymentText = info.message.requestPaymentMessage?.noteMessage?.extendedTextMessage?.text || '';
            if (paymentText.includes('chat.whatsapp.com')) {
              foundGroupLink = true;
              link_dgp = link_dgp || await bot.groupInviteCode(from);
              if (paymentText.includes(link_dgp)) foundGroupLink = false;
            }
          }
          if (foundGroupLink) {
            if (isOwner) return { stopProcessing: false };
            
            const isMember = idInArray(sender, AllgroupMembers);
            
            if (isBotAdmin) {
              const targets = [sender];
              if (info.key.participantAlt) targets.push(info.key.participantAlt);
              
              await bot.groupParticipantsUpdate(from, targets, 'remove').catch(()=>{});
              
              await bot.sendMessage(from, {
                delete: { remoteJid: from, fromMe: false, id: info.key.id, participant: sender }
              }).catch(()=>{});
              
              await reply(MESSAGES.middleware.antiLink.groupRemoved(getUserName(sender)), {
                mentions: [sender]
              });
            } else {
              await reply(MESSAGES.middleware.antiLink.groupWarned(getUserName(sender)), {
                mentions: [sender]
              });
            }
            return { stopProcessing: true };
          }
        } catch (error) {
          console.error("Erro no sistema antilink de grupos:", error);
        }
      }
    }

    if (isGroup && groupData.antilinkcanal && !isGroupAdmin && !isParceiro) {
      if (!isUserWhitelisted(sender, 'antilinkcanal')) {
        let foundChannelLink = false;
        try {
          if (budy2.includes('whatsapp.com/channel/')) {
            foundChannelLink = true;
          }
          if (!foundChannelLink && info.message?.requestPaymentMessage) {
            const paymentText = info.message.requestPaymentMessage?.noteMessage?.extendedTextMessage?.text || '';
            if (paymentText.includes('whatsapp.com/channel/')) {
              foundChannelLink = true;
            }
          }
          if (foundChannelLink) {
            if (isOwner) return { stopProcessing: false };
            
            const isMember = idInArray(sender, AllgroupMembers);
            
            if (isBotAdmin) {
              const targets = [sender];
              if (info.key.participantAlt) targets.push(info.key.participantAlt);
              
              await bot.groupParticipantsUpdate(from, targets, 'remove').catch(()=>{});
              
              await bot.sendMessage(from, {
                delete: { remoteJid: from, fromMe: false, id: info.key.id, participant: sender }
              }).catch(()=>{});
              
              await reply(MESSAGES.middleware.antiLink.channelRemoved(getUserName(sender)), {
                mentions: [sender]
              });
            } else {
              await reply(MESSAGES.middleware.antiLink.channelWarned(getUserName(sender)), {
                mentions: [sender]
              });
            }
            return { stopProcessing: true };
          }
        } catch (error) {
          console.error("Erro no sistema antilink de canais:", error);
        }
      }
    }

    if (isGroup && groupData.antilinksoft && !isGroupAdmin && !isParceiro && budy2.includes('http') && !isOwner) {
      if (!isUserWhitelisted(sender, 'antilinksoft')) {
        try {
          await bot.sendMessage(from, {
            delete: { remoteJid: from, fromMe: false, id: info.key.id, participant: sender }
          });
          return { stopProcessing: true };
        } catch (error) {
          console.error("Erro no sistema antilinksoft:", error);
        }
      }
    }

    if (isGroup && groupData.antilinkhard && !isGroupAdmin && !isOwner && !isParceiro) {
      const linkRegex = /(https?:\/\/|www\.)[^\s]+|([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?/gi;
      const hasLink = linkRegex.test(budy2);
      
      if (hasLink && !isUserWhitelisted(sender, 'antilinkhard')) {
        try {
          const isMember = idInArray(sender, AllgroupMembers);
          if (isBotAdmin) {
            const targets = [sender];
            if (info.key.participantAlt) targets.push(info.key.participantAlt);
            
            await bot.groupParticipantsUpdate(from, targets, 'remove').catch(()=>{});
            
            await bot.sendMessage(from, {
              delete: { remoteJid: from, fromMe: false, id: info.key.id, participant: sender }
            }).catch(()=>{});
            
            await reply(MESSAGES.middleware.antiLink.linkRemoved(getUserName(sender)), {
              mentions: [sender]
            });
          } else {
            await bot.sendMessage(from, {
              delete: { remoteJid: from, fromMe: false, id: info.key.id, participant: sender }
            }).catch(()=>{});
            
            await reply(MESSAGES.middleware.antiLink.linkWarned(getUserName(sender)), {
              mentions: [sender]
            });
          }
          return { stopProcessing: true };
        } catch (error) {
          console.error("Erro no sistema antilink hard:", error);
        }
      }
    }

    return { stopProcessing: false };
}
