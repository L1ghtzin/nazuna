export default {
  name: "vip_info",
  description: "Consulta informaÃ§Ãµes e menus de comandos VIP",
  commands: ["comandosvip", "infovip", "listcmdvip", "listvipcommands", "vip", "vipinfo", "vipmenu"],
  handle: async ({
    reply,
    isOwner,
    isPremium,
    prefix,
    pushname,
    menuVIP,
    getMenuDesignWithDefaults,
    nomebot,
    MESSAGES
  }) => {
    if (!isOwner && !isPremium) return reply(MESSAGES.permission.premiumOnly);

    const design = getMenuDesignWithDefaults(nomebot, pushname, prefix);
    const text = await menuVIP(prefix, nomebot, pushname, design);
    return reply(text);
  }
};
