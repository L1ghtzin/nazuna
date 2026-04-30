import { PREFIX } from "../../config.js";

export default {
  name: "owner_broadcast",
  description: "Comandos de divulgação e transmissão do dono",
  commands: ["antispamcmd", "div", "divdono", "divulgar", "setdiv", "tm2", "inscrevertm", "inscrevertm2", "desinscrever", "desinscrevertm", "cancelartm", "statustm", "statustm2"],
  handle: async ({ 
    nazu, from, info, command, args, reply, prefix, sender, q,
    isGroup, isOwner, AllgroupMembers, optimizer, DATABASE_DIR,
    generateWAMessageFromContent, antiSpamGlobal,
    isImage, isVideo, isQuotedImage, isQuotedVideo, getFileBuffer
  , MESSAGES }) => {
    if (!isOwner) return reply(MESSAGES.permission.ownerOnly);

    const cmd = command.toLowerCase();

    // ═══════════════════════════════════════════════════════════════
    // 🛡️ ANTISPAM GLOBAL (CMD)
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'antispamcmd') {
      const filePath = DATABASE_DIR + '/antispam.json';
      const cfg = antiSpamGlobal || {};
      const usage = `Uso: ${prefix}antispamcmd on <limite> <janela_s> <bloqueio_s> | off | status`;
      
      if (!q) return reply(usage);
      const parts = q.trim().split(/\s+/);
      const sub = parts[0].toLowerCase();

      if (sub === 'status') {
        return reply(`🛡️ *ANTISPAM GLOBAL*\n\nStatus: ${cfg.enabled ? '✅ Ativo' : `💔 Inativo`}\nLimite: ${cfg.limit} cmds/${cfg.interval}s\nBloqueio: ${Math.floor(cfg.blockTime/60)}m`);
      }
      if (sub === 'off') {
        cfg.enabled = false;
        await optimizer.saveJsonWithCache(filePath, cfg);
        return reply("✅ AntiSpam desativado.");
      }
      if (sub === 'on') {
        const [l, i, b] = parts.slice(1).map(v => parseInt(v));
        if ([l, i, b].some(isNaN)) return reply(usage);
        Object.assign(cfg, { enabled: true, limit: l, interval: i, blockTime: b });
        await optimizer.saveJsonWithCache(filePath, cfg);
        return reply("✅ AntiSpam configurado e ativado!");
      }
      return reply(usage);
    }

    // ═══════════════════════════════════════════════════════════════
    // 📣 DIVULGAÇÃO (DIV/DIVULGAR)
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'div' || cmd === 'divulgar') {
      if (!isGroup) return reply("Use no grupo!");
      const count = parseInt(args.pop());
      const markAll = args[args.length - 1]?.toLowerCase() === 'all';
      if (markAll) args.pop();
      
      let text = args.join(' ').trim();
      if (!text) {
        const divCfg = await optimizer.loadJsonWithCache(DATABASE_DIR + '/divulgacao.json', {});
        text = divCfg.savedMessage;
      }
      if (!text || isNaN(count)) return reply(`Uso: ${prefix}${cmd} <mensagem> [all] <quantidade>`);

      reply(`🚀 Iniciando divulgação de ${count} mensagens...`);
      
      for (let i = 0; i < count; i++) {
        const payment = {
          requestPaymentMessage: {
            currencyCodeIso4217: 'BRL', amount1000: '0', requestFrom: sender,
            noteMessage: { extendedTextMessage: { text, mentionedJid: markAll ? AllgroupMembers : [] } },
            amount: { value: '0', offset: 1000, currencyCode: 'BRL' },
            expiryTimestamp: Math.floor(Date.now() / 1000) + 86400
          }
        };
        const msg = await generateWAMessageFromContent(from, payment, { userJid: nazu?.user?.id });
        await nazu.relayMessage(from, msg.message, { messageId: msg.key.id });
        await new Promise(r => setTimeout(r, 500));
      }
      return reply("✅ Divulgação concluída.");
    }

    if (cmd === 'setdiv') {
      if (!q) return reply("Informe a mensagem.");
      await optimizer.saveJsonWithCache(DATABASE_DIR + '/divulgacao.json', { savedMessage: q });
      return reply("✅ Mensagem salva.");
    }
    
    if (cmd === 'divdono') {
      const sub = (args[0] || '').toLowerCase();
      const rest = args.slice(1).join(' ').trim();
      const configPath = DATABASE_DIR + '/dono_divulgacao.json';
      const config = await optimizer.loadJsonWithCache(configPath, { groups: [], savedMessage: '', scheduleTime: null });
      const groups = Array.isArray(config.groups) ? config.groups : [];

      const helpText = `📣 *DIVULGAÇÃO DO DONO (NOVO)*\n\n` +
        `• ${prefix}divdono add [id] (no grupo ou com ID)\n` +
        `• ${prefix}divdono rem <id>\n` +
        `• ${prefix}divdono list\n` +
        `• ${prefix}divdono msg <texto>\n` +
        `• ${prefix}divdono send [texto] (usa msg salva)\n` +
        `• ${prefix}divdono time <HH:MM|off>\n` +
        `• ${prefix}divdono status`;

      if (!sub || sub === 'help') return reply(helpText);

      if (sub === 'add' || sub === 'registrar' || sub === 'register') {
        let targetGroupId = rest || (isGroup ? from : null);
        if (!targetGroupId) return reply(`💡 Use: ${prefix}divdono add [id_do_grupo]`);
        if (!targetGroupId.includes('@g.us')) targetGroupId += '@g.us';
        
        if (!groups.includes(targetGroupId)) {
          groups.push(targetGroupId);
          config.groups = groups;
          await optimizer.saveJsonWithCache(configPath, config);
          return reply(`✅ Grupo registrado para divulgação.\n📌 Total: ${groups.length}`);
        }
        return reply('⚠️ Este grupo já está registrado.');
      }

      if (sub === 'rem' || sub === 'remove' || sub === 'del') {
        if (!rest) return reply(`💡 Use: ${prefix}divdono rem <id_do_grupo>`);
        let targetGroupId = rest.trim();
        if (!targetGroupId.includes('@g.us')) targetGroupId += '@g.us';
        
        const newGroups = groups.filter(id => id !== targetGroupId);
        if (newGroups.length === groups.length) return reply('⚠️ Grupo não encontrado na lista.');
        
        config.groups = newGroups;
        await optimizer.saveJsonWithCache(configPath, config);
        return reply(`✅ Grupo removido da divulgação.\n📌 Total: ${newGroups.length}`);
      }

      if (sub === 'list' || sub === 'lista') {
        if (!groups.length) return reply('⚠️ Nenhum grupo registrado para divulgação.');
        let text = `📣 *GRUPOS REGISTRADOS (${groups.length})*\n\n`;
        for (let i = 0; i < groups.length; i++) {
          const id = groups[i];
          try {
            const meta = await nazu.groupMetadata(id).catch(() => ({ subject: 'Desconhecido/Removido' }));
            text += `*${i + 1}.* ${meta.subject}\n   └ ID: ${id}\n`;
          } catch(e) {
            text += `*${i + 1}.* Desconhecido (ID: ${id})\n`;
          }
        }
        return reply(text);
      }

      if (sub === 'msg' || sub === 'mensagem') {
        if (!rest) return reply(`💡 Use: ${prefix}divdono msg <sua mensagem de divulgação aqui>`);
        config.savedMessage = rest;
        await optimizer.saveJsonWithCache(configPath, config);
        return reply(`✅ Mensagem de divulgação salva com sucesso!\nPara testar: ${prefix}divdono send`);
      }

      if (sub === 'time' || sub === 'horario') {
        if (!rest) return reply(`💡 Use: ${prefix}divdono time <HH:MM> ou 'off'`);
        if (rest.toLowerCase() === 'off') {
          config.scheduleTime = null;
          await optimizer.saveJsonWithCache(configPath, config);
          return reply(`✅ Divulgação automática desativada.`);
        }
        if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(rest)) {
          return reply('❌ Formato de hora inválido! Use HH:MM (ex: 14:30)');
        }
        config.scheduleTime = rest;
        await optimizer.saveJsonWithCache(configPath, config);
        return reply(`✅ Horário de divulgação automática configurado para ${rest}.`);
      }

      if (sub === 'status') {
        let text = `📊 *STATUS DIVULGAÇÃO*\n\n`;
        text += `• *Grupos:* ${groups.length}\n`;
        text += `• *Mensagem salva:* ${config.savedMessage ? 'Sim ✅' : 'Não ❌'}\n`;
        text += `• *Automático:* ${config.scheduleTime ? `Sim, às ${config.scheduleTime}` : 'Desativado'}\n`;
        return reply(text);
      }

      if (sub === 'send' || sub === 'enviar') {
        if (!groups.length) return reply('⚠️ Nenhum grupo registrado!');
        const messageText = rest || config.savedMessage;
        if (!messageText) return reply(`⚠️ Nenhuma mensagem definida! Use ${prefix}divdono msg <texto>`);
        
        reply(`🚀 Iniciando envio para ${groups.length} grupos...`);
        let success = 0, fail = 0;
        
        for (const id of groups) {
          try {
            await nazu.sendMessage(id, { text: `[📡 MENSAGEM DO DONO]\n\n${messageText}` });
            success++;
            await new Promise(r => setTimeout(r, 2000));
          } catch (e) {
            fail++;
          }
        }
        return reply(`✅ *Divulgação Concluída!*\n\n🟢 Sucesso: ${success}\n🔴 Falha: ${fail}`);
      }

      return reply('❌ Subcomando inválido.\n\n' + helpText);
    }

    // ═══════════════════════════════════════════════════════════════
    // 📩 SISTEMA DE TRANSMISSÃO TM2 (INSCRITOS)
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'inscrevertm' || cmd === 'inscrevertm2') {
      if (isGroup) return reply('⚠️ Este comando só funciona no privado! Me chama no PV para se inscrever.');
      
      const subFile = pathz.join(DATABASE_DIR, 'transmissao_subs.json');
      const subs = await optimizer.loadJsonWithCache(subFile, { users: [] });
      
      if (subs.users.includes(sender)) {
        return reply(`✅ Você já está inscrito nas transmissões!\n\n📊 *Estatísticas:*\n• Total de inscritos: ${subs.users.length}`);
      }
      
      subs.users.push(sender);
      await optimizer.saveJsonWithCache(subFile, subs);
      return reply(`🎉 *Inscrição confirmada!*\n\nVocê agora receberá as transmissões da bot diretamente no seu privado.\n\n💡 *Como funciona:*\n• Você receberá mensagens importantes da equipe\n• Para cancelar, use: ${prefix}desinscrever\n\n✨ Obrigado por se inscrever!`);
    }

    if (cmd === 'desinscrever' || cmd === 'desinscrevertm' || cmd === 'cancelartm') {
      if (isGroup) return reply('⚠️ Este comando só funciona no privado!');
      
      const subFile = pathz.join(DATABASE_DIR, 'transmissao_subs.json');
      const subs = await optimizer.loadJsonWithCache(subFile, { users: [] });
      
      if (!subs.users.includes(sender)) {
        return reply('⚠️ Você não está inscrito nas transmissões.');
      }
      
      subs.users = subs.users.filter(u => u !== sender);
      await optimizer.saveJsonWithCache(subFile, subs);
      return reply(`✅ *Inscrição cancelada!*\n\nVocê não receberá mais as transmissões.\n\n💡 Para se inscrever novamente, use: ${prefix}inscrevertm`);
    }

    if (cmd === 'statustm' || cmd === 'statustm2') {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      const subFile = pathz.join(DATABASE_DIR, 'transmissao_subs.json');
      const subs = await optimizer.loadJsonWithCache(subFile, { users: [] });
      return reply(`📊 *STATUS TRANSMISSÃO TM2*\n\n• Inscritos: ${subs.users.length}`);
    }

    if (cmd === 'tm2') {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      
      if (!q && !isImage && !isVideo && !isQuotedImage && !isQuotedVideo) {
        return reply('Digite uma mensagem ou marque uma imagem/vídeo! Exemplo: ' + prefix + 'tm2 Olá inscritos!');
      }
      
      const subFile = pathz.join(DATABASE_DIR, 'transmissao_subs.json');
      const subs = await optimizer.loadJsonWithCache(subFile, { users: [] });
      
      if (subs.users.length === 0) {
        return reply('⚠️ Ainda não há inscritos para enviar a transmissão.\n\n💡 Os usuários devem usar o comando /inscrevertm no privado para se inscrever.');
      }
      
      const cabecalho = `╔══════════════════════\n║  📡 *TRANSMISSÃO VIP* 📡\n╚══════════════════════\n\n`;
      let baseMessage = {};
      
      try {
        if (isImage && getFileBuffer) {
          const image = await getFileBuffer(info.message.imageMessage, 'image');
          baseMessage = { image, caption: q ? `${cabecalho}${q}` : cabecalho.trim() };
        } else if (isVideo && getFileBuffer) {
          const video = await getFileBuffer(info.message.videoMessage, 'video');
          baseMessage = { video, caption: q ? `${cabecalho}${q}` : cabecalho.trim() };
        } else if (isQuotedImage && getFileBuffer) {
          const image = await getFileBuffer(info.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage, 'image');
          baseMessage = { image, caption: q ? `${cabecalho}${q}` : cabecalho.trim() };
        } else if (isQuotedVideo && getFileBuffer) {
          const video = await getFileBuffer(info.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage, 'video');
          baseMessage = { video, caption: q ? `${cabecalho}${q}` : cabecalho.trim() };
        } else {
          baseMessage = { text: `${cabecalho}${q}` };
        }
      } catch (e) {
        baseMessage = { text: `${cabecalho}${q}` }; 
      }
      
      reply(`🚀 Iniciando transmissão para ${subs.users.length} inscritos...`);
      let success = 0, fail = 0;
      
      for (const id of subs.users) {
        try {
          await nazu.sendMessage(id, baseMessage);
          success++;
          await new Promise(r => setTimeout(r, 2000));
        } catch (e) {
          fail++;
        }
      }
      return reply(`✅ *Transmissão Concluída!*\n\n🟢 Sucesso: ${success}\n🔴 Falha: ${fail}`);
    }
  }
};
