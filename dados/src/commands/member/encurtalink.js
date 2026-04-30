import axios from 'axios';

export default {
  name: "encurtalink",
  description: "Encurta um link usando o serviço spoo.me",
  commands: ["encurtalink", "tinyurl"],
  usage: `${global.prefixo}encurtalink <link>`,
  handle: async ({ 
    reply,
    q,
    prefix,
    command
  , MESSAGES }) => {
    try {
      if (!q) return reply(`❌️ *Forma incorreta, use está como exemplo:* ${prefix + command} https://instagram.com/hiudyyy_`);
      
      const shortResponse = await axios.post("https://spoo.me/api/v1/shorten", { 
        long_url: q, 
        alias: `nazuna_${Math.floor(10000 + Math.random() * 90000)}` 
      });
      
      reply(`✅ *Link encurtado com sucesso!*\n\n🔗 *Link curto:* ${shortResponse.data.short_url}\n📎 *Link original:* ${shortResponse.data.long_url}`);
    } catch (e) {
      console.error(e);
      await reply(MESSAGES.error.internal);
    }
  }
};
