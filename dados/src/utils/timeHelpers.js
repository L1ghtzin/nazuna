export const parseTimeToMinutes = (timeStr) => {
  if (typeof timeStr !== 'string') return null;
  
  // Validate basic format
  const m = timeStr.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!m) return null;
  
  const h = parseInt(m[1]);
  const mi = parseInt(m[2]);
  
  // Validate hour range
  if (h < 0 || h > 23) return null;
  
  // Validate minute range
  if (mi < 0 || mi > 59) return null;
  
  return h * 60 + mi;
};

// Enhanced time validation function
export const validateTimeFormat = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') {
    return { valid: false, error: 'Horário inválido. O horário não pode ser vazio.' };
  }
  
  // Check for valid format
  const isValidFormat = /^([01]?\d|2[0-3]):([0-5]\d)$/.test(timeStr);
  if (!isValidFormat) {
    return { valid: false, error: 'Formato inválido. Use HH:MM (24 horas).' };
  }
  
  // Parse and validate components
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  if (hours < 0 || hours > 23) {
    return { valid: false, error: 'Hora inválida. Use entre 00 e 23.' };
  }
  
  if (minutes < 0 || minutes > 59) {
    return { valid: false, error: 'Minuto inválido. Use entre 00 e 59.' };
  }
  
  // Check for edge cases
  if (timeStr === '24:00') {
    return { valid: false, error: 'Use 23:59 como horário máximo.' };
  }
  
  return { valid: true, timeStr };
};

export const normalizeScheduleTime = (timeStr) => {
  if (typeof timeStr !== 'string') return null;
  const trimmed = timeStr.trim();
  const match = trimmed.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;
  const hours = String(parseInt(match[1], 10)).padStart(2, '0');
  const minutes = match[2];
  return `${hours}:${minutes}`;
};

export const hasRunForScheduleToday = (entry, today, targetTime) => {
  if (!entry) return false;
  if (typeof entry === 'string') {
    return entry === today;
  }
  if (typeof entry === 'object') {
    const { date, time } = entry;
    if (!date || date !== today) return false;
    if (!targetTime) return true;
    if (!time) return true;
    return time === targetTime;
  }
  return false;
};

export const recordScheduleRun = (schedule, key, today, targetTime) => {
  if (!schedule || typeof schedule !== 'object') return;
  schedule.lastRun = typeof schedule.lastRun === 'object' && schedule.lastRun !== null ? schedule.lastRun : {};
  schedule.lastRun[key] = {
    date: today,
    time: targetTime
  };
};

export const formatScheduleLastRun = (entry) => {
  if (!entry) return '—';
  if (typeof entry === 'string') return entry;
  if (typeof entry === 'object') {
    const date = entry.date || '—';
    if (entry.time) {
      return `${date} ${entry.time}`;
    }
    return date;
  }
  return '—';
};

export const getNowMinutes = () => {
  // Use Brazil/Sao_Paulo timezone for accurate time comparisons
  const now = new Date();
  const saoPauloTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
  return saoPauloTime.getHours() * 60 + saoPauloTime.getMinutes();
};

export const getTodayStr = () => {
  // Use Brazil/Sao_Paulo timezone for consistent date handling
  const d = new Date();
  const saoPauloDate = new Date(d.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
  const y = saoPauloDate.getFullYear();
  const m = String(saoPauloDate.getMonth() + 1).padStart(2, '0');
  const day = String(saoPauloDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const tzFormat = (date) => new Date(date).toLocaleString('pt-BR');

export const parseAbsoluteDateTime = (str) => {
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

export const parseRelative = (str) => {
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

export const parseReminderInput = (text) => {
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
