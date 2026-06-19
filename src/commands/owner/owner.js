import fs from 'fs/promises';
import pathz from 'path';
import { getAllCommandList } from '../../utils/dynamicCommand.js';

export default {
  name: "owner",
  description: "Comandos exclusivos do dono do bot",
  commands: ["blockcmdg", "blockuserg", "botoff", "boton", "listblocks", "seradm", "sermembro", "tm", "unblockcmdg", "unblockuserg"],
  handle: async ({ 
    bot, from, info, command, q, reply, prefix, sender, pushname,
    botState, globalBlocks, transmissao,
    isOwner, DATABASE_DIR, optimizer, getUserName, getFileBuffer,
    isImage, isVideo, isQuotedImage, isQuotedVideo, menc_os2, isGroup,
    MESSAGES, AllgroupMembers, idsMatch }) => {
    const cmd = command.toLowerCase();

    // ═══════════════════════════════════════════════════════════════
    // 📡 TRANSMISSÃO (TM)
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'tm') {
      if (!q && !isImage && !isVideo && !isQuotedImage && !isQuotedVideo) return reply(MESSAGES.owner.owner.tm.missingMedia);

      const cabecalho = MESSAGES.owner.owner.tm.header;
      let baseMessage = {};

      if (isImage || isQuotedImage) {
        const msg = isImage ? info.message.imageMessage : info.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage;
        const buffer = await getFileBuffer(msg, 'image');
        baseMessage = { image: buffer, caption: q ? `${cabecalho}${q}` : cabecalho.trim() };
      } else if (isVideo || isQuotedVideo) {
        const msg = isVideo ? info.message.videoMessage : info.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage;
        const buffer = await getFileBuffer(msg, 'video');
        baseMessage = { video: buffer, caption: q ? `${cabecalho}${q}` : cabecalho.trim() };
      } else {
        baseMessage = { text: `${cabecalho}${q}` };
      }

      const groups = await bot.groupFetchAllParticipating();
      let enviados = 0;
      for (const group of Object.values(groups)) {
        try {
          await bot.sendMessage(group.id, baseMessage);
          enviados++;
          await new Promise(r => setTimeout(r, 1500));
        } catch (e) { console.error('Error fetching broadcast PP:', e); }
      }
      return reply(MESSAGES.owner.owner.tm.success(enviados));
    }

    // ═══════════════════════════════════════════════════════════════
    // 🛡️ BLOQUEIOS GLOBAIS
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'blockcmdg') {
      if (!q) return reply(MESSAGES.owner.owner.blockcmdg.missingCmd(prefix));
      const cmdToBlock = q.toLowerCase().split(' ')[0];
      if (!cmdToBlock) return reply(MESSAGES.owner.owner.blockcmdg.missingCmd(prefix));
      
      const allCommands = await getAllCommandList();
      if (!allCommands.includes(cmdToBlock)) {
        return reply(MESSAGES.owner.owner.blockcmdg.invalidCmd(cmdToBlock));
      }
      
      const blockFile = pathz.join(DATABASE_DIR, 'globalBlocks.json');
      const loadedBlocks = await optimizer.loadJsonWithCache(blockFile, { users: {}, commands: {} });
      loadedBlocks.commands = loadedBlocks.commands || {};
      loadedBlocks.commands[cmdToBlock] = { reason: q.split(' ').slice(1).join(' ') || 'Sem motivo', timestamp: Date.now() };
      
      await optimizer.saveJsonWithCache(blockFile, loadedBlocks);
      return reply(MESSAGES.owner.owner.blockcmdg.success(cmdToBlock, loadedBlocks.commands[cmdToBlock].reason));
    }

    if (cmd === 'unblockcmdg') {
      if (!q) return reply(MESSAGES.owner.owner.unblockcmdg.missingCmd(prefix));
      const cmdToUnblock = q.toLowerCase().split(' ')[0];
      if (!cmdToUnblock) return reply(MESSAGES.owner.owner.unblockcmdg.missingCmd(prefix));
      
      const blockFile = pathz.join(DATABASE_DIR, 'globalBlocks.json');
      const loadedBlocks = await optimizer.loadJsonWithCache(blockFile, { users: {}, commands: {} });
      loadedBlocks.commands = loadedBlocks.commands || {};
      
      if (!loadedBlocks.commands[cmdToUnblock]) {
        return reply(MESSAGES.owner.owner.unblockcmdg.notBlocked(cmdToUnblock));
      }
      delete loadedBlocks.commands[cmdToUnblock];
      await optimizer.saveJsonWithCache(blockFile, loadedBlocks);
      return reply(MESSAGES.owner.owner.unblockcmdg.success(cmdToUnblock));
    }

    if (cmd === 'listblocks') {
      const blockFile = pathz.join(DATABASE_DIR, 'globalBlocks.json');
      const loadedBlocks = await optimizer.loadJsonWithCache(blockFile, { users: {}, commands: {} });
      
      const blockedCommands = loadedBlocks.commands && Object.keys(loadedBlocks.commands).length > 0
        ? Object.entries(loadedBlocks.commands).map(([cmd, data]) => `🔧 *${cmd}* - Motivo: ${data.reason}`).join('\n')
        : MESSAGES.owner.owner.listblocks.noCmds;
      const blockedUsers = loadedBlocks.users && Object.keys(loadedBlocks.users).length > 0
        ? Object.entries(loadedBlocks.users).map(([user, data]) => `👤 *${user.split('@')[0]}* - Motivo: ${data.reason}`).join('\n')
        : MESSAGES.owner.owner.listblocks.noUsers;
      return reply(`${MESSAGES.owner.owner.listblocks.header}${blockedCommands}${MESSAGES.owner.owner.listblocks.usersHeader}${blockedUsers}`);
    }

    if (cmd === 'boton' || cmd === 'botoff') {
      botState.status = (cmd === 'boton' ? 'on' : 'off');
      await optimizer.saveJsonWithCache(pathz.join(DATABASE_DIR, 'botState.json'), botState);
      return reply(MESSAGES.owner.owner.botState.success(cmd === 'boton' ? 'ativado' : 'desativado'));
    }



    if (cmd === 'reviverqr') {
      const qrcodeDir = pathz.join(DATABASE_DIR, 'qr-code');
      try {
        const files = await fs.readdir(qrcodeDir);
        for (const f of files) {
          if (f.startsWith('pre-key') || f.startsWith('sender') || f.startsWith('session')) {
            await fs.unlink(pathz.join(qrcodeDir, f));
          }
        }
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      reply(MESSAGES.owner.owner.reviverqr.success);
      setTimeout(() => process.exit(), 1000);
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // 🛠️ ADMIN & MODERAÇÃO GLOBAL
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'seradm' || cmd === 'sermembro') {
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      const action = cmd === 'seradm' ? 'promote' : 'demote';
      try {
        let targetId = sender;
        if (AllgroupMembers && idsMatch) {
           for (const member of AllgroupMembers) {
               if (idsMatch(member, sender)) {
                   targetId = member;
                   break;
               }
           }
        }
        await bot.groupParticipantsUpdate(from, [targetId], action);
        return reply(MESSAGES.owner.owner.role.success(cmd === 'seradm' ? 'Administrador' : 'Membro comum'));
      } catch (e) {
        console.error("Erro no seradm/sermembro:", e);
        return reply(MESSAGES.owner.owner.role.error);
      }
    }

    if (cmd === 'blockuserg') {
      if (!menc_os2) return reply(MESSAGES.error.missing('alguém'));
      let reason = q.includes(' ') ? q.substring(q.indexOf(' ')).trim() : "Não informado";
      let target = menc_os2.includes(' ') ? menc_os2.split(' ')[0] : menc_os2;
      
      const blockFile = pathz.join(DATABASE_DIR, 'globalBlocks.json');
      const globalBlocks = await optimizer.loadJsonWithCache(blockFile, { users: {}, commands: {} });
      globalBlocks.users[target] = { reason, timestamp: Date.now() };
      await optimizer.saveJsonWithCache(blockFile, globalBlocks);
      
      return reply(MESSAGES.owner.owner.blockuserg.success(target.split('@')[0], reason), { mentions: [target] });
    }

    if (cmd === 'unblockuserg') {
      if (!menc_os2) return reply(MESSAGES.error.missing('alguém'));
      let target = menc_os2.includes(' ') ? menc_os2.split(' ')[0] : menc_os2;
      
      const blockFile = pathz.join(DATABASE_DIR, 'globalBlocks.json');
      const globalBlocks = await optimizer.loadJsonWithCache(blockFile, { users: {}, commands: {} });
      
      if (!globalBlocks.users[target]) {
         return reply(MESSAGES.owner.owner.unblockuserg.notBlocked);
      }
      
      delete globalBlocks.users[target];
      await optimizer.saveJsonWithCache(blockFile, globalBlocks);
      return reply(MESSAGES.owner.owner.unblockuserg.success(target.split('@')[0]), { mentions: [target] });
    }


  }
};
