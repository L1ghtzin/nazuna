export default {
  name: "system_management",
  description: "Gerenciamento avançado do sistema, subdonos e limites",
  commands: ["addblackglobal", "addsubdono", "atualizar", "atualizarbot", "cmddeslimitar", "cmdlimit", "cmdlimitar", "cmdlimites", "cmdlimits", "cmdremovelimit", "delsubdono", "limitarcmd", "listasubdonos", "listblackglobal", "listcmdlimites", "listsubdonos", "remsubdono", "rmblackglobal", "rmcmdlimit", "rmsubdono", "update", "updates", "viewmsg"],
  handle: async ({ 
    bot, from, info, command, reply, q, args, isOwner, isSubOwner, isOwnerOrSub, prefix, sender, numerodono, config,
    addSubdono, removeSubdono, getSubdonos, addGlobalBlacklist, removeGlobalBlacklist, getGlobalBlacklist,
    isValidJid, isValidLid, buildUserId, getLidFromJidCached, groupMetadata, isGroup, pushname, menc_os2,
    MESSAGES, botState, optimizer, DATABASE_DIR
  }) => {
    const cmd = command.toLowerCase();

    if (!isOwnerOrSub) {
       return reply(MESSAGES.permission.subOwnerOnly);
    }

    // --- UPDATES ---
    if (['updates', 'atualizar', 'update', 'atualizarbot'].includes(cmd)) {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);

      if (!q || q.toLowerCase() !== 'sim') {
        return reply(MESSAGES.owner.system_management.update.warning(prefix, command));
      }

      try {
        const { spawn } = await import('child_process');
        const pathz = await import('path');
        const fs = await import('fs');
        
        const updateScriptPath = pathz.join(process.cwd(), 'src', '.scripts', 'update.js');

        if (!fs.existsSync(updateScriptPath)) {
          return reply(MESSAGES.owner.system_management.update.scriptNotFound);
        }

        await reply(MESSAGES.owner.system_management.update.starting);

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
            reply(MESSAGES.owner.system_management.update.finishedError(code));
          }
        });

      } catch (e) {
        console.error('Erro ao iniciar spawn de atualização:', e);
        return reply(MESSAGES.owner.system_management.update.error(e.message));
      }
      return;
    }


    // --- SUBDONOS ---
    if (['addsubdono', 'remsubdono', 'rmsubdono', 'delsubdono', 'listasubdonos', 'listsubdonos'].includes(cmd)) {
      if (cmd.startsWith('add')) {
        let target = menc_os2 || q.trim();
        if (!target) return reply(MESSAGES.owner.system_management.subOwner.missingTarget);
        
        if (target && !target.includes('@')) {
          target = buildUserId(target, config);
        }
        
        const res = await addSubdono(target, numerodono, bot);
        return reply(res.message);
      }
      if (cmd.startsWith('rem') || cmd.startsWith('rm') || cmd.startsWith('del')) {
        let target = menc_os2 || q.trim();
        if (!target) return reply(MESSAGES.owner.system_management.subOwner.missingTarget);

        if (target && !target.includes('@')) {
          target = buildUserId(target, config);
        }

        const res = await removeSubdono(target, bot);
        return reply(res.message);
      }
      if (cmd.startsWith('list')) {
        const list = getSubdonos();
        if (!list.length) return reply(MESSAGES.owner.system_management.subOwner.emptyList);
        return reply(MESSAGES.owner.system_management.subOwner.listHeader + list.join('\n'));
      }
    }


    // --- CMD LIMIT ---
    if (cmd.includes('cmdlimit')) {
      const { cmdLimitAdd, cmdLimitRemove, cmdLimitList } = await import('../../funcs/utils/cmdlimit.js');
      if (cmd.includes('limitar') || cmd === 'cmdlimit') return cmdLimitAdd(bot, from, q, reply, prefix, isOwnerOrSub);
      if (cmd.includes('des') || cmd.includes('rem')) return cmdLimitRemove(bot, from, q, reply, prefix, isOwnerOrSub);
      return cmdLimitList(bot, from, q, reply, prefix, isOwnerOrSub);
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

        if (!target) return reply(MESSAGES.owner.system_management.blacklist.missingTarget);

        if (target && !target.includes('@')) {
          target = buildUserId(target, config);
        }
        
        const res = await addGlobalBlacklist(target, reason || 'Não especificado', pushname, bot);
        return reply(res.message, { mentions: [target] });
      }
      if (cmd.startsWith('rm')) {
        let target = menc_os2;
        if (!target && q) target = q.split(' ')[0];
        if (!target) return reply(MESSAGES.owner.system_management.blacklist.missingTarget);

        if (target && !target.includes('@')) {
          target = buildUserId(target, config);
        }
        
        const res = await removeGlobalBlacklist(target, bot);
        return reply(res.message, { mentions: [target] });
      }
      const list = getGlobalBlacklist();
      return reply(MESSAGES.owner.system_management.blacklist.listHeader + Object.keys(list.users).join('\n'));
    }

    // --- VIEWMSG (Marcar como lida) ---
    if (cmd === 'viewmsg') {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      const opt = q.toLowerCase();
      
      if (opt !== 'on' && opt !== 'off') {
        return reply(MESSAGES.owner.system_management.viewMsg.usage(prefix));
      }
      
      const path = await import('path');
      botState.viewMessages = (opt === 'on');
      await optimizer.saveJsonWithCache(path.join(DATABASE_DIR, 'botState.json'), botState);
      
      return reply(MESSAGES.owner.system_management.viewMsg.success(opt));
    }
  }
};
