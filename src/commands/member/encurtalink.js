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
      if (!q) return reply(MESSAGES.member.encurtalink.missingLink(prefix, command));
      
      const shortResponse = await axios.post("https://spoo.me/api/v1/shorten", { 
        long_url: q, 
        alias: `chainy_${Math.floor(10000 + Math.random() * 90000)}` 
      });
      
      reply(MESSAGES.member.encurtalink.success(shortResponse.data.short_url, shortResponse.data.long_url));
    } catch (e) {
      console.error(e);
      await reply(MESSAGES.error.general);
    }
  }
};
