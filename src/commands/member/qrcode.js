export default {
  name: "qrcode",
  description: "Gera um QR Code a partir de texto ou link",
  commands: ["qrcode"],
  usage: `${global.prefixo}qrcode <texto ou link>`,
  handle: async ({ 
    bot,
    from,
    reply,
    q,
    prefix,
    info,
    MESSAGES
  }) => {
    try {
      if (!q) return reply(MESSAGES.member.qrcode.usage(prefix));

      await reply(MESSAGES.member.qrcode.generating);
      
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(q)}`;
      const qSnippet = `${q.substring(0, 100)}${q.length > 100 ? '...' : ''}`;
      await bot.sendMessage(from, {
        image: { url: qrUrl },
        caption: MESSAGES.member.qrcode.success(qSnippet)
      }, { quoted: info });
    } catch (e) {
      console.error("Erro ao gerar QR Code:", e);
      reply(MESSAGES.error.general);
    }
  }
};
