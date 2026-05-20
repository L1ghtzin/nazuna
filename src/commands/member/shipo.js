export default {
  name: "shipo",
  description: "Forma um casal com a pessoa marcada",
  commands: ["shipo"],
  usage: `${global.prefix}shipo <@usuario>`,
  handle: async ({  reply, isGroup, isModoBn, menc_os2, from, buildGroupFilePath, optimizer, AllgroupMembers, getUserName, prefix , MESSAGES }) => {
    try {
      if (!isGroup) return reply("╭━━━⊱ 💔 *ERRO* 💔 ⊱━━━╮\n│\n│ ❌ Este comando só funciona\n│    em grupos!\n│\n╰━━━━━━━━━━━━━━━━━━━━╯");
      if (!isModoBn) return reply(`💔 O modo brincadeira não está ativo nesse grupo.`);
      if (!menc_os2) return reply(`╭━━━⊱ 💘 *SHIPO* 💘 ⊱━━━╮\n│\n│ ❌ Marque alguém para\n│    encontrar um par!\n│\n│ 💡 *Exemplo:*\n│ ${prefix}shipo @fulano\n│\n╰━━━━━━━━━━━━━━━━━━━━╯`);
      if (AllgroupMembers.length < 2) return reply(`💔 Preciso de pelo menos 2 membros no grupo!`);
      
      let path = buildGroupFilePath(from);
      // Otimização: Usar cache para leitura de arquivo
      let data = await optimizer.loadJsonWithCache(path, { mark: {} });
      let membros = AllgroupMembers.filter(m => !['0', 'marca'].includes(data.mark[m]));
      
      if (membros.length < 2) membros = AllgroupMembers; // fallback
      
      let par = membros[Math.floor(Math.random() * membros.length)];
      while (par === menc_os2) {
        par = membros[Math.floor(Math.random() * membros.length)];
      }
      
      const shipLevel = Math.floor(Math.random() * 101);
      const chance = Math.floor(Math.random() * 101);
      
      const userName1 = getUserName(menc_os2);
      const userName2 = getUserName(par);
      const nomeShip = `${userName1.slice(0,3)}${userName2.slice(-3)}`;
      
      const comentarios = [
        'Encontrei o par perfeito!', 'Match feito no céu!', 'Combinação aprovada!',
        'Ship name já tá pronto!', 'Quero ver essa dupla!', 'Shippando forte!'
      ];
      const comentario = comentarios[Math.floor(Math.random() * comentarios.length)];
      
      const statusShip = shipLevel >= 80 ? '🔥 ALMA GÊMEA!' : 
         shipLevel >= 60 ? '😍 Tem futuro hein!' : 
         shipLevel >= 40 ? '😊 Pode dar certo!' : 
         shipLevel >= 20 ? '🤔 Vai precisar de esforço...' : '😅 Zero chance!';

      await reply(`╭━━━⊱ 💘 *SHIPO* 💘 ⊱━━━╮
│
│ 💫 *${comentario}*
│
│ 💝 *O PAR PERFEITO*
│ @${userName1} ❤️ @${userName2}
│
│ 🏷️ *Nome do Ship:* ${nomeShip}
│
│ 📊 *Estatísticas*
│ └─ 💖 Ship: *${shipLevel}%*
│ └─ 🎯 Chance: *${chance}%*
│
│ ${statusShip}
│
╰━━━━━━━━━━━━━━━━━━━━━━╯`, {
        mentions: [menc_os2, par]
      });
    } catch (e) {
      console.error('Erro no comando shipo:', e);
      await reply(MESSAGES.error.simple);
    }
  }
};
