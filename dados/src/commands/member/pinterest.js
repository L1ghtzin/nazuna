import modules from "../../funcs/exports.js";
const { pinterest } = modules;

export default {
  name: "pinterest",
  description: "Pesquisa imagens e vídeos no Pinterest ou baixa diretamente a partir de um link",
  commands: ["pinterest", "pin"],
  usage: `${global.prefix}pinterest <termo> [/quantidade] ou ${global.prefix}pinterest <link>`,
  handle: async ({ 
    reply, q, nazu, from, info, prefix,
    MESSAGES
  }) => {
    try {
      if (!q) return reply('Digite o termo para pesquisar no Pinterest. Exemplo: ' + prefix + 'pinterest gatinhos /3');

      // Detecta se é URL de Pinterest antes de qualquer split
      const PIN_URL_REGEX = /^(?:https?:\/\/)?(?:[a-zA-Z0-9-]+\.)?pinterest\.\w{2,6}(?:\.\w{2})?\/pin\/([0-9a-zA-Z]+)|^https?:\/\/pin\.it\/[a-zA-Z0-9]+/i;
      let maxImages = 3;
      let searchTerm = q.trim();

      // Só extrai limite \/N se NÃO for URL
      if (!PIN_URL_REGEX.test(searchTerm)) {
        const limitMatch = searchTerm.match(/\s\/\s*(\d{1,2})\s*$/);
        if (limitMatch) {
          const parsed = parseInt(limitMatch[1]);
          maxImages = Math.max(1, Math.min(parsed, 10));
          searchTerm = searchTerm.replace(/\s\/\s*\d{1,2}\s*$/, '').trim();
        }
      } else {
        // Para URL, baixa 1 mídia (padrão)
        maxImages = 1;
      }

      const isPinUrl = PIN_URL_REGEX.test(searchTerm);
      
      const pinPromise = isPinUrl ? pinterest.dl(searchTerm) : pinterest.search(searchTerm);

      pinPromise
        .then(async (datinha) => {
          if (!datinha.ok || !datinha.urls || datinha.urls.length === 0) {
            return reply(isPinUrl ? 'Não foi possível baixar este link do Pinterest. 😕' : 'Nenhuma imagem encontrada para o termo pesquisado. 😕');
          }

          const itemsToSend = datinha.urls.slice(0, maxImages);
          for (const url of itemsToSend) {
            const message = isPinUrl && datinha.type === 'video'
              ? { video: { url }, caption: '📌 Download do Pinterest' }
              : { image: { url }, caption: isPinUrl ? '📌 Download do Pinterest' : `📌 Resultado da pesquisa por "${searchTerm}"` };
            await nazu.sendMessage(from, message, { quoted: info });
          }
        })
        .catch((e) => {
          console.error('Erro no comando pinterest (promise):', e);
          reply("Ocorreu um erro ao processar o Pinterest 💔");
        });
      return;
    } catch (e) {
      console.error('Erro no comando pinterest:', e);
      reply("Ocorreu um erro ao processar o Pinterest 💔");
    }
  }
};
