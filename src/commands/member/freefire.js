export default {
  name: 'freefire',
  description: 'Utilitarios de Free Fire',
  commands: ['likeff'],
  usage: '{prefix}likeff <uid>',
  handle: async ({ reply, q, prefix, freefire, MESSAGES }) => {
    if (!q) return reply(MESSAGES.member.freefire.missingUid(prefix));
    if (!freefire?.sendLikes) return reply(MESSAGES.member.freefire.unavailable);

    await reply(MESSAGES.member.freefire.sendingLikes);

    try {
      const result = await freefire.sendLikes(q.trim());
      if (!result.ok) return reply(result.msg || MESSAGES.error.general);

      return reply(MESSAGES.member.freefire.likesSuccess(result.player, result.uid || q.trim(), result.initialLikes, result.finalLikes, result.likesAdded));
    } catch (error) {
      console.error('[FREEFIRE] Erro no comando likeff:', error);
      return reply(MESSAGES.error.general);
    }
  }
};
