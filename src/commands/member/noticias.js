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
      if (!q) return reply(`📰 *Pesquisa de Notícias*\n\n❌ Digite o que deseja pesquisar.\n\n📝 *Uso:* ${prefix}${command} <termo>\n\n📌 *Exemplo:*\n${prefix}${command} tecnologia brasil`);
      
      await reply('📰 Buscando notícias...');
      
      const newsResult = await searchNews(q, 10);
      
      if (!newsResult.ok) {
        return reply(`💔 Nenhuma notícia encontrada.`);
      }
      
      const { query: newsQuery, results: newsResults } = newsResult;
      
      let newsText = `📰 *Notícias sobre:* "${newsQuery}"\n\n`;
      
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
