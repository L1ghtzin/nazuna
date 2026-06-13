import { searchNews } from '../../funcs/utils/search.js';

export default {
  name: "noticias",
  description: "Pesquisa notícias na web",
  commands: ["noticias", "news", "noticia"],
  usage: `${global.prefixo}noticias <termo>`,
  handle: async ({ 
    reply,
    q,
    prefix,
    command,
    MESSAGES
  }) => {
    try {
      if (!q) return reply(MESSAGES.member.noticias.usage(prefix, command));
      
      await reply(MESSAGES.member.noticias.searching);
      
      const newsResult = await searchNews(q, 10);
      
      if (!newsResult.ok) {
        return reply(MESSAGES.member.noticias.notFound);
      }
      
      const { query: newsQuery, results: newsResults } = newsResult;
      
      let newsText = MESSAGES.member.noticias.header(newsQuery);
      
      newsResults.slice(0, 8).forEach((news, index) => {
        newsText += `*${index + 1}. ${news.title}*\n`;
        newsText += `📝 ${news.description?.substring(0, 120) || 'Sem descrição'}${news.description?.length > 120 ? '...' : ''}\n`;
        newsText += `🔗 ${news.url}\n\n`;
      });
      
      reply(newsText.trim());
    } catch (e) {
      console.error('Erro no comando noticias:', e);
      reply(MESSAGES.error.general);
    }
  }
};
