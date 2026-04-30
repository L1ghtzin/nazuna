export default {
  name: "rental_management",
  description: "Gerenciamento do sistema de aluguel de grupos",
  commands: [
    "rentalstats", "rentaltest", "rentalconfig", "interval", "final", 
    "cleanup", "notifications", "autocleanup", "rentalclean"
  ],
  handle: async ({ 
    reply, command, isOwner, q, prefix, rentalExpirationManager,
    MESSAGES, nazu
  }) => {
    if (!isOwner) return reply("🚫 Apenas o dono do bot!");

    const cmd = command.toLowerCase();

    // --- ESTATÍSTICAS ---
    if (cmd === 'rentalstats') {
      if (!rentalExpirationManager?.getStats) return reply(`💔 Sistema de expiração não inicializado.`);
      const stats = rentalExpirationManager.getStats();
      
      let teks = `📋 *ESTATÍSTICAS DE ALUGUEL*\n\n`;
      teks += `🚀 *Status:* ${stats.isRunning ? 'Ativo' : 'Parado'}\n`;
      teks += `⏱️ *Última Checagem:* ${stats.lastCheckTime ? new Date(stats.lastCheckTime).toLocaleString('pt-BR') : 'Nunca'}\n`;
      teks += `🔔 *Avisos Enviados:* ${stats.warningsSent}\n`;
      teks += `🔨 *Expirados:* ${stats.expiredProcessed}\n`;
      teks += `💔 *Erros:* ${stats.errors}`;
      
      return reply(teks);
    }

    // --- TESTE E LIMPEZA ---
    if (['rentaltest', 'rentalclean', 'cleanup'].includes(cmd)) {
      if (!rentalExpirationManager?.checkExpirations) return reply(`💔 Sistema de expiração não inicializado no contexto atual.`);
      await reply("⏳ Iniciando verificação forçada de expirações...");
      try {
        await rentalExpirationManager.checkExpirations(nazu, { bypassInterval: true });
        return reply("✅ Verificação de aluguéis concluída com sucesso!");
      } catch (e) {
        console.error('Erro na verificação forçada:', e);
        return reply("❌ Falha na verificação forçada.");
      }
    }

    // --- CONFIGURAÇÃO ---
    if (['rentalconfig', 'interval'].includes(cmd)) {
      return reply(`⚙️ *Configuração de Aluguel*\n\nPara alterar as configurações globais, edite o arquivo dados/banco de dados/rentalConfig.json manualmente.`);
    }

    return reply(`✅ Comando ${cmd} processado.`);
  }
};
