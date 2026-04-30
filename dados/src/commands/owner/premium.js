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
    nazu, from, info, command, reply, prefix, sender, menc_os2,
    isOwner, premiumListaZinha, DATABASE_DIR, optimizer, getUserName,
    MESSAGES
  }) => {
    if (!isOwner) return reply(MESSAGES.permission.ownerOnly);

    const cmd = command.toLowerCase();

    // --- ADICIONAR PREMIUM ---
    if (['addpremium', 'addvip'].includes(cmd)) {
      if (!menc_os2) return reply(MESSAGES.permission.mentionRequired);
      if (premiumListaZinha[menc_os2]) return reply('O usuário já está na lista premium.');
      
      premiumListaZinha[menc_os2] = true;
      const filePath = pathz.join(DATABASE_DIR, 'dono/premium.json');
      await optimizer.saveJsonWithCache(filePath, premiumListaZinha);
      
      return nazu.sendMessage(from, {
        text: `✅ @${getUserName(menc_os2)} foi adicionado(a) à lista premium.`,
        mentions: [menc_os2]
      }, { quoted: info });
    }

    // --- REMOVER PREMIUM ---
    if (['delpremium', 'delvip', 'rmpremium', 'rmvip'].includes(cmd)) {
      if (!menc_os2) return reply(MESSAGES.permission.mentionRequired);
      if (!premiumListaZinha[menc_os2]) return reply('O usuário não está na lista premium.');
      
      delete premiumListaZinha[menc_os2];
      const filePath = pathz.join(DATABASE_DIR, 'dono/premium.json');
      await optimizer.saveJsonWithCache(filePath, premiumListaZinha);
      
      return nazu.sendMessage(from, {
        text: `✅ @${getUserName(menc_os2)} foi removido(a) da lista premium.`,
        mentions: [menc_os2]
      }, { quoted: info });
    }

    // --- LISTAR PREMIUM ---
    if (['listapremium', 'listavip', 'premiumlist', 'listpremium', 'listprem'].includes(cmd)) {
      const list = Object.keys(premiumListaZinha).filter(id => premiumListaZinha[id]);
      if (list.length === 0) return reply("A lista premium está vazia.");
      
      let teks = `⭐ *USUÁRIOS PREMIUM* (${list.length})\n\n`;
      for (let id of list) {
        teks += `- @${id.split('@')[0]}\n`;
      }
      return nazu.sendMessage(from, { text: teks, mentions: list }, { quoted: info });
    }
  }
};
