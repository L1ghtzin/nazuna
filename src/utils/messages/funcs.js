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
  },
  tictactoe: {
    invalidInvite: '❌ Dados inválidos para o convite',
    alreadyPlaying: '❌ Já existe um jogo ou convite em andamento!',
    invite: (inviter, invitee) => `🎮 *CONVITE JOGO DA VELHA*\n\n@${inviter} convidou @${invitee}!\n\n✅ Aceitar: "sim", "s"\n❌ Recusar: "não", "n"\n\n⏳ Expira em 15 minutos.`,
    noPendingInvite: '❌ Nenhum convite pendente para você.',
    invalidResponse: '❌ Resposta inválida. Use "sim" ou "não".',
    inviteRejected: '❌ Convite recusado. Jogo cancelado.',
    gameStarted: (xSymbol, xPlayer, oSymbol, oPlayer, board, current) => `🎮 *JOGO DA VELHA - INICIADO!*\n\n👥 Jogadores:\n➤ ${xSymbol}: @${xPlayer}\n➤ ${oSymbol}: @${oPlayer}\n\n${board}\n\n💡 Vez de @${current} (1-9).`,
    noActiveGame: '❌ Nenhum jogo em andamento!',
    gameTimeout: '❌ Jogo encerrado por inatividade (5 minutos sem jogada).',
    notYourTurn: '❌ Não é sua vez!',
    invalidPosition: '❌ Posição inválida! Use 1-9.',
    positionTaken: '❌ Posição já ocupada!',
    unknownError: '❌ Erro desconhecido.',
    gameWon: (winner, board) => `🎮 *JOGO DA VELHA - FIM*\n\n🎉 @${winner} venceu! 🏆\n\n${board}`,
    gameDraw: (board) => `🎮 *JOGO DA VELHA - FIM*\n\n🤝 Empate!\n\n${board}`,
    gameContinue: (nextPlayer, board) => `🎮 *JOGO DA VELHA*\n\n👉 Vez de @${nextPlayer}\n\n${board}\n\n💡 Digite um número de 1 a 9.`,
    gameEndedManual: '🎮 Jogo encerrado manualmente!'
  },
  connect4: {
    invalidInvite: '❌ Dados inválidos para o convite',
    alreadyPlaying: '❌ Já existe um jogo ou convite em andamento neste grupo!',
    invite: (inviter, invitee) => `🔴🟡 *CONVITE CONNECT 4*\n\n@${inviter} convidou @${invitee} para jogar!\n\n✅ Aceitar: "sim", "s"\n❌ Recusar: "não", "n"\n\n⏳ Expira em 15 minutos.`,
    noPendingInvite: '❌ Nenhum convite pendente para você.',
    invalidResponse: '❌ Resposta inválida. Use "sim" ou "não".',
    inviteRejected: '❌ Convite recusado. Jogo cancelado.',
    gameStarted: (s1, p1, s2, p2, board, current) => `🔴🟡 *CONNECT 4 - INICIADO!*\n\n👥 Jogadores:\n➤ ${s1}: @${p1}\n➤ ${s2}: @${p2}\n\n${board}\n💡 Vez de @${current}\n📝 Digite um número de 1 a 7 para escolher a coluna.`,
    noActiveGame: '❌ Nenhum jogo em andamento!',
    gameTimeout: '❌ Jogo encerrado por inatividade (5 minutos sem jogada).',
    notYourTurn: '❌ Não é sua vez!',
    invalidColumn: '❌ Coluna inválida! Use 1-7.',
    columnFull: '❌ Esta coluna está cheia!',
    unknownError: '❌ Erro desconhecido.',
    gameWon: (winner, board) => `🔴🟡 *CONNECT 4 - FIM*\n\n🎉 @${winner} venceu! 🏆\n\n${board}`,
    gameDraw: (board) => `🔴🟡 *CONNECT 4 - FIM*\n\n🤝 Empate!\n\n${board}`,
    gameContinue: (nextPlayer, board) => `🔴🟡 *CONNECT 4*\n\n👉 Vez de @${nextPlayer}\n\n${board}\n💡 Digite um número de 1 a 7.`,
    gameEndedManual: '🔴🟡 Jogo encerrado manualmente!'
  },
  uno: {
    alreadyExists: '❌ Já existe um jogo de UNO neste grupo!',
    created: (host, max, min) => `🃏 *UNO - JOGO CRIADO!*\n\n👑 Host: @${host}\n\n📝 Comandos:\n• "entrar" - Entrar no jogo\n• "sair" - Sair do jogo\n• "iniciar" - Iniciar (host)\n• "cancelar" - Cancelar (host)\n\n👥 Jogadores: 1/${max}\n⏳ Mínimo: ${min} jogadores`,
    noGame: '❌ Nenhum jogo de UNO neste grupo!',
    gameStartedError: '❌ O jogo já começou!',
    gameFull: '❌ O jogo está cheio!',
    alreadyJoined: '❌ Você já está no jogo!',
    joined: (player, statusText) => `✅ @${player} entrou!\n\n${statusText}`,
    notInGame: '❌ Você não está no jogo!',
    hostCannotLeave: '❌ O host não pode sair antes de iniciar! Use "cancelar" para cancelar o jogo.',
    leftWoWinner: (left, winner) => `👋 @${left} abandonou o jogo!\n\n🎉 @${winner} VENCEU por W.O.! 🏆`,
    leftContinue: (left, statusText) => `👋 @${left} abandonou o jogo!\n\n${statusText}`,
    leftNoStart: (player) => `👋 @${player} saiu do jogo.`,
    notHostStart: '❌ Apenas o host pode iniciar o jogo!',
    notEnoughPlayers: (min) => `❌ Mínimo de ${min} jogadores necessários!`,
    notStarted: '❌ O jogo ainda não começou!',
    started: (firstCard, statusText) => `🃏 *UNO - JOGO INICIADO!*\n\n🎴 Primeira carta: ${firstCard}\n\n${statusText}\n\n📝 Comandos:\n• "jogar <n>" - Jogar carta\n• "jogar <n> <cor>" - Jogar coringa\n• "comprar" - Comprar carta\n• "uno" - Gritar UNO!\n• "mão" - Ver suas cartas (privado)`,
    notYourTurn: '❌ Não é sua vez!',
    invalidCard: '❌ Carta inválida! Use o número da carta.',
    cannotPlayCard: '❌ Você não pode jogar essa carta!',
    chooseColor: '❌ Escolha uma cor! Ex: jogar 3 azul',
    win: (winner, card) => `🃏 *UNO - FIM DE JOGO!*\n\n🎉 @${winner} VENCEU! 🏆\n\n🎴 Última carta: ${card}`,
    played: (player, card, msg, statusText) => `🎴 @${player} jogou ${card}\n${msg ? msg + '\n' : ''}\n${statusText}`,
    drawnMulti: (player, count, statusText) => `📥 @${player} comprou ${count} cartas!\n\n${statusText}`,
    drawnPlayable: (card, idx) => `📥 Você comprou ${card}\n✅ Pode jogar esta carta! Use "jogar ${idx}"`,
    drawnPass: (player, statusText) => `📥 @${player} comprou uma carta e passou a vez.\n\n${statusText}`,
    calledUno: (player) => `🎉 @${player} gritou *UNO!*`,
    noUnoToCall: '❌ Você não tem UNO para gritar!',
    caughtUno: (catcher, target) => `🚨 @${catcher} pegou @${target} sem gritar UNO!\n📥 @${target} comprou 2 cartas de penalidade!`,
    nobodyToCatch: '❌ Não há ninguém para pegar!',
    kickedWon: (kicked, timeouts, winner) => `⏰ @${kicked} foi expulso por inatividade (${timeouts} timeouts)!\n\n🎉 @${winner} VENCEU por W.O.! 🏆`,
    kickedContinue: (kicked, timeouts, statusText) => `⏰ @${kicked} foi expulso por inatividade (${timeouts} timeouts)!\n\n${statusText}`,
    timeoutWarn: (player, timeouts, max, statusText) => `⏰ @${player} demorou demais!\n📥 Comprou 1 carta e perdeu a vez (${timeouts}/${max} avisos)\n\n${statusText}`,
    notHostCancel: '❌ Apenas o host ou admins podem cancelar o jogo!',
    cancelled: '🃏 Jogo de UNO cancelado!'
  },
  memoria: {
    alreadyExists: '❌ Já existe um jogo de memória em andamento neste chat!',
    created: (player, pairs, board) => `🧠 *JOGO DA MEMÓRIA*\n\n👤 Jogador: @${player}\n🎯 Encontre os ${pairs} pares!\n\n${board}\n📝 Digite o número da posição para revelar.\n💡 Exemplo: "1" ou "memoria 5"`,
    noGame: '❌ Nenhum jogo em andamento!',
    notYourGame: '❌ Este não é seu jogo!',
    gameFinished: '❌ O jogo já terminou!',
    invalidPosition: '❌ Posição inválida! Use 1-16.',
    alreadyRevealed: '❌ Esta carta já foi revelada!',
    firstCard: (pos, emoji, board, attempts, found, total) => `🧠 *JOGO DA MEMÓRIA*\n\n🎴 Posição ${pos}: ${emoji}\n👆 Escolha a segunda carta!\n\n${board}\n📊 Tentativas: ${attempts} | Pares: ${found}/${total}`,
    match: (emoji, board, attempts, found, total) => `🧠 *JOGO DA MEMÓRIA*\n\n✅ *PAR ENCONTRADO!* ${emoji}${emoji}\n\n${board}\n📊 Tentativas: ${attempts} | Pares: ${found}/${total}`,
    noMatch: (pos1, emoji1, pos2, emoji2, board, attempts, found, total) => `🧠 *JOGO DA MEMÓRIA*\n\n❌ Não é par!\n${pos1}: ${emoji1} ≠ ${pos2}: ${emoji2}\n\n${board}\n📊 Tentativas: ${attempts} | Pares: ${found}/${total}`,
    win: (player, board, attempts, timeStr, rankPos) => `🧠 *JOGO DA MEMÓRIA - VITÓRIA!*\n\n🎉 @${player} completou o jogo!\n\n${board}\n📊 *Estatísticas:*\n• Tentativas: ${attempts}\n• Tempo: ${timeStr}\n• Ranking: #${rankPos}\n\n${attempts <= 12 ? '🏆 *CONQUISTA DESBLOQUEADA: Memória de Elefante!*' : ''}`,
    notAdminOrPlayerCancel: '❌ Apenas o jogador ou admins podem encerrar!',
    cancelled: '🧠 Jogo da memória encerrado!',
    rankingEmpty: '🧠 *RANKING - JOGO DA MEMÓRIA*\n\nNenhum recorde ainda!',
    rankingHeader: '🧠 *RANKING - JOGO DA MEMÓRIA*\n\n',
    rankingRow: (medal, player, attempts, timeStr) => `${medal} @${player} - ${attempts} tentativas (${timeStr})\n`
  }
};
