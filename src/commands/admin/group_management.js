import { normalizeScheduleTime, validateTimeFormat } from "../../utils/timeHelpers.js";
import { scheduleGroupJob, unscheduleGroupJob } from "../../workers/index.js";

export default {
  name: "group_management",
  description: "Gerenciamento avançado de grupos",
  commands: ["abrirgp", "aceitar", "alterardesc", "alterarfoto", "alterarnome", "antibotao", "antibtn", "antidelete", "antifake", "antiflood", "antilinkhard", "antiloc", "approve", "aprovar", "autoacceptr", "autoaceitarsolic", "autoaprovar", "autodl", "autodown", "captcha", "captcharequests", "captchasolic", "cita", "closegp", "dellimitmessage", "descgrupo", "descricao", "fechargp", "fotogp", "fotogrupo", "gamemode", "gp", "group", "grupo", "hidetag", "limitmessage", "modobn", "modobrincadeira", "modobrincadeiras", "mudardesc", "mudarfoto", "mudarnome", "nomegp", "onlyadm", "opengp", "pendentes", "recusarsolic", "recusarsolicitacao", "reject", "renomeargrupo", "requests", "setdesc", "setfoto", "setname", "setprefix", "soadm", "soadmin", "solicitacoes", "sorteio", "sorteionome", "totag"],
  handle: async ({ 
    bot, from, info, command, args, reply, prefix, pushname, sender, q,
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
          if (!q) return reply(MESSAGES.admin.group_management.sorteio.nameUsage(prefix));
          const nomes = q.split(',').map(n => n.trim()).filter(Boolean);
          if (nomes.length < 2) return reply(MESSAGES.admin.group_management.sorteio.minNames);
          const vencedor = nomes[Math.floor(Math.random() * nomes.length)];
          return reply(MESSAGES.admin.group_management.sorteio.resultName(vencedor));
        }

        const membros = AllgroupMembers.filter(m => !['0', 'marca'].includes(data.mark?.[m]));
        if (membros.length < 2) return reply(MESSAGES.admin.group_management.sorteio.minMembers);
        const numVencedores = parseInt(q) || 1;
        if (numVencedores < 1 || numVencedores > membros.length) return reply(MESSAGES.admin.group_management.sorteio.invalidAmount);
        
        const vencedores = [];
        const pool = [...membros];
        for (let i = 0; i < numVencedores; i++) {
          const idx = Math.floor(Math.random() * pool.length);
          vencedores.push(pool.splice(idx, 1)[0]);
        }
        
        const text = MESSAGES.admin.group_management.sorteio.resultHeader + vencedores.map((v, i) => MESSAGES.admin.group_management.sorteio.resultItem(i + 1, getUserName(v))).join('\n');
        return reply(text, { mentions: vencedores });
      } catch (e) {
        console.error(e);
        return reply(MESSAGES.admin.group_management.sorteio.error);
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
            messageToSend = { text: q || MESSAGES.admin.group_management.hidetag.defaultMsg, mentions };
          }
        } else {
          messageToSend = { text: q || MESSAGES.admin.group_management.hidetag.defaultMsg, mentions };
        }

        await bot.sendMessage(from, messageToSend);
        registerMassMentionUse(from);
      } catch (e) {
        console.error(e);
        return reply(MESSAGES.admin.group_management.hidetag.error);
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
        'autodown': 'autodl',
        'antibotao': 'antibtn',
        'antibtn': 'antibtn'
      };
      
      const feature = featureMap[cmd] || cmd;

      if (cmd === 'antiflood') {
        if (!q) return reply(MESSAGES.admin.group_management.protections.floodUsage(prefix));
        const antifloodFile = pathz.join(DATABASE_DIR, 'antiflood.json');
        let floodData = await optimizer.loadJsonWithCache(antifloodFile, {});
        floodData[from] = floodData[from] || {};
        if (q.toLowerCase() === 'off') {
          floodData[from].enabled = false;
        } else {
          const interval = parseInt(q);
          if (isNaN(interval) || interval < 1) return reply(MESSAGES.admin.group_management.protections.floodInvalid);
          floodData[from].enabled = true;
          floodData[from].interval = interval;
        }
        await optimizer.saveJsonWithCache(antifloodFile, floodData);
        return reply(MESSAGES.admin.group_management.protections.floodToggle(floodData[from].enabled));
      }

      groupData[feature] = !groupData[feature];
      await optimizer.saveJsonWithCache(groupFile, groupData);
      return reply(MESSAGES.admin.group_management.protections.genericToggle(feature, groupData[feature]));
    }

    // ═══════════════════════════════════════════════════════════════
    // 🛡️ ANTIFAKE (Bloquear números estrangeiros)
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'antifake') {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);

      const subArg = (q || '').trim();
      const subArgLower = subArg.toLowerCase();

      // --- Subcomando: DDI ---
      if (subArgLower.startsWith('ddi')) {
        const ddiValue = subArg.replace(/^ddi\s*/i, '').trim();
        if (!ddiValue) {
          const currentDDI = groupData.antifakeDDI || '55';
          return reply(MESSAGES.admin.group_management.antifake.ddiInfo(currentDDI, prefix));
        }
        const ddis = ddiValue.split(',').map(d => d.trim()).filter(d => /^\d{1,4}$/.test(d));
        if (ddis.length === 0) {
          return reply(MESSAGES.admin.group_management.antifake.ddiInvalid(prefix));
        }
        groupData.antifakeDDI = ddis.join(',');
        await optimizer.saveJsonWithCache(groupFile, groupData);
        return reply(MESSAGES.admin.group_management.antifake.ddiSuccess(ddis.join(', ')));
      }

      // --- Subcomando: WHITELIST ---
      if (subArgLower.startsWith('wl')) {
        const wlParts = subArg.replace(/^wl\s*/i, '').trim().split(/\s+/);
        const wlAction = (wlParts[0] || '').toLowerCase();
        const wlNumber = (wlParts[1] || '').replace(/\D/g, '');

        if (wlAction === 'add') {
          if (!wlNumber) return reply(MESSAGES.admin.group_management.antifake.wlAddUsage(prefix));
          if (!groupData.antifakeWhitelist) groupData.antifakeWhitelist = [];
          if (groupData.antifakeWhitelist.includes(wlNumber)) {
            return reply(MESSAGES.admin.group_management.antifake.wlAddExists(wlNumber));
          }
          groupData.antifakeWhitelist.push(wlNumber);
          await optimizer.saveJsonWithCache(groupFile, groupData);
          return reply(MESSAGES.admin.group_management.antifake.wlAddSuccess(wlNumber));
        }

        if (wlAction === 'remove' || wlAction === 'rem' || wlAction === 'del') {
          if (!wlNumber) return reply(MESSAGES.admin.group_management.antifake.wlRemUsage(prefix));
          if (!groupData.antifakeWhitelist) groupData.antifakeWhitelist = [];
          const idx = groupData.antifakeWhitelist.indexOf(wlNumber);
          if (idx === -1) return reply(MESSAGES.admin.group_management.antifake.wlRemNotFound(wlNumber));
          groupData.antifakeWhitelist.splice(idx, 1);
          await optimizer.saveJsonWithCache(groupFile, groupData);
          return reply(MESSAGES.admin.group_management.antifake.wlRemSuccess(wlNumber));
        }

        if (wlAction === 'lista' || wlAction === 'list' || !wlAction) {
          const wl = groupData.antifakeWhitelist || [];
          if (wl.length === 0) return reply(MESSAGES.admin.group_management.antifake.wlListEmpty(prefix));
          return reply(MESSAGES.admin.group_management.antifake.wlListHeader(wl.length) + wl.map((n, i) => `${i + 1}. ${n}`).join('\n'));
        }

        return reply(MESSAGES.admin.group_management.antifake.wlUsage(prefix));
      }

      // --- Subcomando: LOG ---
      if (subArgLower === 'log' || subArgLower === 'logs') {
        try {
          const { getAntifakeLogs } = await import('../../utils/antifakeGuard.js');
          const logs = await getAntifakeLogs(from, 10);
          if (logs.length === 0) return reply(MESSAGES.admin.group_management.antifake.logEmpty);
          let msg = MESSAGES.admin.group_management.antifake.logHeader(logs.length);
          logs.forEach((log, i) => {
            const date = new Date(log.timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
            const actionEmoji = log.action === 'ban' ? '🚫' : '❌';
            msg += `${actionEmoji} *${log.number}*\n   ${log.action.toUpperCase()} — ${date}\n   ${log.reason}\n\n`;
          });
          return reply(msg.trim());
        } catch (e) {
          console.error('Erro ao carregar logs antifake:', e);
          return reply(MESSAGES.admin.group_management.antifake.logError);
        }
      }

      // --- Toggle on/off ---
      groupData.antifake = !groupData.antifake;
      await optimizer.saveJsonWithCache(groupFile, groupData);

      const currentDDI = groupData.antifakeDDI || '55';
      const wlCount = (groupData.antifakeWhitelist || []).length;

      if (groupData.antifake) {
        return reply(MESSAGES.admin.group_management.antifake.statusOn(currentDDI, wlCount, prefix));
      } else {
        return reply(MESSAGES.admin.group_management.antifake.statusOff(prefix));
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // ⚙️ CONFIGURAÇÕES DE GRUPO
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'setprefix') {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!q) return reply(MESSAGES.admin.group_management.config.prefixUsage(prefix));
      const newPrefix = q.trim().charAt(0);
      if (newPrefix === '$') return reply(MESSAGES.admin.group_management.config.prefixReserved);
      groupData.customPrefix = newPrefix;
      await optimizer.saveJsonWithCache(groupFile, groupData);
      return reply(MESSAGES.admin.group_management.config.prefixSuccess(newPrefix));
    }

    if (['modobrincadeira', 'modobrincadeiras', 'modobn', 'gamemode'].includes(cmd)) {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      groupData.modobrincadeira = !groupData.modobrincadeira;
      await optimizer.saveJsonWithCache(groupFile, groupData);
      return reply(MESSAGES.admin.group_management.config.gameModeToggle(groupData.modobrincadeira));
    }

    if (['limitmessage', 'dellimitmessage'].includes(cmd)) {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      
      if (cmd === 'dellimitmessage') {
        delete groupData.messageLimit;
        await optimizer.saveJsonWithCache(groupFile, groupData);
        return reply(MESSAGES.admin.group_management.config.limitDelSuccess);
      }

      if (args.length < 3) return reply(MESSAGES.admin.group_management.config.limitUsage(prefix));
      const limit = parseInt(args[0]);
      const timeMatch = args[1].toLowerCase().match(/^(\d+)(s|m|h)$/);
      const action = args[2].toLowerCase();

      if (isNaN(limit) || !timeMatch || !['ban', 'adv'].includes(action)) return reply(MESSAGES.admin.group_management.config.limitInvalid);
      
      let seconds = parseInt(timeMatch[1]);
      if (timeMatch[2] === 'm') seconds *= 60;
      else if (timeMatch[2] === 'h') seconds *= 3600;

      groupData.messageLimit = { enabled: true, limit, interval: seconds, action, users: {} };
      await optimizer.saveJsonWithCache(groupFile, groupData);
      return reply(MESSAGES.admin.group_management.config.limitSuccess(limit, args[1], action));
    }

    // ═══════════════════════════════════════════════════════════════
    // 🚪 GRUPO STATUS (ABRIR/FECHAR)
    // ═══════════════════════════════════════════════════════════════
    if (['grupo', 'gp', 'group'].includes(cmd)) {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      
      const param = (q || '').toLowerCase();
      const shouldOpen = ['a', 'o', 'open', 'abrir'].includes(param);
      const shouldClose = ['f', 'c', 'close', 'fechar'].includes(param);

      if (shouldOpen) {
        await bot.groupSettingUpdate(from, 'not_announcement');
        if (groupData?.x9) {
          await bot.sendMessage(from, { text: MESSAGES.admin.group_management.status.openX9(sender.split('@')[0]), mentions: [sender] }).catch(e => {});
        }
        return reply(MESSAGES.admin.group_management.status.openSuccess);
      } else if (shouldClose) {
        await bot.groupSettingUpdate(from, 'announcement');
        if (groupData?.x9) {
          await bot.sendMessage(from, { text: MESSAGES.admin.group_management.status.closeX9(sender.split('@')[0]), mentions: [sender] }).catch(e => {});
        }
        return reply(MESSAGES.admin.group_management.status.closeSuccess);
      }
      return reply(MESSAGES.admin.group_management.status.usage(prefix, cmd));
    }

    if (cmd === 'opengp' || cmd === 'abrirgp') {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!q) {
        return reply(MESSAGES.admin.group_management.status.openScheduleUsage(prefix, cmd));
      }

      const rawArg = q.trim();
      const argLower = rawArg.toLowerCase();

      groupData.schedule = groupData.schedule || {};

      if (argLower === 'off' || argLower === 'desativar' || argLower === 'remove' || argLower === 'rm') {
        delete groupData.schedule.openTime;
        if (groupData.schedule?.lastRun) {
          delete groupData.schedule.lastRun.open;
          if (Object.keys(groupData.schedule.lastRun).length === 0) {
            delete groupData.schedule.lastRun;
          }
        }
        await optimizer.saveJsonWithCache(groupFile, groupData);
        try { unscheduleGroupJob(from, 'open'); } catch (e) { console.error('Error unscheduling group open job:', e); }
        return reply(MESSAGES.admin.group_management.status.openScheduleRemSuccess);
      }

      const timeValidation = validateTimeFormat(rawArg);
      if (!timeValidation.valid) {
        return reply(MESSAGES.admin.group_management.status.scheduleInvalid(timeValidation.error, prefix, cmd, '07:30'));
      }

      const normalizedTime = normalizeScheduleTime(rawArg);
      if (!normalizedTime) {
        return reply(MESSAGES.admin.group_management.status.scheduleUnrecognized(prefix, cmd, '07:30'));
      }

      groupData.schedule.openTime = normalizedTime;
      if (groupData.schedule.lastRun && typeof groupData.schedule.lastRun === 'object') {
        delete groupData.schedule.lastRun.open;
        if (Object.keys(groupData.schedule.lastRun).length === 0) {
          delete groupData.schedule.lastRun;
        }
      }

      await optimizer.saveJsonWithCache(groupFile, groupData);
      try { scheduleGroupJob(from, 'open', normalizedTime, bot); } catch (e) { console.error('Erro ao agendar open cron:', e); }

      return reply(MESSAGES.admin.group_management.status.openScheduleSuccess(normalizedTime, isBotAdmin));
    }

    if (cmd === 'closegp' || cmd === 'fechargp') {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!q) {
        return reply(MESSAGES.admin.group_management.status.closeScheduleUsage(prefix, cmd));
      }

      const rawArg = q.trim();
      const argLower = rawArg.toLowerCase();

      groupData.schedule = groupData.schedule || {};

      if (argLower === 'off' || argLower === 'desativar' || argLower === 'remove' || argLower === 'rm') {
        delete groupData.schedule.closeTime;
        if (groupData.schedule?.lastRun) {
          delete groupData.schedule.lastRun.close;
          if (Object.keys(groupData.schedule.lastRun).length === 0) {
            delete groupData.schedule.lastRun;
          }
        }
        await optimizer.saveJsonWithCache(groupFile, groupData);
        try { unscheduleGroupJob(from, 'close'); } catch (e) { console.error('Error unscheduling group close job:', e); }
        return reply(MESSAGES.admin.group_management.status.closeScheduleRemSuccess);
      }

      const timeValidation = validateTimeFormat(rawArg);
      if (!timeValidation.valid) {
        return reply(MESSAGES.admin.group_management.status.scheduleInvalid(timeValidation.error, prefix, cmd, '22:30'));
      }

      const normalizedTime = normalizeScheduleTime(rawArg);
      if (!normalizedTime) {
        return reply(MESSAGES.admin.group_management.status.scheduleUnrecognized(prefix, cmd, '22:30'));
      }

      groupData.schedule.closeTime = normalizedTime;
      if (groupData.schedule.lastRun && typeof groupData.schedule.lastRun === 'object') {
        delete groupData.schedule.lastRun.close;
        if (Object.keys(groupData.schedule.lastRun).length === 0) {
          delete groupData.schedule.lastRun;
        }
      }

      await optimizer.saveJsonWithCache(groupFile, groupData);
      try { scheduleGroupJob(from, 'close', normalizedTime, bot); } catch (e) { console.error('Erro ao agendar close cron:', e); }

      return reply(MESSAGES.admin.group_management.status.closeScheduleSuccess(normalizedTime, isBotAdmin));
    }

    // ═══════════════════════════════════════════════════════════════
    // 🖼️ FOTO, NOME E DESCRIÇÃO
    // ═══════════════════════════════════════════════════════════════
    if (['fotogp', 'fotogrupo', 'setppgp', 'setfoto'].includes(cmd)) {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      if (!isQuotedImage && !isQuotedMsg && !info.message?.imageMessage) return reply(MESSAGES.admin.group_management.media.photoProvide);

      try {
        const media = isQuotedImage ? info.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage : info.message.imageMessage;
        const buffer = await getFileBuffer(media, 'image');
        await bot.updateProfilePicture(from, buffer);
        return reply(MESSAGES.admin.group_management.media.photoSuccess);
      } catch (e) { return reply(MESSAGES.admin.group_management.media.photoError); }
    }

    if (cmd === 'nomegp' || cmd === 'setname') {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      if (!q) return reply(MESSAGES.admin.group_management.media.nameProvide);
      await bot.groupUpdateSubject(from, q);
      return reply(MESSAGES.admin.group_management.media.nameSuccess);
    }

    if (cmd === 'descgp' || cmd === 'descgrupo' || cmd === 'setdesc') {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      await bot.groupUpdateDescription(from, q || '');
      return reply(MESSAGES.admin.group_management.media.descSuccess);
    }

    if (cmd === 'soadm' || cmd === 'adminonly' || cmd === 'soadmin') {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      
      groupData.soadm = !groupData.soadm;
      await optimizer.saveJsonWithCache(groupFile, groupData);
      
      return reply(MESSAGES.admin.group_management.media.onlyAdmToggle(groupData.soadm));
    }

    // ═══════════════════════════════════════════════════════════════
    // 📬 SOLICITAÇÕES DE ENTRADA
    // ═══════════════════════════════════════════════════════════════
    if (['requests', 'solicitacoes', 'pendentes'].includes(cmd)) {
      if (!isGroupAdmin && !isOwner) return reply(MESSAGES.permission.adminOnly);
      try {
        const requests = await bot.groupRequestParticipantsList(from);
        if (!requests || requests.length === 0) return reply(MESSAGES.admin.group_management.requests.empty);
        let msg = MESSAGES.admin.group_management.requests.header(requests.length);
        const mentions = [];
        requests.forEach((req, i) => {
          msg += `${i + 1}. @${req.jid.split('@')[0]}\n`;
          mentions.push(req.jid);
        });
        return bot.sendMessage(from, { text: msg, mentions });
      } catch (e) { return reply(MESSAGES.admin.group_management.requests.fetchError); }
    }

    if (['aprovar', 'aceitar', 'approve', 'recusarsolic', 'recusar', 'reject'].includes(cmd)) {
      if (!isGroupAdmin && !isOwner) return reply(MESSAGES.permission.adminOnly);
      const type = ['aprovar', 'aceitar', 'approve'].includes(cmd) ? 'approve' : 'reject';
      const target = menc_os2 || (args[0] && args[0].includes('@') ? args[0].replace('@', '') + '@s.whatsapp.net' : null);
      if (!target) return reply(MESSAGES.error.missing('alguém'));
      try {
        await bot.groupRequestParticipantsUpdate(from, [target], type);
        return reply(`${type === 'approve' ? MESSAGES.admin.group_management.requests.actionSuccess : MESSAGES.admin.group_management.requests.actionReject}`);
      } catch (e) { return reply(MESSAGES.admin.group_management.requests.actionError); }
    }

    if (['autoaceitarsolic', 'autoaprovar', 'captchasolic'].includes(cmd)) {
      if (!isGroupAdmin && !isOwner) return reply(MESSAGES.permission.adminOnly);
      const subCmd = args[0]?.toLowerCase();
      if (!subCmd) return reply(MESSAGES.admin.group_management.requests.autoUsage(prefix, cmd));
      const feature = cmd === 'captchasolic' ? 'captchaEnabled' : 'autoAcceptRequests';
      groupData[feature] = subCmd === 'on';
      await optimizer.saveJsonWithCache(groupFile, groupData);
      return reply(MESSAGES.admin.group_management.requests.autoToggle(cmd === 'captchasolic' ? 'Captcha' : 'Auto-aprovação', groupData[feature]));
    }
  }
};
