import fs from 'fs';
import cron from 'node-cron';
import pathz from 'path';
import { GRUPOS_DIR } from '../utils/paths.js';
import { ensureDirectoryExists } from '../utils/helpers.js';
import { normalizeScheduleTime } from '../utils/timeHelpers.js';

const autoMsgCronJobs = {};

const unscheduleAutoMessage = (groupId, msgId) => {
  const key = `${groupId}:${msgId}`;
  const j = autoMsgCronJobs[key];
  if (j && typeof j.stop === 'function') {
    try { j.stop(); } catch (e) { console.error('Error stopping cleanup task:', e); }
  }
  delete autoMsgCronJobs[key];
};

export const scheduleAutoMessage = (groupId, msgConfig, bot) => {
  if (!groupId || !msgConfig || !msgConfig.id || !msgConfig.time) return;
  
  const normalized = normalizeScheduleTime(msgConfig.time);
  if (!normalized) return;
  
  const [hh, mm] = normalized.split(':');
  if (typeof hh === 'undefined' || typeof mm === 'undefined') return;
  
  const key = `${groupId}:${msgConfig.id}`;
  
  unscheduleAutoMessage(groupId, msgConfig.id);

  const cronExpr = `${parseInt(mm, 10)} ${parseInt(hh, 10)} * * *`;
  
  try {
    const task = cron.schedule(cronExpr, async () => {
      try {
        const filePath = pathz.join(GRUPOS_DIR, `${groupId}.json`);
        if (!fs.existsSync(filePath)) {
          console.warn(`[AutoMsg] Arquivo do grupo não encontrado: ${groupId}`);
          return;
        }
        
        let groupFileData = {};
        try {
          groupFileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) {
          console.error(`[AutoMsg] Erro ao ler arquivo do grupo ${groupId}:`, e);
          return;
        }
        
        const autoMessages = groupFileData.autoMessages || [];
        const currentMsg = autoMessages.find(m => m.id === msgConfig.id);
        
        if (!currentMsg) {
          console.warn(`[AutoMsg] Mensagem ${msgConfig.id} não encontrada no arquivo`);
          return;
        }
        
        if (!currentMsg.enabled) {
          console.log(`[AutoMsg] Mensagem ${msgConfig.id} está desativada, pulando envio`);
          return;
        }
        
        const messageContent = {};
        
        if (currentMsg.type === 'text') {
          messageContent.text = currentMsg.content;
        } else if (currentMsg.type === 'image') {
          messageContent.image = { url: currentMsg.mediaPath };
          if (currentMsg.caption) messageContent.caption = currentMsg.caption;
        } else if (currentMsg.type === 'video') {
          messageContent.video = { url: currentMsg.mediaPath };
          if (currentMsg.caption) messageContent.caption = currentMsg.caption;
        } else if (currentMsg.type === 'document') {
          messageContent.document = { url: currentMsg.mediaPath };
          messageContent.fileName = currentMsg.fileName || 'documento.pdf';
          if (currentMsg.caption) messageContent.caption = currentMsg.caption;
        } else if (currentMsg.type === 'sticker') {
          messageContent.sticker = { url: currentMsg.mediaPath };
        } else if (currentMsg.type === 'audio') {
          messageContent.audio = { url: currentMsg.mediaPath };
          messageContent.mimetype = 'audio/mp4';
        }
        
        await bot.sendMessage(groupId, messageContent);
        console.log(`[AutoMsg] ✅ Mensagem enviada automaticamente: Grupo ${groupId.substring(0, 15)}... ID ${msgConfig.id} às ${normalized}`);
        
      } catch (e) {
        console.error(`[AutoMsg Error] ${groupId}:${msgConfig.id}:`, e.message || e);
        if (e && (e.message === 'item-not-found' || e.data === 404)) {
          console.log(`[AutoMsg] 🗑️ Removendo auto-mensagem para grupo que não existe mais: ${groupId}`);
          unscheduleAutoMessage(groupId, msgConfig.id);
        }
      }
    }, { 
      scheduled: true,
      timezone: 'America/Sao_Paulo' 
    });

    task.start();
    autoMsgCronJobs[key] = task;
    console.log(`[AutoMsg] 🔔 Agendamento criado para ${key} em ${cronExpr} (timezone: America/Sao_Paulo)`);
  } catch (e) {
    console.error('[AutoMsg] Failed to schedule message', cronExpr, e);
  }
};

export const loadAllAutoMessages = async (bot) => {
  try {
    if (!ensureDirectoryExists(GRUPOS_DIR)) return;
    const files = await fs.promises.readdir(GRUPOS_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    let loadedCount = 0;
    
    await Promise.all(jsonFiles.map(async (f) => {
      const groupId = f.replace(/\.json$/, '');
      if (!groupId.endsWith('@g.us')) return;
      
      const filePath = pathz.join(GRUPOS_DIR, f);
      let data = {};
      try { 
        const fileContent = await fs.promises.readFile(filePath, 'utf8');
        data = JSON.parse(fileContent) || {}; 
      } catch (e) { return; }
      
      const autoMessages = data.autoMessages && Array.isArray(data.autoMessages) ? data.autoMessages : [];
      
      for (const msgConfig of autoMessages) {
        if (msgConfig.enabled && msgConfig.time) {
          scheduleAutoMessage(groupId, msgConfig, bot);
          console.log(`[AutoMsg] ✅ Mensagem agendada: Grupo ${groupId.substring(0, 15)}... ID ${msgConfig.id} às ${msgConfig.time}`);
          loadedCount++;
        }
      }
    }));
    
    if (loadedCount > 0) {
      console.log(`[AutoMsg] 📨 Total de ${loadedCount} mensagem(ns) automática(s) carregada(s) com sucesso`);
    }
  } catch (e) {
    console.error('[AutoMsg] Failed to load auto messages:', e);
  }
};

export const startAutoMensagensWorker = (bot) => {
  try {
    loadAllAutoMessages(bot);

    setInterval(() => {
      try {
        loadAllAutoMessages(bot);
      } catch (e) {
        console.error('[AutoMsg] refresh error:', e);
      }
    }, 6 * 60 * 60 * 1000); // a cada 6 horas
  } catch (e) {
    console.error('[AutoMsg] startAutoMensagensWorker error:', e);
  }
};
