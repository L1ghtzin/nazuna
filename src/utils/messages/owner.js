export const ownerMessages = {
  addreact: {
    missingParams: (prefix, cmd) => `Uso: ${prefix}${cmd} trigger emoji`,
    invalidEmoji: "❌ Envie apenas um emoji válido!",
    success: (emoji) => `✅ O emoji "${emoji}" foi adicionado à lista de reações aleatórias do bot.`
  },
  bot_config: {
    antipv: {
      statusUnchanged: (cmd, currentStatus) => `⚠️ O Anti-PV (${cmd.toUpperCase()}) já está ${currentStatus}.`,
      statusChanged: (cmd, status, infoMsg) => `✅ *Anti-PV (${cmd.toUpperCase()})*: ${status.toUpperCase()}\n\n💡 ${infoMsg}`,
      missingMessage: (prefix) => `Por favor, forneça a nova mensagem para o antipv. Exemplo: ${prefix}antipvmessage Comandos no privado estão desativados!`,
      messageUpdated: (message) => `✅ Mensagem do antipv atualizada para: "${message}"`
    },
    menu: {
      mediaMissing: (prefix, command) => `Marque uma imagem ou um vídeo, com o comando: ${prefix}${command} (mencionando a mídia)`,
      mediaUpdated: "✅ Mídia do menu atualizada com sucesso.",
      audioRemoved: "✅ Áudio do menu removido com sucesso!\n\nO menu voltará a ser enviado sem áudio.",
      audioMissing: (prefix, command) => `❌ *Envie ou marque um áudio* com o comando: ${prefix}${command}\n\n🎵 Este áudio será enviado junto com o menu principal.\n\n💡 Para remover depois, use: ${prefix}${command} off`,
      audioUpdated: (prefix, command) => `✅ *Áudio do menu configurado com sucesso!*\n\n🎵 O áudio será enviado junto com o menu principal.\n\n💡 Para remover, use: ${prefix}${command} off`
    },
    misc: {
      missingLink: "Informe o link do grupo.",
      joining: "✅ Entrando...",
      invalidLink: "💔 Link inválido.",
      leaving: "👋 Saindo do grupo..."
    }
  },
  cachedebug: {
    header: "📊 *Cache JID→LID Debug*\n\n",
    stats: (totalEntries, lastUpdate, version) => `📈 Total de entradas: ${totalEntries}\n🕐 Última atualização: ${lastUpdate}\n📦 Versão: ${version}\n\n`,
    lastEntriesHeader: "📋 *Últimas 10 entradas:*\n\n",
    entryLine: (idx, jid, lid) => `${idx}. JID: ${jid}\n   LID: ${lid}\n\n`,
    empty: "⚠️ Cache vazio - nenhuma conversão JID→LID registrada ainda.\n",
    footer: (fileName) => `\n💾 Arquivo: ${fileName}`
  },
  delreact: {
    missingParams: (prefix, cmd) => `Uso: ${prefix}${cmd} id`
  },
  design_menu: {
    menuPreview: (headerPreview, currentDesign, prefix) => `╭─⊰ 🎨 *CONFIGURAÇÕES DO DESIGN* 🎨 ⊱─╮
┊
┊ 🔸 *Cabeçalho:*
┊ ${headerPreview}
┊
┊ 🔸 *Borda Superior:* ${currentDesign.menuTopBorder}
┊ 🔸 *Borda Inferior:* ${currentDesign.bottomBorder}
┊ 🔸 *Borda do Meio:* ${currentDesign.middleBorder}
┊ 🔸 *Ícone do Item:* ${currentDesign.menuItemIcon}
┊ 🔸 *Ícone Separador:* ${currentDesign.separatorIcon}
┊ 🔸 *Ícone do Título:* ${currentDesign.menuTitleIcon}
┊
┊ 📝 *Comandos:*
┊ ${prefix}setborda, ${prefix}setbordafim, ${prefix}setbordameio,
┊ ${prefix}setitem, ${prefix}setseparador, ${prefix}settitulo,
┊ ${prefix}setheader, ${prefix}resetdesign
┊
╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯`,
    resetSuccess: "✅ Design do menu resetado!",
    usage: (prefix, cmd) => `Uso: ${prefix}${cmd} <texto/emoji>`,
    success: "✅ Alteração realizada no design do menu!"
  },
  fotobot: {
    missingImage: (prefix) => `💔 Envie ou marque uma imagem para definir como foto de perfil do bot.\n\n📝 *Uso:* Envie uma imagem com o comando ou responda uma imagem com ${prefix}fotobot`,
    invalidMedia: "💔 Mídia inválida. Envie uma imagem.",
    success: "✅ Foto de perfil do bot alterada com sucesso!"
  },
  lermais: {
    enabled: `✅ *"Ler Mais" ATIVADO nos menus!*\n\n📱 Os menus agora exibem caracteres invisíveis no início, fazendo o WhatsApp mostrar "Ler mais".\n\n💡 Isso deixa os menus mais limpos na prévia da conversa.`,
    disabled: `💔 *"Ler Mais" DESATIVADO nos menus!*\n\n📱 Os menus não terão mais os caracteres invisíveis.\n\n💡 O conteúdo completo aparecerá direto sem precisar expandir.`
  },
  listreact: {
    empty: "Nenhum react configurado.",
    header: "📋 Lista de Reacts:\n\n",
    item: (r) => `ID: ${r.id} | Trigger: ${r.trigger} | Emoji: ${r.emoji}\n`
  },
  maintenance: {
    apostarpet: {
      groupOnly: '⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.',
      rpgDisabled: (prefix) => `⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`,
      ecoDisabled: "💔 Sistema de economia não carregado neste módulo.",
      noTarget: (prefix) => `💔 Marque alguém para apostar!\n\n💡 Uso: ${prefix}apostarpet <valor> <nº pet> @user`,
      selfBet: "💔 Você não pode apostar contra si mesmo!",
      invalidAmount: "💔 Informe um valor válido para apostar!",
      insufficientFunds: "💔 Você não tem dinheiro suficiente na carteira!",
      opponentInsufficient: "💔 Seu oponente não tem dinheiro suficiente!",
      noPets: "🐾 Você não tem pets!",
      opponentNoPets: "💔 Seu oponente não tem pets!",
      invalidPet: (prefix) => `💔 Pet inválido! Use ${prefix}pets para ver seus pets.`,
      resultMsg: (myPet, oppPet, betAmount, won) => {
        let resultMsg = `╭━━━⊱ 🎰 *APOSTA DE PETS* ⊱━━━╮\n\n`;
        resultMsg += `${myPet.emoji} *${myPet.name}* (Lv.${myPet.level}) VS ${oppPet.emoji} *${oppPet.name}* (Lv.${oppPet.level})\n\n`;
        resultMsg += `💰 Aposta: ${betAmount.toLocaleString()}\n\n`;
        
        if (won) {
          resultMsg += `🏆 *VOCÊ VENCEU!*\n💰 Ganhou: +${betAmount.toLocaleString()}`;
        } else {
          resultMsg += `💀 *VOCÊ PERDEU!*\n💸 Perdeu: -${betAmount.toLocaleString()}`;
        }
        
        resultMsg += `\n╰━━━━━━━━━━━━━━━━━━━━━━╯`;
        return resultMsg;
      }
    },
    limpardb: {
      success: (count) => `🧹 *Limpeza concluída!*\n\nRemovidos *${count}* arquivos de grupos que o bot não participa mais.`
    },
    diagnostic: {
      start: "🛠️ *Iniciando reparo do banco de dados...*",
      success: (users, migrated, petsFixed) => `✅ *Manutenção Concluída!*\n\n📊 Status:\n- Usuários: ${users}\n- Migrados: ${migrated}\n- Pets corrigidos: ${petsFixed}`,
      fallback: "✅ Integridade verificada e cache otimizado!",
      fail: "💔 Falha na rotina de diagnóstico."
    },
    style: {
      preview: (style) => `🎨 *Preview do Estilo Atual*\n\n┏━━━━━━━━━━━━━━\n┃ 🌟 *Bem-vindo(a) ao bot!*\n┃ 💎 Estilo: ${style}\n┗━━━━━━━━━━━━━━`,
      missingStyle: (prefix, cmd) => `💔 Especifique o tema/estilo. Ex: ${prefix}${cmd} dark`,
      success: (style) => `✅ Estilo alterado para *${style}* com sucesso!`
    },
    defaultSuccess: (cmd) => `✅ Manutenção ${cmd} executada.`
  },
  msgboton: {
    status: (newStatus, statusText) => `🔔 *Mensagem de inicialização ${statusText}!*\n\nAgora, quando o bot ligar, ${newStatus ? 'você receberá' : 'NÃO receberá'} uma mensagem de boas-vindas no seu privado.`
  },
  msgprefix: {
    missingParams: (prefix) => `Uso: ${prefix}msgprefix off ou ${prefix}msgprefix texto aqui #prefixo#`,
    success: (newMsg, prefix) => `✅ Mensagem prefix configurada: ${newMsg.replace('#prefixo#', prefix)}`,
    disabled: "✅ Mensagem prefix desativada.",
    error: "Erro ao salvar."
  },
  nomebot: {
    missingName: (prefix, cmd) => `Por favor, digite o novo nome do bot.\nExemplo: ${prefix}${cmd} Chainy`,
    success: (name) => `Nome do bot alterado com sucesso para "${name}"!`
  },
  nomedono: {
    missingName: (prefix, cmd) => `Por favor, digite o novo nome do dono.\nExemplo: ${prefix}${cmd} Hiudy`,
    success: (name) => `Nome do dono alterado com sucesso para "${name}"!`
  },
  nuke: {
    noMembers: "Nenhum membro para banir.",
    error: "Ocorreu um erro ao banir 💔"
  },
  numerodono: {
    missingParams: (prefix, cmd) => `Por favor, digite o novo número do dono.\nExemplo: ${prefix}${cmd} +559681361714`,
    success: (num) => `Número do dono alterado com sucesso para "${num}"!`
  },
  owner: {
    tm: {
      missingMedia: "Digite uma mensagem ou marque uma imagem/vídeo!",
      header: "╔══════════════════════\n║  📡 *TRANSMISSÃO DA BOT* 📡\n╚══════════════════════\n\n",
      success: (count) => `✅ Transmissão enviada para ${count} grupos!`
    },
    blockcmdg: {
      missingCmd: (prefix) => `💔 Informe o comando a bloquear! Ex.: ${prefix}blockcmdg sticker`,
      invalidCmd: (cmd) => `❌ O comando *${cmd}* não existe e não pode ser bloqueado!`,
      success: (cmd, reason) => `✅ Comando *${cmd}* bloqueado globalmente!\nMotivo: ${reason}`
    },
    unblockcmdg: {
      missingCmd: (prefix) => `💔 Informe o comando a desbloquear! Ex.: ${prefix}unblockcmdg sticker`,
      notBlocked: (cmd) => `❌ O comando *${cmd}* não está bloqueado!`,
      success: (cmd) => `✅ Comando *${cmd}* desbloqueado globalmente!`
    },
    listblocks: {
      header: "🔒 *Bloqueios Globais* 🔒\n\n📜 *Comandos Bloqueados*:\n",
      usersHeader: "\n\n👥 *Usuários Bloqueados*:\n",
      noCmds: "Nenhum comando bloqueado.",
      noUsers: "Nenhum usuário bloqueado."
    },
    botState: {
      success: (action) => `✅ Bot ${action}!`, // ativado/desativado
    },
    reviverqr: {
      success: "🧹 Limpeza concluída! Reiniciando..."
    },
    role: {
      success: (role) => `✅ O dono agora é ${role}.`,
      error: "❌ Erro. Verifique se o bot é administrador do grupo."
    },
    blockuserg: {
      success: (user, reason) => `✅ Usuário @${user} bloqueado globalmente!\nMotivo: ${reason}`
    },
    unblockuserg: {
      notBlocked: "❌ O usuário não está bloqueado globalmente!",
      success: (user) => `✅ Usuário @${user} desbloqueado globalmente!`
    }
  },
  owner_broadcast: {
    antispamcmd: {
      usage: (prefix) => `Uso: ${prefix}antispamcmd on <limite> <janela_s> <bloqueio_s> | off | status`,
      status: (status, limit, interval, blockTime) => `🛡️ *ANTISPAM GLOBAL*\n\nStatus: ${status}\nLimite: ${limit} cmds/${interval}s\nBloqueio: ${blockTime}m`,
      off: "✅ AntiSpam desativado.",
      on: "✅ AntiSpam configurado e ativado!"
    },
    div: {
      usage: (prefix, cmd) => `Uso: ${prefix}${cmd} <mensagem> [all] <quantidade>`,
      start: (count) => `🚀 Iniciando divulgação de ${count} mensagens...`,
      success: "✅ Divulgação concluída."
    },
    setdiv: {
      missingMsg: "Informe a mensagem.",
      success: "✅ Mensagem salva."
    },
    divdono: {
      help: (prefix) => `📣 *DIVULGAÇÃO DO DONO (NOVO)*\n\n• ${prefix}divdono add [id] (no grupo ou com ID)\n• ${prefix}divdono rem <id>\n• ${prefix}divdono list\n• ${prefix}divdono msg <texto>\n• ${prefix}divdono send [texto] (usa msg salva)\n• ${prefix}divdono time <HH:MM|off>\n• ${prefix}divdono status`,
      add: {
        usage: (prefix) => `💡 Use: ${prefix}divdono add [id_do_grupo]`,
        success: (total) => `✅ Grupo registrado para divulgação.\n📌 Total: ${total}`,
        exists: "⚠️ Este grupo já está registrado."
      },
      rem: {
        usage: (prefix) => `💡 Use: ${prefix}divdono rem <id_do_grupo>`,
        notFound: "⚠️ Grupo não encontrado na lista.",
        success: (total) => `✅ Grupo removido da divulgação.\n📌 Total: ${total}`
      },
      list: {
        empty: "⚠️ Nenhum grupo registrado para divulgação.",
        header: (total) => `📣 *GRUPOS REGISTRADOS (${total})*\n\n`
      },
      msg: {
        usage: (prefix) => `💡 Use: ${prefix}divdono msg <sua mensagem de divulgação aqui>`,
        success: (prefix) => `✅ Mensagem de divulgação salva com sucesso!\nPara testar: ${prefix}divdono send`
      },
      time: {
        usage: (prefix) => `💡 Use: ${prefix}divdono time <HH:MM> ou 'off'`,
        off: "✅ Divulgação automática desativada.",
        invalid: "❌ Formato de hora inválido! Use HH:MM (ex: 14:30)",
        success: (time) => `✅ Horário de divulgação automática configurado para ${time}.`
      },
      status: {
        text: (groups, hasMsg, time) => `📊 *STATUS DIVULGAÇÃO*\n\n• *Grupos:* ${groups}\n• *Mensagem salva:* ${hasMsg}\n• *Automático:* ${time}\n`
      },
      send: {
        empty: "⚠️ Nenhum grupo registrado!",
        missingMsg: (prefix) => `⚠️ Nenhuma mensagem definida! Use ${prefix}divdono msg <texto>`,
        start: (total) => `🚀 Iniciando envio para ${total} grupos...`,
        success: (success, fail) => `✅ *Divulgação Concluída!*\n\n🟢 Sucesso: ${success}\n🔴 Falha: ${fail}`
      },
      invalid: "❌ Subcomando inválido.\n\n"
    },
    tm2: {
      privateOnly: "⚠️ Este comando só funciona no privado! Me chama no PV para se inscrever.",
      alreadySubbed: (total) => `✅ Você já está inscrito nas transmissões!\n\n📊 *Estatísticas:*\n• Total de inscritos: ${total}`,
      successSub: (prefix) => `🎉 *Inscrição confirmada!*\n\nVocê agora receberá as transmissões da bot diretamente no seu privado.\n\n💡 *Como funciona:*\n• Você receberá mensagens importantes da equipe\n• Para cancelar, use: ${prefix}desinscrever\n\n✨ Obrigado por se inscrever!`,
      privateOnlyUnsub: "⚠️ Este comando só funciona no privado!",
      notSubbed: "⚠️ Você não está inscrito nas transmissões.",
      successUnsub: (prefix) => `✅ *Inscrição cancelada!*\n\nVocê não receberá mais as transmissões.\n\n💡 Para se inscrever novamente, use: ${prefix}inscrevertm`,
      status: (total) => `📊 *STATUS TRANSMISSÃO TM2*\n\n• Inscritos: ${total}`,
      missingMedia: (prefix) => `Digite uma mensagem ou marque uma imagem/vídeo! Exemplo: ${prefix}tm2 Olá inscritos!`,
      noSubs: "⚠️ Ainda não há inscritos para enviar a transmissão.\n\n💡 Os usuários devem usar o comando /inscrevertm no privado para se inscrever.",
      header: "╔══════════════════════\n║  📡 *TRANSMISSÃO VIP* 📡\n╚══════════════════════\n\n",
      start: (total) => `🚀 Iniciando transmissão para ${total} inscritos...`,
      success: (success, fail) => `✅ *Transmissão Concluída!*\n\n🟢 Sucesso: ${success}\n🔴 Falha: ${fail}`
    }
  },
  owner_group_mgmt: {
    listgp: {
      header: (total) => `🌟 *LISTA DE GRUPOS* (${total})\n\n`,
      item: (i, subject, id) => `${i}. ${subject}\n🆔 ${id}\n\n`
    },
    listbangp: {
      empty: "✅ Nenhum grupo banido.",
      header: (total) => `🚫 *GRUPOS BANIDOS* (${total})\n\n`,
      item: (subject, id) => `🔹 ${subject}\n🆔 ${id}\n\n`
    },
    bangp: {
      banned: "🚫 Grupo banido!",
      unbanned: "✅ Grupo desbanido!"
    }
  },
  personalizargrupo: {
    toggle: (state) => `✅ Sistema de personalização ${state ? 'ATIVADO' : 'DESATIVADO'}!`,
    info: (status, name, photo, prefix) => `🎨 *PERSONALIZAÇÃO DO GRUPO*\n\nStatus Global: ${status}\nNome: ${name}\nFoto: ${photo}\n\nComandos: ${prefix}nomegrupo, ${prefix}fotomenugrupo, ${prefix}removernome, ${prefix}removerfotomenu`,
    disabled: "⚠️ O sistema de personalização está desativado pelo dono.",
    name: {
      usage: (prefix, cmd) => `Uso: ${prefix}${cmd} <nome>`,
      success: (name) => `✅ Nome do bot alterado para "${name}" neste grupo!`
    },
    photo: {
      missingMedia: "Envie/marque uma imagem.",
      success: "✅ Foto do menu personalizada!"
    },
    resetName: "✅ Nome resetado para o padrão.",
    resetPhoto: "✅ Foto resetada para o padrão."
  },
  prefix: {
    usage: (prefix, cmd) => `📌 *Configuração de Prefixo*\n\n📝 *Como usar:*\n  Digite o novo prefixo após o comando\n  Ex: ${prefix}${cmd} /\n  Ex: ${prefix}${cmd} !\n\n⚠️ O prefixo do bot será atualizado para o valor especificado!`,
    reserved: `💔 O símbolo "$" é reservado e não pode ser usado como prefixo.\n✅ Prefixo alterado automaticamente para "/" globalmente!`,
    success: (newPrefix) => `✅ Prefixo alterado globalmente para: "${newPrefix}"`
  },
  premium: {
    add: {
      alreadyPremium: "O usuário já está na lista premium.",
      success: (user) => `✅ @${user} foi adicionado(a) à lista premium.`
    },
    remove: {
      notPremium: "O usuário não está na lista premium.",
      success: (user) => `✅ @${user} foi removido(a) da lista premium.`
    },
    list: {
      empty: "A lista premium está vazia.",
      header: (total) => `⭐ *USUÁRIOS PREMIUM* (${total})\n\n`,
      item: (user) => `- @${user}\n`
    }
  },
  reiniciar: {
    success: `🔄 *REINICIANDO O BOT...*\n\n⏳ Pausando processamento de mensagens...\n🚀 O bot voltará online em alguns segundos!`
  },
  rental_management: {
    permission: "🚫 Apenas o Dono e subdonos podem gerenciar o sistema de aluguel!",
    notInitialized: "💔 Sistema de expiração não inicializado.",
    stats: (isRunning, lastCheck, warnings, finalWarnings, expired, errors, interval, warningDays, finalDays) => `📋 *ESTATÍSTICAS DE ALUGUEL*\n\n🚀 *Status:* ${isRunning}\n⏱️ *Última Checagem:* ${lastCheck}\n🔔 *Avisos Enviados:* ${warnings}\n🚨 *Avisos Finais:* ${finalWarnings}\n🔨 *Expirados Processados:* ${expired}\n💔 *Erros:* ${errors}\n\n⚙️ *Intervalo:* ${interval}\n⚠️ *Dias de Aviso:* ${warningDays}\n🚨 *Aviso Final:* ${finalDays}`,
    check: {
      notInitialized: "💔 Sistema de expiração não inicializado no contexto atual.",
      start: "⏳ Iniciando verificação forçada de expirações...",
      success: "✅ Verificação de aluguéis concluída com sucesso!",
      error: "❌ Falha na verificação forçada."
    },
    config: (interval, warningDays, finalDays, autoCleanup, notifications) => `⚙️ *Configuração Atual do Sistema de Aluguel*\n\n• Intervalo cron: ${interval}\n• Dias de aviso: ${warningDays}\n• Aviso final: ${finalDays}\n• Auto limpeza: ${autoCleanup}\n• Notificações: ${notifications}\n\nPara alterar, ajuste a inicialização em src/connect.js (RentalExpirationManager).`,
    unknownCmd: (cmd) => `❌ Comando de gerenciamento desconhecido: ${cmd}`
  },
  rental_system: {
    permission: {
      ownerOnly: "🚫 Apenas o Dono e subdonos podem gerenciar o sistema de aluguel!",
      mode: "🚫 Apenas o Dono e subdonos podem gerenciar o modo de aluguel!",
      code: "🚫 Apenas o Dono e subdonos podem gerar códigos!",
      list: "🚫 Apenas o Dono e subdonos podem ver a lista de aluguéis!",
      remove: "🚫 Apenas o Dono e subdonos podem remover aluguéis!",
      extend: "🚫 Apenas o Dono e subdonos podem estender aluguéis!",
      info: "🚫 Apenas o Dono e subdonos podem ver informações de aluguel!",
      cleanup: "🚫 Apenas o Dono e subdonos podem limpar aluguéis!",
      groupOnly: "Este comando só pode ser usado em grupos."
    },
    mode: {
      on: "✅ Modo de aluguel global ATIVADO! O bot agora só responderá em grupos com aluguel ativo.",
      onFail: "❌ Erro ao ativar o modo de aluguel global.",
      off: "✅ Modo de aluguel global DESATIVADO! O bot responderá em todos os grupos permitidos.",
      offFail: "❌ Erro ao desativar o modo de aluguel global.",
      usage: (prefix, status) => `🤔 Uso: ${prefix}modoaluguel on|off\nStatus atual: ${status}`,
      error: "❌ Ocorreu um erro inesperado."
    },
    notification: {
      success: (action) => `✅ O destino dos avisos de aluguel foi configurado para: *${action.toUpperCase()}*`,
      usage: (prefix, target) => `🤔 Uso: ${prefix}aluguelaviso <grupo|pv|ambos>\n\nStatus atual: *${target.toUpperCase()}*`,
      error: "❌ Ocorreu um erro ao configurar os avisos."
    },
    list: {
      empty: "📭 Nenhum grupo com aluguel ativo no momento.",
      header: (total) => `╭━━━⊱ 📋 *LISTA DE ALUGUEIS* ⊰━━━╮\n│\n│ 📊 Total de grupos: ${total}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`,
      itemHeader: (icon, name) => `${icon} *${name}*\n┌─────────────────\n`,
      itemId: (id) => `│ 📱 ID: ${id}\n`,
      itemStatus: (status) => `│ 📅 Status: ${status}\n`,
      itemExpires: (date) => `│ ⏰ Expira em: ${date}\n`,
      itemDaysLeft: (days) => `│ ⏳ Dias restantes: ${days}\n`,
      itemAddedAt: (date) => `│ 📆 Adicionado em: ${date}\n`,
      itemFooter: "└─────────────────\n\n",
      itemError: "│ ❌ Erro ao buscar dados\n",
      notFound: "⚠️ Grupo não encontrado\n",
      stats: (active, permanent, expired, total) => `╭━━━⊱ 📊 *ESTATÍSTICAS* ⊰━━━╮\n│\n│ ✅ Ativos: ${active}\n│ ♾️ Permanentes: ${permanent}\n│ ❌ Expirados: ${expired}\n│ 📦 Total: ${total}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`,
      commands: (prefix) => `💡 *Comandos disponíveis:*\n• ${prefix}removeraluguel <id>\n• ${prefix}estenderaluguel <id> <dias>\n• ${prefix}infoaluguel <id>`,
      error: "❌ Ocorreu um erro ao listar os aluguéis."
    },
    add: {
      invalidDuration: (prefix) => `🤔 Duração inválida. Use um número de dias (ex: 30) ou a palavra "permanente".\nExemplo: ${prefix}addaluguel 30`,
      error: "❌ Ocorreu um erro inesperado ao adicionar o aluguel."
    },
    remove: {
      usage: (prefix) => `💡 *Uso:* ${prefix}removeraluguel [id_do_grupo]\n\n📝 Use dentro de um grupo ou informe o ID.\n💡 Use ${prefix}listaraluguel para ver os IDs.`,
      notFound: (prefix) => `❌ Este grupo não possui aluguel ativo.\n\n💡 Use ${prefix}listaraluguel para ver os grupos com aluguel.`,
      success: (name, id) => `╭━━━⊱ ✅ *ALUGUEL REMOVIDO* ⊰━━━╮\n│\n│ 🗑️ O aluguel do grupo foi\n│    removido com sucesso!\n│\n│ 📱 Grupo: ${name}\n│ 🆔 ID: ${id}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n⚠️ O bot não funcionará mais neste grupo até que um novo aluguel seja adicionado.`,
      groupWarning: "⚠️ *AVISO IMPORTANTE*\n\nO aluguel deste grupo foi removido pelo proprietário do bot.\n\n❌ O bot não funcionará mais neste grupo.\n\nPara mais informações, entre em contato com o dono.",
      error: "❌ Ocorreu um erro ao remover o aluguel."
    },
    extend: {
      usage: (prefix) => `💡 *Uso:* ${prefix}estenderaluguel <dias> (no grupo)\nou\n${prefix}estenderaluguel <id_do_grupo> <dias>\n\n📝 *Exemplo:*\n${prefix}estenderaluguel 7 (no grupo)\n${prefix}estenderaluguel 5511999999999 7\n\n💡 Use ${prefix}listaraluguel para ver os IDs.`,
      invalidDays: "❌ O número de dias deve ser um valor positivo!",
      fail: (msg) => `❌ ${msg}`,
      success: (name, days, newDate, daysLeft) => `╭━━━⊱ ✅ *ALUGUEL ESTENDIDO* ⊰━━━╮\n│\n│ 📱 Grupo: ${name}\n│ ➕ Dias adicionados: ${days}\n│ 📅 Nova expiração: ${newDate}\n│ ⏳ Dias restantes: ${daysLeft}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
      groupWarning: (days, newDate, daysLeft) => `🎉 *BOA NOTÍCIA!*\n\nSeu aluguel foi estendido!\n\n➕ Dias adicionados: *${days}*\n📅 Nova data de expiração: *${newDate}*\n⏳ Dias restantes: *${daysLeft}*\n\n✨ Continue aproveitando o bot!`,
      error: "❌ Ocorreu um erro ao estender o aluguel."
    },
    dayfree: {
      usage: (prefix, cmd) => `Uso: ${prefix}${cmd} <dias> [motivo opcional]\nEx: ${prefix}adddiasaluguel 7 Manutencao compensatoria`,
      invalidDays: "O primeiro argumento deve ser um número positivo de dias.",
      noRentals: "Não há grupos com aluguel configurado.",
      summaryHeader: "📊 Resumo da extensão de aluguel:\n\n",
      successItem: (id, msg) => `✅ ${id}: ${msg}\n`,
      failNotify: "   ⚠️ Falha ao avisar no grupo.\n",
      failItem: (id, msg) => `❌ ${id}: ${msg}\n`,
      groupWarning: (name, days, date, reason) => `🎉 Aténcao, ${name}! Adicionados ${days} dias extras de aluguel.\nNova expiração: ${date}.\nMotivo: ${reason}`,
      summaryFooter: (success, fail) => `\nTotal: ${success} sucessos | ${fail} falhas`,
      error: "Ocorreu um erro ao estender aluguel em todos os grupos."
    },
    info: {
      usage: (prefix) => `💡 *Uso:* ${prefix}infoaluguel <id_do_grupo>\n\n📝 Ou use este comando dentro do grupo para ver o status dele.`,
      notFound: (prefix) => `❌ Este grupo não possui aluguel ativo.\n\n💡 Use ${prefix}addaluguel para adicionar.`,
      header: (name, id, members) => `╭━━━⊱ 📋 *DETALHES DO ALUGUEL* ⊰━━━╮\n│\n│ 📱 *GRUPO:* ${name}\n│ 🆔 *ID:* ${id}\n│ 👥 *Membros:* ${members}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`,
      permanent: "♾️ *STATUS:* PERMANENTE\n\n✨ Este grupo tem aluguel permanente!\n⏰ Não há data de expiração.",
      status: (isExpired) => `📅 *STATUS:* ${isExpired ? "❌ EXPIRADO" : "✅ ATIVO"}\n\n`,
      expiration: (date, time) => `⏰ *Data de expiração:*\n   ${date} as ${time}\n\n`,
      daysLeft: (days) => `⏳ *Tempo restante:* ${days} dia${days !== 1 ? "s" : ""}\n\n`,
      warning: "⚠️ *ATENÇÃO:* O aluguel está próximo de expirar!\n\n",
      expiredAgo: (days) => `⏳ *Expirado há:* ${days} dia${days !== 1 ? "s" : ""}\n\n`,
      addedAt: (date) => `\n📆 *Aluguel adicionado em:* ${date}`,
      commands: (prefix, id) => `\n\n💡 *Comandos disponíveis:*\n• ${prefix}estenderaluguel ${id} <dias>\n• ${prefix}removeraluguel ${id}`,
      error: "❌ Ocorreu um erro ao buscar informações do aluguel."
    },
    code: {
      usage: (prefix) => `🤔 Uso: ${prefix}gerarcodigobr <dias|permanente> [id_do_grupo_opcional]`,
      invalidDuration: "🤔 Duração inválida. Use um número de dias (ex: 7) ou a palavra \"permanente\".",
      invalidTarget: "🤔 ID do grupo alvo inválido. Forneça o ID completo (número@g.us) ou deixe em branco para um código genérico.",
      error: "❌ Ocorreu um erro inesperado ao gerar o código."
    },
    cleanup: {
      start: "🔄 Iniciando limpeza completa de aluguéis...",
      groupWarning: (name, symbol) => `⏰ O aluguel deste grupo (${name}) expirou. Estou saindo, mas vocês podem renovar o aluguel entrando em contato com o dono! Até mais! 😊${symbol}`,
      adminWarning: (name, symbol) => `⚠️ Olá, admin do grupo *${name}*! O aluguel do grupo expirou, e por isso saí. Para renovar, entre em contato com o dono. Obrigado! ${symbol}`,
      noRentalWarning: (symbol) => `👋 Este grupo não possui aluguel registrado. Estou saindo. Até mais! ${symbol}`,
      summary: (cleaned, expired, noRental, notified, deleted, cleared, left, leftList) => `🧹 *Resumo da Limpeza Completa de Alugueis* 🧹\n\n✅ Grupos removidos dos registros: *${cleaned}*\n⏰ Grupos vencidos processados: *${expired}*\n🚫 Grupos sem aluguel processados: *${noRental}*\n📩 Administradores notificados: *${notified}*\n🗑️ Chats excluídos: *${deleted}*\n🧽 Conversas de grupos limpas: *${cleared}*\n📋 Total de grupos dos quais sai: *${left}*\n${leftList}\n\n✨ Limpeza concluída com sucesso!`,
      leftListHeader: "\n📋 *Grupos processados:*\n",
      leftListMore: (count) => `\n... e mais ${count} grupos`,
      error: "Ocorreu um erro ao limpar aluguéis."
    }
  },
  reviverqr: {
    notFound: "❌ Pasta de autenticação não encontrada.",
    start: "🧹 *INICIANDO LIMPEZA DE SESSÃO...*\n\nRemovendo arquivos temporários para resolver erros de 'Bad MAC' mantendo o login ativo.\n\n⏳ Aguarde...",
    report: (list, total) => `✅ *LIMPEZA CONCLUÍDA!*\n\n📊 *Arquivos removidos:*\n${list}\n📈 *Total:* ${total}\n\n🔄 *O bot será reiniciado em 3 segundos para aplicar as mudanças.*`,
    reportItem: (category, count) => `└─ ${category}: ${count}\n`,
    clean: "ℹ️ *Nenhum arquivo problemático encontrado.* \n\nA sessão parece estar limpa.",
    error: (msg) => `❌ Erro ao limpar sessão: ${msg}`
  },
  system_management: {
    update: {
      warning: (prefix, command) => `⚠️ *ATENÇÃO - ATUALIZAÇÃO DO BOT* ⚠️\n\n┏━━━━━━━━━━━━━━━━━━━━━\n┃ 📢 *AVISOS IMPORTANTES:*\n┣━━━━━━━━━━━━━━━━━━━━━\n┃\n┃ ⚠️ Edições manuais no código\n┃    serão *PERDIDAS*\n┃\n┃ ✅ Banco de dados será\n┃    *PRESERVADO*\n┃\n┃ ✅ Configurações (config.json)\n┃    *MANTIDAS*\n┃\n┗━━━━━━━━━━━━━━━━━━━━━\n\nPara confirmar e atualizar, digite:\n*${prefix}${command} sim*`,
      scriptNotFound: "❌ Script de atualização não encontrado!\n\n📂 Caminho esperado: src/.scripts/update.js",
      starting: "🚀 *INICIANDO ATUALIZAÇÃO...*\n\n🔄 Iniciando script de atualização e monitorando progresso...",
      finishedError: (code) => `❌ O processo de atualização terminou com erro (Código: ${code}). Verifique o console para mais detalhes.`,
      error: (msg) => `❌ Erro interno ao tentar atualizar: ${msg}`
    },
    subOwner: {
      missingTarget: "Marque ou digite o número.",
      emptyList: "📭 Nenhum subdono.",
      listHeader: "👑 *Subdonos:*\n\n"
    },
    blacklist: {
      missingTarget: "⚠️ Marque, responda a mensagem ou digite o número do usuário.",
      listHeader: "🛑 *Blacklist Global:*\n\n"
    },
    viewMsg: {
      usage: (prefix) => `⚠️ Uso incorreto! Digite:\n*${prefix}viewmsg on* (ativar marcação de lida)\n*${prefix}viewmsg off* (desativar)`,
      success: (opt) => `👁️ *Visualização automática:* ${opt === 'on' ? '✅ ATIVADA' : '❌ DESATIVADA'}\n_O bot agora vai ${opt === 'on' ? 'marcar as mensagens que recebe como lidas' : 'deixar as mensagens acumularem sem visualizar'}._`
    }
  },
  vip_system: {
    add: {
      usage: (prefix, cmd) => `Uso: ${prefix}${cmd} <cmd> | <desc> | <cat>\nEx: ${prefix}${cmd} play | Baixar música | download`
    },
    remove: {
      usage: (prefix, cmd) => `Uso: ${prefix}${cmd} <comando>`
    },
    toggle: {
      usage: (prefix) => `Uso: ${prefix}togglecmdvip <cmd> <on/off>`
    },
    stats: (total, enabled, categories) => `📊 *STATS VIP*\n\nTotal: ${total}\nAtivos: ${enabled}\nCategorias: ${categories}`
  }
};
