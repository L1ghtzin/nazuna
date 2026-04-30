import pathz from 'path';

export default {
  name: "advanced_ban",
  description: "Sistema de Banimento Fake (BAM)",
  commands: ["ban2", "banir2", "bam", "banfake", "setbammsg", "editarbam", "verbammsg", "verbam", "resetbammsg", "resetarbam"],
  handle: async ({ 
    nazu, from, info, command, reply, isOwner, isGroupAdmin, isGroup, menc_os2, 
    groupData, DATABASE_DIR, optimizer, nomedono, q, prefix, MESSAGES,
    isBotAdmin, idsMatch, ownerJid, lidowner, botNumber, botNumberLid, idInArray, groupAdmins, AllgroupMembers
  }) => {
    if (!isGroup) return reply(MESSAGES.permission.groupOnly);
    if (!isGroupAdmin && !isOwner) return reply(MESSAGES.permission.userAdminOnly);

    const cmd = command.toLowerCase();
    const groupFilePath = pathz.join(DATABASE_DIR, `grupos/${from}.json`);

    // --- EXECUÇÃO DO BAN2 (REAL) ---
    if (['ban2', 'banir2'].includes(cmd)) {
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      if (!menc_os2) return reply(MESSAGES.permission.mentionRequired);
      
      // Proteções essenciais
      if (idsMatch && idsMatch(menc_os2, ownerJid) || (lidowner && idsMatch && idsMatch(menc_os2, lidowner))) {
        return reply(MESSAGES.permission.cantBanOwner);
      }
      if (idsMatch && idsMatch(menc_os2, botNumber) || (botNumberLid && idsMatch && idsMatch(menc_os2, botNumberLid))) {
        return reply(MESSAGES.permission.cantBanSelf);
      }
      if (idInArray && idInArray(menc_os2, groupAdmins)) {
        return reply(MESSAGES.permission.cantBanAdmin);
      }
      
      await nazu.sendMessage(from, {
        text: `⚠️ *ÚLTIMAS PALAVRAS!*\n\n@${menc_os2.split('@')[0]}, você tem *10 segundos* para dizer suas últimas palavras antes de ser banido! ⏰`,
        mentions: [menc_os2]
      }, { quoted: info });

      await new Promise(r => setTimeout(r, 10000));

      // Converte para LID se necessário
      let targetId = menc_os2;
      if (AllgroupMembers && idsMatch) {
         for (const member of AllgroupMembers) {
             if (idsMatch(member, menc_os2)) {
                 targetId = member;
                 break;
             }
         }
      }

      await nazu.groupParticipantsUpdate(from, [targetId], 'remove');
      return nazu.sendMessage(from, {
        text: `👋 @${menc_os2.split('@')[0]} foi banido! Adeus! 🚪\n\n📝 Motivo: Banimento com aviso.`,
        mentions: [menc_os2]
      }, { quoted: info });
    }

    // --- EXECUÇÃO DO BAM (FAKE) ---
    if (['bam', 'banfake'].includes(cmd)) {
      if (!menc_os2) return reply(MESSAGES.permission.mentionRequired);
      
      await nazu.sendMessage(from, {
        text: `⏳ *ÚLTIMAS PALAVRAS!*\n\n@${menc_os2.split('@')[0]}, você tem *10 segundos* para dizer suas últimas palavras antes de ser banido! 🔨`,
        mentions: [menc_os2]
      }, { quoted: info });

      await new Promise(r => setTimeout(r, 10000));

      const defaultMsg = `🎭 *ERA MEME!*\n\n@${menc_os2.split('@')[0]}, relaxa, era só uma brincadeira! 😂\n\nVocê não vai ser banido... dessa vez! 🥳`;
      const msg = groupData.bamMessage || defaultMsg;

      return nazu.sendMessage(from, {
        text: msg.replace('#numerodele#', `@${menc_os2.split('@')[0]}`),
        mentions: [menc_os2]
      }, { quoted: info });
    }

    // --- CONFIGURAÇÃO ---
    if (['setbammsg', 'editarbam'].includes(cmd)) {
      if (!q) return reply(`Uso: ${prefix}${cmd} <mensagem>\nUse #numerodele# para marcar o usuário.`);
      groupData.bamMessage = q;
      await optimizer.saveJsonWithCache(groupFilePath, groupData);
      return reply("✅ Mensagem do BAM atualizada!");
    }

    if (['verbammsg', 'verbam'].includes(cmd)) {
      return reply(`📝 *Mensagem atual do BAM:*\n\n${groupData.bamMessage || "(Padrão do Sistema)"}`);
    }

    if (['resetbammsg', 'resetarbam'].includes(cmd)) {
      delete groupData.bamMessage;
      await optimizer.saveJsonWithCache(groupFilePath, groupData);
      return reply("🔄 Mensagem do BAM resetada para o padrão.");
    }
  }
};
