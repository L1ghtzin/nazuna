import cron from 'node-cron';
import { loadDonoDivulgacao, saveDonoDivulgacao } from '../utils/database.js';
import { isGroupId } from '../utils/helpers.js';
import { normalizeScheduleTime, getTodayStr, hasRunForScheduleToday } from '../utils/timeHelpers.js';

let currentBot = null;
let workerStarted = false;

const unscheduleDonoDivulgacaoJob = () => {
  if (donoDivulgacaoCronJob && typeof donoDivulgacaoCronJob.stop === 'function') {
    try { donoDivulgacaoCronJob.stop(); } catch (e) { console.error('Error stopping donoDivulgacaoCronJob:', e); }
  }
  donoDivulgacaoCronJob = null;
};

export const runDonoDivulgacaoSend = async (bot, messageText, source = 'manual') => {
  const sockToUse = bot || currentBot;
  if (!sockToUse) {
    return { success: false, message: '❌ Conexão não disponível para divulgação.' };
  }
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
      await sockToUse.sendMessage(groupId, { text });
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

const scheduleDonoDivulgacaoJob = (timeStr, bot) => {
  if (bot) currentBot = bot;
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

        const result = await runDonoDivulgacaoSend(currentBot, null, 'auto');
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

export const startDonoDivulgacaoWorker = (bot) => {
  if (bot) currentBot = bot;
  if (workerStarted) return;
  workerStarted = true;

  try {
    const config = loadDonoDivulgacao();
    if (config.schedule?.enabled && config.schedule?.time) {
      scheduleDonoDivulgacaoJob(config.schedule.time, bot);
    }
  } catch (e) {
    console.error('[DivDono] Erro ao iniciar worker:', e);
  }
};

