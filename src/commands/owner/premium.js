import pathz from 'path';

export default {
  name: "premium_mgmt",
  description: "Gerenciamento de usuários Premium e VIP",
  commands: [
    "addpremium", "addvip", "delpremium", "delvip", "rmpremium", "rmvip",
    "addpremiumgp", "addvipgp", "delpremiumgp", "delvipgp", "rmpremiumgp", "rmvipgp",
    "listapremium", "listavip", "premiumlist", "listpremium", "listprem"
  ],
  handle: async ({ 
    bot, from, info, command, reply, prefix, sender, menc_os2,
    isOwner, premiumListaZinha, DATABASE_DIR, optimizer, getUserName,
    MESSAGES
  }) => {
    const cmd = command.toLowerCase();

    // --- ADICIONAR PREMIUM ---
    if (['addpremium', 'addvip'].includes(cmd)) {
      if (!menc_os2) return reply(MESSAGES.error.missing('alguém'));
      if (premiumListaZinha[menc_os2]) return reply(MESSAGES.owner.premium.add.alreadyPremium);
      
      premiumListaZinha[menc_os2] = true;
      const filePath = pathz.join(DATABASE_DIR, 'dono/premium.json');
      await optimizer.saveJsonWithCache(filePath, premiumListaZinha);
      
      return bot.sendMessage(from, {
        text: MESSAGES.owner.premium.add.success(getUserName(menc_os2)),
        mentions: [menc_os2]
      }, { quoted: info });
    }

    // --- REMOVER PREMIUM ---
    if (['delpremium', 'delvip', 'rmpremium', 'rmvip'].includes(cmd)) {
      if (!menc_os2) return reply(MESSAGES.error.missing('alguém'));
      if (!premiumListaZinha[menc_os2]) return reply(MESSAGES.owner.premium.remove.notPremium);
      
      delete premiumListaZinha[menc_os2];
      const filePath = pathz.join(DATABASE_DIR, 'dono/premium.json');
      await optimizer.saveJsonWithCache(filePath, premiumListaZinha);
      
      return bot.sendMessage(from, {
        text: MESSAGES.owner.premium.remove.success(getUserName(menc_os2)),
        mentions: [menc_os2]
      }, { quoted: info });
    }

    // --- LISTAR PREMIUM ---
    if (['listapremium', 'listavip', 'premiumlist', 'listpremium', 'listprem'].includes(cmd)) {
      const list = Object.keys(premiumListaZinha).filter(id => premiumListaZinha[id]);
      if (list.length === 0) return reply(MESSAGES.owner.premium.list.empty);
      
      let teks = MESSAGES.owner.premium.list.header(list.length);
      for (let id of list) {
        teks += MESSAGES.owner.premium.list.item(id.split('@')[0]);
      }
      return bot.sendMessage(from, { text: teks, mentions: list }, { quoted: info });
    }
  }
};
