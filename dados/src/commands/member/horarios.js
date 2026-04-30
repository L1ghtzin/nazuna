export default {
  name: "horarios",
  description: "Exibe horários pagantes estimados para diversos jogos",
  commands: ["horarios", "horariopagante", "sinais"],
  usage: `${global.prefix}horarios`,
  handle: async ({ 
    reply,
    MESSAGES
  }) => {
    try {
      const now = new Date();
      const brasiliaTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
      const currentHour = String(brasiliaTime.getHours()).padStart(2, '0');
      const currentMinute = String(brasiliaTime.getMinutes()).padStart(2, '0');
      
      const games = [
        { name: 'Fortune Tiger 🐯', emoji: '🐯', baseMinutes: [5, 15, 25, 35, 45, 55] },
        { name: 'Fortune Mouse 🐭', emoji: '🐭', baseMinutes: [8, 18, 28, 38, 48, 58] },
        { name: 'Double Fortune 💰', emoji: '💰', baseMinutes: [3, 13, 23, 33, 43, 53] },
        { name: 'Fortune Rabbit 🐰', emoji: '🐰', baseMinutes: [7, 17, 27, 37, 47, 57] },
        { name: 'Fortune Ox 🐂', emoji: '🐂', baseMinutes: [2, 12, 22, 32, 42, 52] },
        { name: 'Wild Cash x9000 💸', emoji: '💸', baseMinutes: [4, 14, 24, 34, 44, 54] },
        { name: 'Mines ⛏️', emoji: '⛏️', baseMinutes: [6, 16, 26, 36, 46, 56] },
        { name: 'Aviator ✈️', emoji: '✈️', baseMinutes: [9, 19, 29, 39, 49, 59] },
        { name: 'Dragon Luck 🐲', emoji: '🐲', baseMinutes: [1, 11, 21, 31, 41, 51] },
        { name: 'Ganesha Gold 🕉️', emoji: '🕉️', baseMinutes: [10, 20, 30, 40, 50, 0] },
        { name: 'Bikini Paradise 👙', emoji: '👙', baseMinutes: [14, 24, 34, 44, 54, 4] },
        { name: 'Muay Thai Champion 🥊', emoji: '🥊', baseMinutes: [11, 21, 31, 41, 51, 1] },
        { name: 'Circus Delight 🎪', emoji: '🎪', baseMinutes: [13, 23, 33, 43, 53, 3] },
        { name: 'Piggy Gold 🐷', emoji: '🐷', baseMinutes: [16, 26, 36, 46, 56, 6] },
        { name: 'Midas Fortune 👑', emoji: '👑', baseMinutes: [12, 22, 32, 42, 52, 2] },
        { name: 'Sun & Moon ☀️🌙', emoji: '🌙', baseMinutes: [15, 25, 35, 45, 55, 5] },
        { name: 'Wild Bandito 🤠', emoji: '🤠', baseMinutes: [17, 27, 37, 47, 57, 7] },
        { name: 'Fortune Dragon 🐉', emoji: '🐉', baseMinutes: [19, 29, 39, 49, 59, 9] },
        { name: 'Cash Patrol 🚔', emoji: '🚔', baseMinutes: [18, 28, 38, 48, 58, 8] }
      ];

      let responseText = `🎰✨ *HORÁRIOS PAGANTES* ✨🎰\n\n`;
      responseText += `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
      responseText += `┃  ⏰ *Horário (BR):* ${currentHour}:${currentMinute}  ┃\n`;
      responseText += `┃  📅 *Data:* ${brasiliaTime.toLocaleDateString('pt-BR')}     ┃\n`;
      responseText += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;

      games.forEach(game => {
        const gameMinutes = game.baseMinutes.map(minute => {
          const variation = Math.floor(Math.random() * 7) - 3;
          let adjustedMinute = minute + variation;
          if (adjustedMinute < 0) adjustedMinute += 60;
          if (adjustedMinute >= 60) adjustedMinute -= 60;
          return String(adjustedMinute).padStart(2, '0');
        }).sort((a, b) => parseInt(a) - parseInt(b));

        responseText += `╭─────────────────────────╮\n`;
        responseText += `│ ${game.emoji} *${game.name}*\n`;
        
        const nextTimes = [];
        const currentMinuteInt = parseInt(currentMinute);
        
        for (let minute of gameMinutes) {
          const minuteInt = parseInt(minute);
          let hour = parseInt(currentHour);
          
          if (minuteInt <= currentMinuteInt) {
            hour = (hour + 1) % 24;
          }
          
          nextTimes.push(`${String(hour).padStart(2, '0')}:${minute}`);
          
          if (nextTimes.length >= 3) break;
        }
        
        while (nextTimes.length < 3) {
          for (let minute of gameMinutes) {
            let hour = (parseInt(currentHour) + Math.ceil(nextTimes.length / gameMinutes.length) + 1) % 24;
            nextTimes.push(`${String(hour).padStart(2, '0')}:${minute}`);
            if (nextTimes.length >= 3) break;
          }
        }

        responseText += `│ 🕐 ${nextTimes.slice(0, 3).join(' • ')}\n`;
        responseText += `╰─────────────────────────╯\n\n`;
      });

      responseText += `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
      responseText += `┃      ⚠️ *IMPORTANTE* ⚠️      ┃\n`;
      responseText += `┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
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

      await reply(responseText);
    } catch (e) {
      console.error('Erro no comando horarios:', e);
      await reply(MESSAGES.error.general);
    }
  }
};
