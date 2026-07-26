import pathz from 'path';
import fs from 'fs';
import db from '../../utils/database/io.js';
import { scheduleAutoMessage, unscheduleAutoMessage } from '../../workers/autoMessagesWorker.js';
import { ensureDirectoryExists } from '../../utils/helpers.js';
import { unwrapMessage } from '../../utils/messageHelpers.js';
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
    getFileBuffer,
    info,
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

      try {
        const rawTarget = quotedMessageContent || info?.message;
        const targetContent = unwrapMessage(rawTarget);
        const isQuoted = !!quotedMessageContent;

        const imageMsg = targetContent?.imageMessage || 
          targetContent?.viewOnceMessage?.message?.imageMessage ||
          targetContent?.viewOnceMessageV2?.message?.imageMessage;

        const videoMsg = targetContent?.videoMessage || 
          targetContent?.viewOnceMessage?.message?.videoMessage ||
          targetContent?.viewOnceMessageV2?.message?.videoMessage;

        const docMsg = targetContent?.documentMessage || 
          targetContent?.documentWithCaptionMessage?.message?.documentMessage;

        const stickerMsg = targetContent?.stickerMessage;

        const audioMsg = targetContent?.audioMessage;

        if (imageMsg || videoMsg || docMsg || stickerMsg || audioMsg) {
          const safeFromFolder = from.replace(/[^a-zA-Z0-9_@.-]/g, '_');
          const autoMsgGroupDir = pathz.join(AUTOMSG_MEDIA_DIR, safeFromFolder);
          ensureDirectoryExists(autoMsgGroupDir);

          if (imageMsg) {
            const imageBuffer = await getFileBuffer(imageMsg, 'image');
            const imagePath = pathz.join(autoMsgGroupDir, `${newMsgConfig.id}.jpg`);
            await fs.promises.writeFile(imagePath, imageBuffer);

            const captionToUse = (description && description !== 'Sem descrição')
              ? description
              : (imageMsg?.caption && !imageMsg.caption.startsWith(prefix) ? imageMsg.caption : description);

            newMsgConfig.type = 'image';
            newMsgConfig.mediaPath = imagePath;
            newMsgConfig.caption = captionToUse;

          } else if (videoMsg) {
            const videoBuffer = await getFileBuffer(videoMsg, 'video');
            const videoPath = pathz.join(autoMsgGroupDir, `${newMsgConfig.id}.mp4`);
            await fs.promises.writeFile(videoPath, videoBuffer);

            const captionToUse = (description && description !== 'Sem descrição')
              ? description
              : (videoMsg?.caption && !videoMsg.caption.startsWith(prefix) ? videoMsg.caption : description);

            newMsgConfig.type = 'video';
            newMsgConfig.mediaPath = videoPath;
            newMsgConfig.caption = captionToUse;

          } else if (docMsg) {
            const docBuffer = await getFileBuffer(docMsg, 'document');
            const docExt = docMsg?.fileName?.split('.').pop() || 'pdf';
            const docPath = pathz.join(autoMsgGroupDir, `${newMsgConfig.id}.${docExt}`);
            await fs.promises.writeFile(docPath, docBuffer);

            const captionToUse = (description && description !== 'Sem descrição')
              ? description
              : (docMsg?.caption && !docMsg.caption.startsWith(prefix) ? docMsg.caption : description);

            newMsgConfig.type = 'document';
            newMsgConfig.mediaPath = docPath;
            newMsgConfig.fileName = docMsg?.fileName || 'documento.pdf';
            newMsgConfig.caption = captionToUse;

          } else if (stickerMsg) {
            const stickerBuffer = await getFileBuffer(stickerMsg, 'sticker');
            const stickerPath = pathz.join(autoMsgGroupDir, `${newMsgConfig.id}.webp`);
            await fs.promises.writeFile(stickerPath, stickerBuffer);

            newMsgConfig.type = 'sticker';
            newMsgConfig.mediaPath = stickerPath;

          } else if (audioMsg) {
            const audioBuffer = await getFileBuffer(audioMsg, 'audio');
            const audioPath = pathz.join(autoMsgGroupDir, `${newMsgConfig.id}.mp3`);
            await fs.promises.writeFile(audioPath, audioBuffer);

            newMsgConfig.type = 'audio';
            newMsgConfig.mediaPath = audioPath;
          }
        } else if (isQuoted && (quotedMessageContent?.conversation || quotedMessageContent?.extendedTextMessage?.text)) {
          const quotedText = quotedMessageContent.conversation || quotedMessageContent.extendedTextMessage?.text;
          newMsgConfig.type = 'text';
          newMsgConfig.content = (description && description !== 'Sem descrição') ? description : quotedText;
        } else {
          if (!description || description === 'Sem descrição') {
            return reply('❌ Você precisa enviar/responder a uma mídia ou fornecer um texto após o horário.');
          }
          newMsgConfig.type = 'text';
          newMsgConfig.content = description;
        }

        groupFileData.autoMessages.push(newMsgConfig);
        await db.writeSafe(groupFilePath, groupFileData);

        // Agenda imediatamente — sem precisar aguardar o próximo refresh do worker
        scheduleAutoMessage(from, newMsgConfig, bot);

        return reply(MESSAGES.admin.automsg.addSuccess(normalizedTime));
      } catch (err) {
        console.error('❌ Erro no subcomando add do automsg:', err);
        return reply('❌ Ocorreu um erro ao processar a mídia da mensagem automática. Tente novamente.');
      }
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
        await db.writeSafe(groupFilePath, groupFileData);
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
      await db.writeSafe(groupFilePath, groupFileData);
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
      await db.writeSafe(groupFilePath, groupFileData);
      unscheduleAutoMessage(from, targetId);

      return reply(`✅ Mensagem automática desativada!\n\n🆔 ID: ${targetId}`);
    }

    return reply(`❌ Subcomando inválido. Use: add, list, del, on ou off`);
  },
};
