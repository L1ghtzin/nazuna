export default {
  name: "vip_system",
  description: "Gerenciamento de comandos VIP",
  commands: ["addcmdvip", "addvipcommand", "adicionarcmdvip", "ativarcmdvip", "comandosvip", "delcmdvip", "desativarcmdvip", "estatísticasvip", "infovip", "listcmdvip", "listvipcommands", "removecmdvip", "removevipcommand", "rmcmdvip", "statsvip", "togglecmdvip", "vip", "vipinfo", "vipmenu", "vipstats"],
  handle: async ({ 
    reply, command, args, q, isOwner, isPremium, prefix, pushname,
    vipCommandsManager, menuVIP, getMenuDesignWithDefaults, nomebot,
    MESSAGES
  }) => {
    const cmd = command.toLowerCase();

    // ═══════════════════════════════════════════════════════════════
    // 📖 VISUALIZAÇÃO (INFO/MENU)
    // ═══════════════════════════════════════════════════════════════
    if (['menuvip', 'vipmenu', 'vipinfo', 'infovip', 'listcmdvip', 'listvipcommands', 'comandosvip'].includes(cmd)) {
      if (!isOwner && !isPremium) return reply(MESSAGES.permission.premiumOnly);
      const design = getMenuDesignWithDefaults(nomebot, pushname, prefix);
      const text = await menuVIP(prefix, nomebot, pushname, design);
      return reply(text);
    }

    if (!isOwner) return reply(MESSAGES.permission.ownerOnly);

    // ═══════════════════════════════════════════════════════════════
    // ⚙️ GERENCIAMENTO
    // ═══════════════════════════════════════════════════════════════
    if (['addcmdvip', 'addvipcommand', 'adicionarcmdvip'].includes(cmd)) {
      if (!q) return reply(MESSAGES.owner.vip_system.add.usage(prefix, cmd));
      const [name, desc, cat] = q.split('|').map(p => p.trim());
      const res = vipCommandsManager.addVipCommand(name, desc, cat || 'outros', name);
      return reply(res.message);
    }

    if (['removecmdvip', 'rmcmdvip', 'delcmdvip'].includes(cmd)) {
      if (!q) return reply(MESSAGES.owner.vip_system.remove.usage(prefix, cmd));
      const res = vipCommandsManager.removeVipCommand(q.trim());
      return reply(res.message);
    }

    if (['togglecmdvip', 'ativarcmdvip', 'desativarcmdvip'].includes(cmd)) {
      if (!args[0] || !args[1]) return reply(MESSAGES.owner.vip_system.toggle.usage(prefix));
      const enabled = ['on', 'ativar'].includes(args[1].toLowerCase());
      const res = vipCommandsManager.toggleVipCommand(args[0].trim(), enabled);
      return reply(res.message);
    }

    if (['statsvip', 'vipstats', 'estatísticasvip'].includes(cmd)) {
      const stats = vipCommandsManager.getVipStats();
      return reply(MESSAGES.owner.vip_system.stats(stats.total, stats.enabled, stats.categories.length));
    }
  }
};
