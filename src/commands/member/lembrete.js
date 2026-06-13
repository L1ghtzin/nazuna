import crypto from 'crypto';
import { loadReminders, saveReminders } from '../../utils/database.js';

const tzFormat = (date) => new Date(date).toLocaleString('pt-BR');

const parseAbsoluteDateTime = (str) => {
  if (!str) return null;
  const cleaned = str.toLowerCase().replace(/\s+às\s+/g, ' ').replace(/\s+as\s+/g, ' ').trim();
  let m = cleaned.match(/\b(\d{1,2})[\/](\d{1,2})(?:[\/](\d{2,4}))?\s+(\d{1,2}):(\d{2})\b/);
  if (m) {
    let [ , d, mo, y, h, mi ] = m;
    d = parseInt(d); mo = parseInt(mo); h = parseInt(h); mi = parseInt(mi);
    y = y ? parseInt(y) : new Date().getFullYear();
    if (y < 100) y += 2000;
    const dt = new Date(y, mo - 1, d, h, mi, 0, 0);
    if (!isNaN(dt.getTime())) return dt.getTime();
  }
  m = cleaned.match(/\b(\d{1,2}):(\d{2})\s+(\d{1,2})[\/](\d{1,2})(?:[\/](\d{2,4}))?\b/);
  if (m) {
    let [ , h, mi, d, mo, y ] = m;
    d = parseInt(d); mo = parseInt(mo); h = parseInt(h); mi = parseInt(mi);
    y = y ? parseInt(y) : new Date().getFullYear();
    if (y < 100) y += 2000;
    const dt = new Date(y, mo - 1, d, h, mi, 0, 0);
    if (!isNaN(dt.getTime())) return dt.getTime();
  }
  m = cleaned.match(/\bhoje\b\s*(\d{1,2}):(\d{2})/);
  if (m) {
    const now = new Date();
    const h = parseInt(m[1]); const mi = parseInt(m[2]);
    const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, mi, 0, 0);
    return dt.getTime();
  }
  m = cleaned.match(/\bamanh[ãa]\b\s*(\d{1,2}):(\d{2})/);
  if (m) {
    const now = new Date();
    const h = parseInt(m[1]); const mi = parseInt(m[2]);
    const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, h, mi, 0, 0);
    return dt.getTime();
  }
  return null;
};

const parseRelative = (str) => {
  if (!str) return null;
  const m = str.toLowerCase().match(/\bem\s+(\d{1,5})\s*(m|min|mins|minutos?|h|hora?s?|d|dias?)\b/);
  if (!m) return null;
  const n = parseInt(m[1]);
  const unit = m[2];
  let ms = 0;
  if (/^m(in|ins|inutos?)?$/.test(unit)) ms = n * 60 * 1000;
  else if (/^h|hora/.test(unit)) ms = n * 60 * 60 * 1000;
  else if (/^d|dia/.test(unit)) ms = n * 24 * 60 * 60 * 1000;
  else return null;
  return Date.now() + ms;
};

const parseReminderInput = (text) => {
  if (!text) return null;
  const relTs = parseRelative(text);
  if (relTs) {
    const after = text.toLowerCase().replace(/\bem\s+\d{1,5}\s*(m|min|mins|minutos?|h|hora?s?|d|dias?)\b\s*/,'');
    const msg = after.trim();
    return { at: relTs, message: msg || 'Seu lembrete!' };
  }
  let m = text.toLowerCase().replace(/\s+às\s+/g, ' ').match(/(\d{1,2}[\/]\d{1,2}(?:[\/]\d{2,4})?\s+\d{1,2}:\d{2})/);
  if (!m) m = text.toLowerCase().match(/(\d{1,2}:\d{2}\s+\d{1,2}[\/]\d{1,2}(?:[\/]\d{2,4})?)/);
  if (!m) {
    let hm = text.toLowerCase().match(/(hoje\s*\d{1,2}:\d{2}|amanh[ãa]\s*\d{1,2}:\d{2})/);
    if (hm) {
      const ts = parseAbsoluteDateTime(hm[1]);
      const msg = text.toLowerCase().replace(hm[1], '').replace(/\s+às\s+/g, ' ').trim();
      if (ts) return { at: ts, message: msg || 'Seu lembrete!' };
    }
    return null;
  }
  const whenStr = m[1];
  const ts = parseAbsoluteDateTime(whenStr);
  if (!ts) return null;
  const msg = text.toLowerCase().replace(whenStr, '').replace(/\s+às\s+/g, ' ').trim();
  return { at: ts, message: msg || 'Seu lembrete!' };
};

