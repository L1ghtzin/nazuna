import { exec } from 'child_process';
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
    reply, command, isMedia, info, nazu, from, q, args, prefix, type, audioEdit, getFileBuffer,
    MESSAGES
  }) => {
    const cmd = command.toLowerCase();

    // Comandos de Áudio
    if (['cortaraudio', 'cutaudio', 'velocidade', 'speed', 'reversobn', 'reversebn', 'bassbn', 'bassboostbn', 'normalizar', 'normalize'].includes(cmd)) {
      if (!audioEdit) return reply(`💔 Sistema de edição de áudio temporariamente indisponível.`);
      
      const quotedMsg = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const hasAudio = type === 'audioMessage' || quotedMsg?.audioMessage;
      
      if (!hasAudio) return reply(`💔 Responda a um áudio para usar este comando!`);
      
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
          if (!start || !end) return reply(`💔 Informe início e fim!\n\nUso: ${prefix}${cmd} <inicio> <fim>\nExemplo: ${prefix}${cmd} 0:10 0:30`);
          result = await audioEdit.cutAudio(audioBuffer, start, end, prefix);
        } 
        else if (['velocidade', 'speed'].includes(cmd)) {
          const vel = parseFloat(args[0]);
          if (isNaN(vel) || vel < 0.5 || vel > 3) return reply(`💔 Velocidade inválida!\n\nUso: ${prefix}${cmd} <0.5-3.0>\nExemplo: ${prefix}${cmd} 1.5`);
          result = await audioEdit.changeSpeed(audioBuffer, vel);
        }
        else if (['reversobn', 'reversebn'].includes(cmd)) {
          result = await audioEdit.reverseAudio(audioBuffer);
        }
        else if (['bassbn', 'bassboostbn'].includes(cmd)) {
          const levelBass = parseInt(args[0]) || 10;
          if (levelBass < 1 || levelBass > 20) return reply(`💔 Nível de bass inválido!\n\nUso: ${prefix}${cmd} <1-20>\nExemplo: ${prefix}${cmd} 15`);
          result = await audioEdit.bassBoost(audioBuffer, levelBass);
        }
        else if (['normalizar', 'normalize'].includes(cmd)) {
          result = await audioEdit.normalizeAudio(audioBuffer);
        }

        if (result.success) {
          await nazu.sendMessage(from, { audio: result.buffer, mimetype: 'audio/mpeg', ptt: false }, { quoted: info });
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
      
      if (!hasVideo) return reply(`💔 Responda a um vídeo para cortar!`);
      
      const inicioVid = args[0];
      const fimVid = args[1];
      if (!inicioVid || !fimVid) {
        return reply(`💔 Informe início e fim!\n\nUso: ${prefix}${cmd} <inicio> <fim>\nExemplo: ${prefix}${cmd} 0:10 0:30`);
      }
      
      await reply('🎬 Cortando vídeo... Por favor, aguarde alguns segundos.');
      
      try {
        const encmediaVideo = quotedMsgVideo?.videoMessage || info.message?.videoMessage;
        const tempId = Math.random().toString(36).substring(7);
        const raneVideoCut = pathz.join(process.cwd(), `dados/database/tmp/${tempId}.mp4`);
        const ranVideoCut = pathz.join(process.cwd(), `dados/database/tmp/${tempId}_cut.mp4`);
        
        const buffimgVideo = await getFileBuffer(encmediaVideo, 'video');
        fs.writeFileSync(raneVideoCut, buffimgVideo);
        
        // Recodifica o vídeo para garantir cortes perfeitos com ffmpeg
        const ffmpegCmd = `ffmpeg -y -ss ${inicioVid} -i "${raneVideoCut}" -to ${fimVid} -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k "${ranVideoCut}"`;
        
        exec(ffmpegCmd, async (err) => {
          if (fs.existsSync(raneVideoCut)) fs.unlinkSync(raneVideoCut);
          
          if (err) {
            console.error('FFMPEG Error (Cortar Vídeo):', err);
            return reply(MESSAGES.error.general);
          }
          
          if (fs.existsSync(ranVideoCut)) {
            const bufferVideo = fs.readFileSync(ranVideoCut);
            await nazu.sendMessage(from, { video: bufferVideo, mimetype: 'video/mp4' }, { quoted: info });
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
