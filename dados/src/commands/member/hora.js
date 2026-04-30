import { normalizar } from '../../utils/helpers.js';

const fusos = {
  'brasil': 'America/Sao_Paulo',
  'br': 'America/Sao_Paulo',
  'saopaulo': 'America/Sao_Paulo',
  'sp': 'America/Sao_Paulo',
  'rio': 'America/Sao_Paulo',
  'brasilia': 'America/Sao_Paulo',
  'manaus': 'America/Manaus',
  'am': 'America/Manaus',
  'acre': 'America/Rio_Branco',
  'fernando': 'America/Noronha',
  'eua': 'America/New_York',
  'usa': 'America/New_York',
  'newyork': 'America/New_York',
  'ny': 'America/New_York',
  'losangeles': 'America/Los_Angeles',
  'la': 'America/Los_Angeles',
  'california': 'America/Los_Angeles',
  'japao': 'Asia/Tokyo',
  'japan': 'Asia/Tokyo',
  'tokyo': 'Asia/Tokyo',
  'china': 'Asia/Shanghai',
  'pequim': 'Asia/Shanghai',
  'coreia': 'Asia/Seoul',
  'korea': 'Asia/Seoul',
  'seul': 'Asia/Seoul',
  'londres': 'Europe/London',
  'london': 'Europe/London',
  'uk': 'Europe/London',
  'paris': 'Europe/Paris',
  'franca': 'Europe/Paris',
  'berlin': 'Europe/Berlin',
  'alemanha': 'Europe/Berlin',
  'portugal': 'Europe/Lisbon',
  'lisboa': 'Europe/Lisbon',
  'moscow': 'Europe/Moscow',
  'russia': 'Europe/Moscow',
  'dubai': 'Asia/Dubai',
  'india': 'Asia/Kolkata',
  'australia': 'Australia/Sydney',
  'sydney': 'Australia/Sydney',
  'argentina': 'America/Argentina/Buenos_Aires',
  'buenosaires': 'America/Argentina/Buenos_Aires'
};

export default {
  name: "hora",
  description: "Mostra o horário atual em diferentes fusos",
  commands: ["hora", "fuso", "horario", "timezone"],
  usage: `${global.prefixo}hora <local>`,
  handle: async ({ 
    reply,
    q,
    prefix,
    MESSAGES
  }) => {
    try {
      if (!q) {
        const agora = new Date();
        const horaBrasil = agora.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dataBrasil = agora.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
        
        return reply(`🕐 *Horário Atual*\n\n🇧🇷 *Brasil (Brasília):*\n⏰ ${horaBrasil}\n📅 ${dataBrasil}\n\n💡 *Ver outro fuso:*\n${prefix}hora <local>\n\n📍 *Locais disponíveis:*\nbrasil, eua, japao, china, coreia, londres, paris, portugal, dubai, australia, argentina...`);
      }

      const local = normalizar(q.toLowerCase().replace(/\s+/g, ''));
      const timezone = fusos[local];

      if (!timezone) {
        return reply(`💔 Fuso horário "${q}" não encontrado!\n\n📍 *Locais disponíveis:*\nbrasil, eua, newyork, losangeles, japao, china, coreia, londres, paris, alemanha, portugal, russia, dubai, india, australia, argentina`);
      }

      const agora = new Date();
      const hora = agora.toLocaleString('pt-BR', { timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const data = agora.toLocaleDateString('pt-BR', { timeZone: timezone, weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
      
      // Calcular diferença com Brasil
      const brTime = new Date(agora.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
      const localTime = new Date(agora.toLocaleString('en-US', { timeZone: timezone }));
      const diffHours = Math.round((localTime - brTime) / (1000 * 60 * 60));
      const diffStr = diffHours >= 0 ? `+${diffHours}h` : `${diffHours}h`;

      await reply(`🕐 *Horário em ${q}*\n\n⏰ *Hora:* ${hora}\n📅 *Data:* ${data}\n\n🇧🇷 *Diferença do Brasil:* ${diffStr}`);
    } catch (e) {
      console.error('Erro ao converter fuso:', e);
      await reply(MESSAGES.error.general);
    }
  }
};
