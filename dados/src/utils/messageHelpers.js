import { getBotId, ensureDirectoryExists } from './helpers.js';
import { downloadContentFromMessage } from 'baileys';
import fs from 'fs';
import pathz from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = pathz.dirname(__filename);

/**
 * Extracts text from various message types including interactive responses
 */
export const getMessageText = (message) => {
  if (!message) return '';
  
  if (message.interactiveResponseMessage) {
    const interactiveResponse = message.interactiveResponseMessage;
    
    if (interactiveResponse.nativeFlowResponseMessage?.paramsJson) {
      try {
        const params = JSON.parse(interactiveResponse.nativeFlowResponseMessage.paramsJson);
        return params.id || '';
      } catch (error) {
        console.error('Erro ao processar resposta de single_select:', error);
      }
    }
    
    if (interactiveResponse.body?.text) {
      return interactiveResponse.body.text;
    }
    
    if (interactiveResponse.selectedDisplayText) {
      return interactiveResponse.selectedDisplayText;
    }
    
    if (typeof interactiveResponse === 'string') {
      return interactiveResponse;
    }
  }
  
  if (message.listResponseMessage?.singleSelectReply?.selectedRowId) {
    return message.listResponseMessage.singleSelectReply.selectedRowId;
  }
  
  if (message.buttonsResponseMessage?.selectedButtonId) {
    return message.buttonsResponseMessage.selectedButtonId;
  }
  
  return message.conversation || 
         message.extendedTextMessage?.text || 
         message.imageMessage?.caption || 
         message.videoMessage?.caption || 
         message.documentWithCaptionMessage?.message?.documentMessage?.caption || 
         message.viewOnceMessage?.message?.imageMessage?.caption || 
         message.viewOnceMessage?.message?.videoMessage?.caption || 
         message.viewOnceMessageV2?.message?.imageMessage?.caption || 
         message.viewOnceMessageV2?.message?.videoMessage?.caption || 
         message.editedMessage?.message?.protocolMessage?.editedMessage?.extendedTextMessage?.text || 
         message.editedMessage?.message?.protocolMessage?.editedMessage?.imageMessage?.caption || 
         '';
};

/**
 * Enhanced participant ID extraction with both LID and JID support
 */
export const extractParticipantId = (participant) => {
  if (!participant) return null;
  // Retorna LID se disponível, senão retorna o ID padrão
  let id = participant.lid || participant.id || null;
  
  // Remove :XX se existir (ex: 267955023654984:13@lid -> 267955023654984@lid)
  if (id && id.includes(':')) {
    const suffix = id.includes('@lid') ? '@lid' : '@s.whatsapp.net';
    id = id.split(':')[0] + suffix;
  }
  
  return id;
};

/**
 * Extracts the real reason by removing mentions from the text
 */
export function extractReason(text, mentionedJids) {
  let reason = text;
  if (mentionedJids) {
    mentionedJids.forEach(jid => { 
      reason = reason.replace('@' + jid.split('@')[0], ''); 
    });
  }
  return reason.trim() || 'Não especificado';
}

/**
 * Helper to normalize clan names - removes accents and non-alphanumeric characters
 */
export function normalizeClanName(name) {
  if (!name) return '';
  const n = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return n.replace(/[^a-zA-Z0-9 ]/g, '').trim().toLowerCase();
}

/**
 * Helper to normalize commands - removes accents but keeps spaces
 */
export function normalizeCommand(cmd) {
  if (!cmd) return '';
  const n = cmd.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return n.replace(/[^a-zA-Z0-9\s]/g, '').trim().toLowerCase();
}

/**
 * Robust bot ID extraction with multiple fallback mechanisms
 */
export const getBotNumber = (nazu) => {
  try {
    // Tenta pegar LID primeiro
    if (nazu.user?.lid) {
      // Remove o sufixo `:XX` se existir
      const lid = nazu.user.lid;
      const cleanLid = lid.includes(':') ? lid.split(':')[0] + '@lid' : lid;
      return cleanLid;
    }
    
    // Fallback para ID padrão
    if (nazu.user?.id) {
      const botId = nazu.user.id.split(':')[0];
      return `${botId}@s.whatsapp.net`;
    }

    // Usa helper se disponível
    if (typeof getBotId === 'function') {
      return getBotId(nazu);
    }

    console.warn('Unable to determine bot number - user object:', nazu.user);
    return null;
  } catch (error) {
    console.error('Error extracting bot number:', error);
    return null;
  }
};
/**
 * Downloads a message content and returns a buffer
 */
