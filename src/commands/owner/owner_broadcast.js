

export default {
  name: "owner_broadcast",
  description: "Comandos de divulgação e transmissão do dono",
  commands: ["antispamcmd", "div", "divdono", "divulgar", "setdiv", "tm2", "inscrevertm", "inscrevertm2", "desinscrever", "desinscrevertm", "cancelartm", "statustm", "statustm2"],
  handle: async ({ 
    bot, from, info, command, args, reply, prefix, sender, q,
    isGroup, isOwner, AllgroupMembers, optimizer, DATABASE_DIR,
    generateWAMessageFromContent, antiSpamGlobal,
    isImage, isVideo, isQuotedImage, isQuotedVideo, getFileBuffer
  , MESSAGES }) => {
    if (!isOwner) return reply(MESSAGES.permission.ownerOnly);

    const cmd = command.toLowerCase();

    // ═══════════════════════════════════════════════════════════════
    // 🛡️ ANTISPAM GLOBAL (CMD)
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'antispamcmd') {
      const filePath = DATABASE_DIR + '/antispam.json';
      const cfg = antiSpamGlobal || {};
      const usage = `Uso: ${prefix}antispamcmd on <limite> <janela_s> <bloqueio_s> | off | status`;
      
      if (!q) return reply(MESSAGES.owner.owner_broadcast.antispamcmd.usage(prefix));
      const parts = q.trim().split(/\s+/);
      const sub = parts[0].toLowerCase();

      if (sub === 'status') {
        return reply(MESSAGES.owner.owner_broadcast.antispamcmd.status(cfg.enabled ? '✅ Ativo' : `💔 Inativo`, cfg.limit, cfg.interval, Math.floor(cfg.blockTime/60)));
      }
      if (sub === 'off') {
        cfg.enabled = false;
        await optimizer.saveJsonWithCache(filePath, cfg);
        return reply(MESSAGES.owner.owner_broadcast.antispamcmd.off);
      }
      if (sub === 'on') {
        const [l, i, b] = parts.slice(1).map(v => parseInt(v));
        if ([l, i, b].some(isNaN)) return reply(MESSAGES.owner.owner_broadcast.antispamcmd.usage(prefix));
        Object.assign(cfg, { enabled: true, limit: l, interval: i, blockTime: b });
        await optimizer.saveJsonWithCache(filePath, cfg);
        return reply(MESSAGES.owner.owner_broadcast.antispamcmd.on);
      }
      return reply(MESSAGES.owner.owner_broadcast.antispamcmd.usage(prefix));
    }

    // ═══════════════════════════════════════════════════════════════
    // 📣 DIVULGAÇÃO (DIV/DIVULGAR)
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'div' || cmd === 'divulgar') {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      const count = parseInt(args.pop());
      const markAll = args[args.length - 1]?.toLowerCase() === 'all';
      if (markAll) args.pop();
      
      let text = args.join(' ').trim();
      if (!text) {
        const divCfg = await optimizer.loadJsonWithCache(DATABASE_DIR + '/divulgacao.json', {});
        text = divCfg.savedMessage;
      }
      if (!text || isNaN(count)) return reply(MESSAGES.owner.owner_broadcast.div.usage(prefix, cmd));

      reply(MESSAGES.owner.owner_broadcast.div.start(count));
      
      for (let i = 0; i < count; i++) {
        const payment = {
          requestPaymentMessage: {
            currencyCodeIso4217: 'BRL', amount1000: '0', requestFrom: sender,
            noteMessage: { extendedTextMessage: { text, mentionedJid: markAll ? AllgroupMembers : [] } },
            amount: { value: '0', offset: 1000, currencyCode: 'BRL' },
            expiryTimestamp: Math.floor(Date.now() / 1000) + 86400
          }
        };
        const msg = await generateWAMessageFromContent(from, payment, { userJid: bot?.user?.id });
        await bot.relayMessage(from, msg.message, { messageId: msg.key.id });
        await new Promise(r => setTimeout(r, 500));
      }
      return reply(MESSAGES.owner.owner_broadcast.div.success);
    }

    if (cmd === 'setdiv') {
      if (!q) return reply(MESSAGES.owner.owner_broadcast.setdiv.missingMsg);
      await optimizer.saveJsonWithCache(DATABASE_DIR + '/divulgacao.json', { savedMessage: q });
      return reply(MESSAGES.owner.owner_broadcast.setdiv.success);
    }
    
    if (cmd === 'divdono') {
      const sub = (args[0] || '').toLowerCase();
      const rest = args.slice(1).join(' ').trim();
      const configPath = DATABASE_DIR + '/dono_divulgacao.json';
      const config = await optimizer.loadJsonWithCache(configPath, { groups: [], savedMessage: '', scheduleTime: null });
      const groups = Array.isArray(config.groups) ? config.groups : [];

      const helpText = `📣 *DIVULGAÇÃO DO DONO (NOVO)*\n\n` +
        `• ${prefix}divdono add [id] (no grupo ou com ID)\n` +
        `• ${prefix}divdono rem <id>\n` +
        `• ${prefix}divdono list\n` +
        `• ${prefix}divdono msg <texto>\n` +
        `• ${prefix}divdono send [texto] (usa msg salva)\n` +
        `• ${prefix}divdono time <HH:MM|off>\n` +
        `• ${prefix}divdono status`;

      if (!sub || sub === 'help') return reply(MESSAGES.owner.owner_broadcast.divdono.help(prefix));

      if (sub === 'add' || sub === 'registrar' || sub === 'register') {
        let targetGroupId = rest || (isGroup ? from : null);
        if (!targetGroupId) return reply(MESSAGES.owner.owner_broadcast.divdono.add.usage(prefix));
        if (!targetGroupId.includes('@g.us')) targetGroupId += '@g.us';
        
        if (!groups.includes(targetGroupId)) {
          groups.push(targetGroupId);
          config.groups = groups;
          await optimizer.saveJsonWithCache(configPath, config);
          return reply(MESSAGES.owner.owner_broadcast.divdono.add.success(groups.length));
        }
        return reply(MESSAGES.owner.owner_broadcast.divdono.add.exists);
      }

      if (sub === 'rem' || sub === 'remove' || sub === 'del') {
        if (!rest) return reply(MESSAGES.owner.owner_broadcast.divdono.rem.usage(prefix));
        let targetGroupId = rest.trim();
        if (!targetGroupId.includes('@g.us')) targetGroupId += '@g.us';
        
        const newGroups = groups.filter(id => id !== targetGroupId);
        if (newGroups.length === groups.length) return reply(MESSAGES.owner.owner_broadcast.divdono.rem.notFound);
        
        config.groups = newGroups;
        await optimizer.saveJsonWithCache(configPath, config);
        return reply(MESSAGES.owner.owner_broadcast.divdono.rem.success(newGroups.length));
      }

      if (sub === 'list' || sub === 'lista') {
        if (!groups.length) return reply(MESSAGES.owner.owner_broadcast.divdono.list.empty);
        let text = MESSAGES.owner.owner_broadcast.divdono.list.header(groups.length);
        for (let i = 0; i < groups.length; i++) {
          const id = groups[i];
          try {
            const meta = await bot.groupMetadata(id).catch(() => ({ subject: 'Desconhecido/Removido' }));
            text += `*${i + 1}.* ${meta.subject}\n   └ ID: ${id}\n`;
          } catch(e) {
            text += `*${i + 1}.* Desconhecido (ID: ${id})\n`;
          }
        }
        return reply(text);
      }

      if (sub === 'msg' || sub === 'mensagem') {
        if (!rest) return reply(MESSAGES.owner.owner_broadcast.divdono.msg.usage(prefix));
        config.savedMessage = rest;
        await optimizer.saveJsonWithCache(configPath, config);
        return reply(MESSAGES.owner.owner_broadcast.divdono.msg.success(prefix));
      }

      if (sub === 'time' || sub === 'horario') {
        if (!rest) return reply(MESSAGES.owner.owner_broadcast.divdono.time.usage(prefix));
        if (rest.toLowerCase() === 'off') {
          config.scheduleTime = null;
          await optimizer.saveJsonWithCache(configPath, config);
          return reply(MESSAGES.owner.owner_broadcast.divdono.time.off);
        }
        if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(rest)) {
          return reply(MESSAGES.owner.owner_broadcast.divdono.time.invalid);
        }
        config.scheduleTime = rest;
        await optimizer.saveJsonWithCache(configPath, config);
        return reply(MESSAGES.owner.owner_broadcast.divdono.time.success(rest));
      }

      if (sub === 'status') {
        return reply(MESSAGES.owner.owner_broadcast.divdono.status.text(groups.length, config.savedMessage ? 'Sim ✅' : 'Não ❌', config.scheduleTime ? `Sim, às ${config.scheduleTime}` : 'Desativado'));
      }

      if (sub === 'send' || sub === 'enviar') {
        if (!groups.length) return reply(MESSAGES.owner.owner_broadcast.divdono.send.empty);
        const messageText = rest || config.savedMessage;
        if (!messageText) return reply(MESSAGES.owner.owner_broadcast.divdono.send.missingMsg(prefix));
        
        reply(MESSAGES.owner.owner_broadcast.divdono.send.start(groups.length));
        let success = 0, fail = 0;
        
        for (const id of groups) {
          try {
            await bot.sendMessage(id, { text: MESSAGES.owner.owner_broadcast.divdono.send.messageFormat(messageText) });
            success++;
            await new Promise(r => setTimeout(r, 2000));
          } catch (e) {
            fail++;
          }
        }
        return reply(MESSAGES.owner.owner_broadcast.divdono.send.success(success, fail));
      }

      return reply(MESSAGES.owner.owner_broadcast.divdono.invalid + MESSAGES.owner.owner_broadcast.divdono.help(prefix));
    }

    // ═══════════════════════════════════════════════════════════════
    // 📩 SISTEMA DE TRANSMISSÃO TM2 (INSCRITOS)
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'inscrevertm' || cmd === 'inscrevertm2') {
      if (isGroup) return reply(MESSAGES.owner.owner_broadcast.tm2.privateOnly);
      
      const subFile = pathz.join(DATABASE_DIR, 'transmissao_subs.json');
      const subs = await optimizer.loadJsonWithCache(subFile, { users: [] });
      
      if (subs.users.includes(sender)) {
        return reply(MESSAGES.owner.owner_broadcast.tm2.alreadySubbed(subs.users.length));
      }
      
      subs.users.push(sender);
      await optimizer.saveJsonWithCache(subFile, subs);
      return reply(MESSAGES.owner.owner_broadcast.tm2.successSub(prefix));
    }

    if (cmd === 'desinscrever' || cmd === 'desinscrevertm' || cmd === 'cancelartm') {
      if (isGroup) return reply(MESSAGES.owner.owner_broadcast.tm2.privateOnlyUnsub);
      
      const subFile = pathz.join(DATABASE_DIR, 'transmissao_subs.json');
      const subs = await optimizer.loadJsonWithCache(subFile, { users: [] });
      
      if (!subs.users.includes(sender)) {
        return reply(MESSAGES.owner.owner_broadcast.tm2.notSubbed);
      }
      
      subs.users = subs.users.filter(u => u !== sender);
      await optimizer.saveJsonWithCache(subFile, subs);
      return reply(MESSAGES.owner.owner_broadcast.tm2.successUnsub(prefix));
    }

    if (cmd === 'statustm' || cmd === 'statustm2') {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      const subFile = pathz.join(DATABASE_DIR, 'transmissao_subs.json');
      const subs = await optimizer.loadJsonWithCache(subFile, { users: [] });
      return reply(MESSAGES.owner.owner_broadcast.tm2.status(subs.users.length));
    }

    if (cmd === 'tm2') {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      
      if (!q && !isImage && !isVideo && !isQuotedImage && !isQuotedVideo) {
        return reply(MESSAGES.owner.owner_broadcast.tm2.missingMedia(prefix));
      }
      
      const subFile = pathz.join(DATABASE_DIR, 'transmissao_subs.json');
      const subs = await optimizer.loadJsonWithCache(subFile, { users: [] });
      
      if (subs.users.length === 0) {
        return reply(MESSAGES.owner.owner_broadcast.tm2.noSubs);
      }
      
      const cabecalho = MESSAGES.owner.owner_broadcast.tm2.header;
      let baseMessage = {};
      
      try {
        if (isImage && getFileBuffer) {
          const image = await getFileBuffer(info.message.imageMessage, 'image');
          baseMessage = { image, caption: q ? `${cabecalho}${q}` : cabecalho.trim() };
        } else if (isVideo && getFileBuffer) {
          const video = await getFileBuffer(info.message.videoMessage, 'video');
          baseMessage = { video, caption: q ? `${cabecalho}${q}` : cabecalho.trim() };
        } else if (isQuotedImage && getFileBuffer) {
          const image = await getFileBuffer(info.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage, 'image');
          baseMessage = { image, caption: q ? `${cabecalho}${q}` : cabecalho.trim() };
        } else if (isQuotedVideo && getFileBuffer) {
          const video = await getFileBuffer(info.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage, 'video');
          baseMessage = { video, caption: q ? `${cabecalho}${q}` : cabecalho.trim() };
        } else {
          baseMessage = { text: `${cabecalho}${q}` };
        }
      } catch (e) {
        baseMessage = { text: `${cabecalho}${q}` }; 
      }
      
      reply(MESSAGES.owner.owner_broadcast.tm2.start(subs.users.length));
      let success = 0, fail = 0;
      
      for (const id of subs.users) {
        try {
          await bot.sendMessage(id, baseMessage);
          success++;
          await new Promise(r => setTimeout(r, 2000));
        } catch (e) {
          fail++;
        }
      }
      return reply(MESSAGES.owner.owner_broadcast.tm2.success(success, fail));
    }
  }
};
