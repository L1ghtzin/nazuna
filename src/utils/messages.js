// ==================== MENSAGENS CENTRALIZADAS ====================
// Todas as mensagens de erro, permissão e feedback do bot ficam aqui.
// Comandos devem usar MESSAGES.xxx ao invés de strings hardcoded.

export const MESSAGES = {
  error: {
    unexpected: "😥 Ops! Ocorreu um erro inesperado. Tente novamente em alguns instantes, por favor!",
    general: "Ocorreu um erro ao processar sua solicitação.",
    internal: "❌ Ocorreu um erro interno. Tente novamente em alguns minutos.",
    simple: "ocorreu um erro",
    notFound: "❌ Comando não encontrado!",
    noMedia: "Marque uma mídia.",
    noText: "Cadê o texto?",
    invalidValue: "❌ Valor inválido!",
    invalidQuantity: "❌ Quantidade inválida.",
    invalidNumber: "❌ Número inválido!",
    noResults: "🔍 Nenhum resultado encontrado.",
    timeout: "⏰ Tempo esgotado! Tente novamente.",
    ffmpegMissing: "❌ Erro ao processar o áudio. Verifique se o FFmpeg está instalado corretamente no seu sistema.",
    cooldown: (time) => `⏳ Aguarde ${time} antes de usar novamente.`,
    notEnough: (item) => `❌ Você não tem ${item} suficiente!`,
  },
  permission: {
    ownerOnly: "🚫 Este comando é exclusivo do dono!",
    subOwnerOnly: "🚫 Apenas o dono ou subdonos podem usar este comando.",
    adminOnly: "Comando restrito a administradores ou moderadores com permissão.",
    botAdminOnly: "Eu preciso ser admin.",
    userAdminOnly: "Você precisa ser admin.",
    groupOnly: "Isso só pode ser usado em grupo.",
    privateOnly: "❌ Este comando só funciona no privado!",
    mentionRequired: "Marque alguém.",
    cantBanOwner: "Não posso banir o dono do bot.",
    cantBanSelf: "Ops! Eu faço parte da bagunça, não dá pra me remover.",
    cantBanAdmin: "Não posso banir um administrador do grupo.",
    premiumOnly: "💎 Isso só pode ser usado por membros premium.",
  },
  general: {
    wait: "⏳ Aguarde um momento, processando...",
    success: "✅ Sucesso!",
    done: "✅ Concluído!",
    cancelled: "❌ Operação cancelada.",
    invalidFormat: "❌ Formato inválido! Verifique o menu para saber como usar.",
    noResults: "🔍 Nenhum resultado encontrado.",
  },
  rpg: {
    noAccount: "❌ Você não tem uma conta no RPG! Crie uma primeiro.",
    itemNotFound: "❌ Você não possui esse item.",
    invalidItem: "❌ Item inválido!",
    maxLevel: "❌ Você já está no nível máximo!",
    alreadyClaimed: "❌ Você já coletou este prêmio.",
    notCompleted: "❌ Complete todas as tarefas para coletar.",
    clanNotFound: "❌ Seu clã não foi encontrado.",
    insufficientCoins: (needed) => `❌ Você precisa de ${needed} moedas!`,
  }
};


