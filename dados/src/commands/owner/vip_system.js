import { PREFIX } from "../../config.js";

export default {
  name: "vip_system",
  description: "Gerenciamento de comandos VIP",
  commands: ["addcmdvip", "addvipcommand", "adicionarcmdvip", "ativarcmdvip", "comandosvip", "delcmdvip", "desativarcmdvip", "estatisticasvip", "infovip", "listcmdvip", "listvipcommands", "menuvip", "removecmdvip", "removevipcommand", "rmcmdvip", "statsvip", "togglecmdvip", "vip", "vipinfo", "vipmenu", "vipstats"],
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
      if (!q) return reply(`Uso: ${prefix}${cmd} <cmd> | <desc> | <cat>\nEx: ${prefix}${cmd} play | Baixar música | download`);
      const [name, desc, cat] = q.split('|').map(p => p.trim());
      const res = vipCommandsManager.addVipCommand(name, desc, cat || 'outros', name);
      return reply(res.message);
    }

    if (['removecmdvip', 'rmcmdvip', 'delcmdvip'].includes(cmd)) {
      if (!q) return reply(`Uso: ${prefix}${cmd} <comando>`);
      const res = vipCommandsManager.removeVipCommand(q.trim());
      return reply(res.message);
    }

    if (['togglecmdvip', 'ativarcmdvip', 'desativarcmdvip'].includes(cmd)) {
      if (!args[0] || !args[1]) return reply(`Uso: ${prefix}togglecmdvip <cmd> <on/off>`);
      const enabled = ['on', 'ativar'].includes(args[1].toLowerCase());
      const res = vipCommandsManager.toggleVipCommand(args[0].trim(), enabled);
      return reply(res.message);
    }

    if (['statsvip', 'vipstats', 'estatisticasvip'].includes(cmd)) {
      const stats = vipCommandsManager.getVipStats();
      return reply(`📊 *STATS VIP*\n\nTotal: ${stats.total}\nAtivos: ${stats.enabled}\nCategorias: ${stats.categories.length}`);
    }
  }
};
