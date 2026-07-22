export const adminMessages = {
  activity: {
    noData: "📊 Nenhum dado de atividade encontrado.",
    rankHeader: (limit, isDesc) => `*🏆 Rank dos ${limit} mais ${isDesc ? 'ativos' : 'inativos'} do grupo:*\n`,
    rankItem: (pos, user, msg, cmd, figu) => `\n*🏅 ${pos}º Lugar:* @${user}\n- Mensagens: *${msg}*\n- Comandos: *${cmd}*\n- Figurinhas: *${figu}*\n`,
    notInGroup: "❌ Este usuário não está no grupo.",
    userNoData: (user) => `📊 @${user} ainda não possui dados no contador.`,
    userActivity: (user, msg, cmd, figu, total, lastActivity) => `📊 *Atividade de @${user}*\n\n💬 *Mensagens:* ${msg}\n⚒️ *Comandos:* ${cmd}\n🎨 *Figurinhas:* ${figu}\n📈 *Total:* ${total}\n🕐 *Última atividade:* ${lastActivity}`,
    groupActivityHeader: (total) => `📊 *Atividade do Grupo*\n👥 *Total:* ${total}\n\n`,
    groupActivityItem: (pos, user, msg, cmd, total) => `${pos}. @${user} | 💬 ${msg} | ⚒️ ${cmd} | 📈 ${total}\n`,
    resetSuccess: "✅ Contador de atividade resetado com sucesso!",
    preserveUsage: (prefix) => `💡 Uso: ${prefix}preservarcontador on/off`,
    preserveToggle: (status) => `✅ Preservação do contador: *${status ? 'ATIVADA' : 'DESATIVADA'}*`
  },
  rules: {
    addProvideText: (prefix) => `📝 Por favor, forneça o texto da regra. Ex: ${prefix}addregra Proibido spam.`,
    addSuccess: (num, text) => `✅ Regra adicionada com sucesso!\n${num}. ${text}`,
    addError: "Ocorreu um erro ao adicionar a regra 💔",
    delProvideNum: (prefix) => `🔢 Por favor, forneça o número da regra a ser removida. Ex: ${prefix}delregra 3`,
    delInvalidNum: (prefix, total) => `❌ Número de regra inválido. Use ${prefix}regras para ver a lista. Atualmente existem ${total} regras.`,
    delSuccess: (rule) => `🗑️ Regra "${rule}" removida com sucesso!`,
    delError: "Ocorreu um erro ao remover a regra 💔"
  },
  bam: {
    lastWordsReal: (user) => `⚠️ *ÚLTIMAS PALAVRAS!*\n\n@${user}, você tem *10 segundos* para dizer suas últimas palavras antes de ser banido! ⏰`,
    bannedReal: (user) => `👋 @${user} foi banido! Adeus! 🚪\n\n📝 Motivo: Banimento com aviso.`,
    lastWordsFake: (user) => `⏳ *ÚLTIMAS PALAVRAS!*\n\n@${user}, você tem *10 segundos* para dizer suas últimas palavras antes de ser banido! 🔨`,
    defaultFakeMsg: (user) => `🎭 *ERA MEME!*\n\n@${user}, relaxa, era só uma brincadeira! 😂\n\nVocê não vai ser banido... dessa vez! 🥳`,
    setUsage: (prefix, cmd) => `Uso: ${prefix}${cmd} <mensagem>\nUse #numerodele# para marcar o usuário.`,
    setSuccess: "✅ Mensagem do BAM atualizada!",
    viewCurrent: (msg) => `📝 *Mensagem atual do BAM:*\n\n${msg}`,
    resetSuccess: "🔄 Mensagem do BAM resetada para o padrão."
  },
  figuban: {
    configured: "✅ *Figurinha de Ban Configurada!* 🚨\n\nEsta figurinha agora é a figurinha oficial de banimento do grupo. Sempre que um administrador enviá-la marcando alguém ou respondendo a uma mensagem de alguém, a pessoa será banida.",
    noSticker: (prefix) => `❌ Nenhuma figurinha de ban configurada neste grupo ainda! Responda a uma figurinha com *${prefix}figuban* para configurar.`,
    activated: "✅ *FiguBan Ativado!*",
    deactivated: "❌ *FiguBan Desativado!*",
    status: (status, hasSticker, prefix) => `🛡️ *SISTEMA FIGUBAN (Sticker Ban)* 🛡️\n\n│ 📊 Status: *${status}*\n│ 🖼️ Figurinha: *${hasSticker}*\n\n💡 *Como usar:*\n• Configure uma figurinha respondendo a ela com *${prefix}figuban*.\n• Ative/Desative com *${prefix}figuban on* ou *${prefix}figuban off*.\n• Para banir alguém, envie essa figurinha respondendo à mensagem da pessoa ou marcando ela.`,
    cantBanOwner: "❌ Não posso banir o dono do bot!",
    cantBanSelf: "❌ Não posso me banir!",
    cantBanAdmin: "❌ Não posso banir um administrador do grupo!",
    botNotAdmin: "❌ Não consigo banir porque não sou administrador do grupo!",
    bannedMsg: (admin, target) => `🚨 *FIGUBAN ATIVADO!* 🚨\n\nO administrador @${admin} removeu o usuário @${target} do grupo usando a figurinha do ban!`
  },
  autohorarios: {
    helpText: (prefix) => `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n┃   🤖 *AUTO HORÁRIOS*     ┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n📋 *Comandos disponíveis:*\n\n🟢 \`${prefix}autohorarios on\`\n   ▸ Liga o envio automático\n\n🔴 \`${prefix}autohorarios off\`\n   ▸ Desliga o envio automático\n\n📊 \`${prefix}autohorarios status\`\n   ▸ Verifica status atual\n\n🔗 \`${prefix}autohorarios link [URL]\`\n   ▸ Define link de apostas\n   ▸ Sem URL remove o link\n\n⏰ *Funcionamento:*\n• Envia horários a cada hora\n• Apenas em grupos\n• Inclui link se configurado\n\n🔒 *Restrito a administradores*`,
    activated: '✅ *Auto horários ativado!*\n\n📤 Os horários pagantes serão enviados automaticamente a cada hora.\n\n⚡ O primeiro envio será na próxima hora cheia.',
    deactivated: '🔴 *Auto horários desativado!*\n\n📴 Os envios automáticos foram interrompidos.',
    status: (enabled, link) => {
      const statusEmoji = enabled ? '🟢' : '🔴';
      const statusText = enabled ? 'ATIVO' : 'INATIVO';
      const linkStatus = link ? `🔗 ${link}` : '🚫 Nenhum link configurado';
      const nextTime = enabled ? 'Na próxima hora cheia' : 'Desativado';
      return `┏━━━━━━━━━━━━━━━━━━━━━━━━┓\n┃   📊 *STATUS AUTO HORÁRIOS*  ┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n${statusEmoji} *Status:* ${statusText}\n\n🔗 *Link:*\n${linkStatus}\n\n⏰ *Próximo envio:*\n${nextTime}`;
    },
    linkRemoved: '🗑️ *Link removido!*\n\n📝 Os horários automáticos não incluirão mais link de apostas.',
    linkConfigured: (link) => `✅ *Link configurado!*\n\n🔗 *URL:* ${link}\n\n📝 Este link será incluído nos horários automáticos.`,
    error: '❌ Ocorreu um erro ao configurar os horários automáticos.'
  },
  automsg: {
    helpText: (prefix) => `📨 *Auto Mensagens*\n      \nUse os subcomandos:\n• ${prefix}automsg add HH:MM | descrição - Adicionar (envie ou responda à mídia/texto)\n• ${prefix}automsg list - Listar mensagens\n• ${prefix}automsg del [id] - Remover mensagem\n• ${prefix}automsg on/off [id] - Ativar/Desativar mensagem\n\n💡 *Exemplo:* ${prefix}automsg add 08:00 | Bom dia!`,
    addInvalidFormat: (prefix) => `❌ Formato inválido! Use: ${prefix}automsg add HH:MM | descrição`,
    addInvalidTime: "❌ Horário inválido! Use o formato 24h (ex: 08:30, 22:00).",
    addMediaWarning: "⚠️ Salvamento de mídia para automsg modularizado requer integração com o sistema de arquivos local. Migrando apenas metadados por enquanto.",
    addUnsupportedFormat: "❌ Por enquanto, apenas mensagens de texto e mídia simples são suportadas na migração modular.",
    addSuccess: (time) => `✅ Mensagem automática adicionada para às ${time}!`,
    listEmpty: "📭 Nenhuma mensagem automática configurada.",
    listHeader: "📨 *Auto Mensagens*\n\n",
    listItem: (status, idx, id, time, desc) => `${status} *${idx}.* ID: ${id} | ⏰ ${time}\n   📝 ${desc}\n\n`,
    delProvideId: "❌ Informe o ID ou o número da lista.",
    delSuccess: "✅ Mensagem removida com sucesso.",
    delNotFound: "❌ Mensagem não encontrada."
  },
  ban: {
    x9Report: (banned, admin, reason) => `🚪 *X9 Report:* @${banned} foi removido(a) do grupo por @${admin}.\n📝 Motivo: ${reason}`,
    success: (reason) => `✅ Usuário banido com sucesso!\n\nMotivo: ${reason}`
  },
  blockcmd: {
    missingCmd: (prefix) => `❌ Digite o comando que deseja bloquear. Exemplo: ${prefix}blockcmd sticker`,
    success: (cmd) => `🔒 O comando *${cmd}* foi bloqueado e só pode ser usado por administradores.`
  },
  custom: {
    autoAddUsage: (prefix, cmd) => `Uso: ${prefix}${cmd} trigger/resposta`,
    autoAddGlobalSuccess: (trigger) => `✅ Auto-resposta global '${trigger}' adicionada!`,
    autoAddGroupSuccess: (trigger) => `✅ Auto-resposta do grupo '${trigger}' adicionada!`,
    autoListHeader: "📋 *AUTO-RESPOSTAS*\n\n",
    autoListGlobal: "🌍 *Globais:*\n",
    autoListGroup: "👥 *Do Grupo:*\n",
    autoListEmpty: "📪 Nenhuma cadastrada.",
    noPrefAddUsage: (prefix, cmd) => `Uso: ${prefix}${cmd} trigger/comando\nEx: menu/menu`,
    noPrefAddSuccess: (trigger, target) => `✅ NoPrefix '${trigger}' -> '${target}' adicionado!`,
    noPrefAddError: "❌ Erro ao salvar.",
    noPrefListEmpty: "📜 Nenhum comando NoPrefix cadastrado.",
    noPrefListHeader: "📋 *COMANDOS SEM PREFIXO*\n\n",
    noPrefDelUsage: (prefix, cmd) => `Uso: ${prefix}${cmd} [número]`,
    noPrefDelSuccess: "✅ NoPrefix removido.",
    noPrefDelInvalid: "❌ Posição inválida.",
    aliasAddUsage: (prefix) => `Uso: ${prefix}addalias apelido/comando`,
    aliasAddSuccess: (alias, target) => `✅ Alias '${alias}' -> '${target}' adicionado!`,
    aliasAddError: "❌ Erro ao salvar.",
    aliasListEmpty: "📜 Nenhum alias cadastrado.",
    aliasListHeader: "📋 *APELIDOS DE COMANDOS*\n\n",
    aliasDelProvide: "Informe o alias.",
    aliasDelSuccess: "✅ Alias removido.",
    aliasDelNotFound: "❌ Não encontrado.",
    cmdAddUsage: (prefix) => `Uso: ${prefix}addcmd trigger | resposta`,
    cmdAddSuccess: (trigger) => `✅ Comando personalizado '${trigger}' adicionado!`,
    cmdListEmpty: "📪 Sem comandos personalizados.",
    cmdListHeader: "📋 *COMANDOS PERSONALIZADOS*\n\n",
    cmdDelProvide: "Informe o trigger.",
    cmdDelNotFound: "❌ Não encontrado.",
    cmdDelSuccess: "✅ Removido."
  },
  extra_protections: {
    antilinkgpOn: "✅ *Antilinkgp foi ativado com sucesso!*\n\nAgora, se alguém enviar links de outros grupos, será banido automaticamente. Mantenha o grupo seguro! 🛡️",
    antilinkgpOff: "⚠️ *Antilinkgp foi desativado.*\n\nLinks de outros grupos não serão mais bloqueados. Use com cuidado! 🔓",
    antilinkcanalOn: "✅ *Antilinkcanal foi ativado!*\n\nNão serão tolerados links de canais neste grupo. Quem desrespeitar, levará ban! 🛡️",
    antilinkcanalOff: "⚠️ *Antilinkcanal desativado.*\n\nFiquem à vontade, links de canais são permitidos novamente. 🔓",
    genericStatus: (cmd, status) => `🔗 *PROTEÇÃO DE LINK: ${cmd.toUpperCase()}*\n\nStatus: ${status}`,
    genericUpdate: (cmd) => `✅ Proteção ${cmd} atualizada.`
  },
  group_admin_extra: {
    autostickerToggle: (enabled) => `✨ Auto figurinhas ${enabled ? 'ativadas' : 'desativadas'}! ${enabled ? 'Todas as imagens e vídeos serão convertidos em figurinhas.' : ''}`,
    autorepoToggle: (enabled) => `✨ Auto resposta ${enabled ? 'ativada' : 'desativada'}!`,
    welcomeUsage: (prefix) => `📝 *Configuração da Mensagem de Boas-Vindas*\n\nPara definir uma mensagem personalizada, digite o comando seguido do texto desejado. Você pode usar as seguintes variáveis:\n\n- *#numerodele#* → Marca o novo membro.\n- *#nomedogp#* → Nome do grupo.\n- *#desc#* → Descrição do grupo.\n- *#membros#* → Número total de membros no grupo.\n\n📌 *Exemplo:*\n${prefix}legendabv Bem-vindo(a) #numerodele# ao grupo *#nomedogp#*! Agora somos #membros# membros. Leia a descrição: #desc#`,
    welcomeSuccess: (msg) => `✅ *Mensagem de boas-vindas configurada com sucesso!*\n\n📌 Nova mensagem:\n"${msg}"`,
    genericUpdate: (cmd) => `✅ Configuração ${cmd} atualizada.`
  },
  group_management: {
    sorteio: {
      nameUsage: (prefix) => `📝 Use: ${prefix}sorteionome <nome1>, <nome2>, ...`,
      minNames: "❌ Forneça pelo menos 2 nomes.",
      resultName: (vencedor) => `🎉 *Resultado do Sorteio* 🎉\n\n🏆 O vencedor é: *${vencedor}*`,
      minMembers: "❌ Membros insuficientes para sorteio.",
      invalidAmount: "❌ Quantidade inválida.",
      resultHeader: "🎉 *Resultado do Sorteio* 🎉\n\n",
      resultItem: (pos, user) => `🏆 *#${pos}* - @${user}`,
      error: "❌ Erro ao realizar sorteio."
    },
    hidetag: {
      defaultMsg: "Mencionando todos...",
      error: "❌ Erro no hidetag/cita."
    },
    protections: {
      floodUsage: (prefix) => `Intervalo em s ou "off". Ex: ${prefix}antiflood 5`,
      floodInvalid: "Inválido.",
      floodToggle: (enabled) => `✅ Antiflood ${enabled ? 'ativado' : 'desativado'}!`,
      genericToggle: (feature, enabled) => `✅ *${feature}* ${enabled ? 'ativado' : 'desativado'}!`
    },
    antifake: {
      ddiInfo: (currentDDI, prefix) => `🌐 *Configuração de DDI Permitido*\n\n` +
            `DDI atual: *${currentDDI}*\n\n` +
            `💡 *Como usar:*\n` +
            `• ${prefix}antifake ddi 55 — Apenas Brasil\n` +
            `• ${prefix}antifake ddi 55,351 — Brasil + Portugal\n` +
            `• ${prefix}antifake ddi 55,54,598 — Brasil + Argentina + Uruguai`,
      ddiInvalid: (prefix) => `❌ DDI inválido! Use números separados por vírgula.\nExemplo: ${prefix}antifake ddi 55,351`,
      ddiSuccess: (ddis) => `✅ *DDI atualizado!*\n\n` +
            `🌐 DDIs permitidos: *${ddis}*\n\n` +
            `Números que não começarem com esses DDIs serão banidos automaticamente ao entrar.`,
      wlAddUsage: (prefix) => `❌ Informe o número.\nExemplo: ${prefix}antifake wl add 1234567890`,
      wlAddExists: (num) => `ℹ️ O número *${num}* já está na whitelist.`,
      wlAddSuccess: (num) => `✅ *${num}* adicionado à whitelist do antifake.\n\nEsse número poderá entrar no grupo mesmo sendo estrangeiro.`,
      wlRemUsage: (prefix) => `❌ Informe o número.\nExemplo: ${prefix}antifake wl remove 1234567890`,
      wlRemNotFound: (num) => `❌ O número *${num}* não está na whitelist.`,
      wlRemSuccess: (num) => `✅ *${num}* removido da whitelist do antifake.`,
      wlListEmpty: (prefix) => `📭 Nenhum número na whitelist do antifake.\n\n💡 Use: ${prefix}antifake wl add <número>`,
      wlListHeader: (count) => `📋 *Whitelist Anti-Fake* (${count})\n\n`,
      wlUsage: (prefix) => `🛡️ *Whitelist Anti-Fake*\n\n💡 *Comandos:*\n• ${prefix}antifake wl add <número>\n• ${prefix}antifake wl remove <número>\n• ${prefix}antifake wl lista`,
      logEmpty: "📭 Nenhum registro de antifake para este grupo.",
      logHeader: (count) => `📋 *Log Anti-Fake* (últimos ${count})\n\n`,
      logError: "❌ Erro ao carregar logs.",
      statusOn: (currentDDI, wlCount, prefix) => `🛡️ *ANTIFAKE ATIVADO!*\n\n` +
            `Números estrangeiros serão banidos automaticamente ao entrar no grupo.\n\n` +
            `🌐 DDIs permitidos: *${currentDDI}*\n` +
            `📋 Whitelist: *${wlCount} número(s)*\n\n` +
            `💡 *Configurações:*\n` +
            `• ${prefix}antifake ddi 55,351 — DDIs permitidos\n` +
            `• ${prefix}antifake wl add <nº> — Whitelist\n` +
            `• ${prefix}antifake log — Ver histórico\n` +
            `• ${prefix}antifake — Desativar`,
      statusOff: (prefix) => `⚠️ *ANTIFAKE DESATIVADO*\n\nNúmeros estrangeiros não serão mais bloqueados. Use ${prefix}antifake para reativar.`
    },
    config: {
      prefixUsage: (prefix) => `Uso: ${prefix}setprefix <símbolo>`,
      prefixReserved: "Símbolo reservado 💔",
      prefixSuccess: (pfx) => `✅ Prefixo alterado para "${pfx}"`,
      gameModeToggle: (enabled) => `🎮 Modo brincadeira ${enabled ? 'ativado' : 'desativado'}!`,
      limitDelSuccess: "🗑️ Limite de mensagens removido.",
      limitUsage: (prefix) => `Uso: ${prefix}limitmessage <quantidade> <tempo(s|m|h)> <ação(ban|adv)>`,
      limitInvalid: "Formato inválido.",
      limitSuccess: (limit, time, action) => `✅ Limite configurado: ${limit} msgs/${time} -> ${action}`
    },
    status: {
      openX9: (user) => `📢 *X9 Report:* Grupo aberto por @${user}`,
      openSuccess: "✅ Grupo aberto.",
      closeX9: (user) => `📢 *X9 Report:* Grupo fechado por @${user}`,
      closeSuccess: "✅ Grupo fechado.",
      usage: (prefix, cmd) => `💡 Uso: ${prefix}${cmd} <abrir|fechar>`,
      openScheduleUsage: (prefix, cmd) => `Uso: ${prefix}${cmd} HH:MM (24h)\nExemplos: ${prefix}${cmd} 07:00 | ${prefix}${cmd} off`,
      openScheduleRemSuccess: "✅ Agendamento diário para ABRIR o grupo foi removido.",
      scheduleInvalid: (err, prefix, cmd, ex) => `⏰ ${err}\nExemplo: ${prefix}${cmd} ${ex}`,
      scheduleUnrecognized: (prefix, cmd, ex) => `⏰ Não consegui entender o horário informado. Use o formato HH:MM, por exemplo ${prefix}${cmd} ${ex}`,
      openScheduleSuccess: (time, isBotAdmin) => `✅ Agendamento salvo! O grupo será ABERTO todos os dias às ${time} (horário de São Paulo).${!isBotAdmin ? '\n⚠️ Observação: Eu preciso ser administrador para efetivar a abertura no horário.' : ''}`,
      closeScheduleUsage: (prefix, cmd) => `Uso: ${prefix}${cmd} HH:MM (24h)\nExemplos: ${prefix}${cmd} 22:30 | ${prefix}${cmd} off`,
      closeScheduleRemSuccess: "✅ Agendamento diário para FECHAR o grupo foi removido.",
      closeScheduleSuccess: (time, isBotAdmin) => `✅ Agendamento salvo! O grupo será FECHADO todos os dias às ${time} (horário de São Paulo).${!isBotAdmin ? '\n⚠️ Observação: Eu preciso ser administrador para efetivar o fechamento no horário.' : ''}`
    },
    media: {
      photoProvide: "Marque uma imagem.",
      photoSuccess: "✅ Foto alterada.",
      photoError: "❌ Erro ao alterar foto.",
      nameProvide: "Informe o nome.",
      nameSuccess: "✅ Nome alterado.",
      descSuccess: "✅ Descrição alterada.",
      onlyAdmToggle: (enabled) => enabled ? `✅ *Modo apenas adm ativado!* Agora apenas administradores do grupo poderão utilizar o bot.` : `⚠️ *Modo apenas adm desativado!* Agora todos os membros podem utilizar o bot novamente.`
    },
    requests: {
      empty: "📭 Não há solicitações pendentes.",
      header: (count) => `📬 *SOLICITAÇÕES PENDENTES* (${count})\n\n`,
      fetchError: "❌ Erro ao buscar solicitações.",
      actionSuccess: "✅ Aprovado!",
      actionReject: "❌ Recusado!",
      actionError: "❌ Erro na operação.",
      autoUsage: (prefix, cmd) => `Uso: ${prefix}${cmd} on/off`,
      autoToggle: (name, enabled) => `✅ ${name}: *${enabled ? 'ATIVADO' : 'DESATIVADO'}*`
    },
  },
  group_security: {
    welcome: {
        on: '✅ *Boas-vindas ativadas!* Agora, novos membros serão recebidos com uma mensagem personalizada.\n📝 Para configurar a mensagem, use: *${prefix}legendabv*',
        off: '⚠️ *Boas-vindas desativadas!* O grupo não enviará mais mensagens para novos membros.',
        exitOn: '✅ *Despedidas ativadas!* Agora, o grupo se despedirá de quem sair.\n📝 Para configurar a mensagem, use: *${prefix}textsaiu*',
        exitOff: '⚠️ *Despedidas desativadas!* O grupo não enviará mais mensagens para quem sair.',
        imgProvide: 'Envie/marque uma imagem.',
        imgSuccess: '✅ Imagem configurada!',
        imgError: '❌ Erro no upload.',
        imgNone: '❌ Não há imagem configurada.',
        imgRmWelcome: '✅ Imagem de boas-vindas removida!',
        imgRmExit: '✅ Imagem de saída removida!',
        msgUsage: (prefix, cmd) => `Uso: ${prefix}${cmd} <mensagem>\n\nTags: #numerodele#, #nomedogp#, #membros#, #desc#`,
        msgSuccess: '✅ Mensagem de saída salva!'
      },
      ghost: {
        usage: (prefix) => `Uso: ${prefix}banghost <limite_msgs>`,
        none: 'Nenhum fantasma encontrado.',
        success: (count) => `✅ ${count} fantasmas removidos!`
      },
      antiBan: {
        on: '✅ Proteção Anti-Ban ativada! Limite de usos aplicado para marcas em massa.',
        off: '✅ Proteção Anti-Ban desativada!',
        status: (isEnabled, memberCount, uses, maxUses) => `📊 *STATUS ANTI-BAN*\n\n🔒 Ativo: ${isEnabled ? 'Sim' : 'Não'}\n👥 Membros: ${memberCount}\n📝 Usos: ${uses}/${maxUses}`,
        usage: (prefix, cmd) => `Uso: ${prefix}${cmd} <on/off/status>`
      },
      warnings: {
        empty: 'Sem advertências.',
        header: '📋 *ADVERTÊNCIAS*\n\n',
        item: (user, length) => `@${user}: ${length}/3\n`,
        removed: '✅ Advertência removida.',
        banned: (user, reason) => `🚫 @${user} recebeu 3 advertências e foi banido!\nÚltima advertência: ${reason}`,
        warned: (user, length, reason) => `⚠️ @${user} recebeu uma advertência (${length}/3).\nMotivo: ${reason}`
      },
      tickets: {
        empty: '📪 Sem tickets abertos.',
        header: '🎫 *TICKETS ABERTOS*\n\n',
        item: (id, user, msg) => `ID: ${id} | De: @${user}\nMsg: ${msg}\n\n`,
        provideId: 'Informe o ID do ticket.',
        toggle: (isOn) => `✅ Suporte ${isOn ? 'ativado' : 'desativado'}!`,
        opened: (id) => `✅ Ticket #${id} aberto! Aguarde contato.`
      },
      blacklist: {
        empty: 'Vazia.',
        header: '📋 BLACKLIST:\n',
        removed: '✅ Removido.',
        notIn: '❌ Este usuário não está na blacklist.',
        alreadyIn: '❌ Este usuário já está na blacklist.',
        added: '✅ Adicionado.'
      },
      clean: {
        fallback: '✅ Limpeza concluída!'
      },
      protections: {
        genericAction: (feature, action) => `🛡️ *${feature}* ativado!\n🔧 Ação: *${action === 'banir' ? 'Apagar + Banir 🔨' : 'Apenas apagar 🗑️'}*`,
        genericStatus: (feature, action, cmds) => `🛡️ *${feature}* ativado!\n🔧 Ação atual: *${action === 'banir' ? 'Apagar + Banir 🔨' : 'Apenas apagar 🗑️'}*\n\n📝 Para mudar a ação:\n${cmds}`,
        genericOff: (feature) => `🛡️ *${feature}* desativado!`,
        unavailable: (system) => `❌ Sistema ${system} indisponível.`,
        antiPaymentOn: '🛡️ *Anti-Payment* ativado!\n\n🔧 Ações automáticas:\n• 🔒 Fechar grupo temporariamente\n• 🚫 Banir o remetente\n• 🗑️ Limpar o chat\n• 🔓 Reabrir o grupo automaticamente\n\n💡 Admins, owners e whitelisted não são afetados.',
        antiPaymentOff: '🛡️ *Anti-Payment* desativado!',
        mediaVizuToggle: (feature, isVizu) => `🛡️ *${feature} (Vizu Única)*: ${isVizu ? '✅ Ativado! Mídias de visualização única também serão bloqueadas.' : '❌ Desativado! Apenas mídias normais serão bloqueadas.'}`,
        mediaStatus: (feature, action, isVizu, cmds) => `🛡️ *${feature}* ativado!\n🔧 Ação atual: *${action === 'banir' ? 'Apagar + Banir 🔨' : 'Apenas apagar 🗑️'}*\n👁️ Bloquear Vizu Única: *${isVizu ? '✅ Sim' : '❌ Não'}*\n\n📝 Configurações:\n${cmds}`,
        limitUpdate: (feature, limit) => `✅ Limite de advertências do ${feature} alterado para *${limit}*.`,
        antifigOn: '✅ Antifig ativado! Figurinhas serão apagadas e o remetente receberá advertências.',
        antifigOff: '✅ Antifig desativado! Figurinhas agora são permitidas.'
      }
    },
    linkgp: {
      message: (groupName, participantCount, adminCount, dateStr, link) => `*🔗 LINK DO GRUPO 🔗*\n\n📝 *Informações:*\n\n👥 *Grupo:* ${groupName}\n👤 *Membros:* ${participantCount}\n👑 *Admins:* ${adminCount}\n🕒 *Gerado em:* ${dateStr}\n\n_🌐 *Link de convite:*_\n${link}\n\n_⚠️ *Avisos:*_\n  Compartilhe apenas com quem confia\n  Administradores podem revogar o link nas configurações do grupo\n_📱 *Compartilhe com responsabilidade!* 📱_`
    },
    marcar: {
      empty: '❌ Nenhum membro para mencionar.',
      membersHeader: (q) => `📢 *Membros mencionados:* ${q ? `\n💬 *Mensagem:* ${q}` : ''}\n\n`,
      memberItem: (user) => `👉 @${user}`,
      adminsHeader: (q, pushname) => `🛡️ *ADMINISTRADORES DO GRUPO*\n\n💬 *Mensagem:* ${q || 'Nenhuma'}\n👤 *Por:* ${pushname}\n\n`,
      adminItem: (user) => `• @${user}\n`,
      adminsTotal: (count) => `\n📊 *Total:* ${count}`
    },
    minmessage: {
      usage: (prefix) => `Uso: ${prefix}minmessage <mínimo de dígitos> <ban/adv> ou ${prefix}minmessage off`,
      off: '✅ Sistema de legenda mínima desativado.',
      invalid: (prefix) => `Formato inválido. Use: ${prefix}minmessage <número positivo> <ban/adv>`,
      success: (minDigits, action) => `✅ Configurado: Mínimo de ${minDigits} caracteres em legendas de fotos/vídeos. Ação em violação: ${action === 'ban' ? 'banir' : 'advertir'}.`,
      error: 'Ocorreu um erro ao configurar 💔'
    },
    moderators: {
      addUsage: (prefix) => `Marque o usuário que deseja promover a moderador. Ex: ${prefix}addmod @usuário`,
      alreadyMod: (user) => `@${user} já é um moderador.`,
      addSuccess: (user) => `✅ @${user} foi promovido a moderador do grupo!`,
      delUsage: (prefix) => `Marque o usuário que deseja remover de moderador. Ex: ${prefix}delmod @usuário`,
      notMod: (user) => `@${user} não é um moderador.`,
      delSuccess: (user) => `✅ @${user} não é mais um moderador do grupo.`,
      listEmpty: '🛡️ Não há moderadores definidos para este grupo.',
      listHeader: (groupName) => `🛡️ *Moderadores do Grupo ${groupName}* 🛡️\n\n`,
      listItem: (user) => `➥ @${user}\n`,
      grantUsage: (prefix) => `Por favor, especifique o comando para permitir aos moderadores. Ex: ${prefix}grantmodcmd ban`,
      alreadyGranted: (cmd) => `Comando "${cmd}" já está permitido para moderadores.`,
      grantSuccess: (prefix, cmd) => `✅ Moderadores agora podem usar o comando: ${prefix}${cmd}`,
      revokeUsage: (prefix) => `Por favor, especifique o comando para proibir aos moderadores. Ex: ${prefix}revokemodcmd ban`,
      notGranted: (cmd) => `Comando "${cmd}" não estava permitido para moderadores.`,
      revokeSuccess: (prefix, cmd) => `✅ Moderadores não podem mais usar o comando: ${prefix}${cmd}`,
      cmdsEmpty: '🔧 Nenhum comando específico permitido para moderadores neste grupo.',
      cmdsHeader: (groupName) => `🔧 *Comandos Permitidos para Moderadores em ${groupName}* 🔧\n\n`,
      cmdsItem: (prefix, cmd) => `➥ ${prefix}${cmd}\n`
    },
    modolite: {
      on: '🔞 *Modo Lite ativado!* O conteúdo inapropriado para crianças será filtrado neste grupo.',
      off: '🔓 *Modo Lite desativado!* O conteúdo do menu de brincadeiras será exibido completamente.'
    },
    mute: {
      success: (user) => `✅ @${user} foi mutado. Se enviar mensagens, será banido.`
    },
    mute2: {
      success: (user) => `✅ @${user} foi mutado. Suas mensagens serão apagadas automaticamente.`
    },
    promover: {
      x9: (target, sender) => `⬆️ *X9 Report:* @${target} foi promovido(a) a ADM por @${sender}.`,
      success: '✅ Usuário promovido a administrador!'
    },
    rebaixar: {
      x9: (target, sender) => `⬇️ *X9 Report:* @${target} foi rebaixado(a) de ADM por @${sender}.`,
      success: '✅ Usuário rebaixado com sucesso!'
    },
    tools: {
      mention: {
        usage: (prefix) => `🔔 *Configuração de Marcações*\n\n🔔 Escolha como deseja ser mencionado:\n\n🔘 *${prefix}mention all*   Marcado em tudo (marcações e jogos).\n🔔 *${prefix}mention marca*   Apenas em marcações de administradores.\n🎮 *${prefix}mention games*   Somente em jogos do bot.\n📴 *${prefix}mention 0*   Não será mencionado em nenhuma ocasião.`,
        all: '✅ Você agora será mencionado em todas as interações do bot, incluindo marcações de administradores e os jogos!',
        marca: '🔔 A partir de agora, você será mencionado apenas quando um administrador marcar.',
        games: '🎮 Você optou por ser mencionado somente em jogos do bot.',
        '0': '📴 Silêncio ativado! Você não será mais mencionado pelo bot, nem em marcações nem em jogos.',
        selected: (message) => `*${message}*`,
        invalid: (prefix) => `❌ Opção inválida! Use *${prefix}mention* para ver as opções.`
      },
      del: {
        missingQuoted: "❌ Responda à mensagem que deseja deletar.",
        error: "❌ Não consegui deletar a mensagem. Verifique se sou administrador."
      },
      block: {
        missingTarget: "❌ Marque o usuário que deseja bloquear/desbloquear.",
        successBlock: "✅ Usuário bloqueado com sucesso!",
        successUnblock: "✅ Usuário desbloqueado com sucesso!",
        error: "❌ Erro ao atualizar status de bloqueio."
      }
    },
    unblockcmd: {
      usage: (prefix) => `❌ Digite o comando que deseja desbloquear. Exemplo: ${prefix}unblockcmd sticker`,
      success: (cmd) => `🔓 O comando *${cmd}* foi desbloqueado e pode ser usado por todos.`,
      notBlocked: '❌ Este comando não está bloqueado.'
    },
    unmute: {
      success: (user) => `✅ @${user} foi desmutado e pode enviar mensagens novamente.`,
      notMuted: '❌ Este usuário não está mutado.'
    },
    unmute2: {
      success: (user) => `✅ @${user} foi desmutado e pode enviar mensagens novamente.`,
      notMuted: '❌ Este usuário não está mutado no sistema mute2.'
    },
    whitelist: {
      listEmpty: '📋 Whitelist vazia.',
      listHeader: '📋 *Whitelist do Grupo*\n\n',
      listItem: (index, user, antis) => `${index}. @${user}\n   Antis: ${antis}\n\n`,
      addUsage: (prefix) => `Uso: ${prefix}wl.add @user | anti1,anti2`,
      missingAntis: "Especifique os antis!",
      addSuccess: (user) => `✅ @${user} adicionado!`,
      missingUser: "Marque o usuário!",
      removeSuccess: "✅ Removido da whitelist."
    },
    x9: {
      statusMessage: (emoji, status) => `${emoji} *Modo X9 ${status}!*\n\n`,
      onInfo: `📋 *O que o modo X9 faz?*\n  Reporta quando alguém é promovido a ADM\n  Reporta quando alguém é removido como ADM\n  Reporta quando alguém é removido do grupo\n  Reporta quando alguém entra no grupo\n  Reporta quando o grupo é atualizado\n\n📢 *Os reports serão enviados no grupo com menções!*\n⚠️ *Use com responsabilidade* ⚠️`,
      offInfo: `📋 Modo X9 desativado.\nNenhuma ação administrativa será reportada no grupo.`,
      error: "❌ Ocorreu um erro ao configurar o modo X9."
    }
};
