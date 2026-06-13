export const funcsMessages = {
  cmdLimit: {
    onlyOwnerLimit: "🚫 Apenas o Dono pode limitar comandos!",
    onlyOwnerRemoveLimit: "🚫 Apenas o Dono pode remover limites de comandos!",
    onlyOwnerViewLimits: "🚫 Apenas o Dono pode ver os limites!",
    invalidFormat: (prefix) => `❌ Formato inválido!\n\nUse: ${prefix}cmdlimitar <comando> <usos> <tempo>\n\nExemplo: ${prefix}cmdlimitar sticker 3 1h\n\n📝 Formatos de tempo aceitos:\n• 30s (30 segundos)\n• 10m (10 minutos)\n• 1h (1 hora)\n• 2d (2 dias)`,
    specifyCommand: (prefix) => `❌ Especifique o comando!\n\nUse: ${prefix}cmddeslimitar <comando>\n\nExemplo: ${prefix}cmddeslimitar sticker`,
    noLimits: "📝 Nenhum comando com limite configurado!",
    listHeader: "🚫 *COMANDOS LIMITADOS*\n\n",
    listFooter: "ℹ️ *Como funciona:*\n• Cada usuário tem seu próprio limite\n• Quando atinge o limite, deve aguardar o período\n• O tempo reset é individual por usuário"
  },
  antiToxic: {
    enabled: (action, threshold, prefix) => `🛡️ *ANTITOXIC ATIVADO*\n\n` +
             `O sistema monitorará ativamente as conversas em busca de palavras ofensivas.\n\n` +
             `📌 *Configuração:*\n` +
             `• Ação: ${action}\n` +
             `• Sensibilidade: ${threshold}%\n\n` +
             `💡 Use ${prefix}antitoxic off para desativar.`,
    disabled: `🛡️ *ANTITOXIC DESATIVADO*\n\nO sistema de detecção de toxicidade foi desativado neste grupo.`,
    invalidAction: (actions) => `❌ Ação inválida!\n\nAções disponíveis: ${actions}`,
    notEnabled: "❌ O antitoxic não está ativado neste grupo!",
    actionChanged: (action) => `🛡️ *ANTITOXIC*\n\nAção alterada para: *${action}*`,
    invalidThreshold: "❌ Sensibilidade deve ser entre 1 e 100!",
    thresholdChanged: (value) => `🛡️ *ANTITOXIC*\n\nSensibilidade alterada para: *${value}%*\n\n💡 Quanto maior, menos mensagens serão marcadas.`,
    statusDisabled: (prefix) => `🛡️ *ANTITOXIC*\n\n❌ Desativado neste grupo.\n\n💡 Use ${prefix}antitoxic on para ativar.`,
    statusEnabled: (action, threshold, detected, warned, deleted, muted) => `🛡️ *ANTITOXIC*\n\n` +
                   `✅ Status: Ativado\n` +
                   `⚡ Ação: ${action}\n` +
                   `📊 Sensibilidade: ${threshold}%\n\n` +
                   `📈 *Estatísticas:*\n` +
                   `• Detectadas: ${detected}\n` +
                   `• Avisos: ${warned}\n` +
                   `• Apagadas: ${deleted}\n` +
                   `• Mutes: ${muted}`,
    warnMsg: (user, reason, count, max) => `🛡️ *ANTITOXIC*\n\n⚠️ @${user}, evite usar palavras ofensivas no grupo.\n\n📌 ${reason}\n⚡ Avisos: ${count}/${max}`,
    deleteMsg: (user, reason) => `🛡️ *ANTITOXIC*\n\n🗑️ Mensagem de @${user} foi removida.\n\n📌 ${reason}`,
    muteMsg: (user, reason) => `🛡️ *ANTITOXIC*\n\n🔇 O usuário @${user} foi mutado por quebrar as regras de convivência.\n\n📌 ${reason}\n\n⚠️ _Atenção: Enquanto estiver mutado, qualquer tentativa de enviar mensagem resultará em banimento._`,
    missingAction: (actions, prefix) => `❓ Informe a ação.\nAções: ${actions}\nEx: ${prefix}antitoxic acao apagar`,
    missingThreshold: (prefix) => `❓ Informe o valor (1-100).\nEx: ${prefix}antitoxic sensibilidade 70`,
    invalidSubcommand: (prefix) => `❓ Subcomando inválido.\nUse:\n` +
                   `• ${prefix}antitoxic on\n` +
                   `• ${prefix}antitoxic off\n` +
                   `• ${prefix}antitoxic status\n` +
                   `• ${prefix}antitoxic acao [avisar/apagar/mute]\n` +
                   `• ${prefix}antitoxic sensibilidade [1-100]`
  },
  antiSticker: {
    warnAdmin: (user) => `🚫 @${user}, figurinhas Lottie (WhatsApp Plus) não são permitidas neste grupo. Você foi removido!`,
    warnUser: (user) => `⚠️ @${user}, figurinhas Lottie (WhatsApp Plus) não são permitidas neste grupo!`,
    status: (status, actionMsg, prefix) => `🛡️ *AntiSticker Plus:* ${status}\n\n` +
            (actionMsg ? `${actionMsg}\n\n` : '') +
            `*Configuração:* \n` +
            `• ${prefix}antistickerplus apagar\n` +
            `• ${prefix}antistickerplus remover`,
    actionDelete: "Ação atual: Apenas apagar 🗑️",
    actionRemove: "Ação atual: Remover usuário 🔨",
    configApagar: "✅ Configurado para apenas *apagar* figurinhas Lottie.",
    configRemover: "✅ Configurado para *remover* quem enviar figurinhas Lottie.",
    invalidSubcommand: (prefix) => `❓ Subcomando inválido.\nUse: ${prefix}antistickerplus [apagar/remover] ou apenas ${prefix}antistickerplus para ligar/desligar.`
  }
};
