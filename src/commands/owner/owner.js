import fs from 'fs';
import pathz from 'path';

export default {
  name: "owner",
  description: "Comandos exclusivos do dono do bot",
  commands: ["blockcmdg", "blockuserg", "botoff", "boton", "listblocks", "reviverqr", "seradm", "sermembro", "tm", "unblockcmdg", "unblockuserg"],
  handle: async ({ 
    nazu, from, info, command, q, reply, prefix, sender, pushname,
    botState, globalBlocks, transmissao,
    isOwner, DATABASE_DIR, optimizer, getUserName, getFileBuffer,
    isImage, isVideo, isQuotedImage, isQuotedVideo, menc_os2, isGroup,
    MESSAGES, AllgroupMembers, idsMatch }) => {
    const cmd = command.toLowerCase();

    // ═══════════════════════════════════════════════════════════════
    // 📡 TRANSMISSÃO (TM)
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'tm') {
      if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
      if (!q && !isImage && !isVideo && !isQuotedImage && !isQuotedVideo) return reply('Digite uma mensagem ou marque uma imagem/vídeo!');

      const cabecalho = `╔══════════════════════\n║  📡 *TRANSMISSÃO DA BOT* 📡\n╚══════════════════════\n\n`;
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

      const groups = await nazu.groupFetchAllParticipating();
      let enviados = 0;
      for (const group of Object.values(groups)) {
        try {
          await nazu.sendMessage(group.id, baseMessage);
          enviados++;
          await new Promise(r => setTimeout(r, 1500));
        } catch (e) { console.error('Error fetching broadcast PP:', e); }
      }
      return reply(`✅ Transmissão enviada para ${enviados} grupos!`);
    }

    // ═══════════════════════════════════════════════════════════════
    // 🛡️ BLOQUEIOS GLOBAIS
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'blockcmdg') {
      if (!q) return reply(`💔 Informe o comando a bloquear! Ex.: ${prefix}blockcmdg sticker`);
      const cmdToBlock = q.toLowerCase().split(' ')[0];
      if (!cmdToBlock) return reply(`💔 Informe o comando a bloquear! Ex.: ${prefix}blockcmdg sticker`);
      globalBlocks.commands = globalBlocks.commands || {};
      globalBlocks.commands[cmdToBlock] = { reason: q.split(' ').slice(1).join(' ') || 'Sem motivo', timestamp: Date.now() };
      await optimizer.saveJsonWithCache(pathz.join(DATABASE_DIR, 'globalBlocks.json'), globalBlocks);
      return reply(`✅ Comando *${cmdToBlock}* bloqueado globalmente!\nMotivo: ${globalBlocks.commands[cmdToBlock].reason}`);
    }

    if (cmd === 'unblockcmdg') {
      if (!q) return reply(`💔 Informe o comando a desbloquear! Ex.: ${prefix}unblockcmdg sticker`);
      const cmdToUnblock = q.toLowerCase().split(' ')[0];
      if (!cmdToUnblock) return reply(`💔 Informe o comando a desbloquear! Ex.: ${prefix}unblockcmdg sticker`);
      globalBlocks.commands = globalBlocks.commands || {};
      if (!globalBlocks.commands[cmdToUnblock]) {
        return reply(`❌ O comando *${cmdToUnblock}* não está bloqueado!`);
      }
      delete globalBlocks.commands[cmdToUnblock];
      await optimizer.saveJsonWithCache(pathz.join(DATABASE_DIR, 'globalBlocks.json'), globalBlocks);
      return reply(`✅ Comando *${cmdToUnblock}* desbloqueado globalmente!`);
    }

    if (cmd === 'listblocks') {
      const blockedCommands = globalBlocks.commands && Object.keys(globalBlocks.commands).length > 0
        ? Object.entries(globalBlocks.commands).map(([cmd, data]) => `🔧 *${cmd}* - Motivo: ${data.reason}`).join('\n')
        : 'Nenhum comando bloqueado.';
      const blockedUsers = globalBlocks.users && Object.keys(globalBlocks.users).length > 0
        ? Object.entries(globalBlocks.users).map(([user, data]) => `👤 *${user.split('@')[0]}* - Motivo: ${data.reason}`).join('\n')
        : 'Nenhum usuário bloqueado.';
      return reply(`🔒 *Bloqueios Globais* 🔒\n\n📜 *Comandos Bloqueados*:\n${blockedCommands}\n\n👥 *Usuários Bloqueados*:\n${blockedUsers}`);
    }

    if (cmd === 'boton' || cmd === 'botoff') {
      botState.status = (cmd === 'boton' ? 'on' : 'off');
      await optimizer.saveJsonWithCache(pathz.join(DATABASE_DIR, 'botState.json'), botState);
      return reply(`✅ Bot ${cmd === 'boton' ? 'ativado' : 'desativado'}!`);
    }



    if (cmd === 'reviverqr') {
      const qrcodeDir = pathz.join(DATABASE_DIR, 'qr-code');
      if (fs.existsSync(qrcodeDir)) {
        fs.readdirSync(qrcodeDir).forEach(f => {
          if (f.startsWith('pre-key') || f.startsWith('sender') || f.startsWith('session')) {
            fs.unlinkSync(pathz.join(qrcodeDir, f));
          }
        });
        reply('🧹 Limpeza concluída! Reiniciando...');
        setTimeout(() => process.exit(), 1000);
      }
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
        await nazu.groupParticipantsUpdate(from, [targetId], action);
        return reply(`✅ O dono agora é ${cmd === 'seradm' ? 'Administrador' : 'Membro comum'}.`);
      } catch (e) {
        console.error("Erro no seradm/sermembro:", e);
        return reply(`❌ Erro. Verifique se o bot é administrador do grupo.`);
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
      
      return reply(`✅ Usuário @${target.split('@')[0]} bloqueado globalmente!\nMotivo: ${reason}`, { mentions: [target] });
    }

    if (cmd === 'unblockuserg') {
      if (!menc_os2) return reply(MESSAGES.error.missing('alguém'));
      let target = menc_os2.includes(' ') ? menc_os2.split(' ')[0] : menc_os2;
      
      const blockFile = pathz.join(DATABASE_DIR, 'globalBlocks.json');
      const globalBlocks = await optimizer.loadJsonWithCache(blockFile, { users: {}, commands: {} });
      
      if (!globalBlocks.users[target]) {
         return reply(`❌ O usuário não está bloqueado globalmente!`);
      }
      
      delete globalBlocks.users[target];
      await optimizer.saveJsonWithCache(blockFile, globalBlocks);
      return reply(`✅ Usuário @${target.split('@')[0]} desbloqueado globalmente!`, { mentions: [target] });
    }


  }
};