export default {
  name: "lembrete",
  description: "Agenda lembretes para serem enviados no futuro",
  commands: ["lembrete", "lembrar", "meuslembretes", "listalembretes", "apagalembrete", "removerlembrete"],
  usage: `${global.prefix}lembrete em 10m tomar remédio`,
  handle: async ({ 
    reply,
    q,
    sender,
    from,
    pushname,
    prefix,
    command,
    optimizer,
    MESSAGES
  }) => {
    const sub = command.toLowerCase();

    // ADICIONAR LEMBRETE
    if (['lembrete', 'lembrar'].includes(sub)) {
      if (!q) return reply(MESSAGES.member.lembrete.usageAdd(prefix));
      const parsed = parseReminderInput(q);
      if (!parsed) return reply(MESSAGES.member.lembrete.invalidDate);
      const { at, message } = parsed;
      const minDelay = 10 * 1000;
      if (at - Date.now() < minDelay) return reply(MESSAGES.member.lembrete.tooSoon);
      
      const newReminder = {
        id: (() => {
          try {
            return crypto.randomBytes(6).toString('hex');
          } catch (error) {
            return Math.random().toString(16).substring(2, 14);
          }
        })(),
        userId: sender,
        chatId: from,
        createdByName: pushname || '',
        createdAt: new Date().toISOString(),
        at,
        message: message,
        status: 'pending'
      };

      const list = await optimizer.memoize(
        'reminders:all',
        () => Promise.resolve(loadReminders()),
        5000
      );
      list.push(newReminder);
      saveReminders(list);
      optimizer.clearStatic('reminders:all');
      
      await reply(MESSAGES.member.lembrete.addSuccess(tzFormat(at), message));
      return;
    }

    // LISTAR MEUS LEMBRETES
    if (['meuslembretes', 'listalembretes'].includes(sub)) {
      const allReminders = await optimizer.memoize(
        'reminders:all',
        () => Promise.resolve(loadReminders()),
        5000
      );
      const list = allReminders.filter(r => r.userId === sender && r.status !== 'sent');
      if (!list.length) return reply(MESSAGES.member.lembrete.emptyList);
      const lines = list
        .sort((a,b)=>a.at-b.at)
        .map((r,i)=>`${i+1}. [${r.id.slice(0,6)}] ${tzFormat(r.at)} — ${r.message}`);
      await reply(MESSAGES.member.lembrete.listHeader + lines.join('\n'));
      return;
    }

    // APAGAR LEMBRETE
    if (['apagalembrete', 'removerlembrete'].includes(sub)) {
      const idArg = (q||'').trim();
      if (!idArg) return reply(MESSAGES.member.lembrete.usageRemove(prefix));
      
      let list = await optimizer.memoize(
        'reminders:all',
        () => Promise.resolve(loadReminders()),
        5000
      );

      if (['tudo','todos','all'].includes(idArg.toLowerCase())) {
        const before = list.length;
        list = list.filter(r => !(r.userId === sender && r.status !== 'sent'));
        const removed = before - list.length;
        saveReminders(list);
        optimizer.clearStatic('reminders:all');
        return reply(MESSAGES.member.lembrete.removedAll(removed));
      }

      const idx = list.findIndex(r => r.id.startsWith(idArg) && r.userId === sender && r.status !== 'sent');
      if (idx === -1) return reply(MESSAGES.member.lembrete.notFound);
      const removed = list.splice(idx,1)[0];
      saveReminders(list);
      optimizer.clearStatic('reminders:all');
      await reply(MESSAGES.member.lembrete.removeSuccess(removed.message));
      return;
    }
  }
};
