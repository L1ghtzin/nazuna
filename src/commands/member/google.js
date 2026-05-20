import { search } from '../../funcs/utils/search.js';

export default {
  name: "google",
  description: "Pesquisa na web usando o Google",
  commands: ["google", "pesquisar", "buscar", "search"],
  usage: `${global.prefixo}google <termo>`,
  handle: async ({ 
    reply,
    q,
    prefix,
    command,
    MESSAGES
  }) => {
    try {
      if (!q) return reply(`🔍 *Pesquisa Web*\n\n❌ Digite o que deseja pesquisar.\n\n📝 *Uso:* ${prefix}${command} <termo>\n\n📌 *Exemplo:*\n${prefix}${command} inteligência artificial`);
      
      await reply('🔍 Pesquisando...');
      
      const searchResult = await search(q, 10);
      
      if (!searchResult.ok) {
        return reply(`💔 Nenhum resultado encontrado.`);
      }
      
      const { query, results } = searchResult;
      
      let response = `🔍 *Resultados para:* "${query}"\n\n`;
      
      results.slice(0, 8).forEach((result, index) => {
        response += `*${index + 1}. ${result.title}*\n`;
        response += `📝 ${result.description?.substring(0, 150) || 'Sem descrição'}${result.description?.length > 150 ? '...' : ''}\n`;
        response += `🔗 ${result.url}\n\n`;
      });
      
      reply(response.trim());
    } catch (e) {
      console.error('Erro no comando google:', e);
      reply(MESSAGES.error.general);
    }
  }
};
