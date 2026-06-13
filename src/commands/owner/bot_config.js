import fs from 'fs';
import path from 'path';

export default {
  name: "bot_config",
  description: "Configurações globais do bot e do sistema",
  // REMOVIDOS: addxp, delxp, level, leveling, dayfree para que não interceptem o bot_config!
  commands: ["activate", "ajuda", "antipv", "antipv2", "antipv3", "antipv4", "antipvmessage", "antipvmsg", "ativar", "audiomenu", "configcmdnotfound", "deactivate", "desativar", "entrar", "fotomenu", "guia", "list", "lista", "mediamenu", "menuaudio", "midiamenu", "off", "on", "sairgp", "setcmdmsg", "setmenuaudio", "tutorial", "videomenu"],
  handle: async ({ 
    bot, from, info, command, reply, isOwner, q, args, prefix, OWNER_ONLY_MESSAGE,
    MESSAGES, optimizer, getFileBuffer, getMediaInfo,
    setMenuAudio, removeMenuAudio, DATABASE_DIR, pathz
  }) => {
    if (!isOwner) return reply(OWNER_ONLY_MESSAGE);
    const cmd = command.toLowerCase();

    // --- ANTIPV ---
    if (['antipv', 'antipv2', 'antipv3', 'antipv4'].includes(cmd)) {
      const dbPath = pathz.join(DATABASE_DIR, 'antipv.json');
      let antipvData = await optimizer.loadJsonWithCache(dbPath, { mode: null, message: MESSAGES.permission.groupOnly });

      const arg0 = args[0] ? args[0].toLowerCase() : '';
      let statusChanged = true;

      if (arg0 === '1' || arg0 === 'on') {
        if (antipvData.mode === cmd) statusChanged = false;
        antipvData.mode = cmd;
      } else if (arg0 === '0' || arg0 === 'off') {
        if (antipvData.mode === null) statusChanged = false;
        antipvData.mode = null;
      } else {
        antipvData.mode = antipvData.mode === cmd ? null : cmd;
      }
      
      if (!statusChanged) {
        const currentStatus = antipvData.mode ? 'ATIVADO' : 'DESATIVADO';
        return reply(MESSAGES.owner.bot_config.antipv.statusUnchanged(cmd, currentStatus));
      }

      await optimizer.saveJsonWithCache(dbPath, antipvData);

      const status = antipvData.mode ? 'ativado' : 'desativado';
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
      let antipvData = await optimizer.loadJsonWithCache(dbPath, { mode: null, message: MESSAGES.permission.groupOnly });
      
      antipvData.message = q.trim();
      await optimizer.saveJsonWithCache(dbPath, antipvData);
      
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
        if (fs.existsSync(path.join(midiasDir, 'menu.jpg'))) fs.unlinkSync(path.join(midiasDir, 'menu.jpg'));
        if (fs.existsSync(path.join(midiasDir, 'menu.mp4'))) fs.unlinkSync(path.join(midiasDir, 'menu.mp4'));
        
        const buffer = await getFileBuffer(mediaInfo.media, mediaInfo.type);
        fs.mkdirSync(midiasDir, { recursive: true });
        fs.writeFileSync(path.join(midiasDir, `menu.${isVideo2 ? 'mp4' : 'jpg'}`), buffer);
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
        if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
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
        fs.mkdirSync(path.dirname(audioPath), { recursive: true });
        fs.writeFileSync(audioPath, audioBuffer);
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
