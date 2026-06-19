export default {
  name: "block_user",
  description: "Bloqueia ou desbloqueia usuarios no bot",
  commands: ["blockuser", "unblockuser"],
  handle: async ({ bot, command, reply, menc_os2, MESSAGES }) => {
    if (!menc_os2) return reply(MESSAGES.admin.tools.block.missingTarget);

    try {
      if (command === 'blockuser') {
        await bot.updateBlockStatus(menc_os2, 'block');
        return reply(MESSAGES.admin.tools.block.successBlock);
      }

      await bot.updateBlockStatus(menc_os2, 'unblock');
      return reply(MESSAGES.admin.tools.block.successUnblock);
    } catch {
      return reply(MESSAGES.admin.tools.block.error);
    }
  }
};
