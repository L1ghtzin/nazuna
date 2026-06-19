import os from 'os';

export default {
  name: "bot_info",
  description: "Informacoes publicas sobre o bot",
  commands: ["infobot", "statusbot", "botinfo", "meustatus", "topcmd", "topcmds", "comandosmaisusados", "cmdinfo", "comandoinfo", "statusgp", "dadosgp", "horariomundial"],
  handle: async ({
    bot, from, reply, formatUptime, getTotalCommands, nomebot, botVersion,
    isGroup, command, MESSAGES, botState, isRentalModeActive,
    premiumListaZinha, globalBlocks, nomedono
  }) => {
    const cmd = command.toLowerCase();

    if (['statusgp', 'dadosgp'].includes(cmd)) {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      const metadata = await bot.groupMetadata(from);
      return reply(MESSAGES.member.bot_info.groupData(
        metadata.subject,
        metadata.participants.length,
        metadata.owner?.split('@')[0] || 'N/A',
        metadata.desc || 'Sem descricao'
      ), { mentions: [metadata.owner].filter(Boolean) });
    }

    if (['infobot', 'statusbot', 'botinfo', 'meustatus'].includes(cmd)) {
      const botUptime = formatUptime(process.uptime(), true);
      const botMemUsage = process.memoryUsage();
      const memUsed = (botMemUsage.heapUsed / 1024 / 1024).toFixed(2);
      const memTotal = (botMemUsage.heapTotal / 1024 / 1024).toFixed(2);

      const allGroups = await bot.groupFetchAllParticipating();
      const totalGroups = Object.keys(allGroups).length;
      let totalUsers = 0;
      Object.values(allGroups).forEach(group => {
        totalUsers += group.participants?.length || 0;
      });

      const botStatus = botState?.status === 'on' ? 'Online' : 'Offline';
      const rentalMode = isRentalModeActive && isRentalModeActive() ? 'Ativo' : 'Desativo';
      const nodeV = process.version;
      const platform = os.platform();
      const totalCmds = getTotalCommands ? await getTotalCommands() : 0;

      const premiumUsers = Object.keys(premiumListaZinha || {}).filter(key => key.endsWith('@s.whatsapp.net')).length;
      const premiumGroups = Object.keys(premiumListaZinha || {}).filter(key => key.endsWith('@g.us')).length;
      const blockedUsersCount = Object.keys(globalBlocks?.users || {}).length;
      const blockedCommandsCount = Object.keys(globalBlocks?.commands || {}).length;
      const currentTime = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

      return reply(MESSAGES.member.bot_info.botStatus({
        nomebot,
        nomedono,
        botVersion,
        botStatus,
        botUptime,
        platform,
        nodeV,
        totalGroups,
        totalUsers,
        totalCmds,
        premiumUsers,
        premiumGroups,
        blockedUsersCount,
        blockedCommandsCount,
        rentalMode,
        memUsed,
        memTotal,
        currentTime
      }));
    }
  }
};
