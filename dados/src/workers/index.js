import fs from 'fs';
import cron from 'node-cron';
import pathz from 'path';
import { loadReminders, saveReminders, writeJsonFile, loadDonoDivulgacao, saveDonoDivulgacao } from '../utils/database.js';
import { GRUPOS_DIR } from '../utils/paths.js';
import { normalizeScheduleTime, getTodayStr, recordScheduleRun, hasRunForScheduleToday } from '../utils/timeHelpers.js';
import { ensureDirectoryExists, isGroupId } from '../utils/helpers.js';
import { PerformanceOptimizer, getPerformanceOptimizer } from '../utils/performanceOptimizer.js';

// Reusing global optimizer if possible, or instantiating a local one
const optimizer = getPerformanceOptimizer();

let workersStarted = false;
const gpCronJobs = {};
const autoMsgCronJobs = {};
let donoDivulgacaoCronJob = null;

export function startAllWorkers(nazuInstance) {
  if (workersStarted) return;
  workersStarted = true;

  startRemindersWorker(nazuInstance);
  startGpScheduleWorker(nazuInstance);
  startAutoHorariosWorker(nazuInstance);
  startAutoMensagensWorker(nazuInstance);
  startDonoDivulgacaoWorker(nazuInstance);
}

const startRemindersWorker = (nazuInstance) => {
  try {
    setInterval(async () => {
      try {
        const list = await optimizer.memoize(
          'reminders:all',
          () => Promise.resolve(loadReminders()),
          5000 // 5 segundos
        );
        if (!Array.isArray(list) || list.length === 0) return;
        const now = Date.now();
        let changed = false;
        for (const r of list) {
          if (!r || r.status === 'sent') continue;
          if (typeof r.at !== 'number') continue;
          if (r.at <= now) {
            const textMsg = `⏰ Lembrete${r.createdByName ? ` de ${r.createdByName}` : ''}: ${r.message}`;
            try {
              if (r.chatId && String(r.chatId).endsWith('@g.us')) {
                await nazuInstance.sendMessage(r.chatId, { text: textMsg, mentions: r.userId ? [r.userId] : [] });
              } else {
                const dest = r.chatId || r.userId;
                if (dest) await nazuInstance.sendMessage(dest, { text: textMsg });
              }
              r.status = 'sent';
              r.sentAt = new Date().toISOString();
              changed = true;
            } catch (e) {
              console.warn("Failed to send reminder:", e);
            }
          }
        }
        if (changed) {
          saveReminders(list);
          optimizer.clearStatic('reminders:all');
        }
      } catch (err) {
        console.error("Reminder worker error:", err);
      }
    }, 30 * 1000);
  } catch (e) {
    console.error("Start reminder worker error:", e);
  }
};

const unscheduleGroupJob = (groupId, type) => {
  const key = `${groupId}:${type}`;
  const j = gpCronJobs[key];
  if (j && typeof j.stop === 'function') {
    try { j.stop(); } catch (e) {}
  }
  delete gpCronJobs[key];
};

