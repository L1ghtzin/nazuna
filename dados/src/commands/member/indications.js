import pathz from 'path';

export default {
  name: "indication_system",
  description: "Sistema de indicações e recomendações",
  commands: ["addindicacao", "addindicar", "addindica", "topindica", "topindicacao", "rankindicacao", "rankindicacoes", "delindicacao", "rmindicacao", "removerindicacao"],
  handle: async ({ 
    reply, command, isOwner, menc_os2, DATABASE_DIR, optimizer, getUserName, prefix, fs,
    MESSAGES
  }) => {
    const cmd = command.toLowerCase();
    const filePath = pathz.join(DATABASE_DIR, 'indicacoes.json');
    
    // Carregar dados
    let data = { users: {} };
    try {
      if (fs.existsSync(filePath)) {
        data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      }
    } catch (e) {}

    // --- ADICIONAR INDICAÇÃO ---
    if (cmd.startsWith('add')) {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      if (!menc_os2) return reply(MESSAGES.permission.mentionRequired);
      
      if (!data.users[menc_os2]) {
        data.users[menc_os2] = { count: 0, addedBy: [], createdAt: new Date().toISOString() };
      }
      
      data.users[menc_os2].count += 1;
      await optimizer.saveJsonWithCache(filePath, data);
      return reply(`✅ Indicação adicionada para @${getUserName(menc_os2)}! Total: ${data.users[menc_os2].count}`, { mentions: [menc_os2] });
    }

    // --- RANKING ---
    if (cmd.includes('top') || cmd.includes('rank')) {
      const users = Object.entries(data.users)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10);
      
      if (users.length === 0) return reply("📭 Nenhuma indicação registrada.");
      
      let teks = `🏆 *RANKING DE INDICAÇÕES*\n\n`;
      users.forEach(([id, info], i) => {
        teks += `${i + 1}. @${id.split('@')[0]} - ${info.count} indicações\n`;
      });
      return reply(teks, { mentions: users.map(u => u[0]) });
    }

    // --- REMOVER ---
    if (cmd.startsWith('del') || cmd.startsWith('rm') || cmd.startsWith('remover')) {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      if (!menc_os2 || !data.users[menc_os2]) return reply("Usuário não encontrado.");
      
      delete data.users[menc_os2];
      await optimizer.saveJsonWithCache(filePath, data);
      return reply("✅ Indicação removida.");
    }
  }
};
