import { PREFIX } from "../../config.js";

export default {
  name: "group_management",
  description: "Gerenciamento avançado de grupos",
  commands: ["abrirgp", "aceitar", "aceitarconvite", "aceitarrpg", "alterardesc", "alterarfoto", "alterarnome", "antibotao", "antibtn", "antidelete", "antidoc", "antiflood", "antilinkhard", "antiloc", "approve", "aprovar", "autoacceptr", "autoaceitarsolic", "autoaprovar", "autodl", "autodown", "captcha", "captcharequests", "captchasolic", "cita", "closegp", "dellimitmessage", "descgrupo", "descricao", "expulsar", "familia", "family", "fechargp", "fotogp", "fotogrupo", "gamemode", "gp", "group", "grupo", "hidetag", "kickcla", "limitmessage", "modobn", "modobrincadeira", "modobrincadeiras", "mudardesc", "mudarfoto", "mudarnome", "nomegp", "onlyadm", "opengp", "pendentes", "recusar", "recusarconvite", "recusarsolic", "recusarsolicitacao", "reject", "renomeargrupo", "requests", "setdesc", "setfoto", "setname", "setprefix", "soadm", "soadmin", "solicitacoes", "sorteio", "sorteionome", "totag"],
  handle: async ({ 
    nazu, from, info, command, args, reply, prefix, pushname, sender, q,
    isGroup, isGroupAdmin, isBotAdmin, isOwner, AllgroupMembers, groupData, groupFile,
    getUserName, optimizer, GRUPOS_DIR, DATABASE_DIR, buildGroupFilePath,
    getFileBuffer, isQuotedMsg, isQuotedImage, isQuotedVideo, isQuotedAudio, 
    isQuotedDocument, isQuotedDocW, isQuotedSticker, checkMassMentionLimit,
    registerMassMentionUse, MASS_MENTION_THRESHOLD, loadMassMentionConfig,
    fs, pathz, generateWAMessageFromContent, menc_os2
  , MESSAGES }) => {
    const cmd = command.toLowerCase();

    // ═══════════════════════════════════════════════════════════════
    // 🎲 SORTEIOS
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'sorteio' || cmd === 'sorteionome') {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      try {
        const path = buildGroupFilePath(from);
        const data = await optimizer.loadJsonWithCache(path, { mark: {} });
        
        if (cmd === 'sorteionome') {
          if (!q) return reply(`📝 Use: ${prefix}sorteionome <nome1>, <nome2>, ...`);
          const nomes = q.split(',').map(n => n.trim()).filter(Boolean);
          if (nomes.length < 2) return reply("❌ Forneça pelo menos 2 nomes.");
          const vencedor = nomes[Math.floor(Math.random() * nomes.length)];
          return reply(`🎉 *Resultado do Sorteio* 🎉\n\n🏆 O vencedor é: *${vencedor}*`);
        }

        const membros = AllgroupMembers.filter(m => !['0', 'marca'].includes(data.mark?.[m]));
        if (membros.length < 2) return reply('❌ Membros insuficientes para sorteio.');
        const numVencedores = parseInt(q) || 1;
        if (numVencedores < 1 || numVencedores > membros.length) return reply('❌ Quantidade inválida.');
        
        const vencedores = [];
        const pool = [...membros];
        for (let i = 0; i < numVencedores; i++) {
          const idx = Math.floor(Math.random() * pool.length);
          vencedores.push(pool.splice(idx, 1)[0]);
        }
        
        const text = `🎉 *Resultado do Sorteio* 🎉\n\n` + vencedores.map((v, i) => `🏆 *#${i + 1}* - @${getUserName(v)}`).join('\n');
        return reply(text, { mentions: vencedores });
      } catch (e) {
        console.error(e);
        return reply("❌ Erro ao realizar sorteio.");
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 📢 MENSAGENS EM MASSA (HIDETAG)
    // ═══════════════════════════════════════════════════════════════
    if (['totag', 'cita', 'hidetag'].includes(cmd)) {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);

      try {
        const massCheck = checkMassMentionLimit(from, AllgroupMembers.length);
        if (!massCheck.allowed) return reply(massCheck.message);

        const data = await optimizer.loadJsonWithCache(buildGroupFilePath(from), { mark: {} });
        const mentions = AllgroupMembers.filter(m => !['0', 'games'].includes(data.mark?.[m]));

        let messageToSend = {};
        const quoted = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (quoted) {
          if (quoted.imageMessage) {
            messageToSend = {
              image: await getFileBuffer(quoted.imageMessage, 'image'),
              caption: q || quoted.imageMessage.caption || '',
              mentions
            };
          } else if (quoted.videoMessage) {
            messageToSend = {
              video: await getFileBuffer(quoted.videoMessage, 'video'),
              caption: q || quoted.videoMessage.caption || '',
              mentions
            };
          } else if (quoted.documentMessage) {
            messageToSend = {
              document: await getFileBuffer(quoted.documentMessage, 'document'),
              mimetype: quoted.documentMessage.mimetype,
              fileName: quoted.documentMessage.fileName,
              caption: q || quoted.documentMessage.caption || '',
              mentions
            };
          } else if (quoted.audioMessage) {
            messageToSend = {
              audio: await getFileBuffer(quoted.audioMessage, 'audio'),
              mimetype: quoted.audioMessage.mimetype,
              ptt: quoted.audioMessage.ptt,
              mentions
            };
          } else if (quoted.stickerMessage) {
            messageToSend = {
              sticker: await getFileBuffer(quoted.stickerMessage, 'sticker'),
              mentions
            };
          } else if (quoted.extendedTextMessage) {
            messageToSend = { text: q || quoted.extendedTextMessage.text, mentions };
          } else if (quoted.conversation) {
            messageToSend = { text: q || quoted.conversation, mentions };
          } else {
            messageToSend = { text: q || 'Mencionando todos...', mentions };
          }
        } else {
          messageToSend = { text: q || 'Mencionando todos...', mentions };
        }

        await nazu.sendMessage(from, messageToSend);
        registerMassMentionUse(from);
      } catch (e) {
        console.error(e);
        return reply("❌ Erro no hidetag/cita.");
      }
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // 🛡️ PROTEÇÕES ADICIONAIS
    // ═══════════════════════════════════════════════════════════════
    if (['antilinkhard', 'antibotao', 'antibtn', 'antidelete', 'antidel', 'autodl', 'autodown', 'antidoc', 'antiloc', 'antiflood'].includes(cmd)) {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!isBotAdmin && cmd !== 'autodl' && cmd !== 'autodown') return reply(MESSAGES.permission.botAdminOnly);

      const featureMap = {
        'antidel': 'antidel',
        'antidelete': 'antidel',
        'autodl': 'autodl',
        'autodown': 'autodl'
      };
      
      const feature = featureMap[cmd] || cmd;

      if (cmd === 'antiflood') {
        if (!q) return reply(`Intervalo em s ou "off". Ex: ${prefix}antiflood 5`);
        const antifloodFile = pathz.join(DATABASE_DIR, 'antiflood.json');
        let floodData = await optimizer.loadJsonWithCache(antifloodFile, {});
        floodData[from] = floodData[from] || {};
        if (q.toLowerCase() === 'off') {
          floodData[from].enabled = false;
        } else {
          const interval = parseInt(q);
          if (isNaN(interval) || interval < 1) return reply("Inválido.");
          floodData[from].enabled = true;
          floodData[from].interval = interval;
        }
        await optimizer.saveJsonWithCache(antifloodFile, floodData);
        return reply(`✅ Antiflood ${floodData[from].enabled ? 'ativado' : 'desativado'}!`);
      }

      groupData[feature] = !groupData[feature];
      await optimizer.saveJsonWithCache(groupFile, groupData);
      return reply(`✅ *${feature}* ${groupData[feature] ? 'ativado' : 'desativado'}!`);
    }

    // ═══════════════════════════════════════════════════════════════
    // ⚙️ CONFIGURAÇÕES DE GRUPO
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'setprefix') {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!q) return reply(`Uso: ${prefix}setprefix <símbolo>`);
      const newPrefix = q.trim().charAt(0);
      if (newPrefix === '$') return reply("Símbolo reservado 💔");
      groupData.customPrefix = newPrefix;
      await optimizer.saveJsonWithCache(groupFile, groupData);
      return reply(`✅ Prefixo alterado para "${newPrefix}"`);
    }

    if (['modobrincadeira', 'modobrincadeiras', 'modobn', 'gamemode'].includes(cmd)) {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      groupData.modobrincadeira = !groupData.modobrincadeira;
      await optimizer.saveJsonWithCache(groupFile, groupData);
      return reply(`🎮 Modo brincadeira ${groupData.modobrincadeira ? 'ativado' : 'desativado'}!`);
    }

    if (['limitmessage', 'dellimitmessage'].includes(cmd)) {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      
      if (cmd === 'dellimitmessage') {
        delete groupData.messageLimit;
        await optimizer.saveJsonWithCache(groupFile, groupData);
        return reply("🗑️ Limite de mensagens removido.");
      }

      if (args.length < 3) return reply(`Uso: ${prefix}limitmessage <quantidade> <tempo(s|m|h)> <ação(ban|adv)>`);
      const limit = parseInt(args[0]);
      const timeMatch = args[1].toLowerCase().match(/^(\d+)(s|m|h)$/);
      const action = args[2].toLowerCase();

      if (isNaN(limit) || !timeMatch || !['ban', 'adv'].includes(action)) return reply("Formato inválido.");
      
      let seconds = parseInt(timeMatch[1]);
      if (timeMatch[2] === 'm') seconds *= 60;
      else if (timeMatch[2] === 'h') seconds *= 3600;

      groupData.messageLimit = { enabled: true, limit, interval: seconds, action, users: {} };
      await optimizer.saveJsonWithCache(groupFile, groupData);
      return reply(`✅ Limite configurado: ${limit} msgs/${args[1]} -> ${action}`);
    }

    // ═══════════════════════════════════════════════════════════════
    // 🚪 GRUPO STATUS (ABRIR/FECHAR)
    // ═══════════════════════════════════════════════════════════════
    if (['grupo', 'gp', 'group', 'opengp', 'closegp', 'abrirgp', 'fechargp'].includes(cmd)) {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      
      const param = (q || '').toLowerCase();
      const shouldOpen = ['a', 'o', 'open', 'abrir'].includes(param) || cmd === 'opengp' || cmd === 'abrirgp';
      const shouldClose = ['f', 'c', 'close', 'fechar'].includes(param) || cmd === 'closegp' || cmd === 'fechargp';

      if (shouldOpen) {
        await nazu.groupSettingUpdate(from, 'not_announcement');
        if (groupData?.x9) {
          await nazu.sendMessage(from, { text: `📢 *X9 Report:* Grupo aberto por @${sender.split('@')[0]}`, mentions: [sender] }).catch(e => {});
        }
        return reply('✅ Grupo aberto.');
      } else if (shouldClose) {
        await nazu.groupSettingUpdate(from, 'announcement');
        if (groupData?.x9) {
          await nazu.sendMessage(from, { text: `📢 *X9 Report:* Grupo fechado por @${sender.split('@')[0]}`, mentions: [sender] }).catch(e => {});
        }
        return reply('✅ Grupo fechado.');
      }
      return reply(`💡 Uso: ${prefix}${cmd} <abrir|fechar>`);
    }

    // ═══════════════════════════════════════════════════════════════
    // 🖼️ FOTO, NOME E DESCRIÇÃO
    // ═══════════════════════════════════════════════════════════════
    if (['fotogp', 'fotogrupo', 'setppgp', 'setfoto'].includes(cmd)) {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      if (!isQuotedImage && !isQuotedMsg && !info.message?.imageMessage) return reply("Marque uma imagem.");

      try {
        const media = isQuotedImage ? info.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage : info.message.imageMessage;
        const buffer = await getFileBuffer(media, 'image');
        await nazu.updateProfilePicture(from, buffer);
        return reply("✅ Foto alterada.");
      } catch (e) { return reply("❌ Erro ao alterar foto."); }
    }

    if (cmd === 'nomegp' || cmd === 'setname') {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      if (!q) return reply("Informe o nome.");
      await nazu.groupUpdateSubject(from, q);
      return reply("✅ Nome alterado.");
    }

    if (cmd === 'descgp' || cmd === 'descgrupo' || cmd === 'setdesc') {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      await nazu.groupUpdateDescription(from, q || '');
      return reply("✅ Descrição alterada.");
    }

    if (cmd === 'soadm' || cmd === 'adminonly' || cmd === 'soadmin') {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      
      groupData.soadm = !groupData.soadm;
      await optimizer.saveJsonWithCache(groupFile, groupData);
      
      if (groupData.soadm) {
        return reply(`✅ *Modo apenas adm ativado!* Agora apenas administradores do grupo poderão utilizar o bot.`);
      } else {
        return reply(`⚠️ *Modo apenas adm desativado!* Agora todos os membros podem utilizar o bot novamente.`);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 📬 SOLICITAÇÕES DE ENTRADA
    // ═══════════════════════════════════════════════════════════════
    if (['requests', 'solicitacoes', 'pendentes'].includes(cmd)) {
      if (!isGroupAdmin && !isOwner) return reply(MESSAGES.permission.adminOnly);
      try {
        const requests = await nazu.groupRequestParticipantsList(from);
        if (!requests || requests.length === 0) return reply("📭 Não há solicitações pendentes.");
        let msg = `📬 *SOLICITAÇÕES PENDENTES* (${requests.length})\n\n`;
        const mentions = [];
        requests.forEach((req, i) => {
          msg += `${i + 1}. @${req.jid.split('@')[0]}\n`;
          mentions.push(req.jid);
        });
        return nazu.sendMessage(from, { text: msg, mentions });
      } catch (e) { return reply("❌ Erro ao buscar solicitações."); }
    }

    if (['aprovar', 'aceitar', 'approve', 'recusarsolic', 'recusar', 'reject'].includes(cmd)) {
      if (!isGroupAdmin && !isOwner) return reply(MESSAGES.permission.adminOnly);
      const type = ['aprovar', 'aceitar', 'approve'].includes(cmd) ? 'approve' : 'reject';
      const target = menc_os2 || (args[0] && args[0].includes('@') ? args[0].replace('@', '') + '@s.whatsapp.net' : null);
      if (!target) return reply(MESSAGES.permission.mentionRequired);
      try {
        await nazu.groupRequestParticipantsUpdate(from, [target], type);
        return reply(`${type === 'approve' ? '✅ Aprovado!' : '❌ Recusado!'}`);
      } catch (e) { return reply("❌ Erro na operação."); }
    }

    if (['autoaceitarsolic', 'autoaprovar', 'captchasolic'].includes(cmd)) {
      if (!isGroupAdmin && !isOwner) return reply(MESSAGES.permission.adminOnly);
      const subCmd = args[0]?.toLowerCase();
      if (!subCmd) return reply(`Uso: ${prefix}${cmd} on/off`);
      const feature = cmd === 'captchasolic' ? 'captchaEnabled' : 'autoAcceptRequests';
      groupData[feature] = subCmd === 'on';
      await optimizer.saveJsonWithCache(groupFile, groupData);
      return reply(`✅ ${cmd === 'captchasolic' ? 'Captcha' : 'Auto-aprovação'}: *${groupData[feature] ? 'ATIVADO' : 'DESATIVADO'}*`);
    }
  }
};
