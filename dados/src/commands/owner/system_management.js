export default {
  name: "system_management",
  description: "Gerenciamento avançado do sistema, subdonos e limites",
  commands: ["addblackglobal", "addsubdono", "atualizar", "atualizarbot", "cmddeslimitar", "cmdlimit", "cmdlimitar", "cmdlimites", "cmdlimits", "cmdremovelimit", "delsubdono", "limitarcmd", "limparaluguel", "listasubdonos", "listblackglobal", "listcmdlimites", "listsubdonos", "modoaluguel", "remsubdono", "rmblackglobal", "rmcmdlimit", "rmsubdono", "update", "updates", "viewmsg"],
  handle: async ({ 
    nazu, from, info, command, reply, q, args, isOwner, isSubOwner, isOwnerOrSub, prefix, sender, numerodono, config,
    addSubdono, removeSubdono, getSubdonos, addGlobalBlacklist, removeGlobalBlacklist, getGlobalBlacklist,
    isValidJid, isValidLid, buildUserId, getLidFromJidCached, groupMetadata, isGroup, pushname, menc_os2,
    MESSAGES
  }) => {
    const cmd = command.toLowerCase();

    if (!isOwner && !['listasubdonos', 'listsubdonos', 'cmdlimites', 'cmdlimits', 'listcmdlimites'].includes(cmd)) {
       if (!isOwnerOrSub) return reply('🚫 Apenas o dono pode usar este comando.');
    }

    // --- UPDATES ---
    if (['updates', 'atualizar', 'update', 'atualizarbot'].includes(cmd)) {
      if (!q || q.toLowerCase() !== 'sim') {
        const avisoMsg = `⚠️ *ATENÇÃO - ATUALIZAÇÃO DO BOT* ⚠️\n\n` +
          `┏━━━━━━━━━━━━━━━━━━━━━\n` +
          `┃ 📢 *AVISOS IMPORTANTES:*\n` +
          `┣━━━━━━━━━━━━━━━━━━━━━\n` +
          `┃\n` +
          `┃ ⚠️ Edições manuais no código\n` +
          `┃    serão *PERDIDAS*\n` +
          `┃\n` +
          `┃ ✅ Banco de dados será\n` +
          `┃    *PRESERVADO*\n` +
          `┃\n` +
          `┃ ✅ Configurações (config.json)\n` +
          `┃    serão *MANTIDAS*\n` +
          `┃\n` +
          `┗━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `Para confirmar e atualizar, digite:\n` +
          `*${prefix}${command} sim*`;
        return reply(avisoMsg);
      }

      await reply('⏳ Baixando atualizações do GitHub...');
      
      try {
        const { exec } = await import('child_process');
        exec('git pull', (err, stdout, stderr) => {
          if (err) {
            console.error('Erro na atualização:', err);
            return reply(`❌ Erro ao atualizar:\n${err.message}`);
          }
          if (stdout.includes('Already up to date.') || stdout.includes('Already up-to-date.')) {
            return reply('✨ *O bot já está na versão mais recente!*');
          }
          reply('✅ *Atualização concluída com sucesso!*\n\n🔄 *Reiniciando o bot para aplicar as mudanças...*');
          setTimeout(() => process.exit(0), 2000);
        });
      } catch (e) {
        return reply('❌ Erro interno ao tentar atualizar.');
      }
      return;
    }

    // --- SUBDONOS ---
    if (['addsubdono', 'remsubdono', 'rmsubdono', 'delsubdono', 'listasubdonos', 'listsubdonos'].includes(cmd)) {
      if (cmd.startsWith('add')) {
        let target = menc_os2 || q.trim();
        if (!target) return reply('Marque ou digite o número.');
        const res = await addSubdono(target, numerodono, nazu);
        return reply(res.message);
      }
      if (cmd.startsWith('rem') || cmd.startsWith('rm') || cmd.startsWith('del')) {
        let target = menc_os2 || q.trim();
        const res = await removeSubdono(target, nazu);
        return reply(res.message);
      }
      if (cmd.startsWith('list')) {
        const list = getSubdonos();
        if (!list.length) return reply('📭 Nenhum subdono.');
        return reply(`👑 *Subdonos:*\n\n` + list.join('\n'));
      }
    }


    // --- CMD LIMIT ---
    if (cmd.includes('cmdlimit')) {
      const { cmdLimitAdd, cmdLimitRemove, cmdLimitList } = await import('../../funcs/utils/cmdlimit.js');
      if (cmd.includes('limitar') || cmd === 'cmdlimit') return cmdLimitAdd(nazu, from, q, reply, prefix, isOwnerOrSub);
      if (cmd.includes('des') || cmd.includes('rem')) return cmdLimitRemove(nazu, from, q, reply, prefix, isOwnerOrSub);
      return cmdLimitList(nazu, from, q, reply, prefix, isOwnerOrSub);
    }

    // --- GLOBAL BLACKLIST ---
    if (cmd.includes('blackglobal')) {
      if (cmd.startsWith('add')) {
        let target = menc_os2;
        let reason = q.trim();
        
        // Se não respondeu a uma mensagem, o primeiro argumento pode ser o número e o resto o motivo
        if (!target && q) {
          const parts = q.split(' ');
          target = parts[0];
          reason = parts.slice(1).join(' ').trim();
        }
        
        // Se citou/marcou alguém, o 'q' inteiro é o motivo
        if (menc_os2 && q) {
          reason = q.trim();
        }

        if (!target) return reply("⚠️ Marque, responda a mensagem ou digite o número do usuário.");
        
        const res = await addGlobalBlacklist(target, reason || 'Não especificado', pushname, nazu);
        return reply(res.message, { mentions: [target] });
      }
      if (cmd.startsWith('rm')) {
        let target = menc_os2;
        if (!target && q) target = q.split(' ')[0];
        if (!target) return reply("⚠️ Marque, responda a mensagem ou digite o número do usuário.");
        
        const res = await removeGlobalBlacklist(target, nazu);
        return reply(res.message, { mentions: [target] });
      }
      const list = getGlobalBlacklist();
      return reply(`🛑 *Blacklist Global:*\n\n` + Object.keys(list.users).join('\n'));
    }
  }
};
