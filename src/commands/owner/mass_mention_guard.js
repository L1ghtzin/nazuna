export default {
  name: "mass_mention_guard",
  description: "Configura a protecao contra marcacao em massa",
  commands: ["antibanmarcar", "protecaomarcar"],
  handle: async ({
    reply, isGroup, from, args, command, prefix, AllgroupMembers,
    loadMassMentionConfig, saveMassMentionConfig,
    loadMassMentionLimit, MASS_MENTION_MAX_USES, MESSAGES
  }) => {
    if (!isGroup) return reply(MESSAGES.permission.groupOnly);

    const config = loadMassMentionConfig();
    const action = args[0]?.toLowerCase();

    if (action === 'on' || action === 'ativar') {
      config[from] = { enabled: true };
      saveMassMentionConfig(config);
      return reply(MESSAGES.admin.group_security.antiBan.on);
    }

    if (action === 'off' || action === 'desativar') {
      if (config[from]) config[from].enabled = false;
      saveMassMentionConfig(config);
      return reply(MESSAGES.admin.group_security.antiBan.off);
    }

    if (action === 'status' || action === 'ver') {
      const isEnabled = config[from]?.enabled || false;
      const memberCount = AllgroupMembers?.length || 0;
      const limitData = loadMassMentionLimit();
      const uses = limitData[from]?.uses?.length || 0;
      return reply(MESSAGES.admin.group_security.antiBan.status(isEnabled, memberCount, uses, MASS_MENTION_MAX_USES));
    }

    return reply(MESSAGES.admin.group_security.antiBan.usage(prefix, command));
  }
};
