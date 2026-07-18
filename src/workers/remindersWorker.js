import { loadReminders, saveReminders } from '../utils/database.js';

export const startRemindersWorker = (bot) => {
  try {
    setInterval(async () => {
      try {
        const list = loadReminders();
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
                await bot.sendMessage(r.chatId, { text: textMsg, mentions: r.userId ? [r.userId] : [] });
              } else {
                const dest = r.chatId || r.userId;
                if (dest) await bot.sendMessage(dest, { text: textMsg });
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
        }
      } catch (err) {
        console.error("Reminder worker error:", err);
      }
    }, 30 * 1000);
  } catch (e) {
    console.error("Start reminder worker error:", e);
  }
};
