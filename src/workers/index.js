import { startRemindersWorker } from './remindersWorker.js';
import { startGpScheduleWorker } from './groupScheduleWorker.js';
import { startAutoHorariosWorker } from './autoHorariosWorker.js';
import { startAutoMensagensWorker } from './autoMessagesWorker.js';
import { startDonoDivulgacaoWorker } from './donoDivulgacaoWorker.js';

let workersStarted = false;

export function startAllWorkers(bot) {
  if (workersStarted) return;
  workersStarted = true;

  startRemindersWorker(bot);
  startGpScheduleWorker(bot);
  startAutoHorariosWorker(bot);
  startAutoMensagensWorker(bot);
  startDonoDivulgacaoWorker(bot);
}

export { scheduleGroupJob, unscheduleGroupJob } from './groupScheduleWorker.js';
export { runDonoDivulgacaoSend } from './donoDivulgacaoWorker.js';
