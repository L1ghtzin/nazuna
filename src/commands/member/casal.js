export default {
  name: "casal",
  description: "Forma um casal aleatório no grupo",
  commands: ["casal"],
  usage: `${global.prefix}casal`,
  handle: async ({  reply, isGroup, isModoBn, from, buildGroupFilePath, optimizer, AllgroupMembers, getUserName , MESSAGES }) => {
    try {
      if (!isGroup) return reply(MESSAGES.member.casal.groupOnlyError);
      if (!isModoBn) return reply(MESSAGES.member.casal.gameModeDisabled);
      if (AllgroupMembers.length < 2) return reply(MESSAGES.member.casal.notEnoughMembers);
      
      let path = buildGroupFilePath(from);
      // Otimização: Usar cache para leitura de arquivo
      let data = await optimizer.loadJsonWithCache(path, { mark: {} });
      
      let membros = AllgroupMembers.filter(m => !['0', 'marca'].includes(data.mark[m]));
      
      if (membros.length < 2) membros = AllgroupMembers; // fallback

      const membro1 = membros[Math.floor(Math.random() * membros.length)];
      let membro2 = membros[Math.floor(Math.random() * membros.length)];
      while (membro2 === membro1) {
        membro2 = membros[Math.floor(Math.random() * membros.length)];
      }

      const shipLevel = Math.floor(Math.random() * 101);
      const chance = Math.floor(Math.random() * 101);
      
      const comentarios = [
        'Cupido acabou de atirar!', 'O amor está no ar!', 'Combinação perfeita detectada!',
        'Ship aprovado pela comunidade!', 'Quimica confirmada!', 'Casal goals incoming!'
      ];
      const comentario = comentarios[Math.floor(Math.random() * comentarios.length)];
      
      const statusShip = shipLevel >= 80 ? '🔥 SHIP INCENDIÁRIO!' : 
         shipLevel >= 60 ? '😍 Ship promissor!' : 
         shipLevel >= 40 ? '😊 Rolou uma química!' : 
         shipLevel >= 20 ? '🤔 Meio forçado...' : '😅 Só na amizade!';
         
      const conclusion = chance >= 70 ? '🎉 Já podem marcar o casamento!' : chance >= 50 ? '👀 Vale a pena investir!' : '😂 Melhor ficar só na amizade!';
      
      await reply(MESSAGES.member.casal.result(comentario, getUserName(membro1), getUserName(membro2), shipLevel, chance, statusShip, conclusion), {
        mentions: [membro1, membro2]
      });
    } catch (e) {
      console.error('Erro no comando casal:', e);
      await reply(MESSAGES.error.general);
    }
  }
};
