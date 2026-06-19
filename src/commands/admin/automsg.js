import pathz from 'path';
import fs from 'fs';


export default {
  name: "automsg",
  description: "Gerencia o envio automático de mensagens agendadas",
  commands: ["automsg"],
  usage: "{prefix}automsg help",
  handle: async ({ 
    bot, 
    from, 
    reply, 
    isGroup, 
    isGroupAdmin, 
    isOwner, 
    args, 
    prefix, 
    groupData,
    buildGroupFilePath,
    optimizer,
    quotedMessageContent,
    isQuotedImage,
    isQuotedVideo,
    isQuotedAudio,
    isQuotedSticker,
    isQuotedDocument,
    isQuotedDocW,
    isQuotedVisuU,
    isQuotedVisuU2,
    isQuotedMsg,
    isQuotedMsg2,
    getFileBuffer,
    sender,
    q,
    MESSAGES
  }) => {

    const subCommand = args[0]?.toLowerCase();
    
    if (!subCommand || subCommand === 'help') {
      return reply(MESSAGES.admin.automsg.helpText(prefix));
    }

    const groupFilePath = buildGroupFilePath(from);
    let data = groupData;
    data.autoMessages = data.autoMessages || [];

    // --- ADD ---
    if (subCommand === 'add') {
      if (!q.includes('|')) {
        return reply(MESSAGES.admin.automsg.addInvalidFormat(prefix));
      }

      const parts = q.split('|').map(s => s.trim());
      const timeStr = parts[0].split(' ').slice(1).join(' '); // Pega o horário após o "add"
      const description = parts[1] || 'Sem descrição';

      // Validação de horário básica (HH:MM)
      const timeMatch = timeStr.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/);
      if (!timeMatch) return reply(MESSAGES.admin.automsg.addInvalidTime);

      const normalizedTime = timeStr.padStart(5, '0');

      let msgConfig = {
        id: Date.now().toString(),
        time: normalizedTime,
        description: description,
        enabled: true,
        createdAt: new Date().toISOString(),
        createdBy: sender
      };

      if (quotedMessageContent) {
        // Lógica de salvamento de mídia (simplificada para o comando modular)
        // No index.js real, isso salvaria em um diretório específico.
        // Aqui vamos apenas marcar o tipo e conteúdo se for texto, 
        // ou avisar que mídia requer salvamento persistente (geralmente feito por serviços).
        
        if (isQuotedImage || isQuotedVisuU || isQuotedVisuU2) {
          msgConfig.type = 'image';
          msgConfig.caption = quotedMessageContent.imageMessage?.caption || description;
          // O buffer precisaria ser salvo em disco. No Chainy, 
          // assumimos que o sistema de carregamento cuidará disso.
          return reply(MESSAGES.admin.automsg.addMediaWarning);
        } else if (isQuotedMsg || isQuotedMsg2) {
          msgConfig.type = 'text';
          msgConfig.content = quotedMessageContent.conversation || quotedMessageContent.extendedTextMessage?.text;
        } else {
          return reply(MESSAGES.admin.automsg.addUnsupportedFormat);
        }
      } else {
        msgConfig.type = 'text';
        msgConfig.content = description;
      }

      data.autoMessages.push(msgConfig);
      await optimizer.saveJsonWithCache(groupFilePath, data);
      
      return reply(MESSAGES.admin.automsg.addSuccess(normalizedTime));
    }

    // --- LIST ---
    if (subCommand === 'list' || subCommand === 'lista') {
      if (data.autoMessages.length === 0) return reply(MESSAGES.admin.automsg.listEmpty);
      
      let listMsg = MESSAGES.admin.automsg.listHeader;
      data.autoMessages.forEach((msg, idx) => {
        const status = msg.enabled ? '✅' : '❌';
        listMsg += MESSAGES.admin.automsg.listItem(status, idx + 1, msg.id, msg.time, msg.description);
      });
      return reply(listMsg);
    }

    // --- DELETE ---
    if (subCommand === 'del' || subCommand === 'remover') {
      const id = args[1];
      if (!id) return reply(MESSAGES.admin.automsg.delProvideId);
      
      const initialCount = data.autoMessages.length;
      if (id.length < 5) { // Provavelmente um índice
        const idx = parseInt(id) - 1;
        if (idx >= 0 && idx < data.autoMessages.length) {
          data.autoMessages.splice(idx, 1);
        }
      } else {
        data.autoMessages = data.autoMessages.filter(m => m.id !== id);
      }

      if (data.autoMessages.length < initialCount) {
        await optimizer.saveJsonWithCache(groupFilePath, data);
        return reply(MESSAGES.admin.automsg.delSuccess);
      } else {
        return reply(MESSAGES.admin.automsg.delNotFound);
      }
    }
  },
};
