import pathz from 'path';
import fs from 'fs';
import db from '../../utils/database/io.js';
import { scheduleAutoMessage, unscheduleAutoMessage } from '../../workers/autoMessagesWorker.js';
import { ensureDirectoryExists } from '../../utils/helpers.js';
import { normalizeScheduleTime } from '../../utils/timeHelpers.js';
import { ROOT_DIR } from '../../utils/paths.js';

const AUTOMSG_MEDIA_DIR = pathz.join(ROOT_DIR, 'dados', 'midias', 'automsg');

export default {
  name: "automsg",
  description: "Gerencia o envio automático de mensagens agendadas",
  commands: ["automsg"],
  usage: "{prefix}automsg help",
  handle: async ({ 
    bot, 
    from, 
    reply, 
    args, 
    prefix, 
    groupData,
    buildGroupFilePath,
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
    const groupFileData = groupData;
    groupFileData.autoMessages = groupFileData.autoMessages || [];

    // --- ADD ---
    if (subCommand === 'add') {
      if (!q.includes('|')) {
        return reply(MESSAGES.admin.automsg.addInvalidFormat(prefix));
      }

      // Extrai horário e descrição: "add HH:MM | descrição"
      const [timeStr, ...descParts] = args.slice(1).join(' ').split('|').map(s => s.trim());
      const description = descParts.join('|').trim() || 'Sem descrição';

      const normalizedTime = normalizeScheduleTime(timeStr);
      if (!normalizedTime) return reply(MESSAGES.admin.automsg.addInvalidTime);

      const newMsgConfig = {
        id: Date.now().toString(),
        time: normalizedTime,
        description,
        enabled: true,
        createdAt: new Date().toISOString(),
        createdBy: sender
      };

      if (quotedMessageContent) {
        const autoMsgGroupDir = pathz.join(AUTOMSG_MEDIA_DIR, from);
        ensureDirectoryExists(autoMsgGroupDir);

        if (isQuotedImage || isQuotedVisuU || isQuotedVisuU2) {
          const imageMsg = quotedMessageContent.imageMessage || 
            quotedMessageContent.viewOnceMessage?.message?.imageMessage ||
            quotedMessageContent.viewOnceMessageV2?.message?.imageMessage;

          const imageBuffer = await getFileBuffer(imageMsg, 'image');
          const imagePath = pathz.join(autoMsgGroupDir, `${newMsgConfig.id}.jpg`);
          fs.writeFileSync(imagePath, imageBuffer);

          newMsgConfig.type = 'image';
          newMsgConfig.mediaPath = imagePath;
          newMsgConfig.caption = imageMsg?.caption || description;

        } else if (isQuotedVideo) {
          const videoBuffer = await getFileBuffer(quotedMessageContent.videoMessage, 'video');
          const videoPath = pathz.join(autoMsgGroupDir, `${newMsgConfig.id}.mp4`);
          fs.writeFileSync(videoPath, videoBuffer);

          newMsgConfig.type = 'video';
          newMsgConfig.mediaPath = videoPath;
          newMsgConfig.caption = quotedMessageContent.videoMessage?.caption || description;

        } else if (isQuotedDocument || isQuotedDocW) {
          const docMsg = quotedMessageContent.documentMessage || 
            quotedMessageContent.documentWithCaptionMessage?.message?.documentMessage;
          const docBuffer = await getFileBuffer(docMsg, 'document');
          const docExt = docMsg?.fileName?.split('.').pop() || 'pdf';
          const docPath = pathz.join(autoMsgGroupDir, `${newMsgConfig.id}.${docExt}`);
          fs.writeFileSync(docPath, docBuffer);

          newMsgConfig.type = 'document';
          newMsgConfig.mediaPath = docPath;
          newMsgConfig.fileName = docMsg?.fileName || 'documento.pdf';
          newMsgConfig.caption = docMsg?.caption || description;

        } else if (isQuotedSticker) {
          const stickerBuffer = await getFileBuffer(quotedMessageContent.stickerMessage, 'sticker');
          const stickerPath = pathz.join(autoMsgGroupDir, `${newMsgConfig.id}.webp`);
          fs.writeFileSync(stickerPath, stickerBuffer);

          newMsgConfig.type = 'sticker';
          newMsgConfig.mediaPath = stickerPath;

        } else if (isQuotedAudio) {
          const audioBuffer = await getFileBuffer(quotedMessageContent.audioMessage, 'audio');
          const audioPath = pathz.join(autoMsgGroupDir, `${newMsgConfig.id}.mp3`);
          fs.writeFileSync(audioPath, audioBuffer);

          newMsgConfig.type = 'audio';
          newMsgConfig.mediaPath = audioPath;

        } else if (isQuotedMsg || isQuotedMsg2) {
          const quotedText = quotedMessageContent.conversation || 
            quotedMessageContent.extendedTextMessage?.text;
          newMsgConfig.type = 'text';
          newMsgConfig.content = quotedText;

        } else {
          return reply(MESSAGES.admin.automsg.addUnsupportedFormat);
        }
      } else {
        if (!description || description === 'Sem descrição') {
          return reply('❌ Você precisa responder a uma mensagem ou fornecer um texto após o horário.');
        }
        newMsgConfig.type = 'text';
        newMsgConfig.content = description;
      }

      groupFileData.autoMessages.push(newMsgConfig);
      db.writeSafe(groupFilePath, groupFileData);

      // Agenda imediatamente — sem precisar aguardar o próximo refresh do worker
      scheduleAutoMessage(from, newMsgConfig, bot);

      return reply(MESSAGES.admin.automsg.addSuccess(normalizedTime));
    }

    // --- LIST ---
    if (subCommand === 'list' || subCommand === 'lista') {
      if (groupFileData.autoMessages.length === 0) return reply(MESSAGES.admin.automsg.listEmpty);
      
      let listText = MESSAGES.admin.automsg.listHeader;
      groupFileData.autoMessages.forEach((scheduledMsg, idx) => {
        const statusIcon = scheduledMsg.enabled ? '✅' : '❌';
        listText += MESSAGES.admin.automsg.listItem(statusIcon, idx + 1, scheduledMsg.id, scheduledMsg.time, scheduledMsg.description);
      });
      return reply(listText);
    }

    // --- DELETE ---
    if (subCommand === 'del' || subCommand === 'delete' || subCommand === 'remover') {
      const targetId = args[1];
      if (!targetId) return reply(MESSAGES.admin.automsg.delProvideId);

      let removedMsg = null;
      const countBefore = groupFileData.autoMessages.length;

      if (targetId.length < 5) {
        // Índice numérico da lista (ex: "1", "2")
        const targetIndex = parseInt(targetId) - 1;
        if (targetIndex >= 0 && targetIndex < groupFileData.autoMessages.length) {
          removedMsg = groupFileData.autoMessages[targetIndex];
          groupFileData.autoMessages.splice(targetIndex, 1);
        }
      } else {
        const foundIndex = groupFileData.autoMessages.findIndex(m => m.id === targetId);
        if (foundIndex !== -1) {
          removedMsg = groupFileData.autoMessages[foundIndex];
          groupFileData.autoMessages.splice(foundIndex, 1);
        }
      }

      if (groupFileData.autoMessages.length < countBefore && removedMsg) {
        if (removedMsg.mediaPath && fs.existsSync(removedMsg.mediaPath)) {
          try { fs.unlinkSync(removedMsg.mediaPath); } catch (_) { /* falha silenciosa */ }
        }
        unscheduleAutoMessage(from, removedMsg.id);
        db.writeSafe(groupFilePath, groupFileData);
        return reply(MESSAGES.admin.automsg.delSuccess);
      }

      return reply(MESSAGES.admin.automsg.delNotFound);
    }

    // --- ON ---
    if (subCommand === 'on' || subCommand === 'ativar') {
      const targetId = args[1];
      if (!targetId) return reply(`❌ Forneça o ID da mensagem.\nUso: ${prefix}automsg on [id]`);

      const targetMsg = groupFileData.autoMessages.find(m => m.id === targetId);
      if (!targetMsg) return reply('❌ Mensagem não encontrada. Use automsg list para ver os IDs.');

      targetMsg.enabled = true;
      db.writeSafe(groupFilePath, groupFileData);
      scheduleAutoMessage(from, targetMsg, bot);

      return reply(`✅ Mensagem automática ativada!\n\n🆔 ID: ${targetId}`);
    }

    // --- OFF ---
    if (subCommand === 'off' || subCommand === 'desativar') {
      const targetId = args[1];
      if (!targetId) return reply(`❌ Forneça o ID da mensagem.\nUso: ${prefix}automsg off [id]`);

      const targetMsg = groupFileData.autoMessages.find(m => m.id === targetId);
      if (!targetMsg) return reply('❌ Mensagem não encontrada. Use automsg list para ver os IDs.');

      targetMsg.enabled = false;
      db.writeSafe(groupFilePath, groupFileData);
      unscheduleAutoMessage(from, targetId);

      return reply(`✅ Mensagem automática desativada!\n\n🆔 ID: ${targetId}`);
    }

    return reply(`❌ Subcomando inválido. Use: add, list, del, on ou off`);
  },
};
