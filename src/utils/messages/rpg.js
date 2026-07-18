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
  transferSelfError: '❌ Você não pode transferir para si mesmo.',
  invalidAmount: '❌ Informe um valor válido.',
  jobNotFound: (prefix) => `❌ Vaga inexistente. Use ${prefix}vagas para ver disponíveis.`,
  relationEndPermission: '🚫 Apenas os envolvidos ou um administrador podem encerrar o relacionamento de terceiros.',

  core: {
    groupOnly: '⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.',
    disabled: (prefix) => `⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`,
    wallet: (wallet) => `💰 *CARTEIRA* 💰\n\n💵 Dinheiro: *${wallet}* moedas.`,
    bank: (bank, capacity) => `🏦 *BANCO RPG* 🏦\n\n💰 Saldo: *${bank}* moedas.\n📦 Limite: *${capacity}* moedas.`,
    deposit: {
      invalidAmount: '❌ Informe um valor válido para depositar.',
      insufficientFunds: '❌ Você não tem essa quantidade de moedas na carteira.',
      bankFull: '❌ Seu banco está cheio ou o valor depositado excederia a capacidade.',
      success: (amount, total) => `✅ Você depositou *${amount}* moedas no banco!\n💰 Saldo atual: *${total}* moedas.`
    },
    withdraw: {
      invalidAmount: '❌ Informe um valor válido para sacar.',
      insufficientFunds: '❌ Você não tem essa quantidade de moedas no banco.',
      success: (amount, fee, net) => `✅ Você sacou *${amount}* moedas!\n💸 Taxa de 5%: *${fee}* moedas.\n💵 Recebido na carteira: *${net}* moedas.`
    },
    transfer: {
      usage: (prefix, sub) => `💡 Uso correto: *${prefix}${sub} @user <valor>*`,
      selfError: '❌ Você não pode transferir para si mesmo.',
      invalidAmount: '❌ Informe um valor válido para transferir.',
      insufficientFunds: (amount, fee, total, wallet) => `❌ Saldo insuficiente!\n\n💸 Valor a transferir: ${amount}\n🌾 Taxa de 15%: ${fee}\n💰 Total necessário: ${total}\n💵 Seu saldo: ${wallet}`,
      success: (amount, fee, total, target) => `✅ Transferência realizada com sucesso!\n\n👥 Destinatário: @${target}\n💵 Valor enviado: *${amount}* moedas\n💸 Taxa (15%): *${fee}* moedas\n💰 Total debitado: *${total}* moedas.`
    },
    mining: {
      cooldown: (time) => `⏳ Você está cansado para minerar. Aguarde ${time}.`,
      needPickaxe: (prefix) => `💔 Você precisa de uma picareta equipada para minerar! Use *${prefix}loja* ou *${prefix}forjar*.`,
      success: (gain, bonusText, drops, dur, max, broke) => `⛏️ *MINERAÇÃO* ⛏️\n\n🪙 Gold ganho: *${gain}* moedas ${bonusText}\n📦 Materiais obtidos: *${drops}*\n🛠️ Durabilidade da Picareta: *${dur}/${max}*${broke ? '\n⚠️ *Sua picareta quebrou!*' : ''}`
    },
    working: {
      cooldown: (time) => `⏳ Você trabalhou recentemente. Aguarde ${time}.`,
      success: (gain, bonus, total) => `💼 *TRABALHO* 💼\n\n💵 Salário base: *${gain}*\n✨ Bônus: *+${bonus}*\n💰 Total recebido: *${total}* moedas.`,
      levelUp: (level) => `\n\n🎉 *LEVEL UP!* Você alcançou o nível *${level}*! 🚀`
    },
    employment: {
      catalogHeader: `╭━━━⊱ 💼 *VAGAS DE EMPREGO* 💼 ⊱━━━╮\n`,
      catalogItem: (key, name, min, max) => `│ 🔹 *${name}* (ID: ${key})\n│   💰 Salário: ${min} - ${max}\n│\n`,
      catalogFooter: (prefix) => `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n💡 Use *${prefix}emprego <ID>* para trabalhar.`,
      usage: (prefix) => `💡 Uso correto: *${prefix}emprego <ID do cargo>*. Veja os cargos disponíveis em *${prefix}vagas*.`,
      hired: (name, min, max, prefix) => `🎉 Parabéns! Você foi contratado como *${name}*!\n💰 Salário estimado: *${min} - ${max}* por turno.\n\n💡 Use *${prefix}trabalhar* para começar.`,
      resigned: (prefix) => `✅ Você pediu demissão do seu emprego!\n💡 Use *${prefix}vagas* para procurar um novo cargo.`
    },
    fishing: {
      cooldown: (time) => `⏳ Os peixes estão assustados. Aguarde ${time} para pescar novamente.`,
      success: (total, bonusText, qty) => `🎣 *PESCA* 🎣\n\n🪙 Gold ganho: *${total}* moedas\n${bonusText}🐟 Peixes capturados: *${qty}*x`
    },
    exploring: {
      cooldown: (time) => `⏳ Você está cansado da última exploração. Aguarde ${time}.`,
      success: (total, bonusText, matsText) => `🧭 *EXPLORAÇÃO* 🧭\n\n🪙 Gold ganho: *${total}* moedas\n${bonusText}${matsText}`,
      drunkBenign: (gold, matsText, sobriety) => `🥴 *EXPLORAÇÃO (EMBRIAGADO)* 🥴\n\nVocê tropeçou no meio da floresta e viu um gnomo gigante dançando samba! 🍄✨\nNa verdade, era apenas um baú de moedas antigo esquecido no arbusto.\n\n│ 💰 Ouro recolhido: *+${gold}* moedas${matsText}\n│ 🍺 Estado: *${sobriety}*`,
      drunkMalign: (gold, sobriety) => `🥴 *EXPLORAÇÃO (EMBRIAGADO)* 🥴\n\nVocê encontrou um "cachorrinho muito fofo e felpudo" e tentou fazer carinho... 🐻\nDescobriu da pior forma que era um urso pardo selvagem irritado!\nVocê fugiu correndo desesperado e derrubou algumas moedas.\n\n│ 💸 Perda: *-${gold}* moedas\n│ 🍺 Estado: *${sobriety}*`,
      drunkBlackout: () => `🥴 *EXPLORAÇÃO (EMBRIAGADO)* 🥴\n\nVocê bebeu demais e teve um apagão no meio da floresta! 💤\nAcordou horas depois deitado em uma vala, com uma baita dor de cabeça e sem saber onde estava.\n\n│ ❌ Ganhos: *Nenhum*\n│ ⏳ Cooldown penalizado: *25 minutos* de espera\n│ 🍺 Estado: *Sóbrio* (depois de dormir na vala) ☀️`
    },
    hunting: {
      cooldown: (time) => `⏳ A floresta está perigosa agora. Aguarde ${time} para caçar novamente.`,
      success: (total, bonusText, meatQty, matsText) => `🏹 *CAÇADA* 🏹\n\n🪙 Gold ganho: *${total}* moedas\n${bonusText}🥩 Carne obtida: *${meatQty}*x\n${matsText}`
    },
    reset: {
      needMention: '❌ Marque o usuário que deseja resetar.',
      success: (target) => `⚠️ Jogador @${target} foi completamente resetado!`
    },
    shop: {
      header: '╭━━━⊱ 🛒 *LOJA RPG* 🛒 ⊱━━━╮\n│\n',
      item: (key, name, price) => `│ 🔹 *${key}*\n│   ${name}\n│   💰 ${price}\n│\n`,
      footer: (prefix) => `╰━━━━━━━━━━━━━━━━━━━━━━━╯\n\n💡 Use: ${prefix}comprar <item>`,
      buySuccess: (name) => `✅ Você comprou ${name}!`
    },
    inventory: {
      header: '╭━━━⊱ 🎒 *INVENTÁRIO* 🎒 ⊱━━━╮\n│\n',
      item: (key, qty) => `│ 🔹 *${key}*: ${qty}\n`,
      empty: '│ 📭 Inventário vazio\n',
      footer: '│\n╰━━━━━━━━━━━━━━━━━━━━━━━╯'
    },
    profile: {
      header: (pushname) => `╭━━━⊱ ⚔️ *PERFIL RPG* ⚔️ ⊱━━━╮\n│ ${pushname}\n╰━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`,
      exp: (level, progress, percent, pLevel, pMult, streak) => `📊 *NÍVEL & EXPERIÊNCIA*\n├ Level: ${level}\n├ XP: ${progress} (${percent}%)\n├ Prestige: ${pLevel}x (${pMult}x)\n└ Streak: ${streak}\n\n`,
      finances: (wallet, bank, total, job) => `💰 *FINANÇAS*\n├ Carteira: ${wallet}\n├ Banco: ${bank}\n├ Total: ${total}\n└ Emprego: ${job}\n\n`,
      custom: (classe, clan, house) => `🎭 *PERSONALIZAÇÃO*\n├ Classe: ${classe}\n├ Clã: ${clan}\n└ Casa: ${house}\n\n`,
      combat: (won, lost, rate, power) => `⚔️ *COMBATE*\n├ Vitórias: ${won}\n├ Derrotas: ${lost}\n├ Win Rate: ${rate}%\n└ Poder: ${power}\n\n`,
      skillsHeader: `🛠️ *HABILIDADES (TOP 3)*\n`,
      familyHeader: `\n👨‍👩‍👧‍👦 *FAMÍLIA & RELACIONAMENTO*\n`,
      familyStatus: (emoji, type, spouse) => `├ ${emoji} Status: ${type}\n├ Parceiro(a): ${spouse}\n`,
      familySingle: `├ 💔 Status: Solteiro(a)\n`,
      familyChildren: (children) => `└ Filhos: ${children}\n\n`,
      collectibles: (achv, pets, premium) => `🏆 *COLECIONÁVEIS*\n├ Conquistas: ${achv}\n├ Pets: ${pets}\n└ Itens Premium: ${premium}\n\n`,
      reputation: (points, karma) => `⭐ *REPUTAÇÃO*\n├ Pontos: ${points}\n└ Karma: ${karma}\n\n`,
      footer: (prefix) => `💎 Use ${prefix}meustats para ver estatísticas detalhadas`
    }
  },
  
  daily: {
    cooldown: (time) => `╭━━━⊱ ⏳ *COOLDOWN* ⏳ ⊱━━━╮\n│\n│ ⚠️ Você já coletou hoje!\n│ 🕐 Volte em: ${time}\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`,
    bonus7: '\n🎉 *BÔNUS DE 7 DIAS:* +500!',
    bonus30: '\n🏆 *BÔNUS DE 30 DIAS:* +2000!',
    rewardHeader: '╭━━━⊱ 🎁 *RECOMPENSA DIÁRIA* ⊱━━━╮\n│\n',
    rewardBase: (base) => `│ 💰 Base: +${base}\n`,
    rewardStreak: (count, bonus) => `│ 🔥 Streak (${count}x): +${bonus}\n`,
    rewardExtra: (extra) => `│ ✨ Bônus: +${extra}\n`,
    rewardDivider: '│ ━━━━━━━━━━━━━━\n',
    rewardTotal: (total) => `│ 💵 Total: *${total}*\n`,
    rewardXp: (xp) => `│ ⚡ XP: +${xp}\n│\n`,
    rewardSequence: (count, s) => `│ 🔥 Sequência: *${count} dia${s}*\n`,
    rewardRecord: (record, s) => `│ 🏆 Recorde: ${record} dia${s}\n│\n`,
    rewardFooter: '╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯',
    levelUp: (level) => `\n\n⚡ *LEVEL UP!* Agora você é level ${level}!`
  },
  
  admin: {
    groupOnly: '💔 Este comando só funciona em grupos.',
    toggle: (status) => `⚔️ Modo RPG ${status ? 'ATIVADO' : 'DESATIVADO'} neste grupo.\n\n${status ? '🎮 Agora os membros podem usar todos os comandos RPG!' : '🔒 Comandos RPG desativados.'}`,
    menu: (prefix) => `📖 Use o comando *${prefix}menurpg* para ver todos os comandos de RPG!`,
    noPlayers: '📊 Nenhum jogador registrado.',
    resetSuccess: '⚠️ Sistema RPG resetado globalmente!',
    rpgaddUsage: (prefix) => `💔 Uso: ${prefix}rpgadd @user <valor>`,
    rpgaddSuccess: (amount, target) => `💰 Adicionado ${amount} para @${target}`,
    rpgremoveUsage: (prefix) => `💔 Uso: ${prefix}rpgremove @user <valor>`,
    rpgremoveSuccess: (amount, target) => `💸 Removido ${amount} de @${target}`,
    rpgsetlevelUsage: (prefix) => `💔 Uso: ${prefix}rpgsetlevel @user <nivel>`,
    rpgsetlevelSuccess: (level, target) => `📊 Nível de @${target} definido para ${level}`,
    mentionPlayer: '💔 Marque um usuário!',
    playerResetSuccess: (target) => `🗑️ Jogador @${target} resetado.`,
    playerNotFound: '💔 Jogador não encontrado.',
    stats: (users, money) => `📊 *STATS RPG*\n\n👥 Jogadores: ${users}\n💰 Circulação: ${money}`,
    resetConfirm: (prefix) => `⚠️ Use ${prefix}rpgresetglobal confirmar para resetar TUDO.`
  },
  
  prestige: {
    info: (level, bonus, currentLevel, reqLevel, wallet, reqMoney, prefix) => `╭━━━⊱ ✨ *PRESTIGE* ⊱━━━╮\n│ Nível Atual: ${level}\n│ Bônus: +${bonus}% ganhos\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n🚀 *REQUISITOS PARA EVOLUIR:*\n• Nível: ${currentLevel}/${reqLevel}\n• Dinheiro: ${wallet}/${reqMoney}\n\n⚠️ *AVISO:* Evoluir resetará seu nível e dinheiro, mas dará bônus permanentes!\n\n💡 Use ${prefix}evoluir confirmar para prosseguir.`,
    needLevel: (reqLevel) => `💔 Você precisa ser Lv.${reqLevel}!`,
    needMoney: (reqMoney) => `💰 Você precisa de ${reqMoney}!`,
    success: (pushname, level) => `🌟 *EVOLUÇÃO CONCLUÍDA!*\n\n${pushname} agora é Prestige Nível ${level}!\n\n✨ Seus ganhos permanentes aumentaram em 10%!`
  },
  
  playerMarket: {
    header: (fee) => `╭━━━⊱ 🛒 *MERCADO DE JOGADORES* ⊱━━━╮\n│ Taxa: ${fee}% por venda\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`,
    empty: `📦 Nenhum item à venda no momento!\n\n`,
    itemsHeader: `📦 *ITENS À VENDA:*\n\n`,
    itemLine: (i, name, enchant, price, seller) => `${i}. *${name}* ${enchant ? `+${enchant}` : ''}\n   💰 ${price} | 👤 @${seller}\n`,
    commandsHelp: (prefix) => `\n💡 *Comandos:*\n• ${prefix}mercadoplayer vender <item> <preço>\n• ${prefix}mercadoplayer comprar <nº>\n• ${prefix}mercadoplayer meus`,
    sellUsage: (prefix) => `💡 Use: ${prefix}mercadoplayer vender <item> <preço>\n\n⚠️ Preço mínimo: 100`,
    noItem: `💔 Você não tem este item!`,
    maxListings: `💔 Você já tem 5 itens à venda! Cancele algum primeiro.`,
    sellSuccess: (name, price, fee) => `✅ *ITEM LISTADO*\n\n📦 ${name}\n💰 ${price}\n\n⚠️ Taxa de ${fee}% será cobrada na venda`,
    invalidNumber: `💔 Número inválido! Use o número da lista.`,
    invalidCancelNumber: `💔 Número inválido!`,
    needMoney: (price) => `💰 Você precisa de ${price}!`,
    buySuccess: (name, price, seller, received) => `✅ *COMPRA REALIZADA*\n\n📦 ${name}\n💰 -${price}\n\n📬 Vendedor @${seller} recebeu ${received}`,
    myAdsEmpty: 'Nenhum anúncio seu encontrado.',
    myAdsHeader: `🛒 *SEUS ANÚNCIOS*\n\n`,
    myAdsItemLine: (i, name, price) => `${i}. *${name}*\n   💰 ${price}\n\n`,
    myAdsFooter: (prefix) => `💡 Use ${prefix}mercadoplayer cancelar <nº> para cancelar`,
    cancelSuccess: (name) => `✅ Anúncio cancelado! ${name} devolvido ao inventário.`,
    help: (prefix) => `💡 Use ${prefix}mercadoplayer para ver comandos`
  },
  
  investments: {
    sellSuccess: (stock, qty, value, profit) => `╭━━━⊱ 💵 *VENDA DE AÇÕES* 💵 ⊱━━━╮\n│\n│ ✅ Ações vendidas!\n│\n│ 📊 Ação: ${stock}\n│ 📈 Quantidade: ${qty}\n│ 💰 Recebido: ${value}\n│ 💼 Lucro acumulado: ${profit}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
    invalidStock: `❌ Item inválido! Escolha: tecnologia, ouro, bitcoin, energia`,
    needMoney: (cost) => `💰 Você precisa de ${cost} moedas!`,
    buySuccess: (stock, qty, cost, total) => `╭━━━⊱ 💼 *INVESTIMENTO* 💼 ⊱━━━╮\n│\n│ ✅ Investimento realizado!\n│\n│ 📊 Ação: ${stock}\n│ 📈 Quantidade: ${qty}\n│ 💰 Valor: ${cost}\n│ 💼 Total investido: ${total}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
    marketHeader: (pushname) => `╭━━━⊱ 📈 *MERCADO DE AÇÕES* 📈 ⊱━━━╮\n│\n│ 👤 Investidor: ${pushname}\n│\n│ 💼 *AÇÕES DISPONÍVEIS:*\n│\n`,
    marketItem: (emoji, name, price, owned) => `│ ${emoji} *${name}*\n│ 💰 Preço: ${price}\n│ 📊 Você tem: ${owned}\n│\n`,
    marketFooter: (prefix) => `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n💡 Use ${prefix}investir comprar <nome> <qtd>\n💡 Exemplo: ${prefix}investir comprar bitcoin 5`
  },
  
  family: {
    myFamilyHeader: (pushname) => `╭━━━⊱ 👨‍👩‍👧‍👦 *MINHA FAMÍLIA* ⊱━━━╮\n│ ${pushname}\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`,
    single: `💔 *Relacionamento:* Solteiro(a)\n\n`,
    relationship: (emoji, type, partner, since) => `${emoji} *${type}:*\n┌─────────────────\n│ @${partner}\n│ ❤️ Desde: ${since}\n└─────────────────\n\n`,
    parentsHeader: `👫 *Pais:*\n`,
    childrenHeader: (count) => `👶 *Filhos (${count}):*\n`,
    noChildren: `👶 *Filhos:* Nenhum\n\n`,
    siblingsHeader: (count) => `👫 *Irmãos (${count}):*\n`,
    listItemDot: (user) => `• @${user}\n`,
    listItemNum: (i, user) => `${i}. @${user}\n`,
    helpFooter: (prefix) => `💡 Use ${prefix}adotaruser @user para adotar\n💡 Use ${prefix}arvore para ver árvore genealógica`,
    adoptNeedMention: (prefix) => `💔 Marque alguém para adotar!\n\n💡 Exemplo: ${prefix}adotaruser @user`,
    adoptSelf: `💔 Você não pode se adotar!`,
    adoptAlreadyChild: `💔 Esta pessoa já é seu filho(a)!`,
    adoptAlreadyParents: `💔 Esta pessoa já tem 2 pais/mães!`,
    adoptNeedMoney: (cost) => `💰 Você precisa de ${cost} moedas para adotar!`,
    adoptSuccess: (pushname, target, cost) => `🎉 Parabéns! ${pushname} adotou @${target}!\n💰 Custo: ${cost}`,
    disownNeedMention: (prefix) => `💔 Marque alguém para deserdar!\n\n💡 Exemplo: ${prefix}deserdar @user`,
    disownNotChild: `💔 Esta pessoa não é seu filho(a)!`,
    disownSuccess: (pushname, target) => `😢 ${pushname} deserdou @${target}!`,
    treeHeader: `╭━━━⊱ 🌳 *ÁRVORE GENEALÓGICA* ⊱━━━╮\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`,
    treeGrandparents: `👴👵 *Avós:*\n`,
    treeParents: `👫 *Pais:*\n`,
    treeYou: (pushname) => `👤 *Você:* ${pushname}\n`,
    treePartner: (partner) => `💍 *Parceiro(a):* @${partner}\n`,
    treeChildren: `👶 *Filhos:*\n`,
    treeGrandchildren: `👶👶 *Netos:*\n`
  },

  crime: {
    needTarget: '❌ Mencione o usuário que deseja assaltar/roubar.',
    cantTargetSelf: '❌ Você não pode se assaltar!',
    cooldownRob: (time) => `⏳ Você assaltou alguém recentemente. Aguarde ${time} para tentar novamente.`,
    victimNoMoney: '❌ A vítima não possui moedas na carteira.',
    robSuccess: (target, amount) => `🔫 Você assaltou @${target} e conseguiu roubar *${amount}* moedas!`,
    robFailed: (target, multa) => `👮 A polícia chegou! @${target} reagiu e você teve que pagar uma multa de *${multa}* moedas.`,
    cooldownCrime: (time) => `⏳ Você cometeu um crime recentemente. Aguarde ${time} para tentar de novo.`,
    crimeSuccess: (amount) => `🕶️ Você realizou o crime com sucesso e faturou *${amount}* moedas!`,
    crimeFailed: (fine) => `🚓 O plano deu errado e você foi pego pela polícia! Multa paga: *${fine}* moedas.`
  },

  quests: {
    noRewards: '💔 Nenhuma recompensa disponível para reivindicar! Complete as missões primeiro.',
    claimed: (count, reward, exp) => `╭━━━⊱ ✅ *RECOMPENSAS* ⊱━━━╮\n\n🎉 Você reivindicou ${count} missão(ões)!\n\n💰 Dinheiro: +${reward}\n✨ EXP: +${exp}\n\n╰━━━━━━━━━━━━━━━━━━━━╯`
  },
  
  challenges: {
    reward: (reward, sub) => `🎁 Você coletou ${reward} do ${sub === 'desafiomensal' ? 'desafio mensal' : 'desafio semanal'}!`,
    header: (sub) => `🎯 Desafio ${sub === 'desafiomensal' ? 'Mensal' : 'Semanal'}\n\n`,
    taskLine: (name, prog, target) => `  ${name}: ${prog}/${target}\n`,
    prize: (reward, claimed) => `\nPrêmio: ${reward} ${claimed ? '(coletado)' : ''}`,
    claimFooter: (prefix, sub) => `\nUse: ${prefix}${sub} coletar`
  },
  
  classes: {
    notFound: '💔 Classe não encontrada!',
    chosen: (name) => `✨ Você agora é um *${name}*!`,
    header: `╭━━━⊱ ⚔️ *CLASSES* ⊱━━━╮\n\n`,
    itemLine: (emoji, name, prefix, id) => `${emoji} *${name}*\n   💡 Use ${prefix}classe ${id}\n\n`
  },

  combat: {
    duel: {
      needTarget: `💔 Marque alguém para duelar!`,
      selfDuel: `💔 Você não pode duelar consigo mesmo!`,
      cooldown: (rem) => `⏰ Você está exausto! Aguarde ${rem} minutos.`,
      header: (p1, p2) => `╭━━━⊱ ⚔️ *DUELO* ⊱━━━╮\n│ ${p1} VS @${p2}\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`,
      myDmgLine: (name, dmg) => `⚔️ ${name}: -${dmg} HP\n`,
      oppDmgLine: (dmg) => `🛡️ Oponente: -${dmg} HP\n\n`,
      win: (reward) => `\n╭━━━⊱ 🏆 *VITÓRIA!* 🏆 ⊱━━━╮\n│\n│ 💰 Recompensa: *+${reward}*\n│ ✨ EXP: *+150*\n`,
      levelUpExt: (level, hp) => `│\n╰━━━━━━━━━━━━━━━━━━━━━╯\n\n╭━━━⊱   *LEVEL UP!* 🌟 ⊱━━━╮\n│\n│ 📊 Nível atual: *${level}*\n│ ❤️ HP restante: *${hp}*\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`,
      winExt: (hp) => `│ ❤️ HP restante: *${hp}*\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`,
      lose: (loss) => `\n╭━━━⊱ 💀 *DERROTA!* 💀 ⊱━━━╮\n│\n│ 💸 Perdeu: *-${loss}*\n│ ❤️ HP restante: *0*\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`
    },
    arena: {
      cooldown: (rem) => `⏰ A arena está fechada para você! Aguarde ${rem} minutos.`,
      header: `╭━━━⊱ 🏛️ *ARENA* ⊱━━━╮\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`,
      itemLine: (i, name, level, r1, r2, enemies) => `${i}. 🏆 *${name}* (Lv.${level})\n   💰 ${r1}-${r2} | ⚔️ ${enemies} Inimigos\n\n`,
      footer: (prefix) => `💡 Use ${prefix}arena <número>`,
      invalid: `💔 Arena inválida!`,
      levelUp: (level) => `🌟 *LEVEL UP!* Você agora é nível ${level}!`,
      win: (wins, enemies, reward) => `🏆 *VITÓRIA NA ARENA!* Derrotou ${wins}/${enemies} inimigos!\n💰 Prêmio: +${reward} moedas`,
      lose: (wins, enemies, loss) => `💀 *DERROTA NA ARENA!* Derrotou apenas ${wins}/${enemies} inimigos.\n💸 Perdeu: -${loss} moedas`
    }
  },

  dungeon: {
    cooldown: (rem) => `⏰ Você está exausto! Aguarde *${rem} minutos*.`,
    header: (name, level) => `╭━━━⊱ 🗺️ *MASMORRAS* ⊱━━━╮\n│ Aventureiro: *${name}*\n│ Nível: ${level}\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`,
    itemLine: (i, emoji, name, level, r1, r2, exp) => `${i}. ${emoji} *${name}* (Lv.${level})\n   💰 ${r1}-${r2} | ✨ ${exp}\n\n`,
    footer: (prefix) => `💡 Use ${prefix}dg <número>`,
    invalid: `💔 Masmorra inválida!`,
    levelUp: (level) => `🌟 *LEVEL UP!* Você agora é nível ${level}!`,
    win: (name, reward, exp) => `⚔️ *VITÓRIA!* Você conquistou a ${name}!\n💰 +${reward} moedas\n✨ +${exp} XP`,
    lose: (name, loss) => `💀 *DERROTA!* Você fugiu da ${name}!\n💸 Perdeu ${loss} moedas.`,
    
    bossCooldown: (remH, remM) => `⏰ Exausto! Aguarde *${remH}h ${remM}min*.`,
    bossBattleStart: (emoji, name, hp, atk, def, pName, pPower) => `╭━━━⊱ 👹 *BOSS FIGHT!* ⊱━━━╮\n\n${emoji} *${name}*\n❤️ HP: ${hp} | ⚔️ ATK: ${atk} | 🛡️ DEF: ${def}\n\nVS\n\n⚔️ *${pName}* (Poder: ${pPower})\n\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`,
    bossFinalHit: (dmg) => `⚔️ Você desferiu o golpe final! (-${dmg} HP)\n`,
    bossWin: (emoji, name, reward, exp, totalDefeated) => `\n╭━━━⊱ 🏆 *VITÓRIA!* ⊱━━━╮\n│ Você derrotou ${emoji} *${name}*!\n│\n│ 💰 Recompensa: +${reward}\n│ ✨ XP: +${exp}\n│ 🏅 Bosses derrotados: ${totalDefeated}\n╰━━━━━━━━━━━━━━━━━━━━╯`,
    bossLevelUp: (level) => `\n\n🌟 *LEVEL UP!* Você agora é nível ${level}!`,
    bossLose: (emoji, name, prefix) => `\n╭━━━⊱ 💀 *DERROTA!* ⊱━━━╮\n│ ${emoji} *${name}* foi mais forte!\n│\n│ 💡 Fique mais forte e tente novamente!\n│ 📈 Use ${prefix}equipar ou ${prefix}encantar para melhorar\n╰━━━━━━━━━━━━━━━━━━━━╯`
  },

  events: {
    header: (todayEvent) => `╭━━━⊱ 🎉 *EVENTOS RPG* ⊱━━━╮\n│ Hoje: ${todayEvent}\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`,
    body: (eventsList) => `📅 *Agenda Semanal:*\n${eventsList}`
  },

  house: {
    noHouse: '❌ Você não tem uma casa!',
    decorNotFound: '❌ Decoração não encontrada!',
    decorAlreadyOwned: '❌ Você já tem essa decoração!',
    invalidDecor: '❌ Decoração inválida ou não encontrada!',
    invalidType: '❌ Tipo inválido!\n\n🏘️ Tipos: barraca, cabana, casa, mansao, castelo',
    insufficientFunds: (cost, name) => `💰 Você precisa de ${cost} para comprar ${name}!`,
    bought: (emoji, name, storage, income) => `╭━━━⊱ 🎉 *CASA COMPRADA* ⊱━━━╮\n\n${emoji} Você comprou uma *${name}*!\n\n📦 Armazenamento: +${storage}\n💰 Renda: ${income}/dia\n\n╰━━━━━━━━━━━━━━━━━━━━╯`,
    cooldownCollect: (hours, mins) => `⏰ Próxima coleta em: ${hours}h ${mins}min`,
    collected: (emoji, name, amount, days) => `💰 *RENDA COLETADA*\n\n${emoji} ${name}\n💵 +${amount} (${days} dias)`,
    decorCost: (cost) => `💰 Você precisa de ${cost}!`,
    decorAdded: (emoji, name, value, bonus) => `🎨 *DECORAÇÃO ADICIONADA*\n\n${emoji} ${name}\n✨ +${value} ${bonus}`,
    usageInfo: (prefix) => `💡 Use: ${prefix}casa para ver opções`
  },
  
  forge: {
    pickaxePerfect: '🛠️ Sua picareta já está em perfeito estado.',
    noPickaxe: '💔 Você não possui uma picareta para reparar.',
    repairCost: (cost) => `💰 O conserto custa ${cost}.`,
    repairSuccess: (dur, max) => `🛠️ Picareta reparada com sucesso! Durabilidade: ${dur}/${max}.`,
    missingMaterials: (item, qty) => `💔 Faltam materiais: ${item} x${qty}.`,
    insufficientGold: '💔 Gold insuficiente.',
    forgedAndEquipped: (name) => `⚒️ Você forjou e equipou ${name}!`,
    forgedItem: (name) => `⚒️ Você forjou ${name}!`,
    cooldown: (time) => `⏳ Aguarde ${time} para forjar novamente.`,
    insufficientCoins: '💰 Você precisa de 150 moedas.',
    forgeSuccess: (gain) => `⚒️ Forja bem-sucedida! Lucro ${gain}.`,
    forgeFailed: '🔥 A forja falhou.',
    recipesHeader: (gold) => `╭━━━⊱ ⚒️ *RECEITAS DE FORJA* ⊱━━━╮\n│ 💰 Seu gold: ${gold}\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`,
    noRecipes: '💔 Nenhuma receita disponível.',
    recipesTitle: '📜 *RECEITAS DISPONÍVEIS*\n\n',
    recipeLine: (name, cost, matsText, prefix, key) => `🔸 *${name}*\n   💰 Custo: ${cost}\n   📦 Materiais: ${matsText}\n   💡 Forjar: ${prefix}forjar ${key}\n\n`
  },
  
  clans: {
    needClanWar: '🏰 Você precisa estar em um clã para declarar guerra!',
    leaderOnlyWar: '👑 Apenas o líder pode declarar guerra!',
    leaderOnlyInvite: '👑 Apenas o líder pode convidar membros.',
    leaderOnlyKick: '👑 Apenas o líder pode expulsar membros.',
    dissolved: '🗑️ Você saiu e o clã foi dissolvido pois não há mais membros.',
    left: '✅ Você saiu do clã.',
    leaderOnlyRemoveInvite: '👑 Apenas o líder pode remover convites.',
    noClans: '📊 Nenhum clã registrado.',
    createUsage: (prefix) => `❗ Use: ${prefix}criarcla <nome do clã>`,
    alreadyInClan: '💔 Você já pertence a um clã!',
    invalidNameLen: '💔 Nome do clã precisa ter entre 3 e 24 caracteres.',
    nameTaken: '💔 Já existe um clã com esse nome!',
    createCost: (cost) => `💰 Você precisa de ${cost} moedas para criar um clã.`,
    created: (name, leader, cost) => `🏰 Clã *${name}* criado com sucesso!\n\n👑 Líder: ${leader}\n💰 Custo: ${cost}`,
    notInClan: (prefix) => `💔 Você não faz parte de nenhum clã. Use: ${prefix}cla <nome do clã> para consultar outro clã.`,
    noClanCatalog: (prefix) => `💔 Clã não encontrado. Use ${prefix}criarcla <nome> para criar o seu!`,
    depositUsage: (prefix) => `💔 Informe um valor válido para depositar! Ex: ${prefix}depositarcla 5000`,
    noMoney: '💰 Você não tem moedas suficientes na carteira!',
    deposited: (amount, bank) => `🏰 Você depositou *${amount}* moedas no banco do clã!\n💰 Banco atual: *${bank}* moedas.`,
    inviteUsage: (prefix) => `❗ Marque um membro para convidar. Ex: ${prefix}convidar @user`,
    inviteSelf: '💔 Você já está no clã!',
    targetInClan: '💔 Este usuário já pertence a um clã.',
    invitePending: '💔 Este usuário já tem um convite pendente.',
    invited: (target, prefix, id) => `📨 Convite enviado para @${target}!\nUse ${prefix}aceitarconvite ${id} para aceitar.`,
    acceptNoInvites: '💔 Você não possui convites pendentes para clãs.',
    acceptMultiple: (prefix) => `🔎 Você possui múltiplos convites. Use: ${prefix}aceitarconvite <clanId>`,
    acceptNotFound: '💔 Clã não encontrado ou sem convite pendente.',
    acceptAlreadyIn: '💔 Você já faz parte de um clã. Saia do atual primeiro.',
    accepted: (name) => `✅ Você entrou para o clã *${name}*!`,
    rejectNoInvites: '💔 Você não possui convites pendentes para clãs.',
    rejectMultiple: (prefix) => `🔎 Você possui múltiplos convites. Use: ${prefix}recusarconvite <clanId>`,
    rejectNotFound: '💔 Clã não encontrado ou sem convite pendente.',
    rejected: (name) => `❗ Você recusou o convite do clã *${name}*.`,
    kickUsage: (prefix) => `❗ Marque um membro para expulsar. Ex: ${prefix}expulsar @user`,
    kickSelf: '💔 Você não pode se expulsar. Use sair para transferir liderança.',
    kickNotMember: '💔 Este usuário não é membro do seu clã.',
    kicked: (target, name) => `🗑️ @${target} foi expulso do clã *${name}*.`,
    leaveLeaderTransfer: (newLeader) => `🔁 Você deixou o clã e a liderança foi transferida para @${newLeader}.`,
    removeInviteUsage: (prefix) => `❗ Marque um usuário para remover o convite. Ex: ${prefix}rmconvite @user`,
    removeInviteNoPending: '💔 Este usuário não tem um convite pendente.',
    removeInviteSuccess: (target) => `🗑️ Convite removido para @${target}.`
  },
  

  crafting: {
    maxEnchant: '❌ Sua arma já está no encantamento máximo (+10)!',
    confirmNeed: '❌ Use "confirmar" para prosseguir',
    noWeapon: (prefix) => `❌ Você não tem uma arma equipada!\n\n💡 Use ${prefix}equipar para equipar uma arma`,
    crystalsNeeded: (crystals) => `💎 Você precisa de ${crystals}x cristais!`,
    craftCritFail: (emoji, name, level) => `💀 *FALHA CRÍTICA!*\n\n⚠️ Sua arma foi destruída no processo...\n\n❌ Você perdeu: ${emoji} ${name} +${level}`,
    craftFail: (cost, crystals) => `❌ *FALHA!*\n\n⚠️ O encantamento falhou, mas sua arma permaneceu intacta.\n\n💸 Perdeu: ${cost}\n💎 Perdeu: ${crystals}x cristais`,
    emptyInventory: '❌ Seu inventário está vazio!\n\n💡 Consiga equipamentos em masmorras',
    insufficientFunds: (cost) => `💰 Você precisa de ${cost} moedas!`,
    equipUsage: (prefix) => `💔 Informe o item: ${prefix}equipar <item>`,
    itemNotFound: '💔 Item não encontrado no inventário!',
    cantEquip: '💔 Este item não pode ser equipado!',
    equippedSuccess: (name, slot) => `✅ Você equipou *${name}* no slot ${slot}!`,
    invalidSlot: '💔 Informe um slot válido: arma, armadura, helmet, boots, shield, accessory',
    unequippedSuccess: (itemId) => `✅ *${itemId}* desequipado!`,
    noPets: '🐾 Você não tem pets!',
    equipPetUsage: (prefix) => `❌ Pet inválido!\n\n💡 Uso: ${prefix}equippet <nº pet> <item>`,
    equipPetItemUsage: (prefix) => `❌ Informe o item!\n\n💡 Uso: ${prefix}equippet <nº pet> <item>`,
    unequipPetUsage: (prefix) => `❌ Pet inválido!\n\n💡 Uso: ${prefix}desequiparpet <nº pet> <slot>\n📦 Slots: arma, armadura, escudo, acessorio, potao`,
    petNoEquip: (emoji, name) => `❌ ${emoji} *${name}* não tem equipamentos equipados!`,
    petInvalidSlot: '❌ Slot inválido ou sem item equipado! Escolha entre: arma, armadura, escudo, acessorio, potao',
    unequippedPetSuccess: (itemKey, emoji, name) => `✅ *${itemKey}* foi removido de ${emoji} *${name}* e devolvido ao seu inventário!`,
    needWeaponToEnchant: '💔 Você precisa de uma arma equipada para encantar!',
    enchantCost: (cost) => `💰 Encantar custa ${cost} moedas!`,
    enchantSuccess: '✨ *SUCESSO!* Sua arma brilhou intensamente! (+5 ATK)',
    enchantFailed: '💨 *FALHA!* O encantamento se dissipou no ar...'
  },
  
  market: {
    empty: '🛒 O mercado está vazio. Use listar para anunciar algo.',
    noOffers: '📭 Você não tem anúncios.',
    emptyPlayerSales: '📦 Você não tem nenhum item à venda!',
    useList: (prefix) => `Use: ${prefix}listar item <key> <qtd> <preco> | ${prefix}listar mat <material> <qtd> <preco>`,
    invalidQtyPrice: '💔 Quantidade e preço inválidos.',
    notEnoughItems: '💔 Você não possui itens suficientes.',
    notEnoughMaterials: '💔 Você não possui materiais suficientes.',
    missingId: '💔 Informe o ID do anúncio.',
    notFound: '💔 Anúncio não encontrado.',
    cancelOnlySeller: '💔 Apenas o vendedor pode cancelar.',
    buyOwnError: '💔 Você não pode comprar seu próprio anúncio.',
    listSuccess: (id, name, qty, price) => `📢 Anúncio #${id} criado: ${name} x${qty} por ${price}.`,
    cancelSuccess: (id) => `💔 Anúncio #${id} cancelado e itens devolvidos.`,
    buySuccess: (tax, priceMinusTax, seller) => `🛒 Compra realizada! Taxa de ${tax} aplicada. Vendedor @${seller} recebeu ${priceMinusTax}.`
  },
  
  economy: {
    noAuctions: '🏛️ Nenhum leilão ativo.',
    lotteryHeader: (jackpot, tickets, prefix) => `╭━━━⊱ 🎫 *LOTERIA* ⊱━━━╮\n💰 Jackpot: ${jackpot}\n🎟️ Seus bilhetes: ${tickets}\n💵 Preço: 10.000/cada\n\n💡 Use ${prefix}loteria comprar <qtd>`,
    insufficientFunds: '💰 Saldo insuficiente!',
    boughtTickets: (qty) => `✅ Você comprou ${qty} bilhetes!`,
    raceUsage: (prefix) => `💡 Use ${prefix}corrida <valor> <1-5>`,
    raceWon: (winner, win) => `🏁 Cavalo ${winner} venceu! Você ganhou ${win}! 🏇`,
    raceLost: (winner, bet) => `🏁 Cavalo ${winner} venceu! Você perdeu ${bet}. 🐎`,
    taxReport: (wealth, tax) => `🏦 *TRIBUTOS*\n\nSua riqueza: ${wealth}\nImposto devido: ${tax}\n\n✅ Tudo em dia!`,
    donateUsage: (prefix) => `💡 Use ${prefix}doar <valor>`,
    donated: (amount) => `💝 Obrigado! Você doou ${amount} para o tesouro.`,
    giftUsage: (prefix) => `💡 Use ${prefix}presente @user <valor>`,
    giftSuccess: (amount, target) => `🎁 Você enviou ${amount} moedas para @${target}!`
  },
  
  properties: {
    useBuy: (prefix) => `Use: ${prefix}comprarpropriedade <tipo>`,
    notFound: 'Propriedade inexistente.',
    alreadyOwned: 'Você já possui essa propriedade.',
    none: 'Você não possui propriedades.',
    upkeepInsufficient: (name, upkeep) => `Saldo insuficiente para pagar manutenção de ${name} (${upkeep}).`,
    buySuccess: (name) => `✅ Você comprou ${name}!`,
    collectSuccess: (gold, mats) => `✅ Coleta concluída! +${gold} gold${mats ? ` | Materiais: ${mats}` : ''}`
  },
  
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
      `📈 *PROGRESSO*\n├ Level: ${level}\n├ Prestige: ${prestige}\n├ Conquistas: ${achievements}\n├ Itens Premium: ${premiumItems}\n└ Pets: ${pets}\n\n` +
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
  },
  
  relationship: {
    disableBn: '💔 O modo brincadeira está desativado neste grupo.',
    needTarget: (cmd) => `💔 Marque a pessoa que você deseja pedir em ${cmd}.`,
    cantTargetSelf: '💔 Você não pode pedir a si mesmo em relacionamento!',
    noActiveOrMention: '💔 Você não marcou ninguém e não possui relacionamento ativo no momento.',
    consultDifferent: '💔 Selecione pessoas diferentes para consultar.',
    noCouples: (prefix) => `💔 Não há casais neste grupo ainda!\n\n💡 Use ${prefix}casar @pessoa para se casar!`,
    noActiveRelation: '💔 Você não possui relacionamento ativo para encerrar.',
    endDifferent: '💔 Selecione pessoas diferentes.',
    endPermission: '🚫 Apenas os envolvidos ou um administrador podem encerrar o relacionamento de terceiros.',
    betrayNeedTarget: (prefix) => `💔 Você precisa marcar alguém para trair! Exemplo: ${prefix}trair @pessoa`,
    betraySelf: '💔 Você não pode trair a si mesmo... isso não faz sentido! 🤨',
    historyNoActive: '💔 Você não possui relacionamento ativo para consultar o histórico.'
  },
  casino: {
    usageApostar: (prefix, command) => `💡 Use ${prefix}${command} <valor>`,
    minBet: (amount = 100) => `💡 Aposta mínima é de ${amount} gold.`,
    insufficientFunds: '💰 Saldo insuficiente na carteira!',
    wonAposta: (amount) => `🎉 Você venceu a aposta e ganhou ${amount} gold!`,
    lostAposta: (amount) => `💀 Você perdeu ${amount} gold na aposta.`,
    usageCoinflip: (prefix) => `💡 Use ${prefix}coinflip <cara|coroa> <valor>`,
    insufficientCoinflip: '💰 Saldo insuficiente!',
    wonCoinflip: (result, amount) => `🪙 Caiu *${result}*! Você ganhou ${amount}!`,
    lostCoinflip: (result, amount) => `🪙 Caiu *${result}*! Você perdeu ${amount}.`,
    usageRoleta: (prefix) => `💡 Use ${prefix}roleta <red|black|green> <valor>`,
    wonRoleta: (result, amount, mult) => `🎰 Resultado: *${result.toUpperCase()}*! Você ganhou ${amount}! (${mult}x)`,
    lostRoleta: (result, amount) => `🎰 Resultado: *${result.toUpperCase()}*! Você perdeu ${amount}.\n🎰 A roleta parece viciada...`,
    cooldownSlots: (time) => `⏳ Aguarde ${time} para jogar slots novamente.`,
    usageSlots: (prefix) => `💡 Use ${prefix}slots <valor>`,
    jackpotSlots: (symbol, amount, mult) => `🎉 *JACKPOT!* Você alinhou 3 ${symbol} e ganhou *${amount}* gold! (${mult}x)`,
    pairSlots: (amount) => `✨ *PAR!* Você combinou 2 símbolos e ganhou *${amount}* gold! (1.5x)`,
    lostSlots: (amount) => `💀 Você perdeu *${amount}* gold. A sorte não está com você!`,
    usageDados: (prefix) => `💡 Use ${prefix}dados <valor>`,
    dadosResult: (playerScore, botScore, resultMsg) => `🎲 Você: ${playerScore}\n🎲 Bot: ${botScore}\n\n${resultMsg}`,
    dadosWon: (amount) => `🎉 Você ganhou ${amount}!`,
    dadosLost: (amount) => `💀 Você perdeu ${amount}.`,
    dadosTie: '🤝 Empate!',
    usageCrash: (prefix) => `💡 Use ${prefix}crash <valor>`,
    crashResult: (exit, crash, resultMsg) => `🚀 Você saiu em: ${exit}x\n💥 Crash em: ${crash}x\n\n${resultMsg}`,
    crashWon: (amount) => `🎉 Você ganhou ${amount}!`,
    crashLost: (amount) => `💀 Você perdeu ${amount}.`,
    usageBlackjack: (prefix) => `💡 Use ${prefix}blackjack <valor>`,
    blackjackResult: (playerCards, playerSum, dealerCards, dealerSum, resultMsg) => `🃏 *BLACKJACK*\n\nSua mão: ${playerCards} = *${playerSum}*\nMesa: ${dealerCards} = *${dealerSum}*\n\n${resultMsg}`,
    bjBust: (amount) => `💀 *BUST!* Você estourou e perdeu ${amount}.\n🃏 Que azar...`,
    bjWon: (amount) => `🎉 *VITÓRIA RARA!* Você ganhou ${amount}!`,
    bjTie: (amount) => `🤝 *EMPATE!*\n💸 Taxa de empate: -${amount}`,
    bjLost: (amount) => `💀 *MESA VENCEU!* Você perdeu ${amount}.\n🃏 O dealer parece ter sorte demais...`
  },
  gifts: {
    unavailable: 'Sistema de presentes indisponível.',
    insufficientGold: (cost) => `💔 Você precisa de ${cost} gold.`,
    invalidType: '💔 Tipo inválido!',
    needMention: (prefix, cmd) => `💔 Marque alguém!\nUso: ${prefix}${cmd} @user <tipo>`,
    emptyInventory: '╭━━━⊱ 🎒 *INVENTÁRIO* 🎒 ⊱━━━╮\n│\n│ 📭 Inventário vazio\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━╯',
    boxSystem: (prefix) => `╭━━━⊱ 🎁 *SISTEMA DE CAIXAS* 🎁 ⊱━━━╮\n│\n│ 🔹 ${prefix}caixa diaria\n│ 🔹 ${prefix}caixa rara (500 gold)\n│ 🔹 ${prefix}caixa lendaria (2000 gold)\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
    inventoryContent: (invStr) => `╭━━━⊱ 🎒 *INVENTÁRIO* 🎒 ⊱━━━╮\n│\n${invStr.split('\n').map(l => '│ ' + l).join('\n')}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━╯`,
    walletReward: (wallet) => `\n💼 Carteira: ${wallet}`,
    levelReward: (level) => `\n⭐ Novo level: ${level}`
  },
  reputation: {
    unavailable: 'Sistema de reputação indisponível.',
    usage: (prefix) => `💔 Uso: ${prefix}rep + @user`,
    needMention: '💔 Marque quem denunciar!',
    needReason: '💔 Informe o motivo!',
    info: (name, rep) => `╭━━━⊱ ⭐ *REPUTAÇÃO* ⭐ ⊱━━━╮\n│\n│ 👤 Usuário: ${name}\n│\n│ ${rep.split('\n').join('\n│ ')}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━╯`
  },
  qrcode: {
    unavailable: 'Sistema de QR Code indisponível.',
    missingText: (prefix) => `💔 Digite o texto!\nEx: ${prefix}qrcode https://google.com`,
    missingMedia: '💔 Marque um QR Code!',
    generated: (q) => `📱 *QR Code gerado!*\n\nConteúdo: ${q}`
  },
  achievements: {
    unavailable: 'Sistema de conquistas indisponível.'
  },
  notes: {
    unavailable: 'Sistema de notas indisponível.',
    empty: 'Você não tem notas salvas.',
    missingText: 'Digite o texto da nota!',
    successAdd: '✅ Nota adicionada!',
    missingId: 'Informe o ID!',
    successDel: '✅ Nota deletada!',
    invalidId: '💔 ID inválido.',
    list: (userNotes) => `📝 *Suas Notas:*\n\n${userNotes.map((n, i) => `${i + 1}. ${n.title || (n.text ? n.text.slice(0, 20) : 'Sem texto')}...`).join('\\n')}`
  },
  cooking: {
    recipesHeader: '📖 *RECEITAS CULINÁRIAS*\n\n',
    recipeTip: (prefix) => `💡 *Dica:* Plante ingredientes com ${prefix}plantar`,
    recipeLine: (name, ingredients, gold, sellPrice, energy, prefix, key) => `${name}\n  📦 Ingredientes: ${ingredients}\n  💰 Custo: ${gold}\n  💵 Venda: ${sellPrice}\n  ⚡ Energia: +${energy}\n  🍳 Cozinhar: ${prefix}cozinhar ${key}\n\n`,
    systemInfo: (prefix) => `👨‍🍳 *SISTEMA DE COZINHA*\n\n📖 Veja as receitas disponíveis: ${prefix}receitas\n🍳 Cozinhar: ${prefix}cozinhar <receita>\n\n💡 Exemplo: ${prefix}cozinhar pao`,
    recipeNotFound: (prefix) => `💔 Receita não encontrada! Use ${prefix}receitas para ver todas as receitas disponíveis.`,
    cooldownCook: (time) => `⏳ Você ainda está cozinhando! Aguarde ${time}.`,
    insufficientFundsCook: (gold, name, wallet) => `💰 Você precisa de ${gold} para cozinhar ${name}. Saldo atual: ${wallet}`,
    insufficientIngredients: (ing, req, have, prefix) => `📦 Ingredientes insuficientes! Você precisa de ${ing} x${req}, mas tem apenas x${have}.\n\n🌱 Plante ingredientes com ${prefix}plantar`,
    cookSuccess: (name, energy, sellPrice, prefix, key) => `👨‍🍳 *COZINHA CONCLUÍDA!*\n\n${name} preparado com sucesso!\n⚡ Energia: +${energy}\n💵 Valor de venda: ${sellPrice}\n\n🍴 Use ${prefix}comercomida ${key} para consumir\n💰 Use ${prefix}vendercomida ${key} para vender`,
    ingredientsEmpty: (prefix) => `📦 *INGREDIENTES*\n\nVocê não possui ingredientes.\n\n🌱 Plante com ${prefix}plantar para conseguir ingredientes!`,
    myIngredientsHeader: '📦 *MEUS INGREDIENTES*\n\n',
    myIngredientsTip: (prefix) => `\n👨‍🍳 Use ${prefix}receitas para ver o que pode cozinhar`,
    foodEmpty: (prefix) => `🍽️ Você não tem comida preparada.\n\n👨‍🍳 Cozinhe algo com ${prefix}cozinhar`,
    foodHeader: '🍽️ *COMIDAS PREPARADAS*\n\n',
    foodItem: (name, qty, energy, sellPrice) => `${name} x${qty}\n  ⚡ Energia: +${energy}\n  💵 Valor: ${sellPrice}\n\n`,
    foodTip: (prefix) => `🍴 Comer: ${prefix}comercomida <comida>\n💰 Vender: ${prefix}vendercomida <comida>`,
    foodNotPrepared: (key, prefix) => `💔 Você não tem ${key} preparado.\n\n👨‍🍳 Cozinhe com ${prefix}cozinhar ${key}`,
    eatSuccess: (name, energyGain, totalEnergy) => `😋 *DELICIOSO!*\n\nVocê comeu ${name}!\n⚡ Energia: +${energyGain}\n💪 Energia total: ${totalEnergy}\n\n💡 Quanto mais energia, mais bônus você recebe!`,
    sellUsage: (prefix) => `💰 *VENDER COMIDA*\n\nUse: ${prefix}vendercomida <comida> <quantidade>\n\n💡 Veja suas comidas com ${prefix}comercomida`,
    invalidQuantity: `💔 Quantidade inválida!`,
    notEnoughFood: (qty, key, have) => `💔 Você não tem ${qty}x ${key}.\n\n🍽️ Você tem: ${have}`,
    sellSuccess: (qty, name, totalValue, wallet) => `💰 *VENDA CONCLUÍDA!*\n\nVocê vendeu ${qty}x ${name}\n💵 Ganhou: ${totalValue}\n💼 Carteira: ${wallet}`,
    invalidRecipe: `💔 Receita não encontrada.`
  },
  farming: {
    farmHeader: '🌾 *MINHA PLANTAÇÃO*\n\n',
    farmStats: (current, max) => `📊 Terrenos: ${current}/${max}\n\n`,
    farmEmpty: '🌱 Sua plantação está vazia!\n\n',
    plotHeader: (idx, seedName) => `🌱 *Terreno ${idx}*\n  Semente: ${seedName}\n`,
    plotReady: '  ✅ Pronto para colher!\n',
    plotTimeLeft: (mins) => `  ⏳ Pronto em: ${mins} min\n`,
    farmCommands: (prefix) => `💡 *Comandos:*\n🌱 Plantar: ${prefix}plantar <semente>\n🌾 Colher: ${prefix}colher\n📦 Sementes: ${prefix}sementes`,
    systemInfo: '🌱 *SISTEMA DE PLANTAÇÃO*\n\n📦 *Sementes Disponíveis:*\n\n',
    seedLineInfo: (name, cost, mins, yieldText) => `${name}\n  💰 Custo: ${cost}\n  ⏱️ Tempo: ${mins} min\n  🌾 Colheita: ${yieldText}\n\n`,
    plantUsage: (prefix) => `🌱 Plantar: ${prefix}plantar <semente>\n💡 Exemplo: ${prefix}plantar trigo`,
    seedNotFound: (prefix) => `💔 Semente não encontrada! Use ${prefix}plantar para ver as sementes disponíveis.`,
    plotsFull: '🌾 Todos os seus terrenos estão ocupados! Aguarde a colheita ou expanda sua fazenda.',
    insufficientFundsPlant: (cost, name, wallet) => `💰 Você precisa de ${cost} para plantar ${name}. Saldo: ${wallet}`,
    plantSuccess: (name, mins, currentPlots, maxPlots) => `🌱 ${name} plantado com sucesso!\n\n⏱️ Estará pronto para colher em ${mins} minutos.\n🌾 Terrenos ocupados: ${currentPlots}/${maxPlots}`,
    nothingPlanted: '🌾 Você não tem nada plantado!',
    nothingReady: (mins) => `⏳ Nenhuma planta está pronta para colher ainda.\n🕐 Próxima colheita em: ${mins} minuto(s)`,
    harvestSuccess: (count, ingredients, value, freePlots, maxPlots) => `🌾 *COLHEITA CONCLUÍDA!*\n\n✅ Plantas colhidas: ${count}\n📦 Ingredientes obtidos:\n${ingredients}\n\n💵 Valor estimado: ${value}\n🌱 Terrenos livres: ${freePlots}/${maxPlots}`,
    seedsHeader: '🌱 *CATÁLOGO DE SEMENTES*\n\n',
    seedsLine: (name, cost, mins, prefix, key) => `${name}\n  💰 Custo: ${cost}\n  ⏱️ Crescimento: ${mins} min\n  🌱 Plantar: ${prefix}plantar ${key}\n\n`
  },
  materials: {
    empty: (prefix) => `╭━━━⊱ ⛏️ *MATERIAIS* ⛏️ ⊱━━━╮\n│\n│ 📭 Você não possui materiais\n│\n│ ⛏️ Mine para coletar!\n│ Use: ${prefix}minerar\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`,
    header: '╭━━━⊱ ⛏️ *MATERIAIS* ⛏️ ⊱━━━╮\n│\n',
    itemLine: (key, qty) => `│ 💎 ${key}: ${qty}\n`,
    footer: '│\n╰━━━━━━━━━━━━━━━━━━━━━━╯',
    pricesHeader: '╭━━━⊱ 💱 *PREÇOS* 💱 ⊱━━━╮\n│\n│ 💎 *MATERIAIS (unidade)*\n│\n',
    priceLine: (key, price) => `│ 🔸 ${key}: ${price}\n`,
    recipesHeader: '│\n│ 📜 *RECEITAS*\n│\n',
    recipeLine: (name, reqs, gold) => `│ 🔨 ${name}\n│    ${reqs} + ${gold}\n`,
    pricesFooter: '│\n╰━━━━━━━━━━━━━━━━━━━━━━━━╯',
    sellUsage: (prefix) => `╭━━━⊱ 💰 *VENDER MATERIAIS* 💰 ⊱━━━╮\n│\n│ 📝 *Uso:*\n│ ${prefix}vender <material> <qtd|all>\n│\n│ 💡 *Exemplo:*\n│ ${prefix}vender ferro 10\n│ ${prefix}vender ouro all\n│\n│ 💱 Ver preços: ${prefix}precos\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
    invalidMaterial: (prefix) => `❌ Material inválido.\n\n💱 Veja preços com ${prefix}precos`,
    sellSuccess: (qty, matKey, gain) => `╭━━━⊱ ✅ *VENDA* ✅ ⊱━━━╮\n│\n│   Vendeu: ${qty}x ${matKey}\n│ 💰 Ganhou: ${gain}\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`
  },
  consumables: {
    invalidConsumable: "⚠️ Consumível inválido!",
    mate: {
      cooldown: (time) => `⏳ Você já tomou um mate recentemente. Aguarde ${time} para tomar outro.`,
      notTired: "⚠️ Você não está cansado o suficiente para tomar um mate! Trabalhe primeiro para ter um cooldown ativo.",
      notInInventory: (prefix) => `🧉 Você não tem Mate no inventário! Compre na loja usando *${prefix}comprar mate*.`,
      dailyLimitReached: (limit) => `⚠️ Você já atingiu o limite diário de consumo de Mate (${limit} vezes).`,
      successWashed: (count, limit) => `🧉 *CHIMARRÃO* 🧉\n\n*Bah, que decepção!* 🫖\nO mate estava lavado e sem gosto...\n⚡ Seu cooldown de trabalho atual foi reduzido em apenas *1* minuto.\n📊 Consumos hoje: *${count}/${limit}*`,
      successStandard: (reduction, count, limit) => `🧉 *CHIMARRÃO* 🧉\n\n*Hummm, no ponto!* 😋\nVocê tomou um chimarrão quentinho e amargo, como deve ser.\n⚡ Seu cooldown de trabalho atual foi reduzido em *${reduction}* minutos!\n📊 Consumos hoje: *${count}/${limit}*`,
      successSpecial: (reduction, count, limit) => `🧉 *CHIMARRÃO* 🧉\n\n*Mas bah, tchê! Cevado com capricho!* 🌿✨\nEste mate ficou espetacular! Disposição lá no topo!\n⚡ Seu cooldown de trabalho atual foi reduzido em *${reduction}* minutos!\n📊 Consumos hoje: *${count}/${limit}*`
    },
    cerveja: {
      cooldown: (time) => `⏳ Você já bebeu uma cerveja recentemente. Aguarde ${time} para tomar outra.`,
      notTired: "⚠️ Você não está cansado para explorar! Seu cooldown de explorar precisa estar ativo.",
      notInInventory: (prefix) => `🍺 Você não tem Cerveja no inventário! Compre na loja usando *${prefix}comprar cerveja*.`,
      dailyLimitReached: (limit) => `⚠️ Você já atingiu o limite diário de consumo de Cerveja (${limit} vezes).`,
      successChoca: (drunkMsg, count, limit) => `🍺 *CERVEJA* 🍺\n\n*Ih, tá choca!* 🤢\nEssa breja estava morna e sem gás...\n⚡ Cooldown de explorar reduzido em apenas *1* minuto.\n\n${drunkMsg}\n📊 Consumos hoje: *${count}/${limit}*`,
      successStandard: (reduction, drunkMsg, count, limit) => `🍺 *CERVEJA* 🍺\n\n*Cerveja no ponto!* 🍺✨\nUma bela loira gelada para relaxar as pernas.\n⚡ Cooldown de explorar reduzido em *${reduction}* minutos.\n\n${drunkMsg}\n📊 Consumos hoje: *${count}/${limit}*`,
      successSpecial: (reduction, drunkMsg, count, limit) => `🍺 *CERVEJA* 🍺\n\n*Mas que delícia! Trincando de gelada!* ❄️🍻\nDesceu redondo! Disposição total para a próxima aventura!\n⚡ Cooldown de explorar reduzido em *${reduction}* minutos!\n\n${drunkMsg}\n📊 Consumos hoje: *${count}/${limit}*`
    },
    cigarro: {
      cooldown: (time) => `⏳ Você já fumou um cigarro recentemente. Aguarde ${time} para acender outro.`,
      notTired: "⚠️ Você não está cansado para pescar! Seu cooldown de pescar precisa estar ativo.",
      notInInventory: (prefix) => `🚬 Você não tem Cigarro no inventário! Compre na loja usando *${prefix}comprar cigarro*.`,
      dailyLimitReached: (limit) => `⚠️ Você já atingiu o limite diário de consumo de Cigarro (${limit} vezes).`,
      successApagado: (lombraMsg, count, limit) => `🚬 *CIGARRO* 🚬\n\n*Putz, apagou!* 💨\nO vento apagou o cigarro na metade e a brasa sumiu...\n⚡ Cooldown de pescar reduzido em apenas *1* minuto.\n\n${lombraMsg}\n📊 Consumos hoje: *${count}/${limit}*`,
      successStandard: (reduction, lombraMsg, count, limit) => `🚬 *CIGARRO* 🚬\n\n*No capricho!* 🚬✨\nUm cigarrinho clássico para ver o tempo passar devagar.\n⚡ Cooldown de pescar reduzido em *${reduction}* minutos.\n\n${lombraMsg}\n📊 Consumos hoje: *${count}/${limit}*`,
      successSpecial: (reduction, lombraMsg, count, limit) => `🚬 *CIGARRO* 🚬\n\n*Saboroso e relaxante!* 🌟🚬\nEsse desceu perfeitamente! Uma calmaria profunda tomou conta.\n⚡ Cooldown de pescar reduzido em *${reduction}* minutos!\n\n${lombraMsg}\n📊 Consumos hoje: *${count}/${limit}*`
    },
    banza: {
      cooldown: (time) => `⏳ Você já fumou um banza recentemente. Aguarde ${time} para acender outro.`,
      notTired: "⚠️ Você não está cansado para pescar! Seu cooldown de pescar precisa estar ativo.",
      notInInventory: (prefix) => `🍁 Você não tem Banza no inventário! Compre na loja usando *${prefix}comprar banza*.`,
      dailyLimitReached: (limit) => `⚠️ Você já atingiu o limite diário de consumo de Banza (${limit} vezes).`,
      successMofado: (lombraMsg, count, limit) => `🍁 *BANZA* 🍁\n\n*Ih, veio mofado!* 🤢\nEssa paranga tava no fundo da gaveta... Gosto horrível e brisa fraca.\n⚡ Cooldown de pescar reduzido em apenas *2* minutos.\n\n${lombraMsg}\n📊 Consumos hoje: *${count}/${limit}*`,
      successStandard: (reduction, lombraMsg, count, limit) => `🍁 *BANZA* 🍁\n\n*Crema pura!* 🍁🔥\nUm fininho verde e cheiroso para abrir a mente.\n⚡ Cooldown de pescar reduzido em *${reduction}* minutos.\n\n${lombraMsg}\n📊 Consumos hoje: *${count}/${limit}*`,
      successSpecial: (reduction, lombraMsg, count, limit) => `🍁 *BANZA* 🍁\n\n*Haxixe dos deuses!* 🍯🍁\nQue pancada! Uma onda gigante de tranquilidade te atingiu.\n⚡ Cooldown de pescar reduzido em *${reduction}* minutos!\n\n${lombraMsg}\n📊 Consumos hoje: *${count}/${limit}*`
    }
  }
};
