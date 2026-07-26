import fs from 'fs';
import cron from 'node-cron';
import pathz from 'path';
import db from '../utils/database/io.js';
import { GRUPOS_DIR } from '../utils/paths.js';
import { ensureDirectoryExists } from '../utils/helpers.js';
import { MESSAGES } from '../utils/messages.js';
import config from '../config.js';

const isDebug = config.debug === true || process.env.CHAINY_DEBUG === '1' || process.env.NAZUNA_DEBUG === '1';

/**
 * Retorna a data atual no formato DD/MM no fuso de Sao_Paulo
 */
function getTodayDDMM() {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit'
  });
  const parts = formatter.formatToParts(new Date());
  const day = parts.find(p => p.type === 'day').value;
  const month = parts.find(p => p.type === 'month').value;
  return `${day}/${month}`;
}

/**
 * Verifica todos os grupos com registros de aniversario e parabeniza os aniversariantes do dia
 */
async function checkBirthdays(bot) {
  try {
    if (!ensureDirectoryExists(GRUPOS_DIR)) return;

    const files = await fs.promises.readdir(GRUPOS_DIR);
    const today = getTodayDDMM();

    if (isDebug) {
      console.log(`[Birthday] Verificando aniversariantes do dia ${today}...`);
    }

    const niverFiles = files.filter(f => f.endsWith('_aniversarios.json'));

    for (const niverFile of niverFiles) {
      try {
        const groupId = niverFile.replace('_aniversarios.json', '');
        if (!groupId.endsWith('@g.us')) continue;

        const filePath = pathz.join(GRUPOS_DIR, niverFile);
        const aniversarios = await db.readAsync(filePath, {});

        const aniversariantes = Object.entries(aniversarios)
          .filter(([, data]) => data === today)
          .map(([jid]) => jid);

        if (aniversariantes.length === 0) continue;

        if (isDebug) {
          console.log(`[Birthday] ${aniversariantes.length} aniversariante(s) no grupo ${groupId.substring(0, 20)}...`);
        }

        const msg = MESSAGES.workers.birthday.parabens(aniversariantes);
        await bot.sendMessage(groupId, {
          text: msg,
          mentions: aniversariantes
        });

        console.log(`[Birthday] Parabens enviado para ${aniversariantes.length} aniversariante(s) no grupo ${groupId.substring(0, 20)}...`);
      } catch (e) {
        console.error(`[Birthday] Erro ao processar arquivo ${niverFile}:`, e.message || e);
      }
    }
  } catch (e) {
    console.error('[Birthday] Erro geral no worker de aniversarios:', e.message || e);
  }
}

/**
 * Inicia o worker de aniversarios (roda todo dia a meia-noite BRT)
 */
export function startBirthdayWorker(bot) {
  try {
    cron.schedule('0 0 * * *', async () => {
      if (isDebug) console.log('[Birthday] Cron disparado: verificando aniversariantes...');
      await checkBirthdays(bot);
    }, { timezone: 'America/Sao_Paulo' });

    if (isDebug) {
      console.log('[Birthday] Worker de aniversarios iniciado (todo dia 00:00 BRT)');
    }
  } catch (e) {
    console.error('[Birthday] Erro ao iniciar worker:', e.message || e);
  }
}
