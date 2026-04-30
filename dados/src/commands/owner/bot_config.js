import fs from 'fs';
import path from 'path';

export default {
  name: "bot_config",
  description: "Configurações globais do bot e do sistema",
  // REMOVIDOS: addxp, delxp, level, leveling, dayfree para que não interceptem o bot_config!
  commands: ["activate", "ajuda", "antipv", "antipv2", "antipv3", "antipv4", "antipvmessage", "antipvmsg", "ativar", "audiomenu", "configcmdnotfound", "deactivate", "desativar", "entrar", "fotomenu", "guia", "list", "lista", "mediamenu", "menuaudio", "midiamenu", "off", "on", "sairgp", "setcmdmsg", "setmenuaudio", "tutorial", "videomenu"],
  handle: async ({ 
    nazu, from, info, command, reply, isOwner, q, args, prefix, OWNER_ONLY_MESSAGE,
    MESSAGES, optimizer, isImage, isQuotedImage, isVideo, isQuotedVideo, getFileBuffer,
    isAudio, isQuotedAudio, setMenuAudio, removeMenuAudio, DATABASE_DIR, pathz
  }) => {
    if (!isOwner) return reply(OWNER_ONLY_MESSAGE);
    const cmd = command.toLowerCase();

    // --- ANTIPV ---
    if (['antipv', 'antipv2', 'antipv3', 'antipv4'].includes(cmd)) {
      const dbPath = pathz.join(DATABASE_DIR, 'antipv.json');
      let antipvData = await optimizer.loadJsonWithCache(dbPath, { mode: null, message: '🚫 Este comando só funciona em grupos!' });

      const arg0 = args[0] ? args[0].toLowerCase() : '';
      if (arg0 === '1' || arg0 === 'on') {
        antipvData.mode = cmd;
      } else if (arg0 === '0' || arg0 === 'off') {
        antipvData.mode = null;
      } else {
        antipvData.mode = antipvData.mode === cmd ? null : cmd;
      }
      
      await optimizer.saveJsonWithCache(dbPath, antipvData);

      const status = antipvData.mode ? 'ativado' : 'desativado';
      let infoMsg = 'O bot responde normalmente no privado.';
      if (antipvData.mode === 'antipv') infoMsg = 'O bot agora ignora mensagens no privado, bloqueia e envia o aviso.';
      if (antipvData.mode === 'antipv2') infoMsg = 'O bot responde apenas a comandos no privado.';
      if (antipvData.mode === 'antipv3') infoMsg = 'O bot ignora mensagens silenciosamente no privado.';
      if (antipvData.mode === 'antipv4') infoMsg = 'O bot bloqueia automaticamente os usuários no privado e envia aviso.';
      
      return reply(`✅ *Anti-PV (${cmd.toUpperCase()})*: ${status.toUpperCase()}\n\n💡 ${infoMsg}`);
    }

    if (cmd === 'antipvmessage' || cmd === 'antipvmsg') {
      if (!q) return reply(`Por favor, forneça a nova mensagem para o antipv. Exemplo: ${prefix}antipvmessage Comandos no privado estão desativados!`);
      const dbPath = pathz.join(DATABASE_DIR, 'antipv.json');
      let antipvData = await optimizer.loadJsonWithCache(dbPath, { mode: null, message: '🚫 Este comando só funciona em grupos!' });
      
      antipvData.message = q.trim();
      await optimizer.saveJsonWithCache(dbPath, antipvData);
      
      return reply(`✅ Mensagem do antipv atualizada para: "${antipvData.message}"`);
    }

    // --- MENU MEDIA (FOTO/VIDEO) ---
    if (['fotomenu', 'videomenu', 'mediamenu', 'midiamenu'].includes(cmd)) {
      const midiasDir = path.resolve('./dados/midias');
      try {
        var RSM = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        var boij2 = RSM?.imageMessage || info.message?.imageMessage || RSM?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessage?.message?.imageMessage || RSM?.viewOnceMessage?.message?.imageMessage;
        var boij = RSM?.videoMessage || info.message?.videoMessage || RSM?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessage?.message?.videoMessage || RSM?.viewOnceMessage?.message?.videoMessage;
        
        if (!boij && !boij2) return reply(`Marque uma imagem ou um vídeo, com o comando: ${prefix + command} (mencionando a mídia)`);
        
        var isVideo2 = !!boij;
        if (fs.existsSync(path.join(midiasDir, 'menu.jpg'))) fs.unlinkSync(path.join(midiasDir, 'menu.jpg'));
        if (fs.existsSync(path.join(midiasDir, 'menu.mp4'))) fs.unlinkSync(path.join(midiasDir, 'menu.mp4'));
        
        var buffer = await getFileBuffer(isVideo2 ? boij : boij2, isVideo2 ? 'video' : 'image');
        fs.mkdirSync(midiasDir, { recursive: true });
        fs.writeFileSync(path.join(midiasDir, `menu.${isVideo2 ? 'mp4' : 'jpg'}`), buffer);
        return reply('✅ Mídia do menu atualizada com sucesso.');
      } catch (e) {
        console.error(e);
        return reply("Ocorreu um erro 💔");
      }
    }

    // --- MENU AUDIO ---
    if (['audiomenu', 'menuaudio', 'setmenuaudio'].includes(cmd)) {
      if (q && ['off', 'del', 'delete', 'remover'].includes(q.toLowerCase())) {
        if (typeof removeMenuAudio === 'function') removeMenuAudio();
        const audioPath = path.resolve('./dados/midias/menu_audio.mp3');
        if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        return reply("✅ Áudio do menu removido com sucesso!\n\nO menu voltará a ser enviado sem áudio.");
      }
      
      const RSMAudio = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const audioMsg = RSMAudio?.audioMessage || info.message?.audioMessage;
      
      if (!audioMsg) {
        return reply(`❌ *Envie ou marque um áudio* com o comando: ${prefix}${command}\n\n🎵 Este áudio será enviado junto com o menu principal.\n\n💡 Para remover depois, use: ${prefix}${command} off`);
      }
      
      try {
        const audioBuffer = await getFileBuffer(audioMsg, 'audio');
        const audioPath = path.resolve('./dados/midias/menu_audio.mp3');
        fs.mkdirSync(path.dirname(audioPath), { recursive: true });
        fs.writeFileSync(audioPath, audioBuffer);
        if (typeof setMenuAudio === 'function') setMenuAudio(audioPath);
        
        return reply('✅ *Áudio do menu configurado com sucesso!*\n\n🎵 O áudio será enviado junto com o menu principal.\n\n💡 Para remover, use: ' + prefix + command + ' off');
      } catch (e) {
        console.error(e);
        return reply("❌ Ocorreu um erro ao configurar o áudio do menu 💔");
      }
    }

    // --- MISC ---
    if (cmd === 'entrar') {
      if (!q) return reply('Informe o link do grupo.');
      return nazu.groupAcceptInvite(q.split('chat.whatsapp.com/')[1]).then(() => reply('✅ Entrando...')).catch(() => reply(`💔 Link inválido.`));
    }
    if (cmd === 'sairgp') {
      await reply('👋 Saindo do grupo...');
      return nazu.groupLeave(from);
    }
  }
};
