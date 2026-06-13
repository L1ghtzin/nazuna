export default {
  name: 'freefire',
  description: 'Utilitarios de Free Fire',
  commands: ['likeff'],
  usage: '{prefix}likeff <uid>',
  handle: async ({ reply, q, prefix, freefire, MESSAGES }) => {
    if (!q) return reply(`Use: ${prefix}likeff <uid>`);
    if (!freefire?.sendLikes) return reply('Servico de Free Fire indisponivel.');

    await reply('Enviando likes no Free Fire...');

    try {
      const result = await freefire.sendLikes(q.trim());
      if (!result.ok) return reply(result.msg || MESSAGES.error.general);

      return reply(
        `Likes enviados com sucesso!\n\n` +
        `Jogador: ${result.player || 'N/A'}\n` +
        `UID: ${result.uid || q.trim()}\n` +
        `Likes antes: ${result.initialLikes ?? 'N/A'}\n` +
        `Likes depois: ${result.finalLikes ?? 'N/A'}\n` +
        `Adicionados: ${result.likesAdded ?? 'N/A'}`
      );
    } catch (error) {
      console.error('[FREEFIRE] Erro no comando likeff:', error);
      return reply(MESSAGES.error.general);
    }
  }
};
