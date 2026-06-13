export const handlersMessages = {
  groupEvents: {
    antifakeRemoved: (number, reason) => `🚫 O usuário @${number} foi removido pelo AntiFake.\nMotivo: Utilizando número estrangeiro (${reason}).`,
    captchaVerification: (number, num1, num2) => `🔐 *VERIFICAÇÃO*\n\nOlá @${number}\n\n❓ ${num1} + ${num2} = ?\n\n⏱️ 5 minutos.`,
    removedList: (reasons) => `🚫 Removidos:\n- ${reasons}`,
    promote: (user, admin) => `⬆️ @${user} virou ADM por @${admin}`,
    demote: (user, admin) => `⬇️ @${user} deixou de ser ADM por @${admin}`,
    captchaSecurityVerification: (number, num1, num2) => `🔐 *VERIFICAÇÃO DE SEGURANÇA*\n\n👋 Olá @${number}!\n\nPara garantir que você não é um bot, resolva:\n❓ *${num1} + ${num2} = ?*\n\n⏱️ Você tem 5 minutos ou será removido.`
  }
};
