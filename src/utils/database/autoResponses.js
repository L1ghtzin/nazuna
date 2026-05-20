// ==================== DATABASE AUTO RESPONSES ====================
// Sistema de auto-respostas do bot (globais e por grupo).

import fs from 'fs';
import pathz from 'path';
import { ensureDirectoryExists, loadJsonFile, normalizar } from '../helpers.js';
import { DATABASE_DIR, GRUPOS_DIR, CUSTOM_AUTORESPONSES_FILE } from '../paths.js';

export const loadCustomAutoResponses = () => {
  return loadJsonFile(CUSTOM_AUTORESPONSES_FILE, {
    responses: []
  }).responses || [];
};

export const saveCustomAutoResponses = responses => {
  try {
    ensureDirectoryExists(DATABASE_DIR);
    fs.writeFileSync(CUSTOM_AUTORESPONSES_FILE, JSON.stringify({
      responses
    }, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar auto-respostas personalizadas:', error);
    return false;
  }
};

export const loadGroupAutoResponses = (groupId) => {
  const groupFile = pathz.join(GRUPOS_DIR, `${groupId}.json`);
  const groupData = loadJsonFile(groupFile, {});
  return groupData.autoResponses || [];
};

export const saveGroupAutoResponses = (groupId, autoResponses) => {
  try {
    const groupFile = pathz.join(GRUPOS_DIR, `${groupId}.json`);
    let groupData = loadJsonFile(groupFile, {});
    groupData.autoResponses = autoResponses;
    fs.writeFileSync(groupFile, JSON.stringify(groupData, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar auto-respostas do grupo:', error);
    return false;
  }
};

export const addAutoResponse = async (groupId, trigger, responseData, isGlobal = false) => {
  try {
    const newResponse = {
      id: Date.now().toString(),
      trigger: normalizar(trigger),
      response: responseData,
      createdAt: new Date().toISOString(),
      isGlobal: isGlobal
    };

    if (isGlobal) {
      const globalResponses = loadCustomAutoResponses();
      globalResponses.push(newResponse);
      return saveCustomAutoResponses(globalResponses);
    } else {
      const groupResponses = loadGroupAutoResponses(groupId);
      groupResponses.push(newResponse);
      return saveGroupAutoResponses(groupId, groupResponses);
    }
  } catch (error) {
    console.error('❌ Erro ao adicionar auto-resposta:', error);
    return false;
  }
};

export const deleteAutoResponse = (groupId, responseId, isGlobal = false) => {
  try {
    if (isGlobal) {
      const globalResponses = loadCustomAutoResponses();
      const filteredResponses = globalResponses.filter(r => r.id !== responseId);
      if (filteredResponses.length === globalResponses.length) return false;
      return saveCustomAutoResponses(filteredResponses);
    } else {
      const groupResponses = loadGroupAutoResponses(groupId);
      const filteredResponses = groupResponses.filter(r => r.id !== responseId);
      if (filteredResponses.length === groupResponses.length) return false;
      return saveGroupAutoResponses(groupId, filteredResponses);
    }
  } catch (error) {
    console.error('❌ Erro ao deletar auto-resposta:', error);
    return false;
  }
};

export const processAutoResponse = async (nazu, from, triggerText, info) => {
  try {
    const normalizedTrigger = normalizar(triggerText);
    
    // Verificar auto-respostas globais (do dono)
    const globalResponses = loadCustomAutoResponses();
    for (const response of globalResponses) {
      if (normalizedTrigger.includes(response.trigger || response.received)) {
        await sendAutoResponse(nazu, from, response, info);
        return true;
      }
    }

    // Verificar auto-respostas do grupo (dos admins)
    if (from.endsWith('@g.us')) {
      const groupResponses = loadGroupAutoResponses(from);
      for (const response of groupResponses) {
        if (normalizedTrigger.includes(response.trigger)) {
          await sendAutoResponse(nazu, from, response, info);
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('❌ Erro ao processar auto-resposta:', error);
    return false;
  }
};

export const sendAutoResponse = async (nazu, from, response, quotedMessage) => {
  try {
    const responseData = response.response || response;
    
    // Compatibilidade com sistema antigo (apenas texto)
    if (typeof responseData === 'string') {
      await nazu.sendMessage(from, { text: responseData }, { quoted: quotedMessage });
      return;
    }

    // Sistema novo com suporte a mídia
    const messageContent = {};
    const sendOptions = { quoted: quotedMessage };

    switch (responseData.type) {
      case 'text':
        messageContent.text = responseData.content;
        break;

      case 'image':
        if (responseData.buffer) {
          messageContent.image = Buffer.from(responseData.buffer, 'base64');
        } else if (responseData.url) {
          messageContent.image = { url: responseData.url };
        }
        if (responseData.caption) {
          messageContent.caption = responseData.caption;
        }
        break;

      case 'video':
        if (responseData.buffer) {
          messageContent.video = Buffer.from(responseData.buffer, 'base64');
        } else if (responseData.url) {
          messageContent.video = { url: responseData.url };
        }
        if (responseData.caption) {
          messageContent.caption = responseData.caption;
        }
        break;

      case 'audio':
        if (responseData.buffer) {
          messageContent.audio = Buffer.from(responseData.buffer, 'base64');
        } else if (responseData.url) {
          messageContent.audio = { url: responseData.url };
        }
        messageContent.mimetype = 'audio/mp4';
        messageContent.ptt = responseData.ptt || false;
        break;

      case 'sticker':
        if (responseData.buffer) {
          messageContent.sticker = Buffer.from(responseData.buffer, 'base64');
        } else if (responseData.url) {
          messageContent.sticker = { url: responseData.url };
        }
        break;

      default:
        messageContent.text = responseData.content || 'Resposta automática';
    }

    await nazu.sendMessage(from, messageContent, sendOptions);
  } catch (error) {
    console.error('❌ Erro ao enviar auto-resposta:', error);
  }
};
