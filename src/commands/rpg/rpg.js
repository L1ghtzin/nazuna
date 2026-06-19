export default {
  name: "rpg",
  description: "Comandos de RPG e Economia",
  commands: ["achievementsbn", "box", "caixa", "conquistasbn", "denunciar", "denuncias", "gerarqrbn", "giftbn", "inventory", "lerqr", "medalhasbn", "nota", "notas", "note", "notes", "presente", "presentebn", "qrcodebn", "rankrep", "readqr", "repbn", "report", "reports", "reputacaobn", "scanqr", "toprep"],
  handle: async ({ 
    bot, from, info, command, args, reply, prefix, pushname, sender, menc_os2,
    gifts, reputation, qrcode, achievements, notes,
    getEcoUser, loadEconomy, saveEconomy, checkEcoLevelUp, isGroupAdmin, isOwnerOrSub
  , MESSAGES }) => {
    const cmd = command.toLowerCase();

    const applyBoxReward = (userEco, reward) => {
      if (!reward || !userEco) return '';
      if (reward.type === 'gold') {
        userEco.wallet = (userEco.wallet || 0) + reward.amount;
        return MESSAGES.rpg.gifts.walletReward(userEco.wallet);
      }
      if (reward.type === 'xp') {
        userEco.exp = (userEco.exp || 0) + reward.amount;
        const levelInfo = checkEcoLevelUp ? checkEcoLevelUp(userEco) : null;
        return levelInfo?.leveledUp ? MESSAGES.rpg.gifts.levelReward(levelInfo.newLevel) : '';
      }
      return '';
    };

    // ═══════════════════════════════════════════════════════════════
    // 🎁 SISTEMA DE CAIXAS (BOX)
    // ═══════════════════════════════════════════════════════════════
    if (['box', 'caixa'].includes(cmd)) {
      if (!gifts) return reply(MESSAGES.rpg.gifts.unavailable);
      
      const tipoBox = args[0]?.toLowerCase();
      if (!tipoBox) {
        return reply(MESSAGES.rpg.gifts.boxSystem(prefix));
      }
      
      const econ = loadEconomy();
      const userEco = getEcoUser(econ, sender);
      let result;

      if (['diaria', 'daily'].includes(tipoBox)) {
        result = gifts.openDailyBox(sender);
      } else if (['rara', 'rare'].includes(tipoBox)) {
        if ((userEco.wallet || 0) < 500) return reply(MESSAGES.rpg.gifts.insufficientGold(500));
        result = gifts.openBox(sender, 'rara', userEco.wallet || 0);
        if (result.success) userEco.wallet -= 500;
      } else if (['lendaria', 'legendary'].includes(tipoBox)) {
        if ((userEco.wallet || 0) < 2000) return reply(MESSAGES.rpg.gifts.insufficientGold(2000));
        result = gifts.openBox(sender, 'lendaria', userEco.wallet || 0);
        if (result.success) userEco.wallet -= 2000;
      } else {
        return reply(MESSAGES.rpg.gifts.invalidType);
      }
      
      if (result.success) {
        const rewardMessage = applyBoxReward(userEco, result.reward);
        saveEconomy(econ);
        result.message += rewardMessage;
      }
      return reply(result.message);
    }

    // ═══════════════════════════════════════════════════════════════
    // 💝 PRESENTES (GIFT)
    // ═══════════════════════════════════════════════════════════════
    if (['presentebn', 'giftbn', 'presente'].includes(cmd)) {
      if (!gifts) return reply(MESSAGES.rpg.gifts.unavailable);
      if (!menc_os2) return reply(MESSAGES.rpg.gifts.needMention(prefix, command));
      
      const tipoGift = args[1]?.toLowerCase();
      if (!tipoGift) {
        return reply(gifts.listGifts(prefix).message);
      }
      
      const giftInfo = gifts.SENDABLE_GIFTS?.[tipoGift];
      if (!giftInfo) {
        return reply(gifts.listGifts(prefix).message);
      }

      const econ = loadEconomy();
      const userEco = getEcoUser(econ, sender);
      if ((userEco.wallet || 0) < giftInfo.cost) {
        return reply(MESSAGES.rpg.gifts.insufficientGold(giftInfo.cost));
      }

      const result = gifts.sendGift(sender, menc_os2, tipoGift);
      if (result.success) {
        userEco.wallet -= giftInfo.cost;
        saveEconomy(econ);
        await bot.sendMessage(from, { text: result.message, mentions: [sender, menc_os2] });
      } else {
        reply(result.message);
      }
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // 🎒 INVENTÁRIO
    // ═══════════════════════════════════════════════════════════════
    if (['inventario', 'inventory'].includes(cmd)) {
      if (!gifts) return reply(MESSAGES.rpg.gifts.unavailable);
      const invStr = gifts.getInventory(sender);
      if (!invStr || invStr.trim() === '') return reply(MESSAGES.rpg.gifts.emptyInventory);
      return reply(MESSAGES.rpg.gifts.inventoryContent(invStr));
    }

    // ═══════════════════════════════════════════════════════════════
    // ⭐ REPUTAÇÃO (REP)
    // ═══════════════════════════════════════════════════════════════
    if (['repbn', 'reputacaobn', 'rep'].includes(cmd)) {
      if (!reputation) return reply(MESSAGES.rpg.reputation.unavailable);
      
      const action = args[0]?.toLowerCase();
      if (!action || (!menc_os2 && action !== '+' && action !== '-')) {
        const target = menc_os2 || sender;
        const rep = reputation.getReputation(target);
        const name = menc_os2 ? `@${menc_os2.split('@')[0]}` : pushname;
        return bot.sendMessage(from, {
          text: MESSAGES.rpg.reputation.info(name, rep),
          mentions: menc_os2 ? [menc_os2] : []
        });
      }
      
      if (['+', 'mais'].includes(action) && menc_os2) {
        return reply(reputation.giveRep(sender, menc_os2, true).message);
      }
      if (['-', 'menos'].includes(action) && menc_os2) {
        return reply(reputation.giveRep(sender, menc_os2, false).message);
      }
      return reply(MESSAGES.rpg.reputation.usage(prefix));
    }

    if (['toprep', 'rankrep'].includes(cmd)) {
      if (!reputation) return reply(MESSAGES.rpg.reputation.unavailable);
      return reply(reputation.getRepRanking(10));
    }

    // ═══════════════════════════════════════════════════════════════
    // 📢 DENÚNCIAS (REPORT)
    // ═══════════════════════════════════════════════════════════════
    if (['denunciar', 'report'].includes(cmd)) {
      if (!reputation) return reply(MESSAGES.rpg.reputation.unavailable);
      if (!menc_os2) return reply(MESSAGES.rpg.reputation.needMention);
      const motivo = args.slice(1).join(' ');
      if (!motivo) return reply(MESSAGES.rpg.reputation.needReason);
      return reply(reputation.reportUser(sender, menc_os2, from, motivo).message);
    }

    if (['denuncias', 'reports'].includes(cmd)) {
      if (!reputation) return reply(MESSAGES.rpg.reputation.unavailable);
      if (!isGroupAdmin && !isOwnerOrSub) return reply(MESSAGES.permission.adminOnly);
      return reply(reputation.getReports(from));
    }

    // ═══════════════════════════════════════════════════════════════
    // 📱 QR CODE
    // ═══════════════════════════════════════════════════════════════
    if (['qrcodebn', 'gerarqrbn'].includes(cmd)) {
      if (!qrcode) return reply(MESSAGES.rpg.qrcode.unavailable);
      if (!q) return reply(MESSAGES.rpg.qrcode.missingText(prefix));
      
      const result = await qrcode.generateQRCode(q, 300, prefix);
      if (result.success) {
        await bot.sendMessage(from, { image: result.buffer, caption: MESSAGES.rpg.qrcode.generated(q) }, { quoted: info });
      } else {
        reply(result.message);
      }
      return;
    }

    if (['lerqr', 'readqr', 'scanqr'].includes(cmd)) {
      if (!qrcode) return reply(MESSAGES.rpg.qrcode.unavailable);
      const quoted = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const media = quoted?.imageMessage || info.message?.imageMessage;
      if (!media) return reply(MESSAGES.rpg.qrcode.missingMedia);
      
      try {
        const { downloadContentFromMessage } = await import('baileys');
        const stream = await downloadContentFromMessage(media, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        const result = await qrcode.readQRCode(buffer);
        reply(result.message);
      } catch (e) {
        reply(MESSAGES.error.general);
      }
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // 🏆 CONQUISTAS (ACHIEVEMENTS)
    // ═══════════════════════════════════════════════════════════════
    if (['conquistasbn', 'achievementsbn', 'medalhasbn'].includes(cmd)) {
      if (!achievements) return reply(MESSAGES.rpg.achievements.unavailable);
      return reply(achievements.getAchievements(sender));
    }

    // ═══════════════════════════════════════════════════════════════
    // 📝 NOTAS (NOTES)
    // ═══════════════════════════════════════════════════════════════
    if (['nota', 'note', 'notas', 'notes'].includes(cmd)) {
      if (!notes) return reply(MESSAGES.rpg.notes.unavailable);
      
      const subCmd = args[0]?.toLowerCase();
      if (!subCmd || subCmd === 'list' || cmd === 'notas' || cmd === 'notes') {
        const userNotes = notes.getUserNotes(sender);
        if (userNotes.length === 0) return reply(MESSAGES.rpg.notes.empty);
        return reply(MESSAGES.rpg.notes.list(userNotes));
      }

      if (subCmd === 'add') {
        const text = args.slice(1).join(' ');
        if (!text) return reply(MESSAGES.rpg.notes.missingText);
        notes.addNote(sender, text);
        return reply(MESSAGES.rpg.notes.successAdd);
      }

      if (subCmd === 'del') {
        const id = parseInt(args[1]) - 1;
        if (isNaN(id)) return reply(MESSAGES.rpg.notes.missingId);
        const res = notes.deleteNote(sender, id);
        return reply(res ? MESSAGES.rpg.notes.successDel : MESSAGES.rpg.notes.invalidId);
      }
    }
  }
};
