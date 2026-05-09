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
  handle: async ({ reply, command, isOwner, rentalExpirationManager }) => {
    const cmd = (command || "").toLowerCase();
    const ownerOnlyMessage = "🚫 Apenas o Dono e subdonos podem gerenciar o sistema de aluguel!";

    if (!isOwner) {
      return reply(ownerOnlyMessage);
    }

    if (cmd === "rentalstats") {
      if (!rentalExpirationManager?.getStats) {
        return reply("💔 Sistema de expiração não inicializado.");
      }

      const stats = rentalExpirationManager.getStats();
      const checkInterval = stats?.config?.checkInterval || "N/A";
      const warningDays = stats?.config?.warningDays ?? "N/A";
      const finalWarningDays = stats?.config?.finalWarningDays ?? "N/A";

      let text = "📋 *ESTATÍSTICAS DE ALUGUEL*\n\n";
      text += `🚀 *Status:* ${stats.isRunning ? "Ativo" : "Parado"}\n`;
      text += `⏱️ *Última Checagem:* ${stats.lastCheckTime ? new Date(stats.lastCheckTime).toLocaleString("pt-BR") : "Nunca"}\n`;
      text += `🔔 *Avisos Enviados:* ${stats.warningsSent}\n`;
      text += `🚨 *Avisos Finais:* ${stats.finalWarningsSent}\n`;
      text += `🔨 *Expirados Processados:* ${stats.expiredProcessed}\n`;
      text += `💔 *Erros:* ${stats.errors}\n`;
      text += `\n⚙️ *Intervalo:* ${checkInterval}\n`;
      text += `⚠️ *Dias de Aviso:* ${warningDays}\n`;
      text += `🚨 *Aviso Final:* ${finalWarningDays}`;
      return reply(text);
    }

    if (["rentaltest", "rentalclean", "cleanup"].includes(cmd)) {
      if (!rentalExpirationManager?.checkExpiredRentals) {
        return reply("💔 Sistema de expiração não inicializado no contexto atual.");
      }

      await reply("⏳ Iniciando verificação forçada de expirações...");
      try {
        await rentalExpirationManager.checkExpiredRentals();
        return reply("✅ Verificação de aluguéis concluída com sucesso!");
      } catch (error) {
        console.error("Erro na verificação forçada:", error);
        return reply("❌ Falha na verificação forçada.");
      }
    }

    if (["rentalconfig", "interval", "notifications", "autocleanup", "final"].includes(cmd)) {
      if (!rentalExpirationManager?.getStats) {
        return reply("💔 Sistema de expiração não inicializado.");
      }

      const { config } = rentalExpirationManager.getStats();
      let message = "⚙️ *Configuração Atual do Sistema de Aluguel*\n\n";
      message += `• Intervalo cron: ${config?.checkInterval || "N/A"}\n`;
      message += `• Dias de aviso: ${config?.warningDays ?? "N/A"}\n`;
      message += `• Aviso final: ${config?.finalWarningDays ?? "N/A"}\n`;
      message += `• Auto limpeza: ${config?.enableAutoCleanup ? "Ativa" : "Desativada"}\n`;
      message += `• Notificações: ${config?.enableNotifications ? "Ativas" : "Desativadas"}\n`;
      message += `\nPara alterar, ajuste a inicialização em dados/src/connect.js (RentalExpirationManager).`;
      return reply(message);
    }

    return reply(`❌ Comando de gerenciamento desconhecido: ${cmd}`);
  }
};

