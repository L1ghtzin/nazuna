export default {
  name: "divulgar",
  description: "Comandos de divulgação do dono do bot",
  commands: ["div", "divulgar", "setdiv", "divdono"],
  handle: async ({ 
    bot, from, command, args, reply, prefix, sender, q,
    isGroup, AllgroupMembers, optimizer, DATABASE_DIR,
    generateWAMessageFromContent, MESSAGES
  }) => {
    const cmd = command.toLowerCase();

    // 📣 DIVULGAÇÃO (DIV/DIVULGAR)
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
        return reply(MESSAGES.owner.owner_broadcast.divdono.status.text(
          groups.length, 
          config.savedMessage ? 'Sim ✅' : 'Não ❌', 
          config.scheduleTime ? `Sim, às ${config.scheduleTime}` : 'Desativado'
        ));
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
  }
};
