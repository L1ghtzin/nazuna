import fs from 'fs';
import cron from 'node-cron';
import pathz from 'path';
import { writeJsonFileQueued } from '../utils/database.js';
import { GRUPOS_DIR } from '../utils/paths.js';
import { normalizeScheduleTime, getTodayStr, recordScheduleRun, hasRunForScheduleToday } from '../utils/timeHelpers.js';
import { ensureDirectoryExists, isGroupId } from '../utils/helpers.js';
import { MESSAGES } from '../utils/messages.js';

const gpCronJobs = {};

export const unscheduleGroupJob = (groupId, type) => {
  const key = `${groupId}:${type}`;
  const j = gpCronJobs[key];
  if (j && typeof j.stop === 'function') {
    try { j.stop(); } catch (e) { console.error('Error stopping task:', e); }
  }
  delete gpCronJobs[key];
};

export const scheduleGroupJob = (groupId, type, timeStr, bot) => {
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
            await bot.groupSettingUpdate(groupId, 'not_announcement');
            await bot.sendMessage(groupId, { text: MESSAGES.workers.schedule.groupOpened });
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
            await bot.groupSettingUpdate(groupId, 'announcement');
            await bot.sendMessage(groupId, { text: MESSAGES.workers.schedule.groupClosed });
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
        writeJsonFileQueued(filePath, data).catch(e => console.error('[Cron] Failed to write schedule run:', e));
      } catch (e) {
        console.error('[Cron] Unexpected error in scheduled job:', e);
      }
    }, { timezone: 'America/Sao_Paulo' });

    gpCronJobs[key] = task;
  } catch (e) {
    console.error('[Cron] Failed to schedule job', cronExpr, e);
  }
};

const loadAllGroupSchedules = async (bot) => {
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
      const schedule = data.schedule && typeof data.schedule === 'object' ? data.schedule : {};
      if (schedule.openTime) {
        scheduleGroupJob(groupId, 'open', schedule.openTime, bot);
        console.log(`[Cron] ✅ Agendamento ABRIR carregado: Grupo ${groupId.substring(0, 15)}... às ${schedule.openTime}`);
        loadedCount++;
      }
      if (schedule.closeTime) {
        scheduleGroupJob(groupId, 'close', schedule.closeTime, bot);
        console.log(`[Cron] ✅ Agendamento FECHAR carregado: Grupo ${groupId.substring(0, 15)}... às ${schedule.closeTime}`);
        loadedCount++;
      }
    }));
    if (loadedCount > 0) {
      console.log(`[Cron] 📅 Total de ${loadedCount} agendamento(s) carregado(s) com sucesso`);
    }
  } catch (e) {
    console.error('[Cron] Failed to load group schedules:', e);
  }
};

export const startGpScheduleWorker = (bot) => {
  try {
    loadAllGroupSchedules(bot);
  } catch (e) {
    console.error('[Cron] startGpScheduleWorker error:', e);
  }
};
