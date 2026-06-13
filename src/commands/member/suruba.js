import fs from 'fs';

export default {
  name: "suruba",
  description: "Cria uma brincadeira de suruba marcando membros aleatórios",
  commands: ["surubao", "suruba"],
  usage: `${global.prefix}surubao <quantidade>`,
  handle: async ({  bot, reply, isGroup, command, info, isModoLite, isModoBn, q, from, buildGroupFilePath, optimizer, AllgroupMembers, getUserName, sender , MESSAGES }) => {
    try {
      // isModoLite e isModoBn normalmente vem do contexto de configuração
      const modoLite = isModoLite !== undefined ? isModoLite : false;
      const modoBn = isModoBn !== undefined ? isModoBn : true;
      
      if (modoLite) return bot.react('❌', { key: info.key });
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!modoBn) return reply(MESSAGES.permission.botGameModeDisabled);
      if (!q) return reply(MESSAGES.member.suruba.missingAmount);
      if (Number(q) > 15) return reply(MESSAGES.member.suruba.amountTooHigh);
      
      const emojiskk = ["🥵", "😈", "🫣", "😏"];
      const emojis2 = emojiskk[Math.floor(Math.random() * emojiskk.length)];
      
      const frasekk = MESSAGES.member.suruba.phrases;
      const context = frasekk[Math.floor(Math.random() * frasekk.length)](q);
      
      let path = buildGroupFilePath(from);
      let data = await optimizer.loadJsonWithCache(path, { mark: {} });
      let membros = AllgroupMembers.filter(m => !['0', 'marca'].includes(data.mark[m]));
      
      let ABC = `${emojis2} @${getUserName(sender)} ${context}\n\n`;
      let mencts = [sender];
      
      for (let i = 0; i < q; i++) {
        let menb = membros[Math.floor(Math.random() * membros.length)];
        ABC += `@${menb.split("@")[0]}\n`;
        mencts.push(menb);
      }
      
      await bot.sendMessage(from, {
        image: {
          url: 'https://raw.githubusercontent.com/nazuninha/uploads/main/outros/1747545773146_rrv7of.bin'
        },
        caption: ABC,
        mentions: mencts
      });
      
    } catch (e) {
      console.error(e);
      await reply(MESSAGES.error.general);
    }
  }
};
