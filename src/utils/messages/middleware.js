export const middlewareMessages = {
  accessControl: {
    blockedInGroup: (reason) => `🚫 Você não tem permissão para usar comandos neste grupo.\nMotivo: ${reason}`,
    globalBlacklist: (reason, addedBy, dateStr) => `🚫 Você está na blacklist global e não pode usar comandos.\nMotivo: ${reason}\nAdicionado por: ${addedBy}\nData: ${dateStr}`,
    groupBlacklist: (reason, dateStr) => `🚫 Você está na blacklist deste grupo e não pode usar comandos.\nMotivo: ${reason}\nData: ${dateStr}`,
    globalBlocked: (reason) => `🚫 Parece que você está bloqueado de usar meus comandos globalmente.\nMotivo: ${reason}`,
    globalCommandDisabled: (command, reason) => `🚫 O comando *${command}* está temporariamente desativado globalmente.\nMotivo: ${reason}`,
    floodBanned: (user, limit, interval) => `🚨 @${user} foi banido por exceder o limite de ${limit} mensagens em ${interval}s!`,
    floodBannedWarnings: (user, limit, interval) => `🚨 @${user} foi banido por exceder o limite de mensagens (${limit} em ${interval}s) 3 vezes!`,
    floodWarning: (user, limit, interval, warnings) => `⚠️ @${user}, você excedeu o limite de ${limit} mensagens em ${interval}s! Advertência ${warnings}/3.`
  },
  antiLink: {
    groupRemoved: (user) => `🔗 @${user}, links de outros grupos não são permitidos. Você foi removido do grupo.`,
    groupWarned: (user) => `🔗 Atenção, @${user}! Links de outros grupos não são permitidos. Não consigo remover você, mas evite compartilhar esses links.`,
    channelRemoved: (user) => `📢 @${user}, links de canais não são permitidos. Você foi removido do grupo.`,
    channelWarned: (user) => `📢 Atenção, @${user}! Links de canais não são permitidos. Não consigo remover você, mas evite compartilhar esses links.`,
    linkRemoved: (user) => `🔗 @${user}, links não são permitidos. Você foi removido do grupo.`,
    linkWarned: (user) => `🔗 Atenção, @${user}! Links não são permitidos. Não consigo remover você, mas evite enviar links.`
  },
  automation: {
    pornDetected: (reason) => `🚨 Conteúdo impróprio detectado! (${reason})`,
    pornRemoved: (user) => `🔞 @${user}, conteúdo impróprio detectado. Você foi removido do grupo.`,
    pornRemoveError: (user) => `⚠️ Não consegui remover @${user} automaticamente. Admins, por favor, verifiquem!`,
    pornAdminNeeded: (user, reason) => `@${user} enviou conteúdo impróprio (${reason}), mas não posso removê-lo sem ser admin.`,
    locationRemoved: (user) => `🗺️ @${user}, localização não permitida. Você foi removido do grupo.`,
    floodCooldown: (seconds) => `⏳ Aguarde ${seconds} segundos antes de usar outro comando.`,
    documentRemoved: (user) => `📄 @${user}, documentos não são permitidos. Você foi removido do grupo.`
  },
  antiPV: {
    defaultMsg: "🚫 Este comando só funciona em grupos!",
    blockWarning: "\n\n⚠️ Você será bloqueado."
  },
  captcha: {
    expired: (user) => `⏰ @${user} demorou demais e foi removido.`,
    released: (user) => `✅ @${user} liberado com sucesso!`
  },
  customCommand: {
    ownerOnly: "🚫 Este comando só pode ser usado pelo dono do bot.",
    adminOnlyGroup: "🚫 Este comando só pode ser usado por admins (em grupos).",
    adminOnly: "🚫 Este comando só pode ser usado por admins.",
    groupOnly: "⚠️ Comando restrito a grupos.",
    privateOnly: "⚠️ Comando restrito ao privado.",
    invalidParam: (message) => `❌ Parâmetro inválido: ${message}`,
    missingParams: (missingList, usage) => `❌ Parâmetros ausentes: ${missingList}\nUso: ${usage}`,
    executionError: "❌ Erro ao executar comando personalizado."
  },
  commandDispatcher: {
    vipOnly: (prefix) => `🔒 *Comando VIP Exclusivo*\n\nEste comando é apenas para usuários VIP/Premium!\n\n💎 Use ${prefix}menuvip para ver os comandos VIP!\n📞 Contate o dono: ${prefix}dono`
  },
  partnership: {
    limitReached: (user, limit) => `@${user}, você atingiu o limite de ${limit} links de grupos.`,
    notPartner: (user) => `@${user}, você não é um parceiro e não pode enviar links de grupos.`
  },
  antiStealth: {
    alert: (user, actionText) => `🚨 *SISTEMA DE SEGURANÇA* 🚨\n\n@${user} enviou uma mensagem na qual o bot não conseguiu ler o tipo ou conteúdo (Mensagem Criptografada/Stealth). Como resposta, ${actionText}.`,
    alertOwnerWarning: (owner) => `\n\n👑 @${owner}, atenção! Possível ataque Stealth detectado.`,
    alertFooter: `\n\n_Se você acha que isso foi um engano, entre em contato com um administrador._`,
    ownerNotification: (group, user, actions) => `⚠️ *ALERTA ANTI-STEALTH* ⚠️\n\n` +
      `🛡️ Ataque detectado!\n\n` +
      `👥 *Grupo:* ${group}\n` +
      `👤 *Infrator:* @${user}\n` +
      `⚡ *Ações:* ${actions}`,
    periodEnded: (minutes) => `✅ *O período de segurança de ${minutes} minutos acabou.*\n\nO grupo foi reaberto e todos podem voltar a conversar livremente.`,
    activated: (actionText, prefix) => `🛡️ *ANTI-STEALTH ATIVADO*\n\nO sistema irá proteger o grupo contra mensagens Stealth.\n\n📌 *Ação configurada:*\n${actionText}\n\n💡 Use _${prefix}antistealth acao_ para configurar.`,
    desactivated: `✅ *ANTI-STEALTH DESATIVADO*\n\nA proteção contra mensagens Stealth foi desligada.`,
    statusTitle: `🛡️ *ANTI-STEALTH — STATUS*\n\n`,
    statusBody: (status, action, timer, limit, actionDesc, stats) => 
      `📌 Status: ${status}\n` +
      `⚡ Ação: ${action}${timer}\n` +
      `🎯 Limite de Strikes: ${limit}\n\n` +
      `📋 *O que vai acontecer:*\n${actionDesc}\n\n` +
      `📊 *Estatísticas:*\n` +
      `• Detectadas: ${stats.detected}\n` +
      `• Bans: ${stats.banned}\n` +
      `• Fechamentos: ${stats.closed}`,
    groupOpened: `✅ O grupo foi *ABERTO* novamente.`,
    openError: (msg) => `❌ Erro ao abrir o grupo: ${msg}`,
    configActionMenu: (prefix) => 
      `🛡️ *ANTI-STEALTH — CONFIGURAR AÇÃO*\n\n` +
      `Escolha o que o bot deve fazer ao detectar um ataque:\n\n` +
      `1️⃣ *banir* — Remove o infrator do grupo na hora\n` +
      `2️⃣ *fechar* — Fecha o grupo por 5 minutos para conter o ataque\n` +
      `3️⃣ *avisar* — Apenas avisa o dono do bot no PV (não pune o usuário)\n\n` +
      `💡 *Como usar:*\n` +
      `• _${prefix}antistealth acao 1_ (ou banir)\n` +
      `• _${prefix}antistealth acao 2_ (ou fechar)\n` +
      `• _${prefix}antistealth acao 3_ (ou avisar)\n\n` +
      `🔧 Use _${prefix}antistealth acao abrir_ para destrancar o grupo caso tenha fechado.`,
    actionConfigured: (val, actionDesc) => 
      `🛡️ *ANTI-STEALTH — AÇÃO CONFIGURADA*\n\n` +
      `⚡ Ação: *${val}*\n\n` +
      `📋 *O que vai acontecer ao detectar stealth:*\n${actionDesc}`,
    configStrikesMenu: (prefix, limit) => 
      `🛡️ *ANTI-STEALTH — CONFIGURAR STRIKES*\n\n` +
      `Defina a quantidade de mensagens Stealth/Ciphertext que um usuário pode enviar antes de ser punido (entre 1 e 10).\n\n` +
      `💡 *Como usar:*\n` +
      `• _${prefix}antistealth strikes 3_ (padrão)\n` +
      `• _${prefix}antistealth strikes 1_ (punição imediata)\n\n` +
      `📌 *Limite atual:* ${limit} strike(s)`,
    strikesConfigured: (num) => 
      `🛡️ *ANTI-STEALTH — STRIKES CONFIGURADOS*\n\n` +
      `🎯 Limite de strikes definido para: *${num}*\n` +
      `O usuário será punido na *${num}ª* ocorrência de stealth.`,
    commandsMenu: (prefix) => 
      `🛡️ *ANTI-STEALTH — COMANDOS*\n\n` +
      `• _${prefix}antistealth_ — Ativar/desativar\n` +
      `• _${prefix}antistealth on/off_ — Ativar/desativar\n` +
      `• _${prefix}antistealth status_ — Ver status e estatísticas\n` +
      `• _${prefix}antistealth acao_ — Configurar ação\n` +
      `• _${prefix}antistealth strikes_ — Configurar limite de strikes\n` +
      `• _${prefix}antistealth acao abrir_ — Abre o grupo`
  },
  antiPaymentCmd: {
    groupAlert: (user) => `⚠️ O membro @${user} enviou ou tentou enviar uma mensagem de pagamento maliciosa e foi banido. Limpando o chat para sua segurança...`,
    ownerAlert: (group, user) => `🛡️ [ANTI-PAYMENT] Mensagem de pagamento detectada e mitigada no grupo *${group}*.\nAutor: @${user} (banido e chat limpo).`,
    invalidOption: (prefix) => `❌ Opção inválida. Use *${prefix}antipagamento on/off* ou *${prefix}antipagamento 1/0*`,
    activated: `🛡️ *Anti-Pagamento ATIVADO* com sucesso!\n\nCobranças e mensagens de pagamento serão detectadas e o autor banido instantaneamente, com limpeza de chat.`,
    deactivated: `🛡️ *Anti-Pagamento DESATIVADO* com sucesso!`
  },
  joinRequest: {
    captchaChallenge: (groupName, num1, num2) => 
      `🤖 *Verificação de Entrada no Grupo*\n\n` +
      `Você solicitou entrada no grupo *${groupName}*.\n\n` +
      `Para confirmar que você é humano, resolva esta conta:\n\n` +
      `❓ *${num1} + ${num2} = ?*\n\n` +
      `Responda apenas com o número da resposta.`,
    approved: (user) => `✅ *X9 Report:* @${user} foi aprovado automaticamente (auto-aceitar ativo).`,
    pending: (user) => `📬 *X9 Report:* Nova solicitação de entrada detectada.\n👤 Usuário: @${user}\n\nAprovação manual necessária.`,
    statusUpdate: (user, statusText) => `🔔 *X9 Report:* @${user} ${statusText}.`
  },
  antipalavra: {
    detectedNoAdmin: (user, word) => 
      `⚠️ *ANTIPALAVRA - DETECÇÃO*\n\n` +
      `👤 @${user} usou uma palavra proibida!\n` +
      `⚠️ Palavra: "${word}"\n\n` +
      `❌ Não posso banir pois não sou administrador!`,
    banned: (user, word) => 
      `🚫 *ANTIPALAVRA - BANIMENTO AUTOMÁTICO*\n\n` +
      `👤 Usuário: @${user}\n` +
      `⚠️ Palavra detectada: "${word}"\n` +
      `🔨 Ação: Banimento automático\n\n` +
      `_O sistema antipalavra protege este grupo._`
  },
  games: {
    tttOnlyAdmin: "⚠️ Apenas administradores podem encerrar um jogo da velha em andamento.",
    c4OnlyAdmin: "⚠️ Apenas administradores podem encerrar um Connect4 em andamento."
  }
};
