import pathz from 'path';
import { writeAsync } from '../../utils/database/io.js';

export default {
  name: "advanced_ban",
  description: "Sistema de Banimento Real, Fake (BAM) e Sticker Ban (FiguBan)",
  commands: ["ban2", "banir2", "bam", "banfake", "setbammsg", "editarbam", "verbammsg", "verbam", "resetbammsg", "resetarbam", "figuban"],
  handle: async ({ 
    bot, from, info, command, reply, isGroup, menc_os2,
    groupData, DATABASE_DIR, nomedono, q, prefix, MESSAGES,
    isBotAdmin, idsMatch, ownerJid, lidowner, botNumber, botNumberLid, idInArray, groupAdmins, AllgroupMembers,
    isGroupAdmin, isOwner, quotedMessageContent
  }) => {
    const cmd = command.toLowerCase();
    const groupFilePath = pathz.join(DATABASE_DIR, `grupos/${from}.json`);

    // --- EXECUÇÃO DO BAN2 (REAL) ---
    if (['ban2', 'banir2'].includes(cmd)) {
      if (!isBotAdmin) return reply(MESSAGES.permission.botAdminOnly);
      if (!menc_os2) return reply(MESSAGES.error.missing('alguém'));
      
      // Proteções essenciais
      if (idsMatch && idsMatch(menc_os2, ownerJid) || (lidowner && idsMatch && idsMatch(menc_os2, lidowner))) {
        return reply(MESSAGES.permission.cantBanRole('dono do bot'));
      }
      if (idsMatch && idsMatch(menc_os2, botNumber) || (botNumberLid && idsMatch && idsMatch(menc_os2, botNumberLid))) {
        return reply(MESSAGES.permission.cantBanSelf);
      }
      if (idInArray && idInArray(menc_os2, groupAdmins)) {
        return reply(MESSAGES.permission.cantBanRole('administrador do grupo'));
      }
      
      await bot.sendMessage(from, {
        text: MESSAGES.admin.bam.lastWordsReal(menc_os2.split('@')[0]),
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

      await bot.groupParticipantsUpdate(from, [targetId], 'remove');
      return bot.sendMessage(from, {
        text: MESSAGES.admin.bam.bannedReal(menc_os2.split('@')[0]),
        mentions: [menc_os2]
      }, { quoted: info });
    }

    // --- EXECUÇÃO DO BAM (FAKE) ---
    if (['bam', 'banfake'].includes(cmd)) {
      if (!menc_os2) return reply(MESSAGES.error.missing('alguém'));
      
      await bot.sendMessage(from, {
        text: MESSAGES.admin.bam.lastWordsFake(menc_os2.split('@')[0]),
        mentions: [menc_os2]
      }, { quoted: info });

      await new Promise(r => setTimeout(r, 10000));

      const defaultMsg = MESSAGES.admin.bam.defaultFakeMsg(menc_os2.split('@')[0]);
      const msg = groupData.bamMessage || defaultMsg;

      return bot.sendMessage(from, {
        text: msg.replace('#numerodele#', `@${menc_os2.split('@')[0]}`),
        mentions: [menc_os2]
      }, { quoted: info });
    }

    // --- CONFIGURAÇÃO ---
    if (['setbammsg', 'editarbam'].includes(cmd)) {
      if (!q) return reply(MESSAGES.admin.bam.setUsage(prefix, cmd));
      groupData.bamMessage = q;
      await writeAsync(groupFilePath, groupData);
      return reply(MESSAGES.admin.bam.setSuccess);
    }

    if (['verbammsg', 'verbam'].includes(cmd)) {
      return reply(MESSAGES.admin.bam.viewCurrent(groupData.bamMessage || "(Padrão do Sistema)"));
    }

    if (['resetbammsg', 'resetarbam'].includes(cmd)) {
      delete groupData.bamMessage;
      await writeAsync(groupFilePath, groupData);
      return reply(MESSAGES.admin.bam.resetSuccess);
    }

    // --- FIGUBAN ---
    if (cmd === 'figuban') {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isGroupAdmin && !isOwner) return reply(MESSAGES.permission.userAdminOnly);

      const sub = q?.trim().toLowerCase() || '';

      if (quotedMessageContent && quotedMessageContent.stickerMessage) {
        const sha = Buffer.from(quotedMessageContent.stickerMessage.fileSha256).toString('hex');
        groupData.figuban = {
          enabled: true,
          stickerSha: sha
        };
        await writeAsync(groupFilePath, groupData);
        return reply(MESSAGES.admin.figuban.configured);
      }

      if (sub === 'on') {
        if (!groupData.figuban || !groupData.figuban.stickerSha) {
          return reply(MESSAGES.admin.figuban.noSticker(prefix));
        }
        groupData.figuban.enabled = true;
        await writeAsync(groupFilePath, groupData);
        return reply(MESSAGES.admin.figuban.activated);
      }

      if (sub === 'off') {
        if (!groupData.figuban) groupData.figuban = {};
        groupData.figuban.enabled = false;
        await writeAsync(groupFilePath, groupData);
        return reply(MESSAGES.admin.figuban.deactivated);
      }

      // Mostrar status
      const status = groupData.figuban?.enabled ? '✅ Ativado' : '❌ Desativado';
      const hasSticker = groupData.figuban?.stickerSha ? 'Configurada' : 'Não configurada';
      return reply(MESSAGES.admin.figuban.status(status, hasSticker, prefix));
    }
  }
};