export const getFileBuffer = async (mediakey, mediaType, options = {}) => {
  try {
    if (!mediakey) {
      throw new Error('Chave de mídia inválida');
    }
    const stream = await downloadContentFromMessage(mediakey, mediaType);
    let buffer = Buffer.from([]);
    const MAX_BUFFER_SIZE = 50 * 1024 * 1024;
    let totalSize = 0;
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
      totalSize += chunk.length;
      if (totalSize > MAX_BUFFER_SIZE) {
        throw new Error(`Tamanho máximo de buffer excedido (${MAX_BUFFER_SIZE / (1024 * 1024)}MB)`);
      }
    }
    if (options.saveToTemp) {
      try {
        const tempDir = pathz.join(__dirname, '..', '..', 'database', 'tmp');
        ensureDirectoryExists(tempDir);
        const fileName = options.fileName || `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        const filePath = pathz.join(tempDir, fileName);
        fs.writeFileSync(filePath, buffer);
        return { buffer, filePath };
      } catch (saveError) {
        console.error('Erro ao salvar arquivo temporário:', saveError);
      }
    }
    return buffer;
  } catch (error) {
    console.error('Erro ao obter buffer do arquivo:', error);
    throw error;
  }
};

/**
 * Identifies the media type and content of a message
 */
export const getMediaInfo = (message) => {
  if (!message) return null;
  if (message.imageMessage) return {
    media: message.imageMessage,
    type: 'image'
  };
  if (message.videoMessage) return {
    media: message.videoMessage,
    type: 'video'
  };
  if (message.audioMessage) return {
    media: message.audioMessage,
    type: 'audio'
  };
  if (message.viewOnceMessage?.message?.imageMessage) return {
    media: message.viewOnceMessage.message.imageMessage,
    type: 'image'
  };
  if (message.viewOnceMessage?.message?.videoMessage) return {
    media: message.viewOnceMessage.message.videoMessage,
    type: 'video'
  };
  if (message.viewOnceMessage?.message?.audioMessage) return {
    media: message.viewOnceMessage.message.audioMessage,
    type: 'audio'
  };
  if (message.viewOnceMessageV2?.message?.imageMessage) return {
    media: message.viewOnceMessageV2.message.imageMessage,
    type: 'image'
  };
  if (message.viewOnceMessageV2?.message?.videoMessage) return {
    media: message.viewOnceMessageV2.message.videoMessage,
    type: 'video'
  };
  if (message.viewOnceMessageV2?.message?.audioMessage) return {
    media: message.viewOnceMessageV2.message.audioMessage,
    type: 'audio'
  };
  return null;
};

/**
 * Processes an image using ffmpeg for profile picture format
 */
export const processImageForProfile = async (imageBuffer) => {
  const tempDir = pathz.join(__dirname, '..', '..', 'database', 'tmp');
  ensureDirectoryExists(tempDir);
  
  const inputFile = pathz.join(tempDir, `input_${Date.now()}.jpg`);
  const outputFile = pathz.join(tempDir, `output_${Date.now()}.jpg`);
  
  try {
    fs.writeFileSync(inputFile, imageBuffer);
    const cmd = `ffmpeg -hide_banner -loglevel error -i "${inputFile}" -vf "scale=640:640:force_original_aspect_ratio=decrease,pad=640:640:(ow-iw)/2:(oh-ih)/2:color=white" -q:v 5 -y "${outputFile}"`;
    await execAsync(cmd, { timeout: 15000 });
    const processedBuffer = fs.readFileSync(outputFile);
    try {
      fs.unlinkSync(inputFile);
      fs.unlinkSync(outputFile);
    } catch (cleanupError) {
      console.warn('Aviso: Erro ao limpar arquivos temporários:', cleanupError.message);
    }
    return processedBuffer;
  } catch (error) {
    try {
      if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
      if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
    } catch (cleanupError) {}
    throw new Error(`Erro ao processar imagem: ${error.message}`);
  }
};
