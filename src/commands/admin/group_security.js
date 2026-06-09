
import { sendCleanChat } from '../../utils/cleanChat.js';

export default {
  name: "group_security",
  description: "Segurança e moderação avançada de grupos",
  commands: ["aceitarticket", "addblacklist", "addparceria", "addpartnership", "adv", "advertir", "antibanmarcar", "antifig", "antipalavra", "antisl", "antistatus", "antisticker+", "antistickerplus", "antistickerplusbot", "antitoxic", "antitóxico", "antiword", "banghost", "bemvindo", "blacklist", "boasvindas", "bv", "clean", "configsaida", "delblacklist", "delfotobv", "delfotosaiu", "delparceria", "delpartnership", "exit", "exitimg", "exitmsg", "fotobv", "fotosaida", "fotosaiu", "imgsaiu", "legendasaiu", "limpar", "listadv", "listblacklist", "modoparceria", "parcerias", "partnerships", "protecaomarcar", "removeradv", "removerfotobv", "removerfotosaiu", "rmadv", "rmexitimg", "rmfotobv", "rmfotosaiu", "rmwelcomeimg", "saida", "suporte", "suporteaceitar", "suporteticket", "textsaiu", "ticket", "ticket.aceitar", "ticketaceitar", "ticketsuporte", "unblacklist", "unwarning", "warning", "warninglist", "welcome", "welcomeimg", "antipayment", "antipagamento", "antiimagem", "antivideo", "antiaudio", "antidoc", "antievento", "antiproduto"],
  handle: async ({ 
    bot, from, info, command, args, reply, prefix, pushname, sender, q,
    isGroup, isGroupAdmin, isBotAdmin, isOwner, AllgroupMembers, groupData, groupFile,
    getUserName, optimizer, GRUPOS_DIR, DATABASE_DIR, buildGroupFilePath,
    isQuotedMsg, isQuotedImage, isImage, getFileBuffer, upload,
    menc_os2, menc_jid2, botNumber, botNumberLid, nmrdn,
    fs, pathz, groupAdmins, groupName, idInArray,
    loadMassMentionConfig, saveMassMentionConfig, MASS_MENTION_MAX_USES, MASS_MENTION_THRESHOLD,
    loadMassMentionLimit, parceriasData, saveParceriasData, getLidFromJidCached,
    isValidJid, isValidLid, buildUserId, config, groupMetadata,
    extractReason, setSupportMode, createSupportTicket, findSupportTicketById, acceptSupportTicket, listSupportTickets,
    antistickerplus, antitoxic, antipalavra, idsMatch
  , MESSAGES }) => {
    const cmd = command.toLowerCase();

    // ═══════════════════════════════════════════════════════════════
    // 👋 BOAS-VINDAS / SAÍDA (WELCOME/EXIT)
    // ═══════════════════════════════════════════════════════════════
    if (['bemvindo', 'bv', 'boasvindas', 'welcome', 'saida', 'exit'].includes(cmd)) {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      const isWelcome = ['bemvindo', 'bv', 'boasvindas', 'welcome'].includes(cmd);
      
      if (isWelcome) {
        groupData.bemvindo = !groupData.bemvindo;
      } else {
        groupData.exit = groupData.exit || {};
        groupData.exit.enabled = !groupData.exit.enabled;
      }
      
      await optimizer.saveJsonWithCache(groupFile, groupData);
      
      if (isWelcome) {
        if (groupData.bemvindo) {
          return reply(`✅ *Boas-vindas ativadas!* Agora, novos membros serão recebidos com uma mensagem personalizada.\n📝 Para configurar a mensagem, use: *${prefix}legendabv*`);
        } else {
          return reply('⚠️ *Boas-vindas desativadas!* O grupo não enviará mais mensagens para novos membros.');
        }
      } else {
        if (groupData.exit.enabled) {
          return reply(`✅ *Despedidas ativadas!* Agora, o grupo se despedirá de quem sair.\n📝 Para configurar a mensagem, use: *${prefix}textsaiu*`);
        } else {
          return reply('⚠️ *Despedidas desativadas!* O grupo não enviará mais mensagens para quem sair.');
        }
      }
    }

    if (['fotobv', 'welcomeimg', 'fotosaida', 'exitimg'].includes(cmd)) {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!isQuotedImage && !isImage) return reply("Envie/marque uma imagem.");
      
      try {
        const media = await getFileBuffer(isQuotedImage ? info.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage : info.message.imageMessage, 'image');
        const url = await upload(media);
        const feature = ['fotobv', 'welcomeimg'].includes(cmd) ? 'welcome' : 'exit';
        groupData[feature] = groupData[feature] || {};
        groupData[feature].image = url;
        await optimizer.saveJsonWithCache(groupFile, groupData);
        return reply("✅ Imagem configurada!");
      } catch (e) {
        return reply("❌ Erro no upload.");
      }
    }

    if (['removerfotobv', 'rmfotobv', 'delfotobv', 'rmwelcomeimg'].includes(cmd)) {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!groupData.welcome?.image) return reply("❌ Não há imagem configurada.");
      delete groupData.welcome.image;
      await optimizer.saveJsonWithCache(groupFile, groupData);
      return reply("✅ Imagem de boas-vindas removida!");
    }

    if (['removerfotosaiu', 'rmfotosaiu', 'delfotosaiu', 'rmexitimg'].includes(cmd)) {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!groupData.exit?.image) return reply("❌ Não há imagem configurada.");
      delete groupData.exit.image;
      await optimizer.saveJsonWithCache(groupFile, groupData);
      return reply("✅ Imagem de saída removida!");
    }

    if (['configsaida', 'textsaiu', 'legendasaiu', 'exitmsg'].includes(cmd)) {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!q) return reply(`Uso: ${prefix}${cmd} <mensagem>\n\nTags: #numerodele#, #nomedogp#, #membros#, #desc#`);
      groupData.exit = groupData.exit || {};
      groupData.exit.text = q;
      groupData.exit.enabled = true;
      await optimizer.saveJsonWithCache(groupFile, groupData);
      return reply("✅ Mensagem de saída salva!");
    }

    // ═══════════════════════════════════════════════════════════════
    // 👻 FANTASMAS (GHOST)
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'banghost') {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      const limit = parseInt(q);
      if (isNaN(limit)) return reply(`Uso: ${prefix}banghost <limite_msgs>`);
      
      const countMap = new Map(groupData.contador?.map(u => [u.id, u.msg || 0]) || []);
      const ghosts = AllgroupMembers.filter(m => {
        const msgCount = countMap.get(m) || 0;
        return msgCount <= limit && !idInArray(m, groupAdmins) && m !== botNumber && (!botNumberLid || m !== botNumberLid);
      });

      if (!ghosts.length) return reply("Nenhum fantasma encontrado.");
      await bot.groupParticipantsUpdate(from, ghosts, 'remove');
      return reply(`✅ ${ghosts.length} fantasmas removidos!`);
    }

    // ═══════════════════════════════════════════════════════════════
    // 🛡️ ANTI-BAN MARCAR (MASS MENTION PROTECTION)
    // ═══════════════════════════════════════════════════════════════
    if (['antibanmarcar', 'protecaomarcar'].includes(cmd)) {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      
      const mmConfig = loadMassMentionConfig();
      const action = args[0]?.toLowerCase();

      if (action === 'on' || action === 'ativar') {
        mmConfig[from] = { enabled: true };
        saveMassMentionConfig(mmConfig);
        return reply("✅ Proteção Anti-Ban ativada! Limite de usos aplicado para marcas em massa.");
      } else if (action === 'off' || action === 'desativar') {
        if (mmConfig[from]) mmConfig[from].enabled = false;
        saveMassMentionConfig(mmConfig);
        return reply("✅ Proteção Anti-Ban desativada!");
      } else if (action === 'status' || action === 'ver') {
        const isEnabled = mmConfig[from]?.enabled || false;
        const memberCount = AllgroupMembers?.length || 0;
        const limitData = loadMassMentionLimit();
        const uses = limitData[from]?.uses?.length || 0;
        return reply(`📊 *STATUS ANTI-BAN*\n\n🔒 Ativo: ${isEnabled ? 'Sim' : 'Não'}\n👥 Membros: ${memberCount}\n📝 Usos: ${uses}/${MASS_MENTION_MAX_USES}`);
      } else {
        return reply(`Uso: ${prefix}${cmd} <on/off/status>`);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // ⚠️ ADVERTÊNCIAS (WARNINGS)
    // ═══════════════════════════════════════════════════════════════
    if (['adv', 'advertir', 'warning', 'aviso', 'removeradv', 'rmadv', 'unwarning', 'removeraviso', 'rmaviso', 'listadv', 'warninglist', 'listavisos', 'listaavisos'].includes(cmd)) {
      if (!isGroup || !isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      groupData.warnings = groupData.warnings || {};

      if (['listadv', 'warninglist', 'listavisos', 'listaavisos'].includes(cmd)) {
        if (!Object.keys(groupData.warnings).length) return reply("Sem advertências.");
        let text = "📋 *ADVERTÊNCIAS*\n\n";
        for (const [user, warns] of Object.entries(groupData.warnings)) {
          text += `@${getUserName(user)}: ${warns.length}/3\n`;
        }
        return reply(text, { mentions: Object.keys(groupData.warnings) });
      }

      if (!menc_os2) return reply(MESSAGES.error.missing('alguém'));
      
      if (['removeradv', 'rmadv', 'unwarning', 'removeraviso', 'rmaviso'].includes(cmd)) {
        if (!groupData.warnings[menc_os2]) return reply("Sem advertências.");
        groupData.warnings[menc_os2].pop();
        if (!groupData.warnings[menc_os2].length) delete groupData.warnings[menc_os2];
        await optimizer.saveJsonWithCache(groupFile, groupData);
        return reply("✅ Advertência removida.");
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
        await optimizer.saveJsonWithCache(groupFile, groupData);
        return reply(`🚫 @${getUserName(menc_os2)} recebeu 3 advertências e foi banido!\nÚltima advertência: ${reason}`, { mentions: [menc_os2] });
      }

      await optimizer.saveJsonWithCache(groupFile, groupData);
      return reply(`⚠️ @${getUserName(menc_os2)} recebeu uma advertência (${groupData.warnings[menc_os2].length}/3).\nMotivo: ${reason}`, { mentions: [menc_os2] });
    }

    // ═══════════════════════════════════════════════════════════════
    // 🎫 SUPORTE / TICKETS
    // ═══════════════════════════════════════════════════════════════
    if (['suporte', 'ticket', 'ticketaceitar', 'aceitarticket', 'suporteaceitar', 'ticket.aceitar', 'listaticket', 'listarticket', 'listartickets'].includes(cmd)) {
      if (['listaticket', 'listarticket', 'listartickets'].includes(cmd)) {
        if (!isGroupAdmin && !isOwner) return reply(MESSAGES.permission.adminOnly);
        const tickets = listSupportTickets(from);
        if (!tickets.length) return reply("📪 Sem tickets abertos.");
        let text = `🎫 *TICKETS ABERTOS*\n\n`;
        tickets.forEach(t => {
          text += `ID: ${t.id} | De: @${getUserName(t.userId)}\nMsg: ${t.message}\n\n`;
        });
        return await reply(text, { mentions: tickets.map(t => t.userId) });
      }

      if (['ticketaceitar', 'aceitarticket', 'suporteaceitar', 'ticket.aceitar'].includes(cmd)) {
        if (!isGroupAdmin && !isOwner) return reply(MESSAGES.permission.adminOnly);
        if (!q) return reply("Informe o ID do ticket.");
        const res = acceptSupportTicket(q.trim(), sender);
        return reply(res.message);
      }

      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (q === 'on' || q === 'off') {
        if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
        setSupportMode(from, q === 'on');
        return reply(`✅ Suporte ${q === 'on' ? 'ativado' : 'desativado'}!`);
      }
      const res = createSupportTicket({ groupId: from, groupName, userId: sender, userName: pushname, message: q });
      if (!res.success) return reply(res.message);
      return reply(`✅ Ticket #${res.ticket.id} aberto! Aguarde contato.`);
    }

    // ═══════════════════════════════════════════════════════════════
    // 📋 BLACKLIST DO GRUPO
    // ═══════════════════════════════════════════════════════════════
    if (['blacklist', 'addblacklist', 'delblacklist', 'unblacklist', 'listblacklist', 'listablacklist', 'listblacklistgp', 'listblacklistgrupal', 'blacklistlista', 'blacklista'].includes(cmd)) {
      if (!isGroup || !isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      groupData.blacklist = groupData.blacklist || {};

      if (['listblacklist', 'listablacklist', 'listblacklistgp', 'listblacklistgrupal', 'blacklistlista', 'blacklista'].includes(cmd)) {
        const keys = Object.keys(groupData.blacklist);
        if (!keys.length) return reply("Vazia.");
        return reply("📋 BLACKLIST:\n" + keys.map(u => `@${getUserName(u)}`).join('\n'), { mentions: keys });
      }

      let target = menc_os2;
      let reason = q ? q.trim() : "Sem motivo";

      if (!target && q) {
        const parts = q.split(' ');
        target = parts[0];
        reason = parts.slice(1).join(' ').trim() || "Sem motivo";
      }

      if (menc_os2 && q) {
        reason = q.trim() || "Sem motivo";
      }

      if (!target) return reply(MESSAGES.error.missing('alguém'));

      if (target && !target.includes('@')) {
        target = buildUserId(target, config);
      }

      const searchTarget = target.split('@')[0];

      if (['delblacklist', 'unblacklist'].includes(cmd)) {
        let removido = false;
        for (const k of Object.keys(groupData.blacklist)) {
           if (k === target || k.startsWith(searchTarget) || k.includes(searchTarget)) {
              delete groupData.blacklist[k];
              removido = true;
           }
        }
        
        if (removido) {
           await optimizer.saveJsonWithCache(groupFile, groupData);
           return reply("✅ Removido.");
        } else {
           return reply("❌ Este usuário não está na blacklist.");
        }
      }

      for (const k of Object.keys(groupData.blacklist)) {
         if (k === target || k.startsWith(searchTarget) || k.includes(searchTarget)) {
            return reply("❌ Este usuário já está na blacklist.");
         }
      }

      groupData.blacklist[target] = { reason: reason, date: Date.now() };
      await optimizer.saveJsonWithCache(groupFile, groupData);
      return reply("✅ Adicionado.");
    }

    // ═══════════════════════════════════════════════════════════════
    // 🧹 LIMPEZA
    // ═══════════════════════════════════════════════════════════════
    if (['limpar', 'clean'].includes(cmd)) {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      try {
        await sendCleanChat({ bot, from, reply, successMessage: 'Limpeza concluída!' });
      } catch (error) {
        console.error('[CLEAN] Erro ao limpar chat:', error.message);
        // Fallback para limpeza simples se o relayMessage falhar
        const linhasEmBranco = Array(500).fill('🤍 ').join('\n');
        return reply(`${linhasEmBranco}\n✅ Limpeza concluída!`);
      }
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // 🛡️ PROTEÇÕES EXTRAS (ANTISTATUS, ANTISTICKERPLUS, ETC)
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'antistatus') {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);

      const action = args[0]?.toLowerCase();

      if (action === 'apagar' || action === 'banir') {
        groupData.antistatus = true;
        groupData.antistatus_action = action;
        await optimizer.saveJsonWithCache(groupFile, groupData);
        return reply(`🛡️ *AntiStatus* ativado!\n🔧 Ação: *${action === 'banir' ? 'Apagar + Banir 🔨' : 'Apenas apagar 🗑️'}*`);
      }

      groupData.antistatus = !groupData.antistatus;
      await optimizer.saveJsonWithCache(groupFile, groupData);

      if (groupData.antistatus) {
        const currentAction = groupData.antistatus_action || 'banir';
        return reply(`🛡️ *AntiStatus* ativado!\n🔧 Ação atual: *${currentAction === 'banir' ? 'Apagar + Banir 🔨' : 'Apenas apagar 🗑️'}*\n\n📝 Para mudar a ação:\n• ${prefix}antistatus apagar\n• ${prefix}antistatus banir`);
      }
      return reply(`🛡️ *AntiStatus* desativado!`);
    }

    if (['antistickerplus', 'antisticker+', 'antisl', 'antistickerplusbot'].includes(cmd)) {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin && !isOwner) return reply(MESSAGES.permission.adminOnly);
      if (!antistickerplus) return reply("❌ Sistema AntistickerPlus indisponível.");
      await antistickerplus.handleCommand(bot, from, args, groupData, { reply, prefix });
      return;
    }

    if (cmd === 'antitoxic') {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin && !isOwner) return reply(MESSAGES.permission.adminOnly);
      if (!antitoxic) return reply("❌ Sistema Antitoxic indisponível.");
      await antitoxic.handleCommand(bot, from, args, groupData, { reply, prefix });
      return;
    }

    if (['antipalavra', 'antiword'].includes(cmd)) {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin && !isOwner) return reply(MESSAGES.permission.adminOnly);
      if (!antipalavra) return reply("❌ Sistema Antipalavra indisponível.");
      await antipalavra.handleCommand(bot, from, args, groupData, { reply, prefix });
      return;
    }

    if (['antipayment', 'antipagamento'].includes(cmd)) {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);

      groupData.antipayment = !groupData.antipayment;
      await optimizer.saveJsonWithCache(groupFile, groupData);

      if (groupData.antipayment) {
        return reply(`🛡️ *Anti-Payment* ativado!\n\n🔧 Ações automáticas:\n• 🔒 Fechar grupo temporariamente\n• 🚫 Banir o remetente\n• 🗑️ Limpar o chat\n• 🔓 Reabrir o grupo automaticamente\n\n💡 Admins, owners e whitelisted não são afetados.`);
      }
      return reply(`🛡️ *Anti-Payment* desativado!`);
    }

    if (['antiimagem', 'antiimage'].includes(cmd)) {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);

      const action = args[0]?.toLowerCase();

      if (action === 'vizu') {
        groupData.antiimage_vizu = !groupData.antiimage_vizu;
        await optimizer.saveJsonWithCache(groupFile, groupData);
        return reply(`🛡️ *Anti-Imagem (Vizu Única)*: ${groupData.antiimage_vizu ? '✅ Ativado! Imagens de visualização única também serão bloqueadas.' : '❌ Desativado! Apenas imagens normais serão bloqueadas.'}`);
      }

      if (action === 'apagar' || action === 'banir') {
        groupData.antiimage = true;
        groupData.antiimage_action = action;
        await optimizer.saveJsonWithCache(groupFile, groupData);
        return reply(`🛡️ *Anti-Imagem* ativado!\n🔧 Ação: *${action === 'banir' ? 'Apagar + Banir 🔨' : 'Apenas apagar 🗑️'}*`);
      }

      groupData.antiimage = !groupData.antiimage;
      await optimizer.saveJsonWithCache(groupFile, groupData);

      if (groupData.antiimage) {
        const currentAction = groupData.antiimage_action || 'apagar';
        const vizuStatus = groupData.antiimage_vizu ? '✅ Sim' : '❌ Não';
        return reply(`🛡️ *Anti-Imagem* ativado!\n🔧 Ação atual: *${currentAction === 'banir' ? 'Apagar + Banir 🔨' : 'Apenas apagar 🗑️'}*\n👁️ Bloquear Vizu Única: *${vizuStatus}*\n\n📝 Configurações:\n• ${prefix}antiimagem apagar\n• ${prefix}antiimagem banir\n• ${prefix}antiimagem vizu`);
      }
      return reply(`🛡️ *Anti-Imagem* desativado!`);
    }

    if (['antivideo'].includes(cmd)) {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);

      const action = args[0]?.toLowerCase();

      if (action === 'vizu') {
        groupData.antivideo_vizu = !groupData.antivideo_vizu;
        await optimizer.saveJsonWithCache(groupFile, groupData);
        return reply(`🛡️ *Anti-Vídeo (Vizu Única)*: ${groupData.antivideo_vizu ? '✅ Ativado! Vídeos de visualização única também serão bloqueados.' : '❌ Desativado! Apenas vídeos normais serão bloqueados.'}`);
      }

      if (action === 'apagar' || action === 'banir') {
        groupData.antivideo = true;
        groupData.antivideo_action = action;
        await optimizer.saveJsonWithCache(groupFile, groupData);
        return reply(`🛡️ *Anti-Vídeo* ativado!\n🔧 Ação: *${action === 'banir' ? 'Apagar + Banir 🔨' : 'Apenas apagar 🗑️'}*`);
      }

      groupData.antivideo = !groupData.antivideo;
      await optimizer.saveJsonWithCache(groupFile, groupData);

      if (groupData.antivideo) {
        const currentAction = groupData.antivideo_action || 'apagar';
        const vizuStatus = groupData.antivideo_vizu ? '✅ Sim' : '❌ Não';
        return reply(`🛡️ *Anti-Vídeo* ativado!\n🔧 Ação atual: *${currentAction === 'banir' ? 'Apagar + Banir 🔨' : 'Apenas apagar 🗑️'}*\n👁️ Bloquear Vizu Única: *${vizuStatus}*\n\n📝 Configurações:\n• ${prefix}antivideo apagar\n• ${prefix}antivideo banir\n• ${prefix}antivideo vizu`);
      }
      return reply(`🛡️ *Anti-Vídeo* desativado!`);
    }

    if (['antiaudio'].includes(cmd)) {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);

      const action = args[0]?.toLowerCase();

      if (action === 'vizu') {
        groupData.antiaudio_vizu = !groupData.antiaudio_vizu;
        await optimizer.saveJsonWithCache(groupFile, groupData);
        return reply(`🛡️ *Anti-Áudio (Vizu Única)*: ${groupData.antiaudio_vizu ? '✅ Ativado! Áudios de visualização única também serão bloqueados.' : '❌ Desativado! Apenas áudios normais serão bloqueados.'}`);
      }

      if (action === 'apagar' || action === 'banir') {
        groupData.antiaudio = true;
        groupData.antiaudio_action = action;
        await optimizer.saveJsonWithCache(groupFile, groupData);
        return reply(`🛡️ *Anti-Áudio* ativado!\n🔧 Ação: *${action === 'banir' ? 'Apagar + Banir 🔨' : 'Apenas apagar 🗑️'}*`);
      }

      groupData.antiaudio = !groupData.antiaudio;
      await optimizer.saveJsonWithCache(groupFile, groupData);

      if (groupData.antiaudio) {
        const currentAction = groupData.antiaudio_action || 'apagar';
        const vizuStatus = groupData.antiaudio_vizu ? '✅ Sim' : '❌ Não';
        return reply(`🛡️ *Anti-Áudio* ativado!\n🔧 Ação atual: *${currentAction === 'banir' ? 'Apagar + Banir 🔨' : 'Apenas apagar 🗑️'}*\n👁️ Bloquear Vizu Única: *${vizuStatus}*\n\n📝 Configurações:\n• ${prefix}antiaudio apagar\n• ${prefix}antiaudio banir\n• ${prefix}antiaudio vizu`);
      }
      return reply(`🛡️ *Anti-Áudio* desativado!`);
    }

    if (['antidoc'].includes(cmd)) {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);

      const action = args[0]?.toLowerCase();

      if (action === 'apagar' || action === 'banir') {
        groupData.antidoc = true;
        groupData.antidoc_action = action;
        await optimizer.saveJsonWithCache(groupFile, groupData);
        return reply(`🛡️ *Anti-Documento* ativado!\n🔧 Ação: *${action === 'banir' ? 'Apagar + Banir 🔨' : 'Apenas apagar 🗑️'}*`);
      }

      groupData.antidoc = !groupData.antidoc;
      await optimizer.saveJsonWithCache(groupFile, groupData);

      if (groupData.antidoc) {
        const currentAction = groupData.antidoc_action || 'apagar';
        return reply(`🛡️ *Anti-Documento* ativado!\n🔧 Ação atual: *${currentAction === 'banir' ? 'Apagar + Banir 🔨' : 'Apenas apagar 🗑️'}*\n\n📝 Para mudar a ação:\n• ${prefix}antidoc apagar\n• ${prefix}antidoc banir`);
      }
      return reply(`🛡️ *Anti-Documento* desativado!`);
    }

    if (['antievento'].includes(cmd)) {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);

      const action = args[0]?.toLowerCase();

      if (action === 'apagar' || action === 'banir') {
        groupData.antievento = true;
        groupData.antievento_action = action;
        await optimizer.saveJsonWithCache(groupFile, groupData);
        return reply(`🛡️ *Anti-Evento* ativado!\n🔧 Ação: *${action === 'banir' ? 'Apagar + Banir 🔨' : 'Apenas apagar 🗑️'}*`);
      }

      groupData.antievento = !groupData.antievento;
      await optimizer.saveJsonWithCache(groupFile, groupData);

      if (groupData.antievento) {
        const currentAction = groupData.antievento_action || 'apagar';
        return reply(`🛡️ *Anti-Evento* ativado!\n🔧 Ação atual: *${currentAction === 'banir' ? 'Apagar + Banir 🔨' : 'Apenas apagar 🗑️'}*\n\n📝 Para mudar a ação:\n• ${prefix}antievento apagar\n• ${prefix}antievento banir`);
      }
      return reply(`🛡️ *Anti-Evento* desativado!`);
    }

    if (['antiproduto'].includes(cmd)) {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);

      const action = args[0]?.toLowerCase();

      if (action === 'apagar' || action === 'banir') {
        groupData.antiproduto = true;
        groupData.antiproduto_action = action;
        await optimizer.saveJsonWithCache(groupFile, groupData);
        return reply(`🛡️ *Anti-Produto* ativado!\n🔧 Ação: *${action === 'banir' ? 'Apagar + Banir 🔨' : 'Apenas apagar 🗑️'}*`);
      }

      groupData.antiproduto = !groupData.antiproduto;
      await optimizer.saveJsonWithCache(groupFile, groupData);

      if (groupData.antiproduto) {
        const currentAction = groupData.antiproduto_action || 'apagar';
        return reply(`🛡️ *Anti-Produto* ativado!\n🔧 Ação atual: *${currentAction === 'banir' ? 'Apagar + Banir 🔨' : 'Apenas apagar 🗑️'}*\n\n📝 Para mudar a ação:\n• ${prefix}antiproduto apagar\n• ${prefix}antiproduto banir`);
      }
      return reply(`🛡️ *Anti-Produto* desativado!`);
    }
  }
};
