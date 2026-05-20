import axios from 'axios';

export default {
  name: "clima",
  description: "Consulta a previsão do tempo para uma cidade",
  commands: ["clima", "tempo", "weather", "previsao", "clima2", "tempo2", "weather2", "previsao2"],
  usage: `${global.prefixo}clima <cidade>`,
  handle: async ({ 
    reply,
    q,
    prefix,
    MESSAGES
  }) => {
    try {
      if (!q) {
        return reply(`🌤️ *Previsão do Tempo*\n\n💡 *Como usar:*\n• ${prefix}clima <cidade>\n\n📌 *Exemplos:*\n• ${prefix}clima São Paulo\n• ${prefix}clima Rio de Janeiro\n• ${prefix}clima Tokyo`);
      }

      await reply('🌤️ Consultando previsão do tempo... ⏳');

      const cidade = encodeURIComponent(q);
      const response = await axios.get(`https://wttr.in/${cidade}?format=j1&lang=pt`, {
        timeout: 120000,
        headers: { 'User-Agent': 'curl/7.68.0' }
      });

      const data = response.data;
      const current = data.current_condition[0];
      const location = data.nearest_area[0];
      
      const tempC = current.temp_C;
      const feelsLike = current.FeelsLikeC;
      const humidity = current.humidity;
      const windKmph = current.windspeedKmph;
      const windDir = current.winddir16Point;
      const uvIndex = current.uvIndex;
      const visibility = current.visibility;
      const cloudcover = current.cloudcover;
      const descPt = current.lang_pt?.[0]?.value || current.weatherDesc[0].value;
      
      const cityName = location.areaName[0].value;
      const region = location.region[0].value;
      const country = location.country[0].value;

      // Emoji baseado na condição
      let weatherEmoji = '☀️';
      const desc = descPt.toLowerCase();
      if (desc.includes('chuva') || desc.includes('rain')) weatherEmoji = '🌧️';
      else if (desc.includes('nublado') || desc.includes('cloud')) weatherEmoji = '☁️';
      else if (desc.includes('neve') || desc.includes('snow')) weatherEmoji = '❄️';
      else if (desc.includes('trovoada') || desc.includes('thunder')) weatherEmoji = '⛈️';
      else if (desc.includes('nevoeiro') || desc.includes('fog')) weatherEmoji = '🌫️';
      else if (desc.includes('parcialmente')) weatherEmoji = '⛅';
      else if (desc.includes('sol') || desc.includes('clear')) weatherEmoji = '☀️';

      // Previsão dos próximos dias
      let forecast = '';
      if (data.weather && data.weather.length > 0) {
        forecast = '\n\n📅 *Próximos dias:*\n';
        data.weather.slice(0, 3).forEach((day) => {
          const date = day.date.split('-').reverse().join('/');
          const maxC = day.maxtempC;
          const minC = day.mintempC;
          forecast += `• ${date}: ${minC}°C - ${maxC}°C\n`;
        });
      }

      await reply(`${weatherEmoji} *Clima em ${cityName}*\n📍 ${region}, ${country}\n\n🌡️ *Temperatura:* ${tempC}°C\n🤒 *Sensação:* ${feelsLike}°C\n💧 *Umidade:* ${humidity}%\n💨 *Vento:* ${windKmph} km/h (${windDir})\n☀️ *Índice UV:* ${uvIndex}\n👁️ *Visibilidade:* ${visibility} km\n☁️ *Nuvens:* ${cloudcover}%\n\n📋 *Condição:* ${descPt}${forecast}`);
    } catch (e) {
      console.error('Erro ao buscar clima:', e);
      await reply(`💔 Não consegui encontrar informações do clima para essa cidade. Verifique o nome e tente novamente!`);
    }
  }
};
