export default {
  name: "qrcode",
  description: "Gera um QR Code a partir de texto ou link",
  commands: ["qrcode"],
  usage: `${global.prefixo}qrcode <texto ou link>`,
  handle: async ({ 
    nazu,
    from,
    reply,
    q,
    prefix,
    info,
    MESSAGES
  }) => {
    try {
      if (!q) return reply(`📲 *Gerador de QR Code*\n\n💡 *Como usar:*\n• Envie o texto ou link após o comando\n• Ex: ${prefix}qrcode https://exemplo.com\n• Ex: ${prefix}qrcode Seu texto aqui\n\n✨ O QR Code será gerado instantaneamente!`);

      await reply('Aguarde um momentinho... ☀️');
      
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(q)}`;
      await nazu.sendMessage(from, {
        image: { url: qrUrl },
        caption: `📱✨ *Seu QR Code super fofo está pronto!*\n\nConteúdo: ${q.substring(0, 100)}${q.length > 100 ? '...' : ''}`
      }, { quoted: info });
    } catch (e) {
      console.error("Erro ao gerar QR Code:", e);
      reply(MESSAGES.error.general);
    }
  }
};
