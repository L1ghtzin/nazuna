const axios = require('axios');


const CONFIG = {
  API: {
    BASE_URL: 'https://tenor.googleapis.com/v2/featured?contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5',
    KEY: "AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ"
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000
  }
};


class TenorClient {
  constructor() {
    if (!CONFIG.API.KEY) {
      throw new Error('Chave da API Tenor não configurada');
    };

    this.axios = axios;
  };

  async fetchMix(emoji1, emoji2, attempt = 1) {
    try {
      const response = await this.axios.get(`${CONFIG.API.BASE_URL}&key=${CONFIG.API.KEY}&q=${encodeURIComponent(emoji1)}_${encodeURIComponent(emoji2)}`);

      if (!response.data.results || response.data.results.length === 0) {
        throw new Error('❌ Combinação de emojis não disponível');
      };

      return response.data.results.map(result => result.url);
    } catch (error) {
      if (error.response?.status === 429 && attempt < CONFIG.RETRY.MAX_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY.DELAY * attempt));
        return this.fetchMix(emoji1, emoji2, attempt + 1);
      };
      throw new Error(`❌ Erro ao misturar emojis: ${error.message}`);
    };
  };
};


const client = new TenorClient();


async function emojiMix(emoji1, emoji2) {
  try {
    const urls = await client.fetchMix(emoji1, emoji2);
    return urls[Math.floor(Math.random() * urls.length)];
  } catch (error) {
    console.error('Erro no EmojiMix:', error);
    throw error;
  };
};


module.exports = emojiMix;