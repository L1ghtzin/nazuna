export default {
  name: "system_management",
  description: "Gerenciamento avançado do sistema, subdonos e limites",
  commands: ["addblackglobal", "addsubdono", "atualizar", "atualizarbot", "cmddeslimitar", "cmdlimit", "cmdlimitar", "cmdlimites", "cmdlimits", "cmdremovelimit", "delsubdono", "limitarcmd", "listasubdonos", "listblackglobal", "listcmdlimites", "listsubdonos", "remsubdono", "rmblackglobal", "rmcmdlimit", "rmsubdono", "update", "updates", "viewmsg"],
  handle: async ({ 
    nazu, from, info, command, reply, q, args, isOwner, isSubOwner, isOwnerOrSub, prefix, sender, numerodono, config,
    addSubdono, removeSubdono, getSubdonos, addGlobalBlacklist, removeGlobalBlacklist, getGlobalBlacklist,
    isValidJid, isValidLid, buildUserId, getLidFromJidCached, groupMetadata, isGroup, pushname, menc_os2,
    MESSAGES
  }) => {
    const cmd = command.toLowerCase();

    if (!isOwnerOrSub) {
       return reply('🚫 Apenas o dono ou subdonos podem usar este comando.');
    }

    // --- UPDATES ---
    if (['updates', 'atualizar', 'update', 'atualizarbot'].includes(cmd)) {
      if (!isOwner) return reply("🚫 Apenas o Dono principal pode atualizar o bot!");

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
          `┃    *MANTIDAS*\n` +
          `┃\n` +
          `┗━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `Para confirmar e atualizar, digite:\n` +
          `*${prefix}${command} sim*`;
        return reply(avisoMsg);
      }

      try {
        const { spawn } = await import('child_process');
        const pathz = await import('path');
        const fs = await import('fs');
        
        const updateScriptPath = pathz.join(process.cwd(), 'dados', 'src', '.scripts', 'update.js');

        if (!fs.existsSync(updateScriptPath)) {
          return reply("❌ Script de atualização não encontrado!\n\n📂 Caminho esperado: dados/src/.scripts/update.js");
        }

        await reply("🚀 *INICIANDO ATUALIZAÇÃO...*\n\n🔄 Iniciando script de atualização e monitorando progresso...");

        const updateProcess = spawn('node', [updateScriptPath], {
          cwd: process.cwd(),
          stdio: ['ignore', 'pipe', 'pipe'],
          detached: false
        });

        const messagesSent = new Set();
        const updateMessages = {
          'Verificando requisitos': '🔍 Verificando requisitos do sistema...',
          'Criando backup': '📁 Criando backup dos arquivos importantes...',
          'Backup salvo': '✅ Backup criado com sucesso!',
          'Baixando a versão': '📥 Baixando atualização do GitHub...',
          'Download concluído': '✅ Download concluído!\n\n🧹 Limpando arquivos antigos...',
          'Limpeza concluída': '✅ Limpeza concluída!\n\n🚀 Aplicando atualização...',
          'Atualização aplicada': '✅ Atualização aplicada!\n\n📂 Restaurando dados preservados...',
          'Backup restaurado': '✅ Dados restaurados!\n\n📦 Instalando dependências...',
          'Instalando dependências': '📦 Instalando/verificando dependências...\n⏳ Isso pode levar alguns minutos...',
          'Dependências instaladas': '✅ Dependências instaladas com sucesso!',
          'Atualização concluída': '🎉 *ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!*\n\n🔄 *O bot será reiniciado agora...*'
        };

        updateProcess.stdout.on('data', (data) => {
          const str = data.toString();
          for (const [trigger, msg] of Object.entries(updateMessages)) {
            if (str.includes(trigger) && !messagesSent.has(trigger)) {
              messagesSent.add(trigger);
              reply(msg).catch(() => {});
            }
          }
        });

        updateProcess.stderr.on('data', (data) => {
          const str = data.toString();
          console.error(`[UPDATE ERROR]: ${str}`);
        });

        updateProcess.on('close', (code) => {
          if (code === 0) {
            setTimeout(() => process.exit(0), 3000);
          } else {
            reply(`❌ O processo de atualização terminou com erro (Código: ${code}). Verifique o console para mais detalhes.`);
          }
        });

      } catch (e) {
        console.error('Erro ao iniciar spawn de atualização:', e);
        return reply(`❌ Erro interno ao tentar atualizar: ${e.message}`);
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
