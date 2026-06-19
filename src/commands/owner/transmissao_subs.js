export default {
  name: "transmissao_subs",
  description: "Comandos de transmissão do dono para inscritos do PV",
  commands: ["tm2", "inscrevertm", "inscrevertm2", "desinscrever", "desinscrevertm", "cancelartm", "statustm", "statustm2"],
  handle: async ({ 
    bot, from, info, command, reply, prefix, sender, q,
    isGroup, optimizer, DATABASE_DIR,
    isImage, isVideo, isQuotedImage, isQuotedVideo, getFileBuffer,
    pathz, MESSAGES
  }) => {
    const cmd = command.toLowerCase();

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
      const subFile = pathz.join(DATABASE_DIR, 'transmissao_subs.json');
      const subs = await optimizer.loadJsonWithCache(subFile, { users: [] });
      return reply(MESSAGES.owner.owner_broadcast.tm2.status(subs.users.length));
    }

    if (cmd === 'tm2') {
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