const scheduleGroupJob = (groupId, type, timeStr, nazuInstance) => {
  if (!groupId || !timeStr) return;
  const normalized = normalizeScheduleTime(timeStr);
  if (!normalized) return;
  const [hh, mm] = normalized.split(':');
  if (typeof hh === 'undefined' || typeof mm === 'undefined') return;
  const key = `${groupId}:${type}`;
  unscheduleGroupJob(groupId, type);

  const cronExpr = `${parseInt(mm, 10)} ${parseInt(hh, 10)} * * *`;
  try {
    const task = cron.schedule(cronExpr, async () => {
      try {
        const filePath = pathz.join(GRUPOS_DIR, `${groupId}.json`);
        if (!fs.existsSync(filePath)) return;
        let data = {};
        try { data = JSON.parse(fs.readFileSync(filePath, 'utf8')) || {}; } catch (e) { data = {}; }
        data.schedule = data.schedule || {};
        const schedule = data.schedule;

        if (type === 'open') {
          try {
            await nazuInstance.groupSettingUpdate(groupId, 'not_announcement');
            await nazuInstance.sendMessage(groupId, { text: '🔓 Grupo aberto automaticamente pelo agendamento diário.' });
            console.log(`[Cron] ✅ Grupo ABERTO automaticamente: ${groupId.substring(0, 15)}... às ${normalized}`);
          } catch (e) {
            console.error(`[Cron Error] open ${groupId}:`, e.message || e);
            if (e && (e.message === 'item-not-found' || e.data === 404)) {
              console.log(`[Cron] 🗑️ Removendo agendamento (${type}) para grupo que não existe mais: ${groupId}`);
              unscheduleGroupJob(groupId, type);
            }
          }
        } else {
          try {
            await nazuInstance.groupSettingUpdate(groupId, 'announcement');
            await nazuInstance.sendMessage(groupId, { text: '🔒 Grupo fechado automaticamente pelo agendamento diário.' });
            console.log(`[Cron] ✅ Grupo FECHADO automaticamente: ${groupId.substring(0, 15)}... às ${normalized}`);
          } catch (e) {
            console.error(`[Cron Error] close ${groupId}:`, e.message || e);
            if (e && (e.message === 'item-not-found' || e.data === 404)) {
              console.log(`[Cron] 🗑️ Removendo agendamento (${type}) para grupo que não existe mais: ${groupId}`);
              unscheduleGroupJob(groupId, type);
            }
          }
        }

        recordScheduleRun(schedule, type, getTodayStr(), normalized);
        data.schedule = schedule;
        try { writeJsonFile(filePath, data); } catch (e) { console.error('[Cron] Failed to write schedule run:', e); }
      } catch (e) {
        console.error('[Cron] Unexpected error in scheduled job:', e);
      }
    }, { timezone: 'America/Sao_Paulo' });

    gpCronJobs[key] = task;
  } catch (e) {
    console.error('[Cron] Failed to schedule job', cronExpr, e);
  }
};

const loadAllGroupSchedules = (nazuInstance) => {
  try {
    if (!ensureDirectoryExists(GRUPOS_DIR)) return;
    const files = fs.readdirSync(GRUPOS_DIR).filter(f => f.endsWith('.json'));
    let loadedCount = 0;
    for (const f of files) {
      const groupId = f.replace(/\.json$/, '');
      if (!groupId.endsWith('@g.us')) continue;
      const filePath = pathz.join(GRUPOS_DIR, f);
      let data = {};
      try { data = JSON.parse(fs.readFileSync(filePath, 'utf8')) || {}; } catch (e) { continue; }
      const schedule = data.schedule && typeof data.schedule === 'object' ? data.schedule : {};
      if (schedule.openTime) {
        scheduleGroupJob(groupId, 'open', schedule.openTime, nazuInstance);
        console.log(`[Cron] ✅ Agendamento ABRIR carregado: Grupo ${groupId.substring(0, 15)}... às ${schedule.openTime}`);
        loadedCount++;
      }
      if (schedule.closeTime) {
        scheduleGroupJob(groupId, 'close', schedule.closeTime, nazuInstance);
        console.log(`[Cron] ✅ Agendamento FECHAR carregado: Grupo ${groupId.substring(0, 15)}... às ${schedule.closeTime}`);
        loadedCount++;
      }
    }
    if (loadedCount > 0) {
      console.log(`[Cron] 📅 Total de ${loadedCount} agendamento(s) carregado(s) com sucesso`);
    }
  } catch (e) {
    console.error('[Cron] Failed to load group schedules:', e);
  }
};

const startGpScheduleWorker = (nazuInstance) => {
  try {
    loadAllGroupSchedules(nazuInstance);
  } catch (e) {
    console.error('[Cron] startGpScheduleWorker error:', e);
  }
};

