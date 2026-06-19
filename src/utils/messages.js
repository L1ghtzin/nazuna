// ==================== MENSAGENS CENTRALIZADAS ====================
// Todas as mensagens de erro, permissão e feedback do bot ficam aqui.
// Comandos devem usar MESSAGES.xxx ao invés de strings hardcoded.

import { rpgMessages } from './messages/rpg.js';
import { adminMessages } from './messages/admin.js';
import { memberMessages } from './messages/member.js';
import { ownerMessages } from './messages/owner.js';
import { middlewareMessages } from './messages/middleware.js';
import { handlersMessages } from './messages/handlers.js';
import { funcsMessages } from './messages/funcs.js';
import { workersMessages } from './messages/workers.js';

export const MESSAGES = {
  error: {
    general: "😥 Ops! Ocorreu um erro inesperado ao processar sua solicitação. Tente novamente!",
    notFound: "❌ Comando não encontrado!",
    invalid: (param = "valor") => `❌ ${param.charAt(0).toUpperCase() + param.slice(1)} inválido(a)!`,
    missing: (item) => `⚠️ Por favor, envie ou marque ${item}.`,
    timeout: "⏰ Tempo esgotado! Tente novamente.",
    ffmpegMissing: "❌ Erro ao processar o áudio. Verifique se o FFmpeg está instalado corretamente no seu sistema.",
    cooldown: (time) => `⏳ Aguarde ${time} antes de usar novamente.`,
    notEnough: (item) => `❌ Você não tem ${item} suficiente!`,
    onlyGroup: "❌ Este comando só pode ser utilizado em grupos!",
    modoBnDisabled: "💔 O modo brincadeira não está ativo nesse grupo.",
  },
  permission: {
    ownerOnly: "🚫 Este comando é exclusivo do dono!",
    botGameModeDisabled: "💔 O modo brincadeira não está ativo neste grupo.",
    subOwnerOnly: "🚫 Apenas o dono ou subdonos podem usar este comando.",
    adminOnly: "Comando restrito a administradores ou moderadores com permissão.",
    botAdminOnly: "Eu preciso ser admin.",
    userAdminOnly: "Você precisa ser admin.",
    groupOnly: "Isso só pode ser usado em grupo.",
    privateOnly: "❌ Este comando só funciona no privado!",
    cantBanSelf: "Ops! Eu faço parte da bagunça, não dá pra me remover.",
    cantBanRole: (role) => `🚫 Não posso banir o/um ${role}.`,
    premiumOnly: "💎 Isso só pode ser usado por membros premium.",
  },
  general: {
    wait: "⏳ Aguarde um momento, processando...",
    success: "✅ Sucesso!",
    done: "✅ Concluído!",
    cancelled: "❌ Operação cancelada.",
    invalidFormat: "❌ Formato inválido! Verifique o menu para saber como usar.",
    noResults: "🔍 Nenhum resultado encontrado.",
    unknownUser: "Usuário Desconhecido",
    prefixInfo: (prefix) => `ℹ️ O meu prefixo atual é: *${prefix}*\n\nPara ver meus comandos, digite: *${prefix}menu*`
  },
  rpg: rpgMessages,
  admin: adminMessages,
  member: memberMessages,
  owner: ownerMessages,
  middleware: middlewareMessages,
  handlers: handlersMessages,
  funcs: funcsMessages,
  workers: workersMessages,
  tools: {
    ping: (statusEmoji, speed, statusCor, qualidade, uptimeBot) => `╭⊱ ⚡ *STATUS DA CONEXÃO* ⚡ ⊱╮
│
│ 📡 *Informações de Latência*
│ ├─ ${statusEmoji} Velocidade: *${speed}s*
│ └─ ${statusCor} Qualidade: *${qualidade}*
│
│ ⏱️ *Informações do Sistema*
│ ├─ 🟢 Tempo Online: *${uptimeBot}*
│ └─ 🌐 Servidor: *Online*
│
╰━━━━━━━━━━━━━━━━━━━━━━━━╯`
  },
  security: {
    antiSpamWarn: (time) => `🚫 Você está temporariamente bloqueado de usar comandos por anti-spam.\n⏳ Aguarde ${time}.`,
    antiSpamBlocked: (limit, interval, blockMin) => `🚫 Anti-spam: você excedeu o limite de ${limit} comandos em ${interval}s.\n🔒 Bloqueado por ${blockMin} min.`,
    antiBtnAdmin: (user) => `⚠️ @${user}, Mensagens com botões não são permitidas neste grupo. Você foi removido.`,
    antiBtnUser: (user) => `⚠️ Atenção, @${user}! Mensagens com botões não são permitidas. Não consigo remover você, mas evite usar esse tipo de mensagem.`,
    antiMediaAdmin: (user, type) => `🚫 @${user}, o envio de *${type}* é proibido neste grupo. Você foi removido!`,
    antiMediaUser: (user, type, extra = '') => `⚠️ @${user}, o envio de *${type}* está proibido neste grupo!${extra}`,
    antiPayment: (user) => `🛡️ *Anti-Payment:* Pagamento detectado!\n\n🚫 @${user} foi removido e o grupo foi fechado temporariamente por segurança.`,
    antiStatusAdmin: (user) => `🚫 @${user}, Status não são permitidos neste grupo. Você foi removido.`,
    antiStatusUser: (user, extra = '') => `🚫 @${user}, Status não são permitidos neste grupo!${extra}`,
    antiFakeQuote: (user, messages) => `🛡️ Sistema Anti-Fake Quote ativado!\n\nO banimento de @${user} foi anulado pois ele é um membro veterano (${messages} msgs).\nIsso evita banimentos injustos caso alguém forje um status.`,
    minMessageAdmin: (min) => `🚫 Usuário removido por enviar mídia sem legenda suficiente (mínimo: ${min} caracteres).`,
    minMessageUser: "⚠️ Mídia sem legenda suficiente detectada, mas não sou admin para remover o usuário.",
    minMessageWarn: (min) => `⚠️ Advertência: Envie mídias com pelo menos ${min} caracteres na legenda para evitar remoção.`,
    blockedCommand: "⛔ Este comando foi bloqueado pelos administradores do grupo.",
    mutedUserAdmin: (user) => `🤫 *Usuário mutado detectado*\n\n@${user}, você está tentando falar enquanto está mutado neste grupo. Você será removido conforme as regras.`,
    mutedUserCantRemove: "⚠️ Não posso remover o usuário porque não sou administrador.",
    rentalExpired: "⏳ O aluguel deste grupo expirou ou não está ativo. Para usar os comandos, ative com um código ou solicite ao dono a renovação.",
    afkWelcome: (since) => `👋 *Bem-vindo(a) de volta!*\nSeu status AFK foi removido.\nVocê estava ausente desde: ${since}`,
    afkUser: (user, since, reason = '') => `😴 @${user} está AFK desde ${since}.${reason ? `\nMotivo: ${reason}` : ''}`,
    cantRemoveAdminSuffix: " (não sou admin para remover)",
    antiDelTitle: (user) => `MENSAGEM APAGADA POR: ${user}`,
    antiDelBody: (num) => `Número: ${num}`,
    mediaTypes: {
        imageViewOnce: 'Imagens (Vizu Única)',
        image: 'Imagens',
        videoViewOnce: 'Vídeos (Vizu Única)',
        video: 'Vídeos',
        audioViewOnce: 'Áudios (Vizu Única)',
        audio: 'Áudios',
        document: 'Documentos',
        event: 'Eventos',
        product: 'Produtos/Catálogos'
    }
  },
  rental: {
    invalidGroupId: "🤔 ID de grupo inválido! Verifique se o ID está correto (geralmente termina com @g.us).",
    activatedPermanent: (groupId) => `♾️ *ALUGUEL PERMANENTE ATIVADO!*\n\n📱 *Grupo:* ${groupId}\n✨ Status: Permanente\n⏰ Não há data de expiração.`,
    activatedTemporary: (groupId, days, dateStr, timeStr, prefix) => `✅ *ALUGUEL ATIVADO COM SUCESSO!*\n\n📱 *Grupo:* ${groupId}\n📅 *Duração:* ${days} dia(s)\n⏰ *Expira em:* ${dateStr} às ${timeStr}\n\n💡 Use *${prefix}infoaluguel* para ver os detalhes.`,
    invalidDuration: '🤔 Duração inválida! Use um número de dias (ex: 30) ou a palavra "permanente".',
    saveError: '😥 Oops! Tive um problema ao salvar as informações de aluguel deste grupo.',
    saveCodeError: "❌ Erro ao salvar códigos de ativação:",
    invalidCodeDuration: '🤔 Duração inválida para o código! Use um número de dias (ex: 7) ou "permanente".',
    codeGenerated: (code, isPermanent, days, targetGroupId) => {
      let msg = `🔑 Código de ativação gerado:\n\n*${code}*\n\n`;
      if (isPermanent) { msg += `Duração: Permanente ✨\n`; }
      else { msg += `Duração: ${days} dias ⏳\n`; }
      if (targetGroupId) { msg += `Grupo Alvo: ${targetGroupId} 🎯\n`; }
      msg += `\nEnvie este código no grupo para ativar o aluguel.`;
      return msg;
    },
    codeSaveError: '😥 Oops! Não consegui salvar o novo código de ativação. Tente gerar novamente!',
    invalidCode: '🤷 Código de ativação inválido ou não encontrado!',
    codeAlreadyUsed: (dateStr, userName) => `😕 Este código já foi usado em ${dateStr} por ${userName}!`,
    codeTargetMismatch: '🔒 Este código de ativação é específico para outro grupo!',
    codeActivationError: (msg) => `😥 Oops! Erro ao ativar o aluguel com este código: ${msg}`,
    codeActivated: (code, msg) => `🎉 Código *${code}* ativado com sucesso! ${msg}`,
    codeMarkErrorLog: (code, groupId) => `Falha CRÍTICA ao marcar código ${code} como usado após ativar aluguel para ${groupId}.`,
    codeCriticalError: '🚨 Erro Crítico! O aluguel foi ativado, mas não consegui marcar o código como usado. Por favor, contate o suporte informando o código!',
    extendInvalidGroup: 'ID de grupo inválido.',
    extendInvalidDays: 'Número de dias extras inválido. Deve ser um número positivo.',
    extendNoRental: 'Este grupo não possui aluguel configurado.',
    extendPermanent: 'Aluguel já é permanente, não é possível estender.',
    extendSuccess: (days, dateStr) => `Aluguel estendido por ${days} dias. Nova expiração: ${dateStr}.`,
    extendSaveError: 'Erro ao salvar as informações de aluguel estendido.'
  }
};
