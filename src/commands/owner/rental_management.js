export default {
  name: "rental_management",
  description: "Gerenciamento do sistema de aluguel de grupos",
  commands: [
    "rentalstats",
    "rentaltest",
    "rentalconfig",
    "interval",
    "final",
    "cleanup",
    "notifications",
    "autocleanup",
    "rentalclean"
  ],
  handle: async ({ reply, command, isOwner, rentalExpirationManager, MESSAGES }) => {
    const cmd = (command || "").toLowerCase();

    if (!isOwner) {
      return reply(MESSAGES.owner.rental_management.permission);
    }

    if (cmd === "rentalstats") {
      if (!rentalExpirationManager?.getStats) {
        return reply(MESSAGES.owner.rental_management.notInitialized);
      }

      const stats = rentalExpirationManager.getStats();
      const checkInterval = stats?.config?.checkInterval || "N/A";
      const warningDays = stats?.config?.warningDays ?? "N/A";
      const finalWarningDays = stats?.config?.finalWarningDays ?? "N/A";

      return reply(MESSAGES.owner.rental_management.stats(stats.isRunning ? "Ativo" : "Parado", stats.lastCheckTime ? new Date(stats.lastCheckTime).toLocaleString("pt-BR") : "Nunca", stats.warningsSent, stats.finalWarningsSent, stats.expiredProcessed, stats.errors, checkInterval, warningDays, finalWarningDays));
    }

    if (["rentaltest", "rentalclean", "cleanup"].includes(cmd)) {
      if (!rentalExpirationManager?.checkExpiredRentals) {
        return reply(MESSAGES.owner.rental_management.check.notInitialized);
      }

      await reply(MESSAGES.owner.rental_management.check.start);
      try {
        await rentalExpirationManager.checkExpiredRentals();
        return reply(MESSAGES.owner.rental_management.check.success);
      } catch (error) {
        console.error("Erro na verificação forçada:", error);
        return reply(MESSAGES.owner.rental_management.check.error);
      }
    }

    if (["rentalconfig", "interval", "notifications", "autocleanup", "final"].includes(cmd)) {
      if (!rentalExpirationManager?.getStats) {
        return reply(MESSAGES.owner.rental_management.notInitialized);
      }

      const { config } = rentalExpirationManager.getStats();
      return reply(MESSAGES.owner.rental_management.config(config?.checkInterval || "N/A", config?.warningDays ?? "N/A", config?.finalWarningDays ?? "N/A", config?.enableAutoCleanup ? "Ativa" : "Desativada", config?.enableNotifications ? "Ativas" : "Desativadas"));
    }

    return reply(MESSAGES.owner.rental_management.unknownCmd(cmd));
  }
};

