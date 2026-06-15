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
      success: (total, bonusText, matsText) => `🧭 *EXPLORAÇÃO* 🧭\n\n🪙 Gold ganho: *${total}* moedas\n${bonusText}${matsText}`
    },
    hunting: {
      cooldown: (time) => `⏳ A floresta está perigosa agora. Aguarde ${time} para caçar novamente.`,
      success: (total, bonusText, meatQty, matsText) => `🏹 *CAÇADA* 🏹\n\n🪙 Gold ganho: *${total}* moedas\n${bonusText}🥩 Carne obtida: *${meatQty}*x\n${matsText}`
    },
    reset: {
      needMention: '❌ Marque o usuário que deseja resetar.',
      success: (target) => `⚠️ Jogador @${target} foi completamente resetado!`
    }
  },

  quests: {
    noRewards: '💔 Nenhuma recompensa disponível para reivindicar! Complete as missões primeiro.',
    claimed: (count, reward, exp) => `╭━━━⊱ ✅ *RECOMPENSAS* ⊱━━━╮\n\n🎉 Você reivindicou ${count} missão(ões)!\n\n💰 Dinheiro: +${reward}\n✨ EXP: +${exp}\n\n╰━━━━━━━━━━━━━━━━━━━━╯`
  },
  
  house: {
    noHouse: '❌ Você não tem uma casa!',
    decorNotFound: '❌ Decoração não encontrada!',
    decorAlreadyOwned: '❌ Você já tem essa decoração!',
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
  
  admin: {
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
  }
};
