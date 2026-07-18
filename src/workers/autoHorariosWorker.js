import fs from 'fs';
import { createRequire } from 'module';
import { writeJsonFileQueued } from '../utils/database.js';
import { MESSAGES } from '../utils/messages.js';

// Carrega lista de jogos a partir do JSON estático (separado do código)
const require = createRequire(import.meta.url);
const FORTUNE_GAMES = require('../funcs/json/autoHorariosGames.json');

const AUTO_HORARIOS_PATH = './dados/database/autohorarios.json';

export const startAutoHorariosWorker = (bot) => {
  try {
    setInterval(async () => {
      try {
        const now = new Date();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        
        if (minutes !== 0 || seconds > 30) return;
        
        if (!fs.existsSync(AUTO_HORARIOS_PATH)) return;
        
        let autoSchedules = {};
        try {
          autoSchedules = JSON.parse(fs.readFileSync(AUTO_HORARIOS_PATH, 'utf8'));
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
            
            let responseText = MESSAGES.workers.autoHorarios.header;
            responseText += MESSAGES.workers.autoHorarios.updated(
              currentBrazilTime.toLocaleDateString('pt-BR'),
              currentBrazilTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            );
            
            FORTUNE_GAMES.forEach(game => {
              const todayHours = game.hours.map(baseHour => {
                const variation = Math.floor(Math.random() * 21) - 10;
                const finalHour = baseHour + Math.floor(variation / 60);
                const finalMinutes = Math.abs(variation % 60);
                
                const displayHour = (finalHour % 24 + 24) % 24;
                return `${displayHour.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
              });
              
              responseText += `${game.name}\n`;
              responseText += `🕐 ${todayHours.join(' • ')}\n\n`;
            });
            
            if (config.link) {
              responseText += MESSAGES.workers.autoHorarios.linkHeader;
              responseText += `${config.link}\n\n`;
            }
            
            responseText += MESSAGES.workers.autoHorarios.warnings;
            responseText += MESSAGES.workers.autoHorarios.footer;
            
            await bot.sendMessage(chatId, { text: responseText });
            
            config.lastSent = Date.now();
            
          } catch (e) {
            console.error(`Erro ao enviar auto horários para ${chatId}:`, e.message || e);
            if (e && (e.message === 'item-not-found' || e.data === 404)) {
              console.log(`[AutoHorarios] 🗑️ Desativando horários para grupo que não existe mais: ${chatId}`);
              config.enabled = false;
            }
          }
        }
        
        writeJsonFileQueued(AUTO_HORARIOS_PATH, autoSchedules).catch(e => console.error('Erro ao salvar auto schedules:', e));
        
      } catch (err) {
        console.error('Erro no auto horários worker:', err);
      }
    }, 60 * 1000);
    
  } catch (e) {
    console.error('Erro ao iniciar auto horários worker:', e);
  }
};
