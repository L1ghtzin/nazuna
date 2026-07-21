export const workersMessages = {
  schedule: {
    groupOpened: '🔓 Grupo aberto automaticamente pelo agendamento diário.',
    groupClosed: '🔒 Grupo fechado automaticamente pelo agendamento diário.'
  },
  birthday: {
    parabens: (mentions) =>
      `🎂🎉 *FELIZ ANIVERSÁRIO!* 🎉🎂\n\n` +
      `${mentions.map(m => `@${m.split('@')[0]}`).join(', ')}!\n\n` +
      `Hoje é um dia muito especial! O bot e todo o grupo desejam\n` +
      `um dia incrível, repleto de alegria e muitas realizações! 🥳🎊\n\n` +
      `Que todos os seus sonhos se realizem! 💖`
  },
  autoHorarios: {
    header: "┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n┃    🎰 *HORÁRIOS PAGANTES*   ┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n",
    updated: (date, time) => `🕐 *Atualizado automaticamente:*\n📅 ${date}\n⏰ ${time}\n\n`,
    linkHeader: "┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n┃      🔗 *LINK DE APOSTAS*     ┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n",
    warnings: "⚠️ *AVISOS IMPORTANTES:*\n🔞 *Conteúdo para maiores de 18 anos*\n📊 Estes são horários estimados\n🎯 Jogue com responsabilidade\n💰 Nunca aposte mais do que pode perder\n🆘 Procure ajuda se tiver vício em jogos\n⚖️ Apostas podem causar dependência\n\n",
    footer: "┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n┃  🍀 *BOA SORTE E JOGUE*    ┃\n┃     *CONSCIENTEMENTE!* 🍀  ┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━┛"
  }
};
