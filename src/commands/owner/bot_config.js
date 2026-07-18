import fs from 'fs/promises';
import path from 'path';
import { readAsync, writeAsync } from '../../utils/database/io.js';

async function removeFileIfExists(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

export default {
  name: "bot_config",
  description: "Configurações globais do bot e do sistema",
  // REMOVIDOS: addxp, delxp, level, leveling, dayfree para que não interceptem o bot_config!
  commands: ["activate", "ajuda", "antipv", "antipv2", "antipv3", "antipv4", "antipvmessage", "antipvmsg", "ativar", "audiomenu", "configcmdnotfound", "deactivate", "desativar", "entrar", "fotomenu", "guia", "list", "lista", "mediamenu", "menuaudio", "midiamenu", "off", "on", "sairgp", "setcmdmsg", "setmenuaudio", "tutorial", "videomenu"],
  handle: async ({ 
    bot, from, info, command, reply, q, args, prefix,
    MESSAGES, getFileBuffer, getMediaInfo,
    setMenuAudio, removeMenuAudio, DATABASE_DIR, pathz
  }) => {
    const cmd = command.toLowerCase();

    // --- ANTIPV ---
    if (['antipv', 'antipv2', 'antipv3', 'antipv4'].includes(cmd)) {
      const dbPath = pathz.join(DATABASE_DIR, 'antipv.json');
      let antipvData = await readAsync(dbPath, { mode: 'off', message: MESSAGES.permission.groupOnly });

      const arg0 = args[0] ? args[0].toLowerCase() : '';
      let statusChanged = true;

      if (arg0 === '1' || arg0 === 'on') {
        if (antipvData.mode === cmd) statusChanged = false;
        antipvData.mode = cmd;
      } else if (arg0 === '0' || arg0 === 'off') {
        if (antipvData.mode === 'off' || antipvData.mode === null) statusChanged = false;
        antipvData.mode = 'off';
      } else if (arg0 === '') {
        const isCurrentlyActive = antipvData.mode && antipvData.mode !== 'off';
        if (isCurrentlyActive) {
          antipvData.mode = 'off';
        } else {
          antipvData.mode = cmd;
        }
      } else {
        return reply(`⚠️ Argumento inválido. Use:\n- *${prefix}${cmd} on* para ativar\n- *${prefix}${cmd} off* para desativar\n- *${prefix}${cmd}* para alternar`);
      }
      
      const isCurrentlyActive = antipvData.mode && antipvData.mode !== 'off';
      if (!statusChanged) {
        const currentStatus = isCurrentlyActive ? 'ATIVADO' : 'DESATIVADO';
        return reply(MESSAGES.owner.bot_config.antipv.statusUnchanged(cmd, currentStatus));
      }

      await writeAsync(dbPath, antipvData);

      const status = isCurrentlyActive ? 'ativado' : 'desativado';
      let infoMsg = 'O bot responde normalmente no privado.';
      if (antipvData.mode === 'antipv') infoMsg = 'O bot agora ignora mensagens no privado, bloqueia e envia o aviso.';
      if (antipvData.mode === 'antipv2') infoMsg = 'O bot responde apenas a comandos no privado.';
      if (antipvData.mode === 'antipv3') infoMsg = 'O bot ignora mensagens silenciosamente no privado.';
      if (antipvData.mode === 'antipv4') infoMsg = 'O bot bloqueia automaticamente os usuários no privado e envia aviso.';
      
      return reply(MESSAGES.owner.bot_config.antipv.statusChanged(cmd, status, infoMsg));
    }

    if (cmd === 'antipvmessage' || cmd === 'antipvmsg') {
      if (!q) return reply(MESSAGES.owner.bot_config.antipv.missingMessage(prefix));
      const dbPath = pathz.join(DATABASE_DIR, 'antipv.json');
      let antipvData = await readAsync(dbPath, { mode: 'off', message: MESSAGES.permission.groupOnly });
      
      antipvData.message = q.trim();
      await writeAsync(dbPath, antipvData);
      
      return reply(MESSAGES.owner.bot_config.antipv.messageUpdated(antipvData.message));
    }

    // --- MENU MEDIA (FOTO/VIDEO) ---
    if (['fotomenu', 'videomenu', 'mediamenu', 'midiamenu'].includes(cmd)) {
      const midiasDir = path.resolve('./dados/midias');
      try {
        const quotedMsg = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const mediaInfo = getMediaInfo(info.message) || (quotedMsg ? getMediaInfo(quotedMsg) : null);

        if (!mediaInfo || (mediaInfo.type !== 'image' && mediaInfo.type !== 'video')) {
          return reply(MESSAGES.owner.bot_config.menu.mediaMissing(prefix, command));
        }
        
        const isVideo2 = mediaInfo.type === 'video';
        await removeFileIfExists(path.join(midiasDir, 'menu.jpg'));
        await removeFileIfExists(path.join(midiasDir, 'menu.mp4'));
        
        const buffer = await getFileBuffer(mediaInfo.media, mediaInfo.type);
        await fs.mkdir(midiasDir, { recursive: true });
        await fs.writeFile(path.join(midiasDir, `menu.${isVideo2 ? 'mp4' : 'jpg'}`), buffer);
        return reply(MESSAGES.owner.bot_config.menu.mediaUpdated);
      } catch (e) {
        console.error(e);
        return reply(MESSAGES.error.general);
      }
    }

    // --- MENU AUDIO ---
    if (['audiomenu', 'menuaudio', 'setmenuaudio'].includes(cmd)) {
      if (q && ['off', 'del', 'delete', 'remover'].includes(q.toLowerCase())) {
        if (typeof removeMenuAudio === 'function') removeMenuAudio();
        const audioPath = path.resolve('./dados/midias/menu_audio.mp3');
        await removeFileIfExists(audioPath);
        return reply(MESSAGES.owner.bot_config.menu.audioRemoved);
      }
      
      const quotedMsg = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const mediaInfo = getMediaInfo(info.message) || (quotedMsg ? getMediaInfo(quotedMsg) : null);
      
      if (!mediaInfo || mediaInfo.type !== 'audio') {
        return reply(MESSAGES.owner.bot_config.menu.audioMissing(prefix, command));
      }
      
      try {
        const audioBuffer = await getFileBuffer(mediaInfo.media, 'audio');
        const audioPath = path.resolve('./dados/midias/menu_audio.mp3');
        await fs.mkdir(path.dirname(audioPath), { recursive: true });
        await fs.writeFile(audioPath, audioBuffer);
        if (typeof setMenuAudio === 'function') setMenuAudio(audioPath);
        
        return reply(MESSAGES.owner.bot_config.menu.audioUpdated(prefix, command));
      } catch (e) {
        console.error(e);
        return reply(MESSAGES.error.general);
      }
    }

    // --- MISC ---
    if (cmd === 'entrar') {
      if (!q) return reply(MESSAGES.owner.bot_config.misc.missingLink);
      return bot.groupAcceptInvite(q.split('chat.whatsapp.com/')[1]).then(() => reply(MESSAGES.owner.bot_config.misc.joining)).catch(() => reply(MESSAGES.owner.bot_config.misc.invalidLink));
    }
    if (cmd === 'sairgp') {
      await reply(MESSAGES.owner.bot_config.misc.leaving);
      return bot.groupLeave(from);
    }
  }
};
