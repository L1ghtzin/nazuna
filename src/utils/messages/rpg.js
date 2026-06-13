export const rpgMessages = {
  noAccount: "❌ Você não tem uma conta no RPG! Crie uma primeiro.",
  itemNotFound: "❌ Você não possui esse item.",
  invalidItem: "❌ Item inválido!",
  maxLevel: "❌ Você já está no nível máximo!",
  alreadyClaimed: "❌ Você já coletou este prêmio.",
  notCompleted: "❌ Complete todas as tarefas para coletar.",
  clanNotFound: "❌ Seu clã não foi encontrado.",
  insufficientCoins: (needed) => `❌ Você precisa de ${needed} moedas!`,
  notEnoughData: "💔 Sem dados suficientes para ranking.",
  rankingHeader: "⚔️ 🏆 *RANKING DE RIQUEZA* 🏆 ⚔️\n\n",
  rankingItem: (medal, id, total) => `${medal} @${id} — 💰 ${total}\n`,
  rankingFooter: "\n✨ Continue jogando para subir no rank!",
  groupOnly: '⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.',
  disabled: (prefix) => `⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`,
  tournament: {
    alreadyActive: "💔 Já existe um torneio ativo!",
    opened: (prize, prefix) => `╭━━━⊱ 🏆 *TORNEIO ABERTO!* ⊱━━━╮\n⚔️ Um torneio foi iniciado!\n💰 Prêmio: ${prize}\n💡 Use ${prefix}torneio entrar`,
    noneActive: (prefix) => `💔 Não há torneio ativo! Admins: Use ${prefix}torneio criar`,
    alreadyEntered: "💔 Você já está inscrito!",
    joined: (participants, prize) => `✅ Você entrou no torneio!\n👥 Participantes: ${participants}\n💰 Prêmio acumulado: ${prize}`,
    needMorePlayers: "💔 Precisa de pelo menos 2 participantes!",
    header: "╭━━━⊱ 🏆 *TORNEIO* ⊱━━━╮\n\n",
    roundStart: (round) => `⚔️ *RODADA ${round}*\n`,
    matchResult: (p1, p2, winner) => `@${p1} vs @${p2} → ✅ @${winner}\n`,
    champion: (winner, prize) => `\n🏆 *CAMPEÃO:* @${winner}\n💰 Prêmio: ${prize}`,
    infoMenu: "╭━━━⊱ 🏆 *TORNEIO ATIVO* ⊱━━━╮\n",
    infoStats: (count, prize) => `👥 Participantes: ${count}\n💰 Prêmio: ${prize}\n\n📋 *INSCRITOS:*\n`,
    participantLine: (i, p) => `${i}. @${p}\n`,
    footer: (prefix) => `\n💡 Use ${prefix}torneio entrar`
  },
  streak: {
    alreadyClaimed: (hours, mins) => `⏰ Você já coletou seu daily hoje! Volte em ${hours}h ${mins}min.`,
    claimed: (day, reward) => `🔥 *STREAK DIÁRIO* 🔥\n\nDia: ${day}\n💰 Recompensa: +${reward} moedas\n\n✨ Volte amanhã para aumentar seu streak!`
  },
  social: {
    stats: (name, wallet, bank, total, won, lost, level, repPoints) => `╭━━━⊱ 📊 *RPG STATS* ⊱━━━╮\n│ 👤 ${name}\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n💰 *FINANÇAS*\n├ Carteira: ${wallet}\n├ Banco: ${bank}\n├ Total: ${total}\n\n⚔️ *COMBATE*\n├ Vitórias: ${won}\n├ Derrotas: ${lost}\n└ Level: ${level}\n\n⭐ Reputação: ${repPoints}`,
    needTarget: (action) => `💔 Marque alguém para ${action}!`,
    cantTargetSelf: (action) => `💔 Você não pode se ${action}!`,
    cantHitSelf: "💔 Você não pode bater em si mesmo!",
    cantProtectSelf: "💔 Você não pode se proteger assim!",
    hug: [
      (p1, p2) => `${p1} deu um abraço caloroso em @${p2}! 🤗`,
      (p1, p2) => `${p1} abraçou @${p2} com muito carinho! 💕`,
      (p1, p2) => `Um abraço apertado de ${p1} para @${p2}! 🫂`
    ],
    kiss: [
      (p1, p2) => `${p1} deu um beijo em @${p2}! 😘`,
      (p1, p2) => `${p1} beijou @${p2} apaixonadamente! 💋`
    ],
    slap: [
      (p1, p2) => `${p1} deu um tapa em @${p2}! 👋💥`,
      (p1, p2) => `PAH! ${p1} acertou @${p2} em cheio! 😤`
    ],
    protect: (p1, p2) => `🛡️ ${p1} está protegendo @${p2} por 1 hora!`,
    reputation: (name, points, up, down, karma, fame, rank, prefix) => `╭━━━⊱ ⭐ *REPUTAÇÃO* ⊱━━━╮\n│ ${name}\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n⭐ Pontos: ${points}\n👍 Votos Positivos: ${up}\n👎 Votos Negativos: ${down}\n☯️ Karma: ${karma}\n🌟 Fama: ${fame}\n\n🏅 Classificação: *${rank}*\n\n💡 Use ${prefix}votar @user para dar reputação`,
    alreadyVoted: (time) => `⏰ Você já votou nesta pessoa hoje! Aguarde ${time}.`,
    voted: (p1, p2) => `👍 ${p1} deu reputação para @${p2}!`
  },
  skills: {
    menu: (name) => `╭━━━⊱ 📚 *HABILIDADES* ⊱━━━╮\n│ ${name}\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`,
    item: (name, level, xp, nextXp) => `• ${name}: Nível ${level} (${xp}/${nextXp})\n`,
    fullStats: (name, wallet, bank, totalWealth, donations, battlesWon, battlesLost, duels, crimes, work, mine, fish, hunt, gambleWin, gambleLoss, gambleNet, level, prestige, achievements, pets, premiumItems, repPoints, karma, fame) => 
      `╭━━━✧ *MINHAS ESTATÍSTICAS* ✧━━━╮\n│ ${name}\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
      `💰 *FINANÇAS*\n├ Carteira: ${wallet}\n├ Banco: ${bank}\n├ Total: ${totalWealth}\n└ Doações: ${donations}\n\n` +
      `⚔️ *COMBATE*\n├ Batalhas vencidas: ${battlesWon}\n├ Batalhas perdidas: ${battlesLost}\n├ Duelos: ${duels}\n└ Crimes: ${crimes}\n\n` +
      `⛏️ *TRABALHO*\n├ Trabalhos: ${work}\n├ Mineração: ${mine}\n├ Pesca: ${fish}\n└ Caça: ${hunt}\n\n` +
      `🎲 *APOSTAS*\n├ Ganhou: ${gambleWin}\n├ Perdeu: ${gambleLoss}\n└ Saldo: ${gambleNet}\n\n` +
      `📈 *PROGRESSO*\n├ Level: ${level}\n├ Prestige: ${prestige}\n├ Conquistas: ${achievements}\n├ Pets: ${pets}\n└ Itens Premium: ${premiumItems}\n\n` +
      `⭐ *REPUTAÇÃO*\n├ Pontos: ${repPoints}\n├ Karma: ${karma}\n└ Fama: ${fame}`
  },
  shop: {
    premiumMenu: `╭━━━⊱ 💎 *LOJA PREMIUM* ⊱━━━╮\n╰━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`,
    premiumItemLine: (name, price, desc, prefix, id) => `${name}\n   💰 ${price} moedas\n   📝 ${desc}\n   🛒 ${prefix}comprarpremium ${id}\n\n`,
    missingItemArgs: (prefix) => `💔 Informe o item! Veja a loja: ${prefix}lojapremium`,
    itemNotFoundArgs: (prefix) => `💔 Item não encontrado! Veja a loja: ${prefix}lojapremium`,
    insufficientFunds: (price) => `💔 Saldo insuficiente! Necessário: ${price}`,
    buyPremium: (name, price) => `╭━━━⊱ ✅ *COMPRA PREMIUM* ⊱━━━╮\n│ 🛒 ${name}\n│ 💰 -${price}\n╰━━━━━━━━━━━━━━━━━━━━━━━━━╯`
  },
  pets: {
    noPets: (prefix) => `╭━━━⊱ 🐾 *SISTEMA DE PETS* ⊱━━━╮\n│ Você ainda não tem companheiros!\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n🦊 *PETS DISPONÍVEIS:*\n  *Lobo* - Veloz e leal\n🐉 *Dragão* - Poderoso e raro\n🔥 *Fênix* - Imortal e místico\n🐯 *Tigre* - Feroz e forte\n🦅 *Águia* - Ágil e preciso\n\n💡 Use ${prefix}adotar <nome> para começar!`,
    myPetsHeader: (pushname, amount) => `╭━━━⊱ 🐾 *MEUS PETS* ⊱━━━╮\n│ Treinador: *${pushname}*\n│ Total de Pets: ${amount}/5\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`,
    petItem: (index, emoji, name, evolutions, statusEmoji, level, exp, maxExp, hp, maxHp, atk, def, wins, losses, hungerBar, hunger, moodBar, mood) => 
      `${index}. ${emoji} *${name}*${evolutions}${statusEmoji}\n` +
      `┌─────────────────\n│ 📊 Level ${level} | 💫 ${exp}/${maxExp} EXP\n│ ❤️ HP: ${hp}/${maxHp}\n│ ⚔️ ATK: ${atk} | 🛡️ DEF: ${def}\n` +
      `│ 🏆 ${wins}V | 💀 ${losses}D\n│ 🍖 Fome: ${hungerBar} ${hunger}%\n│ 😊 Humor: ${moodBar} ${mood}%\n└─────────────────\n\n`,
    commands: (prefix) => `🎮 *COMANDOS:* ${prefix}alimentar <nº>, ${prefix}treinar <nº>, ${prefix}evoluirpet <nº>, ${prefix}renomearpet <nº> <nome>, ${prefix}batalhapet <nº> @user`,
    maxPets: '🐾 Você já tem o máximo de 5 pets!',
    storeHeader: `╭━━━⊱ 🐾 *LOJA DE PETS* ⊱━━━╮\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`,
    storeItem: (emoji, name, cost, hp, atk, def) => `${emoji} *${name}*\n│ Preço: ${cost}\n│ ❤️ HP: ${hp} | ⚔️ ATK: ${atk} | 🛡️ DEF: ${def}\n└─────────────────\n\n`,
    storeFooter: (prefix) => `💡 Use ${prefix}adotar <nome>`,
    insufficientFunds: (cost, wallet) => `💰 Você precisa de *${cost}*! Saldo: ${wallet}`,
    adopted: (emoji, name, prefix) => `🎉 Você adotou ${emoji} *${name}*!\n\n💡 Use ${prefix}pets para ver seus companheiros.`,
    invalidPetNumber: (prefix) => `💔 Pet inválido! Escolha o número do pet em ${prefix}pets.`,
    needFoodMoney: (cost) => `💰 Você precisa de ${cost} para alimentar!`,
    fullPet: (emoji, name) => `🍖 ${emoji} *${name}* já está satisfeito!`,
    fed: (emoji, name, mood, hunger) => `🍖 ${emoji} *${name}* comeu!\n😊 Humor: ${mood}/100\n🍖 Fome: ${hunger}/100`,
    invalidPet: `💔 Pet inválido!`,
    hungryPet: (emoji, name) => `🍖 ${emoji} *${name}* está com fome!`,
    tiredPet: (emoji, name) => `⏰ ${emoji} *${name}* está cansado!`,
    evolved: (name, level) => `⭐ *PET EVOLUIU!* 🐾 *${name}* alcançou o nível ${level}!`,
    trained: (emoji, name, expGain, exp, maxExp) => `💪 ${emoji} *${name}* treinou!\n✨ EXP: +${expGain}\n📊 Progresso: ${exp}/${maxExp}`,
    renameUsage: (prefix) => `💔 Use: ${prefix}renomearpet <nº> <nome>`,
    renameCost: `💰 Renomear custa 500 moedas!`,
    renamed: (emoji, oldName, newName) => `✏️ ${emoji} *${oldName}* agora se chama *${newName}*!`,
    maxEvolution: (emoji, name) => `❌ ${emoji} *${name}* já atingiu sua forma máxima!`,
    needLevelToEvolve: (emoji, name, req, level) => `❌ ${emoji} *${name}* precisa estar no nível ${req}!\n\n📊 Nível atual: ${level}`,
    needStone: (prefix) => `❌ Você precisa de uma *Pedra da Evolução* para evoluir seu pet!\n\n🛒 Compre na ${prefix}loja ou ganhe em batalhas de pets.`,
    evolutionComplete: (oldEmoji, newEmoji, oldName, newName) => `╭━━━⊱ ✨ *EVOLUÇÃO CONCLUÍDA!* ✨ ⊱━━━╮\n│\n│ ${oldEmoji} ➜ ${newEmoji}\n│\n│ 🎉 *${oldName}* evoluiu para\n│ 🌟 *${newName}*!\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`,
    evolutionStats: (atk1, atk2, atkB, def1, def2, defB, hp1, hp2, hpB, spd1, spd2, spdB) => `📊 *NOVOS ATRIBUTOS:*\n\n⚔️ *ATK:* ${atk1} ➜ ${atk2} *(+${atkB})*\n🛡️ *DEF:* ${def1} ➜ ${def2} *(+${defB})*\n❤️ *HP:* ${hp1} ➜ ${hp2} *(+${hpB})*\n⚡ *SPD:* ${spd1} ➜ ${spd2} *(+${spdB})*\n\n`,
    nextEvolution: (name, emoji, req) => `🔮 *Próxima Evolução:* ${name} ${emoji}\n📊 *Requisito:* Nível ${req}\n`,
    finalEvolution: (name) => `👑 *${name}* atingiu sua FORMA FINAL!`,
    battleMentionArgs: (prefix) => `⚔️ Mencione um adversário para batalhar!\nEx: ${prefix}batalhapet 1 @user`,
    cantBattleSelf: `💔 Você não pode batalhar contra seus próprios pets!`,
    oppNoPets: `😢 O adversário não tem pets!`,
    weakPet: (emoji, name) => `⚠️ ${emoji} *${name}* está muito fraco para batalhar! Alimente-o e espere recuperar vida!`,
    battleCooldown: (rem) => `⏰ Você acabou de batalhar. Aguarde *${rem} minutos*.`,
    battleLogStart: `╭━━━⊱ ⚔️ *BATALHA DE PETS!* ⚔️ ⊱━━━╮\n\n`,
    battleLogFighter: (emoji, name, level, hp, maxHp, atk, def, spd) => `${emoji} *${name}* (Lv.${level})\n❤️ ${hp}/${maxHp} | ⚔️ ${atk} | 🛡️ ${def} | ⚡ ${spd}\n`,
    typeAdvantage: `✨ *VANTAGEM DE TIPO!*\n`,
    battleLogVs: `\n🆚\n\n`,
    battleLogBegin: `\n╰━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n⚡ *INÍCIO DA BATALHA!*\n\n`,
    battleTurn: (turn) => `━━━ *Turno ${turn}* ━━━\n`,
    attackMyPet: (emoji, name, adv, crit, dmg, hp, maxHp) => `⚔️ ${emoji} ${name} atacou!\n${adv ? '   ✨ *SUPER EFETIVO!*\n' : ''}${crit ? '   💥 *CRÍTICO!*\n' : ''}   💔 Dano: ${dmg}\n   ❤️ HP Oponente: ${hp}/${maxHp}\n`,
    attackOppPet: (emoji, name, adv, crit, dmg, hp, maxHp) => `🛡️ ${emoji} ${name} contra-atacou!\n${adv ? '   ✨ *SUPER EFETIVO!*\n' : ''}${crit ? '   💥 *CRÍTICO!*\n' : ''}   💔 Dano: ${dmg}\n   ❤️ Seu HP: ${hp}/${maxHp}\n`,
    battleVictory: (emoji, name) => `╭━━━⊱ 🏆 *VITÓRIA!* 🏆 ⊱━━━╮\n│ ${emoji} *${name}* venceu!\n╰━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`,
    battleRewards: (reward, expGain) => `📊 *RECOMPENSAS:*\n💰 Moedas: +${reward}\n✨ EXP: +${expGain}\n`,
    itemDrop: (item) => `🎁 Item dropado: *${item}*\n`,
    battleLevelUp: (emoji, name, level, atkGain, defGain, hpGain) => `\n╭━━━⊱ ⭐ *LEVEL UP!* ⭐ ⊱━━━╮\n│ ${emoji} ${name} → Lv.${level}\n│ ⚔️ ATK +${atkGain} | 🛡️ DEF +${defGain} | ❤️ HP +${hpGain}\n╰━━━━━━━━━━━━━━━━━━━━━━━╯`,
    battleDefeat: (emoji, name) => `╭━━━⊱ 💀 *DERROTA!* 💀 ⊱━━━╮\n│ ${emoji} *${name}* venceu!\n╰━━━━━━━━━━━━━━━━━━━━━━━╯\n\n💪 Continue treinando para melhorar!`,
    betMentionArgs: (prefix) => `❌ Marque alguém para apostar!\n\n💡 Uso: ${prefix}apostarpet <valor> <nº pet> @user`,
    betCantSelf: '❌ Você não pode apostar contra si mesmo!',
    betInvalidAmount: '❌ Informe um valor válido para apostar!',
    betNoMoneyMe: '❌ Você não tem dinheiro suficiente na carteira!',
    betNoMoneyOpp: '❌ Seu oponente não tem dinheiro suficiente!',
    betNoPetsMe: '🐾 Você não tem pets!',
    betNoPetsOpp: '❌ Seu oponente não tem pets!',
    betInvalidPetIndex: (prefix) => `❌ Pet inválido! Use ${prefix}pets para ver seus pets.`,
    betHeader: (e1, n1, l1, e2, n2, l2, bet) => `╭━━━⊱ 🎰 *APOSTA DE PETS* ⊱━━━╮\n\n${e1} *${n1}* (Lv.${l1}) VS ${e2} *${n2}* (Lv.${l2})\n\n💰 Aposta: ${bet}\n\n`,
    betWon: (bet) => `🏆 *VOCÊ VENCEU!*\n💰 Ganhou: +${bet}`,
    betLost: (bet) => `💀 *VOCÊ PERDEU!*\n💸 Perdeu: -${bet}`,
    betFooter: `\n╰━━━━━━━━━━━━━━━━━━━━━━╯`
  }
};
