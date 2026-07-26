import { startRemindersWorker } from './remindersWorker.js';
import { startGpScheduleWorker } from './groupScheduleWorker.js';
import { startAutoHorariosWorker } from './autoHorariosWorker.js';
import { startAutoMensagensWorker } from './autoMessagesWorker.js';
import { startDonoDivulgacaoWorker } from './donoDivulgacaoWorker.js';
import { startBirthdayWorker } from './birthdayWorker.js';

let workersStarted = false;
let activeBot = null;

export function updateWorkerSocket(bot) {
  if (!bot) return;
  activeBot = bot;
  startRemindersWorker(activeBot);
  startGpScheduleWorker(activeBot);
  startAutoHorariosWorker(activeBot);
  startAutoMensagensWorker(activeBot);
  startDonoDivulgacaoWorker(activeBot);
  startBirthdayWorker(activeBot);
}

export function startAllWorkers(bot) {
  if (bot) activeBot = bot;
  if (workersStarted) {
    updateWorkerSocket(activeBot);
    return;
  }
  workersStarted = true;

  startRemindersWorker(activeBot);
  startGpScheduleWorker(activeBot);
  startAutoHorariosWorker(activeBot);
  startAutoMensagensWorker(activeBot);
  startDonoDivulgacaoWorker(activeBot);
  startBirthdayWorker(activeBot);
}

export { scheduleGroupJob, unscheduleGroupJob } from './groupScheduleWorker.js';
export { runDonoDivulgacaoSend } from './donoDivulgacaoWorker.js';
