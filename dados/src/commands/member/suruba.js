import fs from 'fs';

export default {
  name: "suruba",
  description: "Cria uma brincadeira de suruba marcando membros aleatórios",
  commands: ["surubao", "suruba"],
  usage: `${global.prefix}surubao <quantidade>`,
  handle: async ({  nazu, reply, isGroup, command, info, isModoLite, isModoBn, q, from, buildGroupFilePath, optimizer, AllgroupMembers, getUserName, sender , MESSAGES }) => {
    try {
      // isModoLite e isModoBn normalmente vem do contexto de configuração
      const modoLite = isModoLite !== undefined ? isModoLite : false;
      const modoBn = isModoBn !== undefined ? isModoBn : true;
      
      if (modoLite) return nazu.react('❌', { key: info.key });
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!modoBn) return reply('O modo brincadeira nao esta ativo no grupo');
      if (!q) return reply(`Eita, coloque o número de pessoas após o comando.`);
      if (Number(q) > 15) return reply("Coloque um número menor, ou seja, abaixo de *15*.");
      
      const emojiskk = ["🥵", "😈", "🫣", "😏"];
      const emojis2 = emojiskk[Math.floor(Math.random() * emojiskk.length)];
      
      const frasekk = [
        `tá querendo relações sexuais a ${q}, topa?`, 
        `quer que *${q}* pessoas venham de *chicote, algema e corda de alpinista*.`, 
        `quer que ${q} pessoas der tapa na cara, lhe chame de cachorra e fud3r bem gostosinho...`
      ];
      const context = frasekk[Math.floor(Math.random() * frasekk.length)];
      
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
      
      await nazu.sendMessage(from, {
        image: {
          url: 'https://raw.githubusercontent.com/nazuninha/uploads/main/outros/1747545773146_rrv7of.bin'
        },
        caption: ABC,
        mentions: mencts
      });
      
    } catch (e) {
      console.error(e);
      await reply(MESSAGES.error.internal);
    }
  }
};
