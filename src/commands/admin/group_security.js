
import { sendCleanChat } from '../../utils/cleanChat.js';
import { writeAsync } from '../../utils/database/io.js';
import { loadActivityData } from '../../utils/groupManager.js';

export default {
  name: "group_security",
  description: "Segurança e moderação avançada de grupos",
  commands: ["aceitarticket", "addblacklist", "addparceria", "addpartnership", "adv", "advertir", "antifig", "antipalavra", "antisl", "antistatus", "antisticker+", "antistickerplus", "antistickerplusbot", "antitoxic", "antitóxico", "antiword", "banghost", "bemvindo", "blacklist", "boasvindas", "bv", "clean", "configsaida", "delblacklist", "delfotobv", "delfotosaiu", "delparceria", "delpartnership", "exit", "exitimg", "exitmsg", "fotobv", "fotosaida", "fotosaiu", "imgsaiu", "legendasaiu", "limpar", "listadv", "listblacklist", "listablacklist", "listblacklistgp", "listblacklistgrupal", "blacklistlista", "blacklista", "modoparceria", "parcerias", "partnerships", "removeradv", "removerfotobv", "removerfotosaiu", "rmadv", "rmexitimg", "rmfotobv", "rmfotosaiu", "rmwelcomeimg", "saida", "suporte", "suporteaceitar", "suporteticket", "textsaiu", "ticket", "ticket.aceitar", "ticketaceitar", "ticketsuporte", "unblacklist", "unwarning", "warning", "warninglist", "welcome", "welcomeimg", "antiimagem", "antifoto", "antiphoto", "antivideo", "antiaudio", "antidoc", "antievento", "antiproduto"],
  handle: async ({ 
    bot, from, info, command, args, reply, prefix, pushname, sender, q,
    isGroup, isGroupAdmin, isBotAdmin, AllgroupMembers, groupData, groupFile,
    getUserName, GRUPOS_DIR, DATABASE_DIR, buildGroupFilePath,
    isQuotedMsg, isQuotedImage, isImage, getFileBuffer, upload,
    menc_os2, menc_jid2, botNumber, botNumberLid, nmrdn,
    fs, pathz, groupAdmins, groupName, idInArray,
    parceriasData, saveParceriasData, getLidFromJidCached,
    isValidJid, isValidLid, buildUserId, config, groupMetadata,
    extractReason, setSupportMode, createSupportTicket, findSupportTicketById, acceptSupportTicket, listSupportTickets,
    antistickerplus, antitoxic, antipalavra, idsMatch
  , MESSAGES }) => {
    const cmd = command.toLowerCase();

    // ═══════════════════════════════════════════════════════════════
    // 👋 BOAS-VINDAS / SAÍDA (WELCOME/EXIT)
    // ═══════════════════════════════════════════════════════════════
    if (['bemvindo', 'bv', 'boasvindas', 'welcome', 'saida', 'exit'].includes(cmd)) {
      const isWelcome = ['bemvindo', 'bv', 'boasvindas', 'welcome'].includes(cmd);
      
      if (isWelcome) {
        groupData.bemvindo = !groupData.bemvindo;
      } else {
        groupData.exit = groupData.exit || {};
        groupData.exit.enabled = !groupData.exit.enabled;
      }
      
      await writeAsync(groupFile, groupData);
      
      if (isWelcome) {
        if (groupData.bemvindo) {
          return reply(MESSAGES.admin.group_security.welcome.on.replace('${prefix}', prefix));
        } else {
          return reply(MESSAGES.admin.group_security.welcome.off);
        }
      } else {
        if (groupData.exit.enabled) {
          return reply(MESSAGES.admin.group_security.welcome.exitOn.replace('${prefix}', prefix));
        } else {
          return reply(MESSAGES.admin.group_security.welcome.exitOff);
        }
      }
    }

    if (['fotobv', 'welcomeimg', 'fotosaida', 'fotosaiu', 'imgsaiu', 'exitimg'].includes(cmd)) {
      if (!isQuotedImage && !isImage) return reply(MESSAGES.admin.group_security.welcome.imgProvide);
      
      try {
        const media = await getFileBuffer(isQuotedImage ? info.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage : info.message.imageMessage, 'image');
        const url = await upload(media);
        const feature = ['fotobv', 'welcomeimg'].includes(cmd) ? 'welcome' : 'exit';
        groupData[feature] = groupData[feature] || {};
        groupData[feature].image = url;
        if (feature === 'exit') {
          groupData[feature].enabled = true;
        }
        await writeAsync(groupFile, groupData);
        return reply(MESSAGES.admin.group_security.welcome.imgSuccess);
      } catch (e) {
        return reply(MESSAGES.admin.group_security.welcome.imgError);
      }
    }

    if (['removerfotobv', 'rmfotobv', 'delfotobv', 'rmwelcomeimg'].includes(cmd)) {
      if (!groupData.welcome?.image) return reply(MESSAGES.admin.group_security.welcome.imgNone);
      delete groupData.welcome.image;
      await writeAsync(groupFile, groupData);
      return reply(MESSAGES.admin.group_security.welcome.imgRmWelcome);
    }

    if (['removerfotosaiu', 'rmfotosaiu', 'delfotosaiu', 'rmexitimg'].includes(cmd)) {
      if (!groupData.exit?.image) return reply(MESSAGES.admin.group_security.welcome.imgNone);
      delete groupData.exit.image;
      await writeAsync(groupFile, groupData);
      return reply(MESSAGES.admin.group_security.welcome.imgRmExit);
    }

    if (['configsaida', 'textsaiu', 'legendasaiu', 'exitmsg'].includes(cmd)) {
      if (!q) return reply(MESSAGES.admin.group_security.welcome.msgUsage(prefix, cmd));
      groupData.exit = groupData.exit || {};
      groupData.exit.text = q;
      groupData.exit.enabled = true;
      await writeAsync(groupFile, groupData);
      return reply(MESSAGES.admin.group_security.welcome.msgSuccess);
    }

    // ═══════════════════════════════════════════════════════════════
    // 👻 FANTASMAS (GHOST)
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'banghost') {
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      const limit = parseInt(q);
      if (isNaN(limit)) return reply(MESSAGES.admin.group_security.ghost.usage(prefix));
      
      const contador = await loadActivityData(from);
      // O(1) acesso direto ao objeto { userId: { msg, ... } }
      const ghosts = AllgroupMembers.filter(m => {
        const msgCount = contador[m]?.msg || 0;
        return msgCount <= limit && !idInArray(m, groupAdmins) && m !== botNumber && (!botNumberLid || m !== botNumberLid);
      });

      if (!ghosts.length) return reply(MESSAGES.admin.group_security.ghost.none);
      await bot.groupParticipantsUpdate(from, ghosts, 'remove');
      return reply(MESSAGES.admin.group_security.ghost.success(ghosts.length));
    }

    // ═══════════════════════════════════════════════════════════════
    // 🛡️ ANTI-BAN MARCAR (MASS MENTION PROTECTION)
    // ═══════════════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════════
    // ⚠️ ADVERTÊNCIAS (WARNINGS)
    // ═══════════════════════════════════════════════════════════════
    if (['adv', 'advertir', 'warning', 'aviso', 'removeradv', 'rmadv', 'unwarning', 'removeraviso', 'rmaviso', 'listadv', 'warninglist', 'listavisos', 'listaavisos'].includes(cmd)) {
      groupData.warnings = groupData.warnings || {};

      if (['listadv', 'warninglist', 'listavisos', 'listaavisos'].includes(cmd)) {
        if (!Object.keys(groupData.warnings).length) return reply(MESSAGES.admin.group_security.warnings.empty);
        let text = MESSAGES.admin.group_security.warnings.header;
        for (const [user, warns] of Object.entries(groupData.warnings)) {
          text += MESSAGES.admin.group_security.warnings.item(getUserName(user), warns.length);
        }
        return reply(text, { mentions: Object.keys(groupData.warnings) });
      }

      if (!menc_os2) return reply(MESSAGES.error.missing('alguém'));
      
      if (['removeradv', 'rmadv', 'unwarning', 'removeraviso', 'rmaviso'].includes(cmd)) {
        if (!groupData.warnings[menc_os2]) return reply(MESSAGES.admin.group_security.warnings.empty);
        groupData.warnings[menc_os2].pop();
        if (!groupData.warnings[menc_os2].length) delete groupData.warnings[menc_os2];
        await writeAsync(groupFile, groupData);
        return reply(MESSAGES.admin.group_security.warnings.removed);
      }

      const reason = q || "Sem motivo";
      groupData.warnings[menc_os2] = groupData.warnings[menc_os2] || [];
      groupData.warnings[menc_os2].push({ reason, sender });
      
      if (groupData.warnings[menc_os2].length >= 3) {
        let targetId = menc_os2;
        if (AllgroupMembers && idsMatch) {
           for (const member of AllgroupMembers) {
               if (idsMatch(member, menc_os2)) {
                   targetId = member;
                   break;
               }
           }
        }
        if (isBotAdmin) await bot.groupParticipantsUpdate(from, [targetId], 'remove');
        delete groupData.warnings[menc_os2];
        await writeAsync(groupFile, groupData);
        return reply(MESSAGES.admin.group_security.warnings.banned(getUserName(menc_os2), reason), { mentions: [menc_os2] });
      }

      await writeAsync(groupFile, groupData);
      return reply(MESSAGES.admin.group_security.warnings.warned(getUserName(menc_os2), groupData.warnings[menc_os2].length, reason), { mentions: [menc_os2] });
    }

    // ═══════════════════════════════════════════════════════════════
    // 🎫 SUPORTE / TICKETS
    // ═══════════════════════════════════════════════════════════════
    if (['suporte', 'ticket', 'ticketaceitar', 'aceitarticket', 'suporteaceitar', 'ticket.aceitar', 'listaticket', 'listarticket', 'listartickets'].includes(cmd)) {
      if (['listaticket', 'listarticket', 'listartickets'].includes(cmd)) {
        const tickets = listSupportTickets(from);
        if (!tickets.length) return reply(MESSAGES.admin.group_security.tickets.empty);
        let text = MESSAGES.admin.group_security.tickets.header;
        tickets.forEach(t => {
          text += MESSAGES.admin.group_security.tickets.item(t.id, getUserName(t.userId), t.message);
        });
        return await reply(text, { mentions: tickets.map(t => t.userId) });
      }

      if (['ticketaceitar', 'aceitarticket', 'suporteaceitar', 'ticket.aceitar'].includes(cmd)) {
        if (!q) return reply(MESSAGES.admin.group_security.tickets.provideId);
        const res = acceptSupportTicket(q.trim(), sender);
        return reply(res.message);
      }
      if (q === 'on' || q === 'off') {
        setSupportMode(from, q === 'on');
        return reply(MESSAGES.admin.group_security.tickets.toggle(q === 'on'));
      }
      const res = createSupportTicket({ groupId: from, groupName, userId: sender, userName: pushname, message: q });
      if (!res.success) return reply(res.message);
      return reply(MESSAGES.admin.group_security.tickets.opened(res.ticket.id));
    }

    // ═══════════════════════════════════════════════════════════════
    // 📋 BLACKLIST DO GRUPO
    // ═══════════════════════════════════════════════════════════════
    if (['blacklist', 'addblacklist', 'delblacklist', 'unblacklist', 'listblacklist', 'listablacklist', 'listblacklistgp', 'listblacklistgrupal', 'blacklistlista', 'blacklista'].includes(cmd)) {
      if (['listblacklist', 'listablacklist', 'listblacklistgp', 'listblacklistgrupal', 'blacklistlista', 'blacklista'].includes(cmd)) {
        const blacklistArray = (Array.isArray(groupData.blacklist) ? groupData.blacklist : []).filter(Boolean);
        if (!blacklistArray.length) return reply(MESSAGES.admin.group_security.blacklist.empty);
        const mentions = blacklistArray.map(u => u.lid || (u.number ? u.number + '@s.whatsapp.net' : null))
          .filter(Boolean)
          .filter(jid => {
            if (jid.includes('@lid')) return true;
            const num = jid.split('@')[0];
            return num.length >= 7 && /^\d+$/.test(num);
          });
        const formatted = blacklistArray.map((u, idx) => {
          const identifier = u.lid || (u.number ? u.number + '@s.whatsapp.net' : 'Desconhecido');
          return `${idx + 1}. @${getUserName(identifier)} (${u.reason || 'Sem motivo'})`;
        }).join('\n');
        return reply(MESSAGES.admin.group_security.blacklist.header + formatted, { mentions });
      }

      let target = menc_os2;
      let reason = q ? q.trim() : "Sem motivo";

      if (!target && q) {
        // Tenta extrair um número de telefone no início do argumento (ex: +55 17 97604-2 ou 55 17 97604-2)
        const numberMatch = q.match(/^(\+?[\d\s\-]+)/);
        if (numberMatch) {
          const possibleNumber = numberMatch[1].trim().replace(/\s/g, ''); // remove espaços para contagem
          const digitsOnly = possibleNumber.replace(/\D/g, '');
          if (digitsOnly.length >= 8) {
            target = possibleNumber;
            reason = q.substring(numberMatch[1].length).trim() || "Sem motivo";
          }
        }

        if (!target) {
          const parts = q.split(' ');
          target = parts[0];
          reason = parts.slice(1).join(' ').trim() || "Sem motivo";
        }
      } else if (menc_os2 && q) {
        reason = q.trim() || "Sem motivo";
      }

      if (!target) return reply(MESSAGES.error.missing('alguém'));

      if (target && !target.includes('@')) {
        target = buildUserId(target, config);
      }

      // Normalizar para LID quando possível (resolve mismatch JID vs LID)
      const originalTarget = target;
      if (isValidJid(target)) {
        try {
          const lidResolvido = await getLidFromJidCached(bot, target);
          if (lidResolvido && lidResolvido.includes('@lid')) target = lidResolvido;
        } catch { }
      }

      if (['delblacklist', 'unblacklist'].includes(cmd)) {
        const blacklistArray = (Array.isArray(groupData.blacklist) ? groupData.blacklist : []).filter(Boolean);
        const initialLength = blacklistArray.length;
        
        groupData.blacklist = blacklistArray.filter(entry => 
          entry.lid !== target && 
          (!originalTarget || entry.number !== originalTarget.replace(/\D/g, '')) &&
          !idsMatch(entry.lid, target)
        );
        
        if (groupData.blacklist.length !== initialLength) {
           await writeAsync(groupFile, groupData);
           return reply(MESSAGES.admin.group_security.blacklist.removed);
        } else {
           return reply(MESSAGES.admin.group_security.blacklist.notIn);
        }
      }

      const blacklistArray = (Array.isArray(groupData.blacklist) ? groupData.blacklist : []).filter(Boolean);
      
      const exists = blacklistArray.find(entry => 
        (target && entry.lid === target) || 
        (originalTarget && entry.number === originalTarget.replace(/\D/g, '')) ||
        idsMatch(entry.lid, target)
      );

      if (exists) {
        let modified = false;
        if (target.includes('@lid') && !exists.lid) { exists.lid = target; modified = true; }
        const cleanNumber = originalTarget.replace(/\D/g, '');
        if (cleanNumber && !exists.number) { exists.number = cleanNumber; modified = true; }
        if (modified) {
          await writeAsync(groupFile, groupData);
          return reply(`✨ Mapeamento do usuário @${getUserName(originalTarget)} atualizado na blacklist!`);
        }
        return reply(MESSAGES.admin.group_security.blacklist.alreadyIn);
      }

      const entry = {
        lid: target.includes('@lid') ? target : '',
        number: originalTarget.replace(/\D/g, ''),
        name: getUserName(originalTarget) || undefined,
        reason: reason,
        createdAt: new Date().toISOString(),
        createdBy: sender
      };
      
      groupData.blacklist = blacklistArray;
      groupData.blacklist.push(entry);
      
      await writeAsync(groupFile, groupData);
      return reply(MESSAGES.admin.group_security.blacklist.added);
    }

    // ═══════════════════════════════════════════════════════════════
    // 🧹 LIMPEZA
    // ═══════════════════════════════════════════════════════════════
    if (['limpar', 'clean'].includes(cmd)) {
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      try {
        await sendCleanChat({ socket: bot, remoteJid: from, sendSuccessReply: reply, successMessage: MESSAGES.admin.group_security.clean.fallback });
      } catch (error) {
        console.error('[CLEAN] Erro ao limpar chat:', error.message);
        // Fallback para limpeza simples se o relayMessage falhar
        const linhasEmBranco = Array(500).fill('🤍 ').join('\n');
        return reply(`${linhasEmBranco}\n${MESSAGES.admin.group_security.clean.fallback}`);
      }
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // 🛡️ PROTEÇÕES EXTRAS (ANTISTATUS, ANTISTICKERPLUS, ETC)
    // ═══════════════════════════════════════════════════════════════
    if (['antifig'].includes(cmd)) {
      try {
        groupData.antifig = groupData.antifig || {};
        groupData.antifig.enabled = !groupData.antifig.enabled;
        
        await writeAsync(groupFile, groupData);
        
        if (groupData.antifig.enabled) {
          return reply(MESSAGES.admin.group_security.protections.antifigOn);
        }
        return reply(MESSAGES.admin.group_security.protections.antifigOff);
      } catch (e) {
        console.error('Erro no comando antifig:', e);
        return reply(MESSAGES.error.general);
      }
    }

    if (cmd === 'antistatus') {
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);

      const action = args[0]?.toLowerCase();

      if (action === 'apagar' || action === 'banir') {
        groupData.antistatus = true;
        groupData.antistatus_action = action;
        await writeAsync(groupFile, groupData);
        return reply(MESSAGES.admin.group_security.protections.genericAction('AntiStatus', action));
      }

      groupData.antistatus = !groupData.antistatus;
      await writeAsync(groupFile, groupData);

      if (groupData.antistatus) {
        const currentAction = groupData.antistatus_action || 'banir';
        return reply(MESSAGES.admin.group_security.protections.genericStatus('AntiStatus', currentAction, `• ${prefix}antistatus apagar\n• ${prefix}antistatus banir`));
      }
      return reply(MESSAGES.admin.group_security.protections.genericOff('AntiStatus'));
    }

    if (['antistickerplus', 'antisticker+', 'antisl', 'antistickerplusbot'].includes(cmd)) {
      if (!antistickerplus) return reply(MESSAGES.admin.group_security.protections.unavailable('AntistickerPlus'));
      await antistickerplus.handleCommand(bot, from, args, groupData, { reply, prefix, groupFile });
      return;
    }

    if (cmd === 'antitoxic') {
      if (!antitoxic) return reply(MESSAGES.admin.group_security.protections.unavailable('Antitoxic'));
      await antitoxic.handleCommand(bot, from, args, groupData, { reply, prefix });
      return;
    }

    if (['antipalavra', 'antiword'].includes(cmd)) {
      if (!antipalavra) return reply(MESSAGES.admin.group_security.protections.unavailable('Antipalavra'));
      await antipalavra.handleCommand(bot, from, args, groupData, { reply, prefix, groupFile });
      return;
    }

    if (['antiimagem', 'antiimage', 'antifoto', 'antiphoto'].includes(cmd)) {
      const action = args[0]?.toLowerCase();

      if (action === 'vizu') {
        groupData.antiimage_vizu = !groupData.antiimage_vizu;
        await writeAsync(groupFile, groupData);
        return reply(MESSAGES.admin.group_security.protections.mediaVizuToggle('Anti-Imagem', groupData.antiimage_vizu));
      }

      if (action === 'apagar' || action === 'banir') {
        groupData.antiimage = true;
        groupData.antiimage_action = action;
        await writeAsync(groupFile, groupData);
        return reply(MESSAGES.admin.group_security.protections.genericAction('Anti-Imagem', action));
      }

      groupData.antiimage = !groupData.antiimage;
      await writeAsync(groupFile, groupData);

      if (groupData.antiimage) {
        const currentAction = groupData.antiimage_action || 'apagar';
        const vizuStatus = groupData.antiimage_vizu ? '✅ Sim' : '❌ Não';
        return reply(MESSAGES.admin.group_security.protections.mediaStatus('Anti-Imagem', currentAction, groupData.antiimage_vizu, `• ${prefix}antiimagem apagar\n• ${prefix}antiimagem banir\n• ${prefix}antiimagem vizu`));
      }
      return reply(MESSAGES.admin.group_security.protections.genericOff('Anti-Imagem'));
    }

    if (['antivideo'].includes(cmd)) {
      const action = args[0]?.toLowerCase();

      if (action === 'vizu') {
        groupData.antivideo_vizu = !groupData.antivideo_vizu;
        await writeAsync(groupFile, groupData);
        return reply(MESSAGES.admin.group_security.protections.mediaVizuToggle('Anti-Vídeo', groupData.antivideo_vizu));
      }

      if (action === 'apagar' || action === 'banir') {
        groupData.antivideo = true;
        groupData.antivideo_action = action;
        await writeAsync(groupFile, groupData);
        return reply(MESSAGES.admin.group_security.protections.genericAction('Anti-Vídeo', action));
      }

      groupData.antivideo = !groupData.antivideo;
      await writeAsync(groupFile, groupData);

      if (groupData.antivideo) {
        const currentAction = groupData.antivideo_action || 'apagar';
        const vizuStatus = groupData.antivideo_vizu ? '✅ Sim' : '❌ Não';
        return reply(MESSAGES.admin.group_security.protections.mediaStatus('Anti-Vídeo', currentAction, groupData.antivideo_vizu, `• ${prefix}antivideo apagar\n• ${prefix}antivideo banir\n• ${prefix}antivideo vizu`));
      }
      return reply(MESSAGES.admin.group_security.protections.genericOff('Anti-Vídeo'));
    }

    if (['antiaudio'].includes(cmd)) {
      const action = args[0]?.toLowerCase();

      if (action === 'vizu') {
        groupData.antiaudio_vizu = !groupData.antiaudio_vizu;
        await writeAsync(groupFile, groupData);
        return reply(MESSAGES.admin.group_security.protections.mediaVizuToggle('Anti-Áudio', groupData.antiaudio_vizu));
      }

      if (action === 'apagar' || action === 'banir') {
        groupData.antiaudio = true;
        groupData.antiaudio_action = action;
        await writeAsync(groupFile, groupData);
        return reply(MESSAGES.admin.group_security.protections.genericAction('Anti-Áudio', action));
      }

      groupData.antiaudio = !groupData.antiaudio;
      await writeAsync(groupFile, groupData);

      if (groupData.antiaudio) {
        const currentAction = groupData.antiaudio_action || 'apagar';
        const vizuStatus = groupData.antiaudio_vizu ? '✅ Sim' : '❌ Não';
        return reply(MESSAGES.admin.group_security.protections.mediaStatus('Anti-Áudio', currentAction, groupData.antiaudio_vizu, `• ${prefix}antiaudio apagar\n• ${prefix}antiaudio banir\n• ${prefix}antiaudio vizu`));
      }
      return reply(MESSAGES.admin.group_security.protections.genericOff('Anti-Áudio'));
    }

    if (['antidoc'].includes(cmd)) {
      const action = args[0]?.toLowerCase();

      if (action === 'apagar' || action === 'banir') {
        groupData.antidoc = true;
        groupData.antidoc_action = action;
        await writeAsync(groupFile, groupData);
        return reply(MESSAGES.admin.group_security.protections.genericAction('Anti-Documento', action));
      }

      groupData.antidoc = !groupData.antidoc;
      await writeAsync(groupFile, groupData);

      if (groupData.antidoc) {
        const currentAction = groupData.antidoc_action || 'apagar';
        return reply(MESSAGES.admin.group_security.protections.genericStatus('Anti-Documento', currentAction, `• ${prefix}antidoc apagar\n• ${prefix}antidoc banir`));
      }
      return reply(MESSAGES.admin.group_security.protections.genericOff('Anti-Documento'));
    }

    if (['antievento'].includes(cmd)) {
      const action = args[0]?.toLowerCase();

      if (action === 'apagar' || action === 'banir') {
        groupData.antievento = true;
        groupData.antievento_action = action;
        await writeAsync(groupFile, groupData);
        return reply(MESSAGES.admin.group_security.protections.genericAction('Anti-Evento', action));
      }

      groupData.antievento = !groupData.antievento;
      await writeAsync(groupFile, groupData);

      if (groupData.antievento) {
        const currentAction = groupData.antievento_action || 'apagar';
        return reply(MESSAGES.admin.group_security.protections.genericStatus('Anti-Evento', currentAction, `• ${prefix}antievento apagar\n• ${prefix}antievento banir`));
      }
      return reply(MESSAGES.admin.group_security.protections.genericOff('Anti-Evento'));
    }

    if (['antiproduto'].includes(cmd)) {
      const action = args[0]?.toLowerCase();

      if (action === 'apagar' || action === 'banir') {
        groupData.antiproduto = true;
        groupData.antiproduto_action = action;
        await writeAsync(groupFile, groupData);
        return reply(MESSAGES.admin.group_security.protections.genericAction('Anti-Produto', action));
      }

      groupData.antiproduto = !groupData.antiproduto;
      await writeAsync(groupFile, groupData);

      if (groupData.antiproduto) {
        const currentAction = groupData.antiproduto_action || 'apagar';
        return reply(MESSAGES.admin.group_security.protections.genericStatus('Anti-Produto', currentAction, `• ${prefix}antiproduto apagar\n• ${prefix}antiproduto banir`));
      }
      return reply(MESSAGES.admin.group_security.protections.genericOff('Anti-Produto'));
    }
  }
};
