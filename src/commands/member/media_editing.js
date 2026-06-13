import { execFile } from 'child_process';
import pathz from 'path';
import fs from 'fs';
import { downloadContentFromMessage } from 'baileys';

export default {
  name: "media_editing",
  description: "Ferramentas de edição de áudio e vídeo",
  commands: [
    "cortaraudio", "cutaudio", "velocidade", "speed", "reversobn", "reversebn", 
    "bassbn", "bassboostbn", "normalizar", "normalize", "cortarvideo", 
    "cortarvid", "cutvideo"
  ],
  handle: async ({ 
    reply, command, isMedia, info, bot, from, q, args, prefix, type, audioEdit, getFileBuffer,
    MESSAGES
  }) => {
    const cmd = command.toLowerCase();

    // Comandos de Áudio
    if (['cortaraudio', 'cutaudio', 'velocidade', 'speed', 'reversobn', 'reversebn', 'bassbn', 'bassboostbn', 'normalizar', 'normalize'].includes(cmd)) {
      if (!audioEdit) return reply(MESSAGES.member.media_editing.audioDisabled);
      
      const quotedMsg = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const hasAudio = type === 'audioMessage' || quotedMsg?.audioMessage;
      
      if (!hasAudio) return reply(MESSAGES.member.media_editing.requireAudio);
      
      try {
        const mediaMsg = quotedMsg?.audioMessage || info.message?.audioMessage;
        let audioBuffer;
        try {
          const bufferStream = await downloadContentFromMessage(mediaMsg, 'audio');
          const chunks = [];
          for await (const chunk of bufferStream) chunks.push(chunk);
          audioBuffer = Buffer.concat(chunks);
        } catch (downloadErr) {
          audioBuffer = await getFileBuffer(mediaMsg, 'audio');
        }
        
        let result;
        
        if (['cortaraudio', 'cutaudio'].includes(cmd)) {
          const start = args[0];
          const end = args[1];
          if (!start || !end) return reply(MESSAGES.member.media_editing.cutAudioUsage(prefix, cmd));
          result = await audioEdit.cutAudio(audioBuffer, start, end, prefix);
        } 
        else if (['velocidade', 'speed'].includes(cmd)) {
          const vel = parseFloat(args[0]);
          if (isNaN(vel) || vel < 0.5 || vel > 3) return reply(MESSAGES.member.media_editing.speedUsage(prefix, cmd));
          result = await audioEdit.changeSpeed(audioBuffer, vel);
        }
        else if (['reversobn', 'reversebn'].includes(cmd)) {
          result = await audioEdit.reverseAudio(audioBuffer);
        }
        else if (['bassbn', 'bassboostbn'].includes(cmd)) {
          const levelBass = parseInt(args[0]) || 10;
          if (levelBass < 1 || levelBass > 20) return reply(MESSAGES.member.media_editing.bassUsage(prefix, cmd));
          result = await audioEdit.bassBoost(audioBuffer, levelBass);
        }
        else if (['normalizar', 'normalize'].includes(cmd)) {
          result = await audioEdit.normalizeAudio(audioBuffer);
        }

        if (result.success) {
          await bot.sendMessage(from, { audio: result.buffer, mimetype: 'audio/mpeg', ptt: false }, { quoted: info });
        } else {
          return reply(result.message);
        }
      } catch (e) {
        console.error(`Erro no ${cmd}:`, e);
        return reply(MESSAGES.error.general);
      }
      return;
    }

    // Comandos de Vídeo
    if (['cortarvideo', 'cortarvid', 'cutvideo'].includes(cmd)) {
      const quotedMsgVideo = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const hasVideo = type === 'videoMessage' || quotedMsgVideo?.videoMessage;
      
      if (!hasVideo) return reply(MESSAGES.member.media_editing.requireVideo);
      
      const inicioVid = args[0];
      const fimVid = args[1];
      if (!inicioVid || !fimVid) {
        return reply(MESSAGES.member.media_editing.cutVideoUsage(prefix, cmd));
      }
      
      await reply(MESSAGES.member.media_editing.cuttingVideo);
      
      try {
        const encmediaVideo = quotedMsgVideo?.videoMessage || info.message?.videoMessage;
        const tempId = Math.random().toString(36).substring(7);
        const raneVideoCut = pathz.join(process.cwd(), `dados/database/tmp/${tempId}.mp4`);
        const ranVideoCut = pathz.join(process.cwd(), `dados/database/tmp/${tempId}_cut.mp4`);
        
        const buffimgVideo = await getFileBuffer(encmediaVideo, 'video');
        fs.writeFileSync(raneVideoCut, buffimgVideo);
        
        const ffmpegArgs = ['-y', '-ss', inicioVid, '-i', raneVideoCut, '-to', fimVid, '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-c:a', 'aac', '-b:a', '128k', ranVideoCut];
        
        execFile('ffmpeg', ffmpegArgs, async (err) => {
          if (fs.existsSync(raneVideoCut)) fs.unlinkSync(raneVideoCut);
          
          if (err) {
            console.error('FFMPEG Error (Cortar Vídeo):', err);
            return reply(MESSAGES.error.general);
          }
          
          if (fs.existsSync(ranVideoCut)) {
            const bufferVideo = fs.readFileSync(ranVideoCut);
            await bot.sendMessage(from, { video: bufferVideo, mimetype: 'video/mp4' }, { quoted: info });
            fs.unlinkSync(ranVideoCut);
          }
        });
      } catch (e) {
        console.error('Erro ao cortar vídeo:', e);
        return reply(MESSAGES.error.general);
      }
    }
  }
};