const startAutoHorariosWorker = (nazuInstance) => {
  try {
    setInterval(async () => {
      try {
        const now = new Date();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        
        if (minutes !== 0 || seconds > 30) return;
        
        const autoSchedulesPath = './dados/database/autohorarios.json';
        if (!fs.existsSync(autoSchedulesPath)) return;
        
        let autoSchedules = {};
        try {
          autoSchedules = JSON.parse(fs.readFileSync(autoSchedulesPath, 'utf8'));
        } catch (e) {
          return;
        }
        
        const currentHour = now.getHours();
        
        for (const [chatId, config] of Object.entries(autoSchedules)) {
          if (!config.enabled) continue;
          if (!chatId.endsWith('@g.us')) continue;
          
          try {
            const currentTime = new Date();
            const currentBrazilTime = new Date(currentTime.getTime() - (3 * 60 * 60 * 1000));
            
            const games = [
              { name: "🎯 FORTUNE TIGER", hours: [9, 11, 14, 16, 18, 20, 22] },
              { name: "🐂 FORTUNE OX", hours: [8, 10, 13, 15, 17, 19, 21] },
              { name: "🐭 FORTUNE MOUSE", hours: [7, 12, 14, 16, 19, 21, 23] },
              { name: "🐰 FORTUNE RABBIT", hours: [6, 9, 11, 15, 18, 20, 22] },
              { name: "🐉 FORTUNE DRAGON", hours: [8, 10, 12, 16, 18, 21, 23] },
              { name: "💎 GATES OF OLYMPUS", hours: [7, 9, 13, 17, 19, 22, 0] },
              { name: "⚡ GATES OF AZTEC", hours: [6, 11, 14, 16, 20, 22, 1] },
              { name: "🍭 SWEET BONANZA", hours: [8, 12, 15, 17, 19, 21, 23] },
              { name: "🏺 HAND OF MIDAS", hours: [7, 10, 13, 16, 18, 20, 0] },
              { name: "🌟 STARLIGHT PRINCESS", hours: [6, 9, 12, 15, 19, 22, 1] },
              { name: "🔥 FIRE PORTALS", hours: [8, 11, 14, 17, 20, 23, 2] },
              { name: "⭐ STAR CLUSTERS", hours: [7, 10, 12, 16, 18, 21, 0] },
              { name: "🌊 AQUA MILLIONS", hours: [6, 9, 13, 15, 19, 22, 1] },
              { name: "🎪 CIRCUS LAUNCH", hours: [8, 11, 14, 16, 20, 23, 2] },
              { name: "🏖️ CASH PATROL", hours: [7, 10, 13, 17, 19, 21, 0] },
              { name: "🎊 PARTY FEVER", hours: [6, 12, 15, 18, 20, 22, 1] },
              { name: "🎭 MYSTERY JOKER", hours: [8, 10, 14, 16, 19, 23, 2] },
              { name: "🎰 SPIN PARTY", hours: [7, 9, 13, 15, 18, 21, 0] },
              { name: "💰 MONEY MAKER", hours: [6, 11, 12, 17, 20, 22, 1] }
            ];
            
            let responseText = `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
            responseText += `┃    🎰 *HORÁRIOS PAGANTES*   ┃\n`;
            responseText += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
            responseText += `🕐 *Atualizado automaticamente:*\n`;
            responseText += `📅 ${currentBrazilTime.toLocaleDateString('pt-BR')}\n`;
            responseText += `⏰ ${currentBrazilTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n\n`;
            
            games.forEach(game => {
              const todayHours = game.hours.map(baseHour => {
                const variation = Math.floor(Math.random() * 21) - 10;
                const finalHour = baseHour + Math.floor(variation / 60);
                const finalMinutes = Math.abs(variation % 60);
                
                const displayHour = finalHour < 0 ? 24 + finalHour : finalHour > 23 ? finalHour - 24 : finalHour;
                return `${displayHour.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
              });
              
              responseText += `${game.name}\n`;
              responseText += `🕐 ${todayHours.join(' • ')}\n\n`;
            });
            
            if (config.link) {
              responseText += `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
              responseText += `┃      🔗 *LINK DE APOSTAS*     ┃\n`;
              responseText += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
              responseText += `${config.link}\n\n`;
            }
            
            responseText += `⚠️ *AVISOS IMPORTANTES:*\n`;
            responseText += `🔞 *Conteúdo para maiores de 18 anos*\n`;
            responseText += `📊 Estes são horários estimados\n`;
            responseText += `🎯 Jogue com responsabilidade\n`;
            responseText += `💰 Nunca aposte mais do que pode perder\n`;
            responseText += `🆘 Procure ajuda se tiver vício em jogos\n`;
            responseText += `⚖️ Apostas podem causar dependência\n\n`;
            responseText += `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
            responseText += `┃  🍀 *BOA SORTE E JOGUE*    ┃\n`;
            responseText += `┃     *CONSCIENTEMENTE!* 🍀  ┃\n`;
            responseText += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛`;
            
            await nazuInstance.sendMessage(chatId, { text: responseText });
            
            config.lastSent = Date.now();
            
          } catch (e) {
            console.error(`Erro ao enviar auto horários para ${chatId}:`, e.message || e);
            if (e && (e.message === 'item-not-found' || e.data === 404)) {
              console.log(`[AutoHorarios] 🗑️ Desativando horários para grupo que não existe mais: ${chatId}`);
              config.enabled = false;
            }
          }
        }
        
        try {
          writeJsonFile(autoSchedulesPath, autoSchedules);
        } catch (e) {
          console.error('Erro ao salvar auto schedules:', e);
        }
        
      } catch (err) {
        console.error('Erro no auto horários worker:', err);
      }
    }, 60 * 1000);
    
  } catch (e) {
    console.error('Erro ao iniciar auto horários worker:', e);
  }
};

const unscheduleAutoMessage = (groupId, msgId) => {
  const key = `${groupId}:${msgId}`;
  const j = autoMsgCronJobs[key];
  if (j && typeof j.stop === 'function') {
    try { j.stop(); } catch (e) {}
  }
  delete autoMsgCronJobs[key];
};

const scheduleAutoMessage = (groupId, msgConfig, nazuInstance) => {
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
        
        await nazuInstance.sendMessage(groupId, messageContent);
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

const loadAllAutoMessages = (nazuInstance) => {
  try {
    if (!ensureDirectoryExists(GRUPOS_DIR)) return;
    const files = fs.readdirSync(GRUPOS_DIR).filter(f => f.endsWith('.json'));
    let loadedCount = 0;
    
    for (const f of files) {
      const groupId = f.replace(/\.json$/, '');
      if (!groupId.endsWith('@g.us')) continue;
      
      const filePath = pathz.join(GRUPOS_DIR, f);
      let data = {};
      try { data = JSON.parse(fs.readFileSync(filePath, 'utf8')) || {}; } catch (e) { continue; }
      
      const autoMessages = data.autoMessages && Array.isArray(data.autoMessages) ? data.autoMessages : [];
      
      for (const msgConfig of autoMessages) {
        if (msgConfig.enabled && msgConfig.time) {
          scheduleAutoMessage(groupId, msgConfig, nazuInstance);
          console.log(`[AutoMsg] ✅ Mensagem agendada: Grupo ${groupId.substring(0, 15)}... ID ${msgConfig.id} às ${msgConfig.time}`);
          loadedCount++;
        }
      }
    }
    
    if (loadedCount > 0) {
      console.log(`[AutoMsg] 📨 Total de ${loadedCount} mensagem(ns) automática(s) carregada(s) com sucesso`);
    }
  } catch (e) {
    console.error('[AutoMsg] Failed to load auto messages:', e);
  }
};

const startAutoMensagensWorker = (nazuInstance) => {
  try {
    loadAllAutoMessages(nazuInstance);

    setInterval(() => {
      try {
        loadAllAutoMessages(nazuInstance);
      } catch (e) {
        console.error('[AutoMsg] refresh error:', e);
      }
    }, 6 * 60 * 60 * 1000); // a cada 6 horas
  } catch (e) {
    console.error('[AutoMsg] startAutoMensagensWorker error:', e);
  }
};

const unscheduleDonoDivulgacaoJob = () => {
  if (donoDivulgacaoCronJob && typeof donoDivulgacaoCronJob.stop === 'function') {
    try { donoDivulgacaoCronJob.stop(); } catch (e) {}
  }
  donoDivulgacaoCronJob = null;
};

const runDonoDivulgacaoSend = async (nazuInstance, messageText, source = 'manual') => {
  const config = loadDonoDivulgacao();
  const groups = Array.isArray(config.groups) ? config.groups : [];
  const text = (messageText || config.message || '').trim();

  if (!text) {
    return { success: false, message: '❌ Nenhuma mensagem configurada para divulgar.' };
  }
  if (groups.length === 0) {
    return { success: false, message: '❌ Nenhum grupo registrado para divulgação.' };
  }

  let sent = 0;
  let failed = 0;

  for (const groupId of groups) {
    if (!isGroupId(groupId)) {
      failed++;
      continue;
    }
    try {
      await nazuInstance.sendMessage(groupId, { text });
      sent++;
    } catch (e) {
      failed++;
    }
  }

  config.stats = config.stats || { totalSent: 0, lastManual: null, lastAuto: null };
  config.stats.totalSent = (config.stats.totalSent || 0) + sent;
  if (source === 'auto') {
    config.stats.lastAuto = new Date().toISOString();
  } else {
    config.stats.lastManual = new Date().toISOString();
  }

  saveDonoDivulgacao(config);

  return { success: true, sent, failed };
};

const scheduleDonoDivulgacaoJob = (timeStr, nazuInstance) => {
  const normalized = normalizeScheduleTime(timeStr);
  if (!normalized) return false;
  const [hh, mm] = normalized.split(':');
  if (typeof hh === 'undefined' || typeof mm === 'undefined') return false;

  unscheduleDonoDivulgacaoJob();

  const cronExpr = `${parseInt(mm, 10)} ${parseInt(hh, 10)} * * *`;
  try {
    const task = cron.schedule(cronExpr, async () => {
      try {
        const config = loadDonoDivulgacao();
        const schedule = config.schedule || {};

        if (!schedule.enabled || !schedule.time) return;
        const targetTime = normalizeScheduleTime(schedule.time);
        if (!targetTime) return;

        const today = getTodayStr();
        if (hasRunForScheduleToday(schedule.lastRun, today, targetTime)) return;

        const result = await runDonoDivulgacaoSend(nazuInstance, null, 'auto');
        if (result.success) {
          schedule.lastRun = { date: today, time: targetTime };
          config.schedule = schedule;
          saveDonoDivulgacao(config);
        }
      } catch (e) {
        console.error('[DivDono] Erro no agendamento:', e);
      }
    }, { timezone: 'America/Sao_Paulo' });

    task.start();
    donoDivulgacaoCronJob = task;
    return true;
  } catch (e) {
    console.error('[DivDono] Falha ao agendar job', cronExpr, e);
    return false;
  }
};

const startDonoDivulgacaoWorker = (nazuInstance) => {
  try {
    const config = loadDonoDivulgacao();
    if (config.schedule?.enabled && config.schedule?.time) {
      scheduleDonoDivulgacaoJob(config.schedule.time, nazuInstance);
    }
  } catch (e) {
    console.error('[DivDono] Erro ao iniciar worker:', e);
  }
};

export { runDonoDivulgacaoSend };
