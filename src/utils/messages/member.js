export const memberMessages = {
  afk: {
    success: (reason) => `😴 Você está AFK.${reason ? `\nMotivo: ${reason}` : ''}`,
    error: "Ocorreu um erro ao definir AFK 💔"
  },
  anagrama: {
    win: (word, points) => `🎉 *ACERTOU!*\n📝 Palavra: *${word}*\n🏆 Pontos: +${points}`,
    gameOver: (word) => `😢 *GAME OVER!* A palavra era *${word}*.`,
    wrong: (scrambled, hint, attempts) => `💔 Errado! ${scrambled}\n💡 Dica: ${hint}\n📊 Tentativas: ${attempts}/5`,
    status: (scrambled, hint) => `🔀 *ANAGRAMA*\n📝 Embaralhada: *${scrambled}*\n💡 Dica: ${hint}`,
    start: (scrambled, hint) => `🔀 *ANAGRAMA*\n📝 Descubra: *${scrambled}*\n💡 Dica: ${hint}`
  },
  audioeffects: {
    processing: '🎵 Processando áudio... Por favor, aguarde alguns segundos.',
    missingAudio: " Para aplicar este efeito de áudio, responda a uma mensagem que contenha um áudio."
  },
  bot_info: {
    groupData: (name, participantsCount, owner, desc) => `🏢 *DADOS DO GRUPO*\n\n📌 *Nome:* ${name}\n👥 *Membros:* ${participantsCount}\n👑 *Criador:* @${owner}\n📝 *Descrição:* ${desc}`,
    serverInfo: (data) => `🌸 ═════════════════════ 🌸\n    *INFORMAÇÕES DO SERVIDOR*\n🌸 ═════════════════════ 🌸\n\n` +
      `🖥️ *Sistema Operacional:* 🏠\n` +
      `├ 🟢 Node.js: ${data.nodeVersion}\n├ 💻 Plataforma: ${data.platform}\n├ 🏗️ Arquitetura: ${data.arch}\n` +
      `├ 🔧 Tipo: ${data.type}\n├ 📋 Release: ${data.release}\n├ 🏷️ Hostname: ${data.hostname}\n` +
      `├ 🔄 Endianness: ${data.endianness}\n├ ⏳ Sistema online há: ${data.osUptime} horas\n└ 📅 Hora atual: ${data.currentServerTime}\n\n` +
      `⚡ *Processador (CPU):* 🧠\n` +
      `├ 🔢 Núcleos: ${data.serverCpuCount}\n├ 🏷️ Modelo: ${data.serverCpuModel}\n├ 👤 Tempo usuário: ${data.serverCpuUser}s\n` +
      `├ ⚙️ Tempo sistema: ${data.serverCpuSystem}s\n├ 📈 Uso CPU atual: ${data.cpuPercent}%\n├ 📊 Load 1min: ${data.serverLoadAvg0}\n` +
      `├ 📈 Load 5min: ${data.serverLoadAvg1}\n└ 📉 Load 15min: ${data.serverLoadAvg2}\n\n` +
      `💾 *Memória do Sistema:* 🧠\n` +
      `├ 🆓 RAM Livre: ${data.serverFreeMemory} GB\n├ 📊 RAM Total: ${data.serverTotalMemory} GB\n├ 📈 RAM Usada: ${data.usedMemGb} GB\n` +
      `└ ⚠️ Uso: [${data.memProgressBar}] ${data.memPercent}%\n\n` +
      `🤖 *Memória da ${data.botNameCap}:* 💖\n` +
      `├ 🧠 Heap Usado: ${data.serverMemUsed} MB\n├ 📦 Heap Total: ${data.serverMemTotal} MB\n├ 🏠 RSS: ${data.serverMemRss} MB\n` +
      `├ 🔗 Externo: ${data.serverMemExternal} MB\n└ ⚠️ Eficiência: [${data.heapProgressBar}] ${data.heapPercent}%\n\n` +
      `🌐 *Rede e Conectividade:* 🔗\n` +
      `├ 🔌 Interfaces: ${data.serverInterfaces}\n${data.networkDetails}├ 📡 Status: Online\n├ ⏱️ Latência de Rede: ${data.networkLatency}\n` +
      `└ 🛡️ Firewall: Ativo\n\n` +
      `💽 *Armazenamento:* 💿\n` +
      `├ 🆓 Livre: ${data.diskFree} GB\n├ 📊 Total: ${data.diskTotal} GB\n├ 📈 Usado: ${data.diskUsed} GB\n` +
      `└ ✅ Uso: [${data.diskProgressBar}] ${data.diskUsagePercent}\n\n` +
      `⏰ *Tempo e Latência:* 🕐\n` +
      `├ ⏱️ Latência do Bot: ${data.latency}ms\n└ 🚀 Bot online há: ${data.serverUptimeFormatted}`,
    botStatus: (data) => "╭───🤖 STATUS DO BOT ───╮\n" +
      `┊ 🏷️ Nome: ${data.nomebot}\n┊ 👨‍💻 Dono: ${data.nomedono}\n┊ 🆚 Versão: ${data.botVersion}\n` +
      `┊ 🟢 Status: ${data.botStatus}\n┊ ⏰ Online há: ${data.botUptime}\n┊ 🖥️ Plataforma: ${data.platform}\n` +
      `┊ 🟢 Node.js: ${data.nodeV}\n┊\n┊ 📊 *Estatísticas:*\n` +
      `┊ • 👥 Grupos: ${data.totalGroups}\n┊ • 👤 Usuários: ${data.totalUsers}\n┊ • ⚒️ Comandos: ${data.totalCmds}\n` +
      `┊ • 💎 Users Premium: ${data.premiumUsers}\n┊ • 💎 Grupos Premium: ${data.premiumGroups}\n┊\n` +
      `┊ 🛡️ *Segurança:*\n` +
      `┊ • 🚫 Users Bloqueados: ${data.blockedUsersCount}\n┊ • 🚫 Cmds Bloqueados: ${data.blockedCommandsCount}\n` +
      `┊ • 🏠 Modo Aluguel: ${data.rentalMode}\n┊\n┊ 💾 *Sistema:*\n` +
      `┊ • 🧠 RAM Usada: ${data.memUsed}MB\n┊ • 📦 RAM Total: ${data.memTotal}MB\n┊ • 🕐 Hora Atual: ${data.currentTime}\n` +
      "╰───────────────╯"
  },
  cacapalavras: {
    notFound: (word) => `❌ "${word}" não está na lista!`,
    alreadyFound: '⚠️ Já encontrou!',
    win: (time) => `🎉 *VITÓRIA!* Todas encontradas em ${time}s!`,
    found: (word, count, total) => `✅ Encontrou "${word}"! (${count}/${total})`,
    status: (count, total, grid) => `🔍 *CAÇA PALAVRAS*\nProgresso: ${count}/${total}\n\`\`\`${grid}\`\`\``,
    start: (dif, grid, total) => `🔍 *CAÇA PALAVRAS* (${dif})\n\`\`\`${grid}\`\`\`\nEncontre ${total} palavras!`
  },
  calculadora: {
    menu: (prefix) => `🧮 *Calculadora Científica*\n\n${prefix}calc <expressão> - Calcula expressão\n${prefix}calc converter <valor> <de> <para>\n\n*Operadores:* + - * / ^ % !\n*Funções:* sin, cos, tan, sqrt, log, abs, ceil, floor\n*Constantes:* pi, e, phi\n\n*Exemplos:*\n${prefix}calc 2+2*3\n${prefix}calc sqrt(144)\n${prefix}calc sin(45)\n${prefix}calc 5!\n${prefix}calc converter 100 km mi`,
    invalidFormat: (prefix) => `💔 Formato inválido.\nUso correto: ${prefix}calc converter 100 km mi`,
    unsupportedConversion: `💔 Conversão não suportada. Tente: km<>mi, c<>f, m<>cm, kg<>lb`,
    conversionResult: (valor, de, resultado, para) => `🔄 *Conversão*\n\n${valor} ${de} = ${resultado.toFixed(2)} ${para}`,
    calcResult: (q, res) => `🧮 *Calculadora*\n\nExpressão: ${q}\nResultado: *${res}*`,
    invalidMath: `💔 Expressão matemática inválida.`
  },
  casal: {
    groupOnlyError: "╭━━━⊱ 💔 *ERRO* 💔 ⊱━━━╮\n│\n│ ❌ Este comando só funciona\n│    em grupos!\n│\n╰━━━━━━━━━━━━━━━━━━━━╯",
    gameModeDisabled: `💔 O modo brincadeira não está ativo nesse grupo.`,
    notEnoughMembers: `💔 Preciso de pelo menos 2 membros no grupo!`,
    result: (comment, user1, user2, shipLevel, chance, statusShip, conclusion) => `╭━━━⊱ 💘 *CASAL* 💘 ⊱━━━╮\n│\n│ 💫 *${comment}*\n│\n│ 👑 *CASAL DO MOMENTO*\n│ @${user1} ❤️ @${user2}\n│\n│ 📊 *Estatísticas*\n│ └─ 💖 Ship: *${shipLevel}%*\n│ └─ 🎯 Chance: *${chance}%*\n│\n│ ${statusShip}\n│\n│ ${conclusion}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`
  },
  clima: {
    menu: (prefix) => `🌤️ *Previsão do Tempo*\n\n💡 *Como usar:*\n• ${prefix}clima <cidade>\n\n📌 *Exemplos:*\n• ${prefix}clima São Paulo\n• ${prefix}clima Rio de Janeiro\n• ${prefix}clima Tokyo`,
    consulting: '🌤️ Consultando previsão do tempo... ⏳',
    result: (weatherEmoji, cityName, region, country, tempC, feelsLike, humidity, windKmph, windDir, uvIndex, visibility, cloudcover, descPt, forecast) => `${weatherEmoji} *Clima em ${cityName}*\n📍 ${region}, ${country}\n\n🌡️ *Temperatura:* ${tempC}°C\n🤒 *Sensação:* ${feelsLike}°C\n💧 *Umidade:* ${humidity}%\n💨 *Vento:* ${windKmph} km/h (${windDir})\n☀️ *Índice UV:* ${uvIndex}\n👁️ *Visibilidade:* ${visibility} km\n☁️ *Nuvens:* ${cloudcover}%\n\n📋 *Condição:* ${descPt}${forecast}`,
    error: `💔 Não consegui encontrar informações do clima para essa cidade. Verifique o nome e tente novamente!`
  },
  dicionario: {
    missingWord: (prefix, command) => `📔 Qual palavra você quer procurar no dicionário? Me diga após o comando ${prefix}${command}! 😊`,
    searching: "📔 Procurando no dicionário... Aguarde um pouquinho! ⏳",
    notFound: `💔 Palavra não encontrada. Verifique a ortografia e tente novamente.`
  },
  dono: {
    info: (nome, numero) => `╔═══ ⚡ *DONO DO BOT* ⚡ ═════\n║\n║ 👤 *Nome:* ${nome}\n║ 📞 *Contato:* wa.me/${numero}\n║\n╚══════════════════════════`
  },
  download: {
    largeFile: '📦 Arquivo muito grande, enviando como documento...',
    youtubeMenu: (prefix, command) => `╭━━━⊱ 🎵 *YOUTUBE MP3* 🎵 ⊱━━━╮\n│\n│ 📝 Digite o nome da música ou\n│     um link do YouTube\n│\n│  *Exemplos:*\n│  ${prefix + command} Back to Black\n│  ${prefix + command} https://youtube.com/...\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
    youtubeWaitLink: 'Aguarde um momentinho... ☀️',
    youtubeSearch: (q) => `🔍 *Pesquisando no YouTube...*\n\n🎵 Música: *${q}*\n\n⏳ Aguarde um momento...`,
    youtubeVideoTooLong: (timestamp) => `⚠️ Este vídeo é muito longo (${timestamp}).\nPor favor, escolha um vídeo com menos de 30 minutos.`,
    youtubeFound: (title, author, timestamp, seconds, views, url) => `🎵 *Música Encontrada* 🎵\n\n📌 *Título:* ${title}\n👤 *Artista/Canal:* ${author}\n⏱ *Duração:* ${timestamp} (${seconds} segundos)\n👀 *Visualizações:* ${views}\n🔗 *Link:* ${url}\n\n🎧 *Baixando e processando sua música, aguarde...*`,
    youtubeVideoMenu: (prefix, cmd) => `🎥 Envie o nome ou link do vídeo do YouTube!\n\nExemplo: ${prefix}${cmd} Linkin Park Numb`,
    youtubeVideoSearch: (q) => `🔍 Pesquisando vídeo: *${q}*...`,
    youtubeVideoNotFound: `💔 Vídeo não encontrado.`,
    youtubeVideoWait: '⏳ Baixando vídeo... Isso pode levar um momento.',
    youtubeVideoFail: '💔 Não foi possível baixar o vídeo. Tente novamente mais tarde.',
    youtubeVideoCaption: (title, quality, source) => `✨ *${title || 'Vídeo baixado'}*\n\n📺 Qualidade: ${quality || '360p'}\n🔗 Fonte: ${source || 'Auto'}`,
    youtubeVideoFatalError: '💔 Ocorreu um erro ao processar seu vídeo.',
    spotifyMenu: (prefix, cmd) => `🎵 Envie o nome da música ou link do Spotify!\n\nExemplo: ${prefix}${cmd} Imagine Dragons Believer`,
    spotifyProcessing: '🎵 Processando solicitação do Spotify...',
    soundcloudMenu: (prefix, cmd) => `🎵 Envie o nome ou link do SoundCloud!\n\nExemplo: ${prefix}${cmd} https://soundcloud.com/...`,
    soundcloudDownloading: '☁️ Baixando do SoundCloud...',
    tiktokMenu: `📱 Envie o link do TikTok ou o que deseja pesquisar!`,
    tiktokDownloading: '⏳ Baixando do TikTok...',
    tiktokAudioNotFound: `💔 Áudio não encontrado no TikTok.`,
    tiktokMediaNotFound: `💔 Mídia não encontrada no TikTok.`,
    tiktokSearching: (q) => `🔍 Pesquisando TikToks: *${q}*...`,
    tiktokSearchNoResults: `💔 Nenhum resultado encontrado.`,
    tiktokCaption: (title) => `✨ TikTok: *${title || ''}*`,
    tiktokSearchCaption: (title) => `✨ *${title || ''}*`,
    instagramMenu: `📸 Envie um link vindo do Instagram!`,
    instagramDownloading: '⏳ Baixando do Instagram...',
    instagramFail: `💔 Não foi possível baixar. Verifique se o link é público.`,
    facebookMenu: `👥 Envie um link do Facebook!`,
    facebookDownloading: '⏳ Baixando do Facebook...',
    facebookCaption: (resolution) => `✨ Vídeo do Facebook (${resolution || 'HD'})`,
    twitterMenu: `🐦 Envie o link do tweet!`,
    twitterFetching: '🐦 Buscando informações do tweet...',
    twitterError: (msg) => `💔 ${msg || 'Erro'}`,
    twitterCaption: (author, text) => `🐦 *Twitter/X Download*\n\n👤 *${author || 'Usuário'}*\n\n📝 ${text || ''}`,
    twitterNoMedia: (caption) => `${caption}\n\n⚠️ Sem mídia.`,
    gdriveMenu: `📂 Envie o link do Google Drive!`,
    mediafireMenu: `📂 Envie o link do Mediafire!`,
    lyricsMenu: `🎵 Qual música?`,
    lyricsUnavailable: '💔 Sistema de letras indisponível no momento.',
    lyricsSearching: (q) => `🔍 Procurando letra de *${q}*...`,
    lyricsNotFound: `💔 Letra não encontrada.`,
    mcpluginMenu: (prefix, cmd) => '🔍 Cadê o nome do plugin para eu pesquisar? 🤔\n\nExemplo: ' + prefix + cmd + ' WorldEdit',
    mcpluginUnavailable: '💔 Sistema de plugins indisponível no momento.',
    mcpluginSearching: '🔍 Buscando plugin...',
    mcpluginCaption: (name, creator, desc, url) => `🔍 Encontrei esse plugin aqui:\n\n*Nome*: _${name}_\n*Publicado por*: _${creator}_\n*Descrição*: _${desc}_\n*Link para download*: _${url}_\n\n> 💖 `,
    kwaiMenu: `📱 Envie o link do Kwai!`,
    kwaiCaption: (title) => `✨ Kwai Video: ${title || ''}`,
    sourceCodeDownloading: '📦 Baixando código-fonte...',
    sourceCodeCaption: `📂 *Código-fonte*`
  },
  encurtalink: {
    missingLink: (prefix, command) => `❌️ *Forma incorreta, use está como exemplo:* ${prefix + command} https://instagram.com/hiudyyy_`,
    success: (shortUrl, longUrl) => `✅ *Link encurtado com sucesso!*\n\n🔗 *Link curto:* ${shortUrl}\n📎 *Link original:* ${longUrl}`
  },
  eununca: {
    pollTitle: (question) => `💭 EU NUNCA, EU JÁ 🌱\n\n${question}`,
    options: [
      `💔 Eu nunca`,
      "✅ Eu já",
      "🤐 Prefiro não responder"
    ]
  },
  forca: {
    surrender: (palavra) => `🏳️ Vocês desistiram!\n\nA palavra era: *${palavra.toUpperCase()}*`,
    hint: (desenho, progresso, dica, letrasErradas, erros, prefix) => `${desenho}\n\n🎯 *FORCA*\n\n📝 ${progresso}\n\n💡 *Dica:* ${dica}\n❌ Letras erradas: ${letrasErradas || 'Nenhuma'}\n⚠️ Erros: ${erros}/6\n\n💬 Chute com: ${prefix}forca [letra]\n🔤 Ou chute a palavra: ${prefix}forca [palavra]`,
    correctWord: (palavra) => `🎉 *PARABÉNS!*\n\n✅ Você acertou a palavra!\n\n🏆 A palavra era: *${palavra.toUpperCase()}*`,
    gameOverWord: (desenho, palavra) => `${desenho}\n\n💀 *GAME OVER!*\n\n❌ A palavra era: *${palavra.toUpperCase()}*`,
    wrongWord: (desenho, progresso, letrasErradas, erros) => `${desenho}\n\n❌ Palavra errada! (+2 erros)\n\n📝 ${progresso}\n\n❌ Letras erradas: ${letrasErradas || 'Nenhuma'}\n⚠️ Erros: ${erros}/6`,
    alreadyGuessed: (letra) => `⚠️ Você já chutou a letra "${letra.toUpperCase()}"!`,
    correctLetterWin: (progresso, palavra) => `🎉 *PARABÉNS!*\n\n📝 ${progresso}\n\n✅ Vocês descobriram a palavra!\n🏆 *${palavra.toUpperCase()}*`,
    correctLetter: (desenho, letra, progresso, erros) => `${desenho}\n\n✅ Letra "${letra.toUpperCase()}" correta!\n\n📝 ${progresso}\n\n⚠️ Erros: ${erros}/6`,
    gameOverLetter: (desenho, palavra) => `${desenho}\n\n💀 *GAME OVER!*\n\n❌ A palavra era: *${palavra.toUpperCase()}*`,
    wrongLetter: (desenho, letra, progresso, letrasErradas, erros) => `${desenho}\n\n❌ Letra "${letra.toUpperCase()}" errada!\n\n📝 ${progresso}\n\n❌ Letras erradas: ${letrasErradas}\n⚠️ Erros: ${erros}/6`,
    gameStatus: (desenho, progresso, prefix) => `${desenho}\n\n🎯 *FORCA*\n\n📝 ${progresso}\n\n💡 Ver dica: ${prefix}forca dica\n🏳️ Desistir: ${prefix}forca desistir`,
    newGame: (desenho, progresso, prefix) => `${desenho}\n\n🎯 *FORCA - Novo Jogo!*\n\n📝 ${progresso}\n\n💬 Chute uma letra: ${prefix}forca [letra]\n💡 Ver dica: ${prefix}forca dica`
  },
  freefire: {
    missingUid: (prefix) => `Use: ${prefix}likeff <uid>`,
    unavailable: 'Servico de Free Fire indisponivel.',
    sendingLikes: 'Enviando likes no Free Fire...',
    likesSuccess: (player, uid, initialLikes, finalLikes, likesAdded) => `Likes enviados com sucesso!\n\nJogador: ${player || 'N/A'}\nUID: ${uid}\nLikes antes: ${initialLikes ?? 'N/A'}\nLikes depois: ${finalLikes ?? 'N/A'}\nAdicionados: ${likesAdded ?? 'N/A'}`
  },
  fun: {
    chaveamentoMissingNames: (prefix, command) => `💔 Forneça exatamente 16 nomes! Exemplo: ${prefix}${command} nome1,nome2,...,nome16`,
    chaveamentoInvalidCount: (count) => `💔 Forneça exatamente 16 nomes! Você forneceu ${count}.`,
    sorteionumUsage: (prefix, command) => `💡 Uso: ${prefix}${command} 1-50`,
    sorteionumInvalid: `💔 Intervalo inválido!`,
    sorteionumResult: (num) => `🎲 *Sorteio:* *${num}*`,
    niverMenu: (prefix, command) => `🎂 *Sistema de Aniversários*\n\n📅 Use: ${prefix}${command} DD/MM\n👥 Use: ${prefix}${command} lista\n✨ O bot parabeniza automaticamente os aniversariantes do dia!`,
    niverEmpty: "📭 Nenhum aniversário registrado neste grupo.",
    niverInvalidFormat: `💔 Formato inválido! Use DD/MM (ex: 25/12).`,
    niverSuccess: (sender, q) => `✅ @${sender}, seu aniversário foi registrado para o dia ${q}! 🥳`,
    chanceMissingText: (prefix) => `🎲 Me conta algo para eu calcular as chances! 📊\n\n📝 *Exemplo:* ${prefix}chance chover pizza hoje`,
    chanceResult: (comment, q, chance, evalText) => `🎯 *${comment}*\n\n🎯 A chance de "${q}" acontecer é: *${chance}%*!\n\n${evalText}`,
    quandoMissingText: (prefix) => `🔮 Me conta o que você quer que eu preveja! 🌠\n\n📝 *Exemplo:* ${prefix}quando vou ficar rico`,
    quandoResult: (q, time, evalText) => `🔮 Minha visão revela que...\n\n  ️ "${q}" vai acontecer: *${time}*!\n\n${evalText}`,
    snMissingText: (prefix) => `🎱 Faça uma pergunta para o oráculo! 🔮\n\n📝 *Exemplo:* ${prefix}sn Vou ganhar na loteria?`,
    snResult: (q, isPos, resp, conf, evalText) => `  **ORÁCULO RESPONDE** 🎱\n\n🤔 *Pergunta:* "${q}"\n\n${isPos ? '🎆' : '💔'} **Resposta:** *${resp}*\n\n📊 *Confiança:* ${conf}%\n\n${evalText}`,
    sorteStatus: (name, level, status) => `🍀 *TESTE DE SORTE* 🍀\n\n👤 *Usuário:* ${name}\n📊 *Nível de Sorte:* ${level}%\n\n📝 *Status:* ${status}\n\n${level >= 50 ? '🚀 Aproveite o dia, a sorte está com você!' : '⚠️ Melhor ter cuidado hoje!'}`
  },
  games: {
    tttUnavailable: "Sistema de Jogo da Velha indisponível.",
    c4Unavailable: "Sistema Connect4 indisponível.",
    unoUnavailable: "Sistema UNO indisponível.",
    unoHelp: (prefix) => `🎴 *UNO - Comandos*\n\n${prefix}uno criar\n${prefix}uno entrar\n${prefix}uno iniciar\n${prefix}uno jogar <n°>\n${prefix}uno comprar\n${prefix}uno mao (PV)\n${prefix}uno status\n${prefix}uno cancelar\n${prefix}uno sair`,
    unoSpecifyCard: "Especifique a carta!",
    unoHand: (hand) => `🎴 *Sua mão:*\n${hand}`,
    unoHandCurrent: (hand) => `🎴 *Sua mão atual:*\n\n${hand}`,
    unoHandSent: '✅ Mão enviada no PV!',
    unoHandFail: `💔 Não consegui enviar no PV.`,
    unoNotInGame: `💔 Você não está no jogo!`,
    unoInitialHand: (hand) => `🎴 *Sua mão inicial:*\n${hand}`,
    memoryUnavailable: "Sistema de Memória indisponível.",
    memoryInProgress: (prefix) => `🎮 Jogo em andamento! Use um número de 1-16 para revelar uma carta.\nOu ${prefix}memoria sair para desistir.`,
    memoryNotInGame: "❌ Nenhum jogo em andamento!"
  },
  google: {
    missingQuery: (prefix, command) => `🔍 *Pesquisa Web*\n\n❌ Digite o que deseja pesquisar.\n\n📝 *Uso:* ${prefix}${command} <termo>\n\n📌 *Exemplo:*\n${prefix}${command} inteligência artificial`,
    searching: '🔍 Pesquisando...',
    notFound: `💔 Nenhum resultado encontrado.`,
    resultsHeader: (query) => `🔍 *Resultados para:* "${query}"\n\n`
  },
  hora: {
    currentTime: (hora, data, prefix) => `🕐 *Horário Atual*\n\n🇧🇷 *Brasil (Brasília):*\n⏰ ${hora}\n📅 ${data}\n\n💡 *Ver outro fuso:*\n${prefix}hora <local>\n\n📍 *Locais disponíveis:*\nbrasil, eua, japao, china, coreia, londres, paris, portugal, dubai, australia, argentina...`,
    invalidTimezone: (local) => `💔 Fuso horário "${local}" não encontrado!\n\n📍 *Locais disponíveis:*\nbrasil, eua, newyork, losangeles, japao, china, coreia, londres, paris, alemanha, portugal, russia, dubai, india, australia, argentina`,
    timeResult: (local, hora, data, diff) => `🕐 *Horário em ${local}*\n\n⏰ *Hora:* ${hora}\n📅 *Data:* ${data}\n\n🇧🇷 *Diferença do Brasil:* ${diff}`
  },
  horarios: {
    header: (currentHour, currentMinute, dateStr) => `🎰✨ *HORÁRIOS PAGANTES* ✨🎰\n\n┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n┃  ⏰ *Horário (BR):* ${currentHour}:${currentMinute}  ┃\n┃  📅 *Data:* ${dateStr}     ┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`,
    gameItem: (emoji, name, timesStr) => `╭─────────────────────────╮\n│ ${emoji} *${name}*\n│ 🕐 ${timesStr}\n╰─────────────────────────╯\n\n`,
    footer: () => `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n┃      ⚠️ *IMPORTANTE* ⚠️      ┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n🔞 *Conteúdo para maiores de 18 anos*\n📊 Estes são horários estimados\n🎯 Jogue com responsabilidade\n💰 Nunca aposte mais do que pode perder\n🆘 Procure ajuda se tiver vício em jogos\n⚖️ Apostas podem causar dependência\n\n┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n┃  🍀 *BOA SORTE E JOGUE*    ┃\n┃     *CONSCIENTEMENTE!* 🍀  ┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━┛`
  },
  indications: {
    addSuccess: (name, count) => `✅ Indicação adicionada para @${name}! Total: ${count}`,
    empty: "📭 Nenhuma indicação registrada.",
    rankingHeader: `🏆 *RANKING DE INDICAÇÕES*\n\n`,
    userNotFound: "Usuário não encontrado.",
    removeSuccess: "✅ Indicação removida."
  },
  interacao: {
    defaultAction: (command, name) => `Você acabou de dar um(a) ${command} no(a) @${name}`
  },
  lembrete: {
    usageAdd: (prefix) => `📅 *Como usar o comando lembrete:*\n\n💡 *Exemplos:*\n• ${prefix}lembrete em 30m beber água\n• ${prefix}lembrete 15/09 18:30 reunião\n• ${prefix}lembrete amanhã 08:00 acordar`,
    invalidDate: "💔 Não consegui entender a data/hora. Exemplos:\n- em 10m tomar remédio\n- 25/12 09:00 ligar para a família\n- hoje 21:15 estudar",
    tooSoon: "⏳ Escolha um horário pelo menos 10 segundos à frente.",
    addSuccess: (date, msg) => `✅ Lembrete agendado para ${date}.\n📝 Mensagem: ${msg}`,
    emptyList: "📭 Você não tem lembretes pendentes.",
    listHeader: "🗓️ Seus lembretes pendentes:\n\n",
    usageRemove: (prefix) => `🗑️ *Uso do comando apagalembrete:*\n\n📝 *Formato:* ${prefix}apagalembrete <id|tudo>\n\n💡 *Exemplos:*\n• ${prefix}apagalembrete 123456\n• ${prefix}apagalembrete tudo`,
    removedAll: (count) => `🗑️ Removidos ${count} lembrete(s) pendente(s).`,
    notFound: "💔 Lembrete não encontrado ou já enviado. Dica: use o ID mostrado em \"meuslembretes\".",
    removeSuccess: (msg) => `🗑️ Lembrete removido: ${msg}`
  },
  leveling: {
    toggled: (enabled) => `🎚️ Sistema de leveling ${enabled ? 'ativado' : 'desativado'}!`,
    status: (pushname, level, patent, xp, nextXp, bar, progress, messages) => `╭━━━⊱ 📊 *STATUS DE NÍVEL* ⊱━━━╮\n│ 👤 *Jogador:* ${pushname}\n│ 🏅 *Nível:* ${level}\n│ 🎖️ *Patente:* ${patent}\n│ ✨ *XP:* ${xp} / ${nextXp}\n│ 📈 [${bar}] ${progress}%\n│ 💬 *Msgs:* ${messages}\n╰━━━━━━━━━━━━━━━━━━━━╯`,
    emptyRank: "Vazio.",
    rankHeader: `🏆 *TOP 10 NÍVEL*\n\n`,
    requireNumber: "Informe um número.",
    updated: (name) => `✅ @${name} atualizado!`
  },
  media_editing: {
    audioDisabled: "💔 Sistema de edição de áudio temporariamente indisponível.",
    requireAudio: "💔 Responda a um áudio para usar este comando!",
    requireVideo: "💔 Responda a um vídeo para cortar!",
    cutAudioUsage: (prefix, cmd) => `💔 Informe início e fim!\n\nUso: ${prefix}${cmd} <inicio> <fim>\nExemplo: ${prefix}${cmd} 0:10 0:30`,
    cutVideoUsage: (prefix, cmd) => `💔 Informe início e fim!\n\nUso: ${prefix}${cmd} <inicio> <fim>\nExemplo: ${prefix}${cmd} 0:10 0:30`,
    speedUsage: (prefix, cmd) => `💔 Velocidade inválida!\n\nUso: ${prefix}${cmd} <0.5-3.0>\nExemplo: ${prefix}${cmd} 1.5`,
    bassUsage: (prefix, cmd) => `💔 Nível de bass inválido!\n\nUso: ${prefix}${cmd} <1-20>\nExemplo: ${prefix}${cmd} 15`,
    cuttingVideo: "🎬 Cortando vídeo... Por favor, aguarde alguns segundos."
  },
  naval: {
    groupOnly: "🚢 Este jogo só funciona em grupos!",
    existingGame: "⚠️ Já existe um jogo ou desafio pendente neste grupo!",
    challenge: (challenger, challenged, prefix) => `🚢 *DESAFIO DE BATALHA NAVAL*\n\n@${challenger} desafiou @${challenged} para uma batalha naval!\n\n💡 O desafiado deve usar: ${prefix}batalhanaval aceitar (ou recusar)\n⏱️ O desafio expira em 60 segundos.`,
    noChallengeAccept: "💔 Não há desafio pendente para você aceitar!",
    challengeExpired: "⏰ O desafio expirou!",
    started: (challenger, challenged, prefix) => `🚢 *BATALHA NAVAL INICIADA!*\n\n@${challenger} vs @${challenged}\n\n🎯 É a vez de @${challenger} atirar!\n\n💡 Use: ${prefix}batalhanaval [coordenada]\n📌 Exemplo: ${prefix}batalhanaval A5`,
    noChallengeRefuse: "💔 Não há desafio pendente para você recusar!",
    refused: (user) => `🚫 @${user} recusou o desafio de Batalha Naval.`,
    gameOver: "💔 Jogo terminado!",
    notYourTurn: "⏳ Não é sua vez! Aguarde o oponente.",
    invalidCoord: (prefix) => `💔 Coordenada inválida! Use formato: A1, B5, J10\n\n💡 Exemplo: ${prefix}batalhanaval A5`,
    alreadyShot: "⚠️ Você já atirou nesta coordenada!",
    hit: "💥 *ACERTOU!*",
    miss: "❌ *ÁGUA!*",
    sunk: (nome) => `💥 *${nome.toUpperCase()} AFUNDADO!*`,
    victory: (v) => `🏆 *VITÓRIA!* @${v} afundou toda a frota!`,
    turnResult: (res, coord, afundadosText, atingidosCount, intactosCount, tabuleiro, turno) => `${res}\n\n🎯 Coordenada: ${coord}\n\n📋 *Frota inimiga:*\n💀 Afundados: ${afundadosText}\n🔥 Atingidos: ${atingidosCount}\n🌊 Intactos: ${intactosCount}\n\n📊 *Seu tabuleiro de tiros:*\n\`\`\`${tabuleiro}\`\`\`\n⏭️ Vez de @${turno}!`,
    status: (j1, j2, turno, afundadosText, atingidosText, intactosCount, tabuleiro, prefix) => `🚢 *BATALHA NAVAL*\n\n@${j1} vs @${j2}\n\n🎯 Turno: @${turno}\n\n📋 *Frota inimiga:*\n💀 Afundados: ${afundadosText}\n🔥 Atingidos: ${atingidosText}\n🌊 Intactos: ${intactosCount}\n\n📊 *Seu tabuleiro de tiros:*\n\`\`\`${tabuleiro}\`\`\`\n💡 Use: ${prefix}batalhanaval [coordenada]\n📌 Exemplo: ${prefix}batalhanaval A5`,
    usage: (prefix) => `🚢 *BATALHA NAVAL*\n\n💡 *Como jogar:*\n\n1️⃣ Desafie alguém:\n${prefix}batalhanaval @usuário\n\n2️⃣ O desafiado aceita ou recusa:\n${prefix}batalhanaval aceitar / recusar\n\n3️⃣ Atire em coordenadas:\n${prefix}batalhanaval A5\n\n🎯 Objetivo: Afundar todos os navios do oponente!\n\n📌 Coordenadas: A-J (colunas) e 1-10 (linhas)\n💥 = Acerto | ❌ = Água`
  },
  nick: {
    usage: (prefix) => `🎮 *GERADOR DE NICK*\n\n📝 *Como usar:*\n• Digite o nick após o comando\n• Ex: ${prefix}nick chainy`
  },
  noticias: {
    usage: (prefix, cmd) => `📰 *Pesquisa de Notícias*\n\n❌ Digite o que deseja pesquisar.\n\n📝 *Uso:* ${prefix}${cmd} <termo>\n\n📌 *Exemplo:*\n${prefix}${cmd} tecnologia brasil`,
    searching: "📰 Buscando notícias...",
    notFound: "💔 Nenhuma notícia encontrada.",
    header: (query) => `📰 *Notícias sobre:* "${query}"\n\n`
  },
  perfil: {
    text: (targetName, pushname, targetId, bio, bioSetAtStr, pacoteValue, randomHumor, emojis, levels, bars) => `*📋 Perfil completo de ${targetName} 📋*

👤 *Nome*: ${pushname}
📱 *Número*: ${targetId}
📜 *Bio*: ${bio}${bioSetAtStr}
💰 *Valor do Pacote*: ${pacoteValue} 🫦
😊 *Humor*: ${randomHumor}

🎭 *Níveis*:
  ${emojis.puta} ┃ Puta: ${levels.puta}% ${bars.puta}
  ${emojis.gado} ┃ Gado: ${levels.gado}% ${bars.gado}
  ${emojis.corno} ┃ Corno: ${levels.corno}% ${bars.corno}
  ${emojis.sortudo} ┃ Sorte: ${levels.sortudo}% ${bars.sortudo}
  ${emojis.carisma} ┃ Carisma: ${levels.carisma}% ${bars.carisma}
  ${emojis.rico} ┃ Rico: ${levels.rico}% ${bars.rico}
  ${emojis.gostosa} ┃ Gostosa: ${levels.gostosa}% ${bars.gostosa}
  ${emojis.feio} ┃ Feio: ${levels.feio}% ${bars.feio}`
  },
  pinterest: {
    unavailable: "⚠️ Módulo Pinterest indisponível no momento. Tente novamente em instantes.",
    usage: (prefix) => `Digite o termo para pesquisar no Pinterest. Exemplo: ${prefix}pinterest gatinhos /3`,
    downloading: "⏳ Baixando do Pinterest... Isso pode levar um momento.",
    searching: (searchTerm) => `🔍 Pesquisando no Pinterest por "*${searchTerm}*"...\n\n⏳ Aguarde um momento...`,
    downloadError: "Não foi possível baixar este link do Pinterest. 😕",
    searchError: "Nenhuma imagem encontrada para o termo pesquisado. 😕",
    downloadCaption: "📌 Download do Pinterest",
    searchCaption: (searchTerm) => `📌 Resultado da pesquisa por "${searchTerm}"`
  },
  ppt: {
    usage: (prefix) => `🎮 *Pedra, Papel ou Tesoura*\n\n💡 *Como jogar:*\n• Escolha sua jogada após o comando\n• Ex: ${prefix}ppt pedra\n• Ex: ${prefix}ppt papel\n• Ex: ${prefix}ppt tesoura\n\n🎲 Vamos ver quem ganha!`,
    invalidChoice: "Escolha inválida! Use: pedra, papel ou tesoura.",
    draw: "Empate! 🤝",
    win: "Você ganhou! 🎉",
    lose: "Eu ganhei! 😎",
    result: (usuarioEscolha, botEscolha, resultado) => `🖐️ *Pedra, Papel, Tesoura* 🖐️\n\nVocê: ${usuarioEscolha}\nEu: ${botEscolha}\n\n${resultado}`
  },
  qrcode: {
    usage: (prefix) => `📲 *Gerador de QR Code*\n\n💡 *Como usar:*\n• Envie o texto ou link após o comando\n• Ex: ${prefix}qrcode https://exemplo.com\n• Ex: ${prefix}qrcode Seu texto aqui\n\n✨ O QR Code será gerado instantaneamente!`,
    generating: "Aguarde um momentinho... ☀️",
    success: (qSnippet) => `📱✨ *Seu QR Code super fofo está pronto!*\n\nConteúdo: ${qSnippet}`
  },
  quiz: {
    groupOnly: "⚔️ Este jogo só funciona em grupos!",
    invalidNumQuestions: (prefix) => `💔 Número de perguntas inválido! Use entre 3 e 20 perguntas.\n\n💡 Exemplo: ${prefix}dueloquiz @usuário 10`,
    existingGame: "⚠️ Já existe um duelo ou desafio pendente neste grupo!",
    challenge: (challenger, challenged, numPerguntas, prefix) => `⚔️ *DESAFIO DE QUIZ*\n\n@${challenger} desafiou @${challenged} para um duelo de ${numPerguntas} perguntas!\n\n💡 O desafiado deve usar: ${prefix}dueloquiz aceitar\n⏱️ O desafio expira em 60 segundos.`,
    noChallengeAccept: "💔 Não há desafio pendente para você aceitar!",
    challengeExpired: "⏰ O desafio expirou!",
    duelStarted: (challenger, challenged, numPerguntas, cat, perguntaText, prefix) => `⚔️ *DUELO DE QUIZ INICIADO!*\n\n@${challenger} vs @${challenged}\n\n📊 ${numPerguntas} perguntas\n\n🎯 *Pergunta 1/${numPerguntas}*\n📂 Categoria: ${cat}\n\n❓ ${perguntaText}\n\n💡 É a vez de @${challenger} responder!\nUse: ${prefix}dueloquiz [resposta]`,
    duelFinished: "💔 Este duelo já terminou!",
    notYourTurn: "⏳ Não é sua vez! Aguarde o oponente.",
    duelResult: (j1, j2, acertos1, acertos2, total, resText) => `⚔️ *DUELO FINALIZADO!*\n\n📊 *Resultado:*\n@${j1}: ${acertos1}/${total} acertos\n@${j2}: ${acertos2}/${total} acertos\n\n${resText}`,
    duelTurnResult: (acertouText, current, total, cat, perguntaText, turno, prefix) => `${acertouText}\n\n🎯 *Pergunta ${current}/${total}*\n📂 Categoria: ${cat}\n\n❓ ${perguntaText}\n\n💡 É a vez de @${turno} responder!\nUse: ${prefix}dueloquiz [resposta]`,
    duelCorrect: "✅ *CORRETO!*",
    duelIncorrect: (correctAnswer) => `💔 *ERRADO!*\n✅ Resposta: ${correctAnswer}`,
    winner: (v) => `🏆 *VENCEDOR:* @${v}!`,
    draw: "🤝 *EMPATE!*",
    skipped: (resposta) => `⏭️ Pergunta pulada!\n\nA resposta era: *${resposta}*`,
    correct: (display, tempo, pontos) => `🎉 *CORRETO!*\n\n✅ Resposta: *${display}*\n⏱️ Tempo: ${tempo}s\n🏆 +${pontos} pontos`,
    incorrect: (display) => `💔 *ERRADO!*\n\n✅ A resposta correta era: *${display}*\n\nMais sorte na próxima!`,
    usage: (list) => `❓ *QUIZ - Teste seus conhecimentos!*\n\n📚 *Categorias disponíveis:*\n${list}\n\n💡 Responda rápido para ganhar mais pontos!`,
    invalidCategory: (categoria, categoriasDisponiveis) => `💔 Categoria "${categoria}" não encontrada!\n\n📚 Categorias disponíveis: ${categoriasDisponiveis.join(', ')}`,
    question: (categoria, p, prefix) => `❓ *QUIZ* (${categoria})\n\n${p}\n\n💡 Responda com: ${prefix}quiz [resposta]\n⏱️ Responda rápido para mais pontos!`
  },
  rates: {
    resultIndividual: (command, targetName, level) => `📊 ${targetName} tem *${level}%* de ${command}! 🔥`,
    notEnoughMembers: "💔 Membros insuficientes para formar um ranking.",
    rankHeader: (cleanedCommand) => `📊 *Ranking de ${cleanedCommand}*:\n\n`,
    rankItem: (i, name) => `🏅 *#${i + 1}* - @${name}\n`
  },
  regras: {
    noRules: "📜 Nenhuma regra definida para este grupo ainda.",
    header: (groupName) => `📜 *Regras do Grupo ${groupName}* 📜\n\n`
  },
  role: {
    noActiveRoles: "🪩 Nenhum rolê ativo no momento.",
    listHeader: "🪩 *Rolês ativos*",
    listFooter: (groupPrefix, goingEmoji, notGoingEmoji) => `🙋 Reaja com ${goingEmoji} ou use ${groupPrefix}role.vou CODIGO\n🤷 Reaja com ${notGoingEmoji} ou use ${groupPrefix}role.nvou CODIGO`,
    sentPv: "📬 Enviei a lista de rolês no seu privado!",
    errorSendList: "💔 Não consegui enviar a lista de rolês agora. Tente novamente mais tarde.",
    createFormat: (groupPrefix) => `📋 Formato esperado:\n${groupPrefix}role.criar CODIGO | Título/Descrição\n\n*Opcional:* CODIGO | Título | Data/Horário | Local | Observações`,
    missingCode: "💔 Informe um código alfanumérico para o rolê.",
    alreadyExists: "💔 Já existe um rolê cadastrado com esse código.",
    createSuccess: (code) => `✅ Rolê *${code}* cadastrado e divulgado!`,
    createWarn: (code, groupPrefix) => `⚠️ Rolê *${code}* salvo, mas não consegui enviar a divulgação automaticamente. Use ${groupPrefix}roles para compartilhar.`,
    alterFormat: (groupPrefix) => `📋 Formato esperado:\n${groupPrefix}role.alterar CODIGO | Novo título | Novo horário | Novo local | Nova descrição`,
    invalidCode: "💔 Informe um código válido para o rolê.",
    notFound: "💔 Não encontrei nenhum rolê com esse código.",
    missingUpdateFields: "ℹ️ Informe pelo menos um campo para atualização ou envie uma nova mídia.",
    updateSuccess: (code) => `✅ Rolê *${code}* atualizado.`,
    deleteFormat: (groupPrefix) => `📋 Informe o código do rolê. Exemplo: ${groupPrefix}role.excluir CODIGO`,
    deleteSuccess: (code) => `🗑️ Rolê *${code}* removido.`,
    vouFormat: (groupPrefix) => `📋 Informe o código do rolê. Exemplo: ${groupPrefix}role.vou CODIGO`,
    alreadyGoing: (title) => `🙋 Você já confirmou presença no rolê *${title}*.`,
    confirmSuccess: (title) => `✅ Presença confirmada no rolê *${title}*.`,
    nvouFormat: (groupPrefix) => `📋 Informe o código do rolê. Exemplo: ${groupPrefix}role.nvou CODIGO`,
    abandonSuccess: (title) => `🤷 Presença removida do rolê *${title}*.`,
    alreadyAbandoned: (title) => `🤷 Você já estava marcado como ausente para o rolê *${title}*.`,
    infoFormat: (groupPrefix) => `📋 Informe o código do rolê. Exemplo: ${groupPrefix}role CODIGO`
  },
  shipo: {
    missingMention: (prefix) => `╭━━━⊱ 💘 *SHIPO* 💘 ⊱━━━╮\n│\n│ ❌ Marque alguém para\n│    encontrar um par!\n│\n│ 💡 *Exemplo:*\n│ ${prefix}shipo @fulano\n│\n╰━━━━━━━━━━━━━━━━━━━━╯`,
    notEnoughMembers: "💔 Preciso de pelo menos 2 membros no grupo!",
    result: (comentario, userName1, userName2, nomeShip, shipLevel, chance, statusShip) => `╭━━━⊱ 💘 *SHIPO* 💘 ⊱━━━╮\n│\n│ 💫 *${comentario}*\n│\n│ 💝 *O PAR PERFEITO*\n│ @${userName1} ❤️ @${userName2}\n│\n│ 🏷️ *Nome do Ship:* ${nomeShip}\n│\n│ 📊 *Estatísticas*\n│ └─ 💖 Ship: *${shipLevel}%*\n│ └─ 🎯 Chance: *${chance}%*\n│\n│ ${statusShip}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`
  },
  sticker: {
    missingEmojis: "Cade os emojis? 💔",
    missingText: "Cade o texto? 💔",
    missingMedia: (command) => `Marque uma imagem ou um vídeo de até 9.9 segundos para fazer figurinha, com o comando: ${command} (mencionando a mídia)`,
    videoTooLong: "O vídeo precisa ter no máximo 9.9 segundos para ser convertido em figurinha.",
    missingQuotedStickerRename: "Você usou de forma errada... Marque uma figurinha.",
    invalidFormatRename: (prefix, command) => `Formato errado, utilize:\n${prefix}${command} Autor/Pack\nEx: ${prefix}${command} By:/Hiudy`,
    invalidFormatTake: (prefix, command) => `Formato errado, utilize:\n${prefix}${command} Autor/Pack\nEx: ${prefix}${command} By:/Hiudy`,
    takeSaveSuccess: (author, pack) => `Autor e pacote salvos com sucesso!\nAutor: ${author || "(vazio)"}\nPacote: ${pack}`,
    takeNoSaved: "Nenhum autor e pacote salvos. Use o comando *rgtake* primeiro.",
    takeMissingSaved: "Você não tem autor e pacote salvos. Use o comando *rgtake* primeiro.",
    packfigUsage: (prefix, isGroup) => `🎨 *Gerador de Figurinhas*\n\n🔢 *Como usar:*\n• Escolha quantas figurinhas deseja (1-15)\n• Ex: ${prefix}figurinhas 10\n• Ex: ${prefix}figurinhas 5\n\n✨ As figurinhas serão enviadas uma por uma!\n${isGroup ? '📬 *Nota:* Em grupos, as figurinhas serão enviadas no seu privado!' : ''}`,
    packfigInvalidAmount: "💔 Número inválido! Escolha entre 1 e 15 figurinhas.",
    packfigSending: (quantidade, isGroup) => isGroup ? `📬 Enviando ${quantidade} figurinha${quantidade > 1 ? 's' : ''} no seu privado...\n⏳ Aguarde um momento!` : `🎨 Enviando ${quantidade} figurinha${quantidade > 1 ? 's' : ''}...\n⏳ Aguarde um momento!`,
    packfigResult: (successCount, failCount) => `✅ Pronto!\n\n📊 *Resultado:*\n• Enviadas: ${successCount} figurinha${successCount !== 1 ? 's' : ''}\n${failCount > 0 ? `• Falhas: ${failCount}\n` : ''}`,
    attpMissingText: "Cadê o texto?",
    attpGenerating: "⏳ Gerando sticker animado... aguarde!"
  },
  stop: {
    start: (letra, categoriasStr, prefix) => `🛑 *STOP*\n🔤 *Letra:* ${letra}\n📋 *Categorias:*\n${categoriasStr}\n\n💡 Use: ${prefix}stop [categoria] [palavra]`,
    timeout: "⏰ *TEMPO ESGOTADO!* Jogo encerrado.",
    invalidCategory: "💔 Categoria inválida!",
    wrongLetter: (letra) => `💔 Deve começar com ${letra}!`,
    alreadyAnsweredCategory: (cat) => `⚠️ Já respondeu ${cat}!`,
    wordAlreadyUsed: "⚠️ Palavra já usada!",
    winner: (winner, tempo) => `🏆 *STOP!* @${winner} completou tudo!\n⏱️ Tempo: ${tempo}s`,
    accepted: (cat, palInput, comps, totalCats) => `✅ Aceito! ${cat}: ${palInput} (${comps}/${totalCats})`,
    status: (letra) => `🛑 *STOP*\n🔤 *Letra:* ${letra}\n📋 *Categorias:*\n`
  },
  suicidio: {
    adminProtect: "💔 Awn, admin, você é precioso demais para isso. Fica aqui com a gente, tá? <3",
    goodbye: (pushname) => `*É uma pena que tenha tomado essa decisão ${pushname}, vamos sentir saudades... 😕*`,
    joke: "*Ainda bem que morreu, não aguentava mais essa praga kkkkkk*"
  },
  suruba: {
    missingAmount: "Eita, coloque o número de pessoas após o comando.",
    amountTooHigh: "Coloque um número menor, ou seja, abaixo de *15*.",
    phrases: [
      (q) => `tá querendo relações sexuais a ${q}, topa?`, 
      (q) => `quer que *${q}* pessoas venham de *chicote, algema e corda de alpinista*.`, 
      (q) => `quer que ${q} pessoas der tapa na cara, lhe chame de cachorra e fud3r bem gostosinho...`
    ]
  },
  textorandom: {
    conselho: (text) => `💡 *Conselho do dia:*\n\n${text}`,
    conselhobiblico: (text) => `📖 *Conselho Bíblico:*\n\n${text}`,
    cantada: (text) => `💘 *Cantada:*\n\n${text}`,
    piada: (text) => `😂 *Piada:*\n\n${text}`,
    charada: (text) => `🧩 *Charada:*\n\n${text}`,
    motivacional: (text) => `🚀 *Frase Motivacional:*\n\n${text}`,
    elogio: (text) => `🌟 *Elogio:*\n\n${text}`,
    reflexao: (text) => `🤔 *Reflexão:*\n\n${text}`,
    fato: (text) => `🔬 *Fato Curioso:*\n\n${text}`
  },
  tools: {
    ping: (statusEmoji, speed, statusCor, qualidade, uptimeBot) => `*${statusEmoji} PONG - RESPOSTA*

*Velocidade:* ${speed} segundos
*Qualidade da conexão:* ${statusCor} ${qualidade}
*Tempo online:* ${uptimeBot}`,
    toimgUsage: (prefix) => `╭⊱ 🖼️ *CONVERTER* 🖼️ ⊱╮\n│\n│ ❌ Marque uma figurinha para\n│    converter em imagem!\n│\n│ 💡 Responda uma figurinha com:\n│ ${prefix}toimg\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━╯`,
    groupstats: (subject, creation, members, admins) => `📊 *Estatísticas do Grupo*\n\n📛 *Nome:* ${subject}\n📅 *Criado em:* ${creation}\n\n👥 *Membros:* ${members}\n👑 *Admins:* ${admins}\n👤 *Comuns:* ${members - admins}`,
    dicionarioUsage: "📔 Qual palavra você quer procurar?",
    dicionarioSearching: "📔 Procurando...",
    dicionarioResult: (palavra, classe, significadosStr) => `📘✨ *Significado de "${palavra}":*\n\n*📚 Classe:* ${classe || 'N/A'}\n\n*📖 Significados:*\n${significadosStr}`,
    dicionarioNotFound: "💔 Palavra não encontrada.",
    urlUsage: (prefix) => `🔒 *Verificador de Links*\n\n💡 *Como usar:*\n• ${prefix}verificarurl <link>\n\n✨ Verifica se um link é seguro ou malicioso.`,
    urlChecking: "🔍 Verificando segurança do link... Aguarde!",
    urlSafe: (domain) => `✅ *Link Verificado*\n\n🔗 *Domínio:* ${domain}\n\n🟢 *Status:* Não encontrado em listas de ameaças\n\n⚠️ *Nota:* Isso não garante 100% de segurança.`,
    urlMalicious: (domain, threat) => `🚨 *ALERTA DE SEGURANÇA* 🚨\n\n🔗 *Domínio:* ${domain}\n🔴 *Status:* MALICIOSO\n⚠️ *Ameaça:* ${threat}\n\n❌ NÃO ACESSE ESTE LINK!`,
    horoscopoUsage: "💔 Você precisa informar um signo para buscar a previsão.",
    horoscopoInvalid: "💔 Signo inválido! Os signos disponíveis são: Áries, Touro, Gêmeos, Câncer, Leão, Virgem, Libra, Escorpião, Sagitário, Capricórnio, Aquário, Peixes.",
    horoscopoResult: (emoji, signo, previsao) => `🔮 *HORÓSCOPO* 🔮\n\n${emoji} *Signo:* ${signo.toUpperCase()}\n✨ *Previsão do Dia:*\n${previsao}`,
    signosList: (prefix) => `🔮 *Signos do Zodíaco*\n\n♈ *Áries*\n♉ *Touro*\n♊ *Gêmeos*\n♋ *Câncer*\n♌ *Leão*\n♍ *Virgem*\n♎ *Libra*\n♏ *Escorpião*\n♐ *Sagitário*\n♑ *Capricórnio*\n♒ *Aquário*\n♓ *Peixes*\n\nUse ${prefix}horoscopo <signo>!`,
    totalcmd: (total) => `📊 *Total de comandos registrados:* *${total}*`,
    worldtime: (city, date, time, timezone) => `⌚ *Hora em ${city.replace('_', ' ')}*\n\n📅 Data: ${date}\n⏰ Hora: ${time}\n🌐 Fuso: ${timezone}`,
    worldtimeNotFound: "💔 Cidade não encontrada ou erro na API. Use: America/Sao_Paulo",
    scanlinkUsage: (prefix, cmd) => `Use: ${prefix}${cmd} <url>`,
    scanlinkScanning: "🔍 Escaneando link... Aguarde.",
    scanlinkSafe: (url) => `✅ Link Verificado: ${url}\n\nStatus: SEGURO 🛡️`
  },
  typing: {
    pendingChallenge: "⚠️ Já existe um desafio pendente neste grupo!",
    challenge: (challenger, challenged, prefix) => `⚡ *DESAFIO DE DIGITAÇÃO*\n\n@${challenger} desafiou @${challenged} para uma corrida de digitação!\n\n💡 O desafiado deve usar: ${prefix}digitar aceitar\n⏱️ O desafio expira em 60 segundos.`,
    noPendingChallenge: "💔 Não há desafio pendente para você aceitar!",
    challengeExpired: "⏰ O desafio expirou!",
    gameStarted: (frase) => `⚡ *CORRIDA DE DIGITAÇÃO INICIADA!*\n\n📝 *Digite exatamente esta frase:*\n\n"${frase}"\n\n⏱️ Quem digitar primeiro e corretamente vence!`,
    challengeAccepted: (delaySec) => `✅ Desafio aceito! A frase será enviada em ${delaySec} segundos... ⏱️`,
    tooFast: "⏱️ Muito rápido! Aguarde um pouco.",
    alreadyAnswered: "⚠️ Você já respondeu!",
    resultWinner: (frase, winner, tempo) => `⚡ *RESULTADO DA CORRIDA*\n\n📝 Frase: "${frase}"\n\n🏆 *VENCEDOR:* @${winner}\n⏱️ Tempo: ${tempo}s`,
    resultDraw: (frase) => `⚡ *RESULTADO DA CORRIDA*\n\n📝 Frase: "${frase}"\n\n😔 *EMPATE!* Nenhum dos dois acertou.`,
    answerReceived: "✅ Resposta recebida! Aguardando o oponente...",
    usage: (prefix) => `⚡ *CORRIDA DE DIGITAÇÃO*\n\n💡 *Como jogar:*\n1️⃣ Desafie alguém: ${prefix}digitar @usuário\n2️⃣ O desafiado aceita: ${prefix}digitar aceitar\n🏆 Quem digitar primeiro e corretamente vence!`
  },
  upload: {
    missingMedia: "Marque um video, uma foto, um audio ou um documento"
  },
  vab: {
    pollName: (opt1, opt2) => `🤔 *QUAL VOCÊ PREFERE?* 🤔\n\n${opt1}\nvs\n${opt2}`,
    pollOpt1: (opt) => `✅ ${opt}`,
    pollOpt2: (opt) => `✅ ${opt}`,
    pollOpt3: "🤷‍♂️ Nenhuma das duas"
  },
  videoeffects: {
    processing: "🎬 Processando vídeo... Por favor, aguarde alguns segundos.",
    missingToMp3: "🎬 Para converter vídeo para áudio, responda a uma mensagem que contenha um vídeo.",
    missingEffect: "🎬 Para aplicar este efeito de vídeo, responda a uma mensagem que contenha um vídeo."
  },
  viewonce: {
    missingMediaKeys: "❌ Não foi possível extrair as chaves de mídia desta mensagem. Ela pode ser muito antiga ou não é uma visualização única válida.",
    revealing: "⏳ Revelando mídia...",
    imageRevealed: "✅ *Imagem Revelada!*",
    videoRevealed: "✅ *Vídeo Revelado!*"
  },
  voltei: {
    welcomeBack: "👋 Bem-vindo(a) de volta! Seu status AFK foi removido.",
    notAfk: "Você não estava AFK."
  },
  wikipedia: {
    usage: (prefix, cmd) => `Use: ${prefix}${cmd} <termo>`,
    searching: "Consultando a Wikipedia...",
    notFound: "Nao encontrei nada sobre esse termo na Wikipedia.",
    result: (language, title, extract, link) => `*Wikipedia (${language})*\n\n*${title}*\n\n${extract}${link ? `\n\nSaiba mais: ${link}` : ''}`
  },
  wordle: {
    surrender: (palavra) => `🏳️ Você desistiu!\n\nA palavra era: *${palavra.toUpperCase()}*`,
    wrongSize: (tamanhoEsperado, prefix) => `💔 A palavra deve ter ${tamanhoEsperado} letras!\n\n💡 Você tem um jogo ativo com palavra de ${tamanhoEsperado} letras.\n\n📝 Chute: ${prefix}wordle [palavra de ${tamanhoEsperado} letras]`,
    win: (historico, tentativas, pontos, palavra) => `🎉 *PARABÉNS!*\n\n${historico}\n\n✅ Você acertou em ${tentativas}/6 tentativas!\n🏆 +${pontos} pontos\n\nA palavra era: *${palavra.toUpperCase()}*`,
    lose: (historico, palavra) => `😢 *GAME OVER!*\n\n${historico}\n\n❌ Suas tentativas acabaram!\n\nA palavra era: *${palavra.toUpperCase()}*`,
    continue: (tentativas, historico, prefix, tamanhoEsperado) => `🎯 *WORDLE* (${tentativas}/6)\n\n${historico}\n\n💡 Continue chutando com: ${prefix}wordle [palavra de ${tamanhoEsperado} letras]`,
    inProgress: (historico, tentativas, tamanho, prefix) => `🎮 *Jogo em andamento!*\n\n${historico}Tentativas: ${tentativas}/6\n📏 Tamanho: ${tamanho} letras\n\n💡 Chute uma palavra de ${tamanho} letras:\n${prefix}wordle [palavra]\n\n🔄 Para desistir: ${prefix}wordle desistir`,
    start: (tamanho, prefix) => `🎮 *WORDLE - Adivinhe a Palavra!*\n\n📝 Tente adivinhar a palavra de ${tamanho} letras!\n\n🟩 = Letra certa no lugar certo\n🟨 = Letra certa no lugar errado\n⬛ = Letra não existe\n\n💡 Você tem 6 tentativas!\n\n*Chute com:* ${prefix}wordle [palavra de ${tamanho} letras]`
  }
};
