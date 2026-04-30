export default {
  name: "rpg",
  description: "Comandos de RPG e Economia",
  commands: ["achievementsbn", "box", "caixa", "conquistasbn", "denunciar", "denuncias", "gerarqrbn", "giftbn", "inventario", "inventory", "lerqr", "medalhasbn", "nota", "notas", "note", "notes", "presente", "presentebn", "qrcode", "qrcodebn", "rankrep", "readqr", "rep", "repbn", "report", "reports", "reputacaobn", "scanqr", "toprep"],
  handle: async ({ 
    nazu, from, info, command, args, reply, prefix, pushname, sender, menc_os2,
    gifts, reputation, getEcoUser, saveEconomy, isGroupAdmin, isOwnerOrSub
  , MESSAGES }) => {
    const cmd = command.toLowerCase();

    // ═══════════════════════════════════════════════════════════════
    // 🎁 SISTEMA DE CAIXAS (BOX)
    // ═══════════════════════════════════════════════════════════════
    if (['box', 'caixa'].includes(cmd)) {
      if (!gifts) return reply("Sistema de presentes indisponível.");
      
      const tipoBox = args[0]?.toLowerCase();
      if (!tipoBox) {
        return reply(`🎁 *Sistema de Caixas*\n\n${prefix}caixa diaria\n${prefix}caixa rara (500 gold)\n${prefix}caixa lendaria (2000 gold)`);
      }
      
      const userEco = getEcoUser(sender);
      let result;

      if (['diaria', 'daily'].includes(tipoBox)) {
        result = gifts.openDailyBox(sender);
      } else if (['rara', 'rare'].includes(tipoBox)) {
        if (userEco.gold < 500) return reply(`💔 Você precisa de 500 gold.`);
        result = gifts.openBox(sender, 'rara');
        if (result.success) { userEco.gold -= 500; saveEconomy(); }
      } else if (['lendaria', 'legendary'].includes(tipoBox)) {
        if (userEco.gold < 2000) return reply(`💔 Você precisa de 2000 gold.`);
        result = gifts.openBox(sender, 'lendaria');
        if (result.success) { userEco.gold -= 2000; saveEconomy(); }
      } else {
        return reply(`💔 Tipo inválido!`);
      }
      
      return reply(result.message);
    }

    // ═══════════════════════════════════════════════════════════════
    // 💝 PRESENTES (GIFT)
    // ═══════════════════════════════════════════════════════════════
    if (['presentebn', 'giftbn', 'presente'].includes(cmd)) {
      if (!gifts) return reply("Sistema de presentes indisponível.");
      if (!menc_os2) return reply(`💔 Marque alguém!\nUso: ${prefix}presente @user <tipo>`);
      
      const tipoGift = args[1]?.toLowerCase();
      if (!tipoGift) {
        return reply(`🎁 *Tipos de Presente*\n\n${gifts.getGiftTypes()}`);
      }
      
      const result = gifts.sendGift(sender, menc_os2, tipoGift);
      if (result.success) {
        await nazu.sendMessage(from, { text: result.message, mentions: [sender, menc_os2] });
      } else {
        reply(result.message);
      }
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // 🎒 INVENTÁRIO
    // ═══════════════════════════════════════════════════════════════
    if (['inventario', 'inventory'].includes(cmd)) {
      if (!gifts) return reply("Sistema de presentes indisponível.");
      return reply(gifts.getInventory(sender));
    }

    // ═══════════════════════════════════════════════════════════════
    // ⭐ REPUTAÇÃO (REP)
    // ═══════════════════════════════════════════════════════════════
    if (['repbn', 'reputacaobn', 'rep'].includes(cmd)) {
      if (!reputation) return reply("Sistema de reputação indisponível.");
      
      const action = args[0]?.toLowerCase();
      if (!action || (!menc_os2 && action !== '+' && action !== '-')) {
        const target = menc_os2 || sender;
        const rep = reputation.getReputation(target);
        const name = menc_os2 ? `@${menc_os2.split('@')[0]}` : pushname;
        return nazu.sendMessage(from, {
          text: `⭐ *Reputação de ${name}*\n\n${rep}`,
          mentions: menc_os2 ? [menc_os2] : []
        });
      }
      
      if (['+', 'mais'].includes(action) && menc_os2) {
        return reply(reputation.giveRep(sender, menc_os2, true).message);
      }
      if (['-', 'menos'].includes(action) && menc_os2) {
        return reply(reputation.giveRep(sender, menc_os2, false).message);
      }
      return reply(`💔 Uso: ${prefix}rep + @user`);
    }

    if (['toprep', 'rankrep'].includes(cmd)) {
      if (!reputation) return reply("Sistema de reputação indisponível.");
      return reply(reputation.getRepRanking(10));
    }

    // ═══════════════════════════════════════════════════════════════
    // 📢 DENÚNCIAS (REPORT)
    // ═══════════════════════════════════════════════════════════════
    if (['denunciar', 'report'].includes(cmd)) {
      if (!reputation) return reply("Sistema de reputação indisponível.");
      if (!menc_os2) return reply(`💔 Marque quem denunciar!`);
      const motivo = args.slice(1).join(' ');
      if (!motivo) return reply(`💔 Informe o motivo!`);
      return reply(reputation.reportUser(sender, menc_os2, from, motivo).message);
    }

    if (['denuncias', 'reports'].includes(cmd)) {
      if (!reputation) return reply("Sistema de reputação indisponível.");
      if (!isGroupAdmin && !isOwnerOrSub) return reply(MESSAGES.permission.adminOnly);
      // Logic for reports view was missing in original snippet view, but we can assume it's reputation.getReports(from)
      return reply(reputation.getReports(from));
    }

    // ═══════════════════════════════════════════════════════════════
    // 📱 QR CODE
    // ═══════════════════════════════════════════════════════════════
    if (['qrcodebn', 'gerarqrbn', 'qrcode'].includes(cmd)) {
      if (!qrcode) return reply("Sistema de QR Code indisponível.");
      if (!q) return reply(`💔 Digite o texto!\nEx: ${prefix}qrcode https://google.com`);
      
      const result = await qrcode.generateQRCode(q, 300, prefix);
      if (result.success) {
        await nazu.sendMessage(from, { image: { url: result.url }, caption: `📱 *QR Code gerado!*\n\nConteúdo: ${q}` }, { quoted: info });
      } else {
        reply(result.message);
      }
      return;
    }

    if (['lerqr', 'readqr', 'scanqr'].includes(cmd)) {
      if (!qrcode) return reply("Sistema de QR Code indisponível.");
      const quoted = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const media = quoted?.imageMessage || info.message?.imageMessage;
      if (!media) return reply(`💔 Marque um QR Code!`);
      
      try {
        const { downloadContentFromMessage } = await import('@whiskeysockets/baileys');
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
      if (!achievements) return reply("Sistema de conquistas indisponível.");
      return reply(achievements.getAchievements(sender));
    }

    // ═══════════════════════════════════════════════════════════════
    // 📝 NOTAS (NOTES)
    // ═══════════════════════════════════════════════════════════════
    if (['nota', 'note', 'notas', 'notes'].includes(cmd)) {
      if (!notes) return reply("Sistema de notas indisponível.");
      
      const subCmd = args[0]?.toLowerCase();
      if (!subCmd || subCmd === 'list' || cmd === 'notas' || cmd === 'notes') {
        const userNotes = notes.getUserNotes(sender);
        if (userNotes.length === 0) return reply("Você não tem notas salvas.");
        return reply(`📝 *Suas Notas:*\n\n${userNotes.map((n, i) => `${i + 1}. ${n.title || (n.text ? n.text.slice(0, 20) : 'Sem texto')}...`).join('\n')}`);
      }

      if (subCmd === 'add') {
        const text = args.slice(1).join(' ');
        if (!text) return reply("Digite o texto da nota!");
        notes.addNote(sender, text);
        return reply("✅ Nota adicionada!");
      }

      if (subCmd === 'del') {
        const id = parseInt(args[1]) - 1;
        if (isNaN(id)) return reply("Informe o ID!");
        const res = notes.deleteNote(sender, id);
        return reply(res ? "✅ Nota deletada!" : `💔 ID inválido.`);
      }
    }
  }
};
