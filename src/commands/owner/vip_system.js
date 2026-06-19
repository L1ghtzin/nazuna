export default {
  name: "vip_system",
  description: "Gerenciamento de comandos VIP",
  commands: [
    "addcmdvip",
    "addvipcommand",
    "adicionarcmdvip",
    "ativarcmdvip",
    "delcmdvip",
    "desativarcmdvip",
    "estatisticasvip",
    "estatísticasvip",
    "removecmdvip",
    "removevipcommand",
    "rmcmdvip",
    "statsvip",
    "togglecmdvip",
    "vipstats"
  ],
  handle: async ({
    reply,
    command,
    args,
    q,
    prefix,
    vipCommandsManager,
    MESSAGES
  }) => {
    const cmd = command.toLowerCase();

    if (["addcmdvip", "addvipcommand", "adicionarcmdvip"].includes(cmd)) {
      if (!q) return reply(MESSAGES.owner.vip_system.add.usage(prefix, cmd));

      const [name, desc, cat] = q.split("|").map(part => part.trim());
      const res = vipCommandsManager.addVipCommand(name, desc, cat || "outros", name);
      return reply(res.message);
    }

    if (["removecmdvip", "removevipcommand", "rmcmdvip", "delcmdvip"].includes(cmd)) {
      if (!q) return reply(MESSAGES.owner.vip_system.remove.usage(prefix, cmd));

      const res = vipCommandsManager.removeVipCommand(q.trim());
      return reply(res.message);
    }

    if (["togglecmdvip", "ativarcmdvip", "desativarcmdvip"].includes(cmd)) {
      if (!args[0] || !args[1]) return reply(MESSAGES.owner.vip_system.toggle.usage(prefix));

      const enabled = ["on", "ativar"].includes(args[1].toLowerCase());
      const res = vipCommandsManager.toggleVipCommand(args[0].trim(), enabled);
      return reply(res.message);
    }

    if (["statsvip", "vipstats", "estatisticasvip", "estatísticasvip"].includes(cmd)) {
      const stats = vipCommandsManager.getVipStats();
      return reply(MESSAGES.owner.vip_system.stats(stats.total, stats.enabled, stats.categories.length));
    }
  }
};
