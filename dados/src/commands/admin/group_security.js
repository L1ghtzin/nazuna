import { PREFIX } from "../../config.js";

export default {
  name: "group_security",
  description: "Segurança e moderação avançada de grupos",
  commands: ["aceitarticket", "addblacklist", "addparceria", "addpartnership", "adv", "advertir", "antibanmarcar", "antifig", "antipalavra", "antisl", "antistatus", "antisticker+", "antistickerplus", "antistickerplusbot", "antitoxic", "antitóxico", "antiword", "banghost", "bemvindo", "blacklist", "boasvindas", "bv", "clean", "configsaida", "delblacklist", "delfotobv", "delfotosaiu", "delparceria", "delpartnership", "exit", "exitimg", "exitmsg", "fotobv", "fotosaida", "fotosaiu", "imgsaiu", "legendasaiu", "limpar", "listadv", "listblacklist", "modoparceria", "parcerias", "partnerships", "protecaomarcar", "removeradv", "removerfotobv", "removerfotosaiu", "rmadv", "rmexitimg", "rmfotobv", "rmfotosaiu", "rmwelcomeimg", "saida", "suporte", "suporteaceitar", "suporteticket", "textsaiu", "ticket", "ticket.aceitar", "ticketaceitar", "ticketsuporte", "unblacklist", "unwarning", "warning", "warninglist", "welcome", "welcomeimg"],
  handle: async ({ 
    nazu, from, info, command, args, reply, prefix, pushname, sender, q,
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
      if (!isGroup) return reply("Grupo apenas 💔");
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
      if (!isGroup) return reply("Grupo apenas 💔");
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
      if (!isGroup || !isGroupAdmin) return reply("Permissões insuficientes 💔");
      if (!groupData.welcome?.image) return reply("❌ Não há imagem configurada.");
      delete groupData.welcome.image;
      await optimizer.saveJsonWithCache(groupFile, groupData);
      return reply("✅ Imagem de boas-vindas removida!");
    }

    if (['removerfotosaiu', 'rmfotosaiu', 'delfotosaiu', 'rmexitimg'].includes(cmd)) {
      if (!isGroup || !isGroupAdmin) return reply("Permissões insuficientes 💔");
      if (!groupData.exit?.image) return reply("❌ Não há imagem configurada.");
      delete groupData.exit.image;
      await optimizer.saveJsonWithCache(groupFile, groupData);
      return reply("✅ Imagem de saída removida!");
    }

    if (['configsaida', 'textsaiu', 'legendasaiu', 'exitmsg'].includes(cmd)) {
      if (!isGroup) return reply("Grupo apenas 💔");
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
      if (!isGroup || !isGroupAdmin || !isBotAdmin) return reply("Permissões insuficientes 💔");
      const limit = parseInt(q);
      if (isNaN(limit)) return reply(`Uso: ${prefix}banghost <limite_msgs>`);
      
      const countMap = new Map(groupData.contador?.map(u => [u.id, u.msg || 0]) || []);
      const ghosts = AllgroupMembers.filter(m => {
        const msgCount = countMap.get(m) || 0;
        return msgCount <= limit && !idInArray(m, groupAdmins) && m !== botNumber && (!botNumberLid || m !== botNumberLid);
      });

      if (!ghosts.length) return reply("Nenhum fantasma encontrado.");
      await nazu.groupParticipantsUpdate(from, ghosts, 'remove');
      return reply(`✅ ${ghosts.length} fantasmas removidos!`);
    }

    // ═══════════════════════════════════════════════════════════════
    // 🛡️ ANTI-BAN MARCAR (MASS MENTION PROTECTION)
    // ═══════════════════════════════════════════════════════════════
    if (['antibanmarcar', 'protecaomarcar'].includes(cmd)) {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      if (!isGroup) return reply("Grupo apenas 💔");
      
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

      if (!menc_os2) return reply(MESSAGES.permission.mentionRequired);
      
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
        if (isBotAdmin) await nazu.groupParticipantsUpdate(from, [targetId], 'remove');
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
    if (['blacklist', 'addblacklist', 'delblacklist', 'listblacklist', 'listablacklist', 'listblacklistgp', 'listblacklistgrupal', 'blacklistlista', 'blacklista'].includes(cmd)) {
      if (!isGroup || !isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      groupData.blacklist = groupData.blacklist || {};

      if (['listblacklist', 'listablacklist', 'listblacklistgp', 'listblacklistgrupal', 'blacklistlista', 'blacklista'].includes(cmd)) {
        const keys = Object.keys(groupData.blacklist);
        if (!keys.length) return reply("Vazia.");
        return reply("📋 BLACKLIST:\n" + keys.map(u => `@${getUserName(u)}`).join('\n'), { mentions: keys });
      }

      if (!menc_os2) return reply(MESSAGES.permission.mentionRequired);
      if (['delblacklist', 'unblacklist'].includes(cmd)) {
        delete groupData.blacklist[menc_os2];
        await optimizer.saveJsonWithCache(groupFile, groupData);
        return reply("✅ Removido.");
      }

      groupData.blacklist[menc_os2] = { reason: q || "Sem motivo", date: Date.now() };
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
      const linhasEmBranco = Array(500).fill('🤍 ').join('\n');
      return reply(`${linhasEmBranco}\n✅ Limpeza concluída!`);
    }

    // ═══════════════════════════════════════════════════════════════
    // 🛡️ PROTEÇÕES EXTRAS (ANTISTATUS, ANTISTICKERPLUS, ETC)
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'antistatus') {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin) return reply(MESSAGES.permission.adminOnly);
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      groupData.antistatus = !groupData.antistatus;
      await optimizer.saveJsonWithCache(groupFile, groupData);
      return reply(`🛡️ *AntiStatus* ${groupData.antistatus ? 'ativado' : 'desativado'}!`);
    }

    if (['antistickerplus', 'antisticker+', 'antisl', 'antistickerplusbot'].includes(cmd)) {
      if (!isGroup) return reply("Grupo apenas 💔");
      if (!isGroupAdmin && !isOwner) return reply(MESSAGES.permission.adminOnly);
      if (!antistickerplus) return reply("❌ Sistema AntistickerPlus indisponível.");
      await antistickerplus.handleCommand(nazu, from, args, groupData, { reply, prefix });
      return;
    }

    if (cmd === 'antitoxic') {
      if (!isGroup) return reply("Grupo apenas 💔");
      if (!isGroupAdmin && !isOwner) return reply(MESSAGES.permission.adminOnly);
      if (!antitoxic) return reply("❌ Sistema Antitoxic indisponível.");
      await antitoxic.handleCommand(nazu, from, args, groupData, { reply, prefix });
      return;
    }

    if (['antipalavra', 'antiword'].includes(cmd)) {
      if (!isGroup) return reply("Grupo apenas 💔");
      if (!isGroupAdmin && !isOwner) return reply(MESSAGES.permission.adminOnly);
      if (!antipalavra) return reply("❌ Sistema Antipalavra indisponível.");
      await antipalavra.handleCommand(nazu, from, args, groupData, { reply, prefix });
      return;
    }
  }
};
