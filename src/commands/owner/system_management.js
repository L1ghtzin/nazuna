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
    // --- UPDATES ---
    // --- UPDATES ---
    if (['updates', 'atualizar', 'update', 'atualizarbot'].includes(cmd)) {
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

        const stages = [
          { name: 'requisitos', label: '🔍 Verificando requisitos', triggers: ['Verificando requisitos'], doneTriggers: ['Criando backup', 'Backup salvo', 'Baixando a versão', 'Download concluído', 'Limpando arquivos', 'Limpeza concluída', 'Aplicando atualização', 'Atualização aplicada', 'Restaurando backup', 'Backup restaurado', 'Instalando dependências', 'Dependências instaladas', 'Atualização concluída'] },
          { name: 'backup', label: '📁 Criando backup', triggers: ['Criando backup'], doneTriggers: ['Backup salvo', 'Baixando a versão', 'Download concluído', 'Limpando arquivos', 'Limpeza concluída', 'Aplicando atualização', 'Atualização aplicada', 'Restaurando backup', 'Backup restaurado', 'Instalando dependências', 'Dependências instaladas', 'Atualização concluída'] },
          { name: 'download', label: '📥 Baixando do GitHub', triggers: ['Baixando a versão'], doneTriggers: ['Download concluído', 'Limpando arquivos', 'Limpeza concluída', 'Aplicando atualização', 'Atualização aplicada', 'Restaurando backup', 'Backup restaurado', 'Instalando dependências', 'Dependências instaladas', 'Atualização concluída'] },
          { name: 'limpeza', label: '🧹 Limpando arquivos', triggers: ['Limpando arquivos'], doneTriggers: ['Limpeza concluída', 'Aplicando atualização', 'Atualização aplicada', 'Restaurando backup', 'Backup restaurado', 'Instalando dependências', 'Dependências instaladas', 'Atualização concluída'] },
          { name: 'aplicacao', label: '🚀 Aplicando nova versão', triggers: ['Aplicando atualização'], doneTriggers: ['Atualização aplicada', 'Restaurando backup', 'Backup restaurado', 'Instalando dependências', 'Dependências instaladas', 'Atualização concluída'] },
          { name: 'restauracao', label: '📂 Restaurando backup', triggers: ['Restaurando backup'], doneTriggers: ['Backup restaurado', 'Instalando dependências', 'Dependências instaladas', 'Atualização concluída'] },
          { name: 'dependencias', label: '📦 Instalando dependências', triggers: ['Instalando dependências'], doneTriggers: ['Dependências instaladas', 'Dependências já estão atualizadas', 'Atualização concluída'] },
          { name: 'finalizacao', label: '🎉 Finalizando atualização', triggers: ['Dependências instaladas', 'Dependências já estão atualizadas', 'Salvando registro'], doneTriggers: ['Atualização concluída'] }
        ];

        const activeTriggers = new Set();
        let sentMsg = null;
        let alreadyUpdated = false;

        const buildStatusText = () => {
          let text = `⚙️ *PROCESSO DE ATUALIZAÇÃO DO BOT* ⚙️\n\n`;
          
          const isStageDone = (stage) => {
            return stage.doneTriggers.some(t => activeTriggers.has(t));
          };
          
          const isStageActive = (stage) => {
            return stage.triggers.some(t => activeTriggers.has(t));
          };

          stages.forEach((stage, idx) => {
            let icon = '⚪';
            
            if (isStageDone(stage)) {
              icon = '✅';
            } else if (isStageActive(stage)) {
              icon = '⏳';
            }
            
            text += `${icon} *${idx + 1}.* ${stage.label}\n`;
          });
          
          if (activeTriggers.has('Atualização concluída')) {
            text += `\n🎉 *ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!*\n\n🔄 *O bot será reiniciado em instantes...*`;
          } else {
            text += `\n⏳ _Por favor, aguarde o término das etapas..._`;
          }
          
          return text;
        };

        let isEditing = false;
        let needsAnotherEdit = false;

        const processEditQueue = async () => {
          if (isEditing || !sentMsg?.key) return;
          isEditing = true;
          
          while (needsAnotherEdit) {
            needsAnotherEdit = false;
            try {
              await bot.sendMessage(from, { edit: sentMsg.key, text: buildStatusText() });
              await new Promise(r => setTimeout(r, 1500)); // Pausa de 1.5s p/ evitar block
            } catch (err) {
              console.error('Erro ao atualizar status do update:', err.message);
            }
          }
          isEditing = false;
        };

        const updateMessage = () => {
          needsAnotherEdit = true;
          processEditQueue();
        };

        // Envia mensagem inicial
        const sentMsgPromise = reply(buildStatusText());
        sentMsgPromise.then(msg => {
          sentMsg = msg;
          if (activeTriggers.size > 0) {
            updateMessage();
          }
        });

        const updateProcess = spawn('node', [updateScriptPath], {
          cwd: process.cwd(),
          stdio: ['ignore', 'pipe', 'pipe'],
          detached: false
        });

        updateProcess.stdout.on('data', async (data) => {
          const str = data.toString();
          let changed = false;
          
          if (str.includes('TRIGGER_ALREADY_UPDATED')) {
            alreadyUpdated = true;
            if (sentMsg?.key) {
              await bot.sendMessage(from, { edit: sentMsg.key, text: MESSAGES.owner.system_management.update.alreadyUpdated }).catch(() => {});
            }
            return;
          }
          
          for (const stage of stages) {
            for (const trigger of stage.triggers) {
              if (str.includes(trigger) && !activeTriggers.has(trigger)) {
                activeTriggers.add(trigger);
                changed = true;
              }
            }
            for (const trigger of stage.doneTriggers) {
              if (str.includes(trigger) && !activeTriggers.has(trigger)) {
                activeTriggers.add(trigger);
                changed = true;
              }
            }
          }
          
          if (str.includes('Atualização concluída') && !activeTriggers.has('Atualização concluída')) {
            activeTriggers.add('Atualização concluída');
            changed = true;
          }

          if (changed) {
            updateMessage();
          }
        });

        updateProcess.stderr.on('data', (data) => {
          const str = data.toString();
          console.error(`[UPDATE ERROR]: ${str}`);
        });

        updateProcess.on('close', async (code) => {
          if (code === 0) {
            if (alreadyUpdated) {
              return;
            }
            setTimeout(() => process.exit(0), 5000);
          } else {
            const errText = MESSAGES.owner.system_management.update.finishedError(code);
            if (sentMsg?.key) {
              await bot.sendMessage(from, { edit: sentMsg.key, text: MESSAGES.owner.system_management.update.finishedErrorMsg(code, errText) }).catch(() => {});
            } else {
              reply(errText).catch(() => {});
            }
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
