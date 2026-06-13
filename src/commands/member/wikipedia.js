import axios from 'axios';

async function fetchSummary(language, term) {
  const response = await axios.get(`https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`, {
    timeout: 12000,
    validateStatus: status => status < 500
  });

  if (response.status === 404 || !response.data?.extract) return null;
  return response.data;
}

export default {
  name: 'wikipedia',
  description: 'Pesquisa um resumo na Wikipedia',
  commands: ['wikipedia', 'wiki'],
  usage: '{prefix}wikipedia <termo>',
  handle: async ({ bot, from, info, reply, q, prefix, command, MESSAGES }) => {
    if (!q) return reply(MESSAGES.member.wikipedia.usage(prefix, command));

    await reply(MESSAGES.member.wikipedia.searching);

    try {
      let language = 'PT';
      let data = await fetchSummary('pt', q);

      if (!data) {
        language = 'EN';
        data = await fetchSummary('en', q);
      }

      if (!data) return reply(MESSAGES.member.wikipedia.notFound);

      const link = data.content_urls?.desktop?.page || '';
      const thumbnail = data.thumbnail?.source;
      let message = MESSAGES.member.wikipedia.result(language, data.title || q, data.extract, link);

      if (thumbnail) {
        return bot.sendMessage(from, {
          image: { url: thumbnail },
          caption: message
        }, { quoted: info });
      }

      return reply(message);
    } catch (error) {
      console.error('[WIKIPEDIA] Erro:', error.message);
      return reply(MESSAGES.error.general);
    }
  }
};
