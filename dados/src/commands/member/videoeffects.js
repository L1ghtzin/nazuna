import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PREFIX } from "../../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "videoeffects",
  description: "Aplica efeitos em vídeos",
  commands: ["espelhar", "fastvid", "glitch", "mirror", "pretoebranco", "reversevid", "rotacionar", "rotate", "sepia", "slowvid", "tomp3", "videobw", "videolento", "videoloop", "videomudo", "videorapido", "videoreverso", "videoslow"],
  usage: `${PREFIX}videorapido (responda a um vídeo)`,
  handle: async ({  
    nazu, 
    from, 
    info, 
    reply, 
    isMedia, 
    isQuotedVideo, 
    getFileBuffer, 
    command 
  , MESSAGES }) => {
    try {
      if (isMedia && info.message.videoMessage || isQuotedVideo) {
        const encmedia = isQuotedVideo ? info.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage : info.message.videoMessage;
        await reply('🎬 Processando vídeo... Por favor, aguarde alguns segundos.');
        
        const videoEffects = {
          videorapido: '[0:v]setpts=0.5*PTS[v];[0:a]atempo=2[a]',
          fastvid: '[0:v]setpts=0.5*PTS[v];[0:a]atempo=2[a]',
          videoslow: '[0:v]setpts=2*PTS[v];[0:a]atempo=0.5[a]',
          videolento: '[0:v]setpts=2*PTS[v];[0:a]atempo=0.5[a]',
          videoreverso: 'reverse,areverse',
          reversevid: 'reverse,areverse',
          videoloop: 'loop=2',
          videomudo: 'an',
          videobw: 'hue=s=0',
          pretoebranco: 'hue=s=0',
          tomp3: 'q:a=0 -map a',
          sepia: 'colorchannelmixer=.393:.769:.189:.349:.686:.168:.272:.534:.131',
          mirror: 'hflip',
          espelhar: 'hflip',
          rotacionar: 'rotate=90*PI/180',
          rotate: 'rotate=90*PI/180'
        };

        const rane = path.join(__dirname, `../../database/tmp/${Math.random()}.mp4`);
        const buffimg = await getFileBuffer(encmedia, 'video');
        fs.writeFileSync(rane, buffimg);
        
        const media = rane;
        const outputExt = command === 'tomp3' ? '.mp3' : '.mp4';
        const ran = path.join(__dirname, `../../database/tmp/${Math.random()}${outputExt}`);
        
        let ffmpegCmd;
        if (command === 'tomp3') {
          ffmpegCmd = `ffmpeg -i "${media}" -q:a 0 -map a "${ran}"`;
        } else if (command === 'videoloop') {
          ffmpegCmd = `ffmpeg -stream_loop 2 -i "${media}" -c copy "${ran}"`;
        } else if (command === 'videomudo') {
          ffmpegCmd = `ffmpeg -i "${media}" -an "${ran}"`;
        } else {
          const effect = videoEffects[command];
          if (['sepia', 'espelhar', 'rotacionar', 'zoom', 'glitch', 'videobw', 'pretoebranco'].includes(command)) {
            ffmpegCmd = `ffmpeg -i "${media}" -vf "${effect}" "${ran}"`;
          } else {
            ffmpegCmd = `ffmpeg -i "${media}" -filter_complex "${effect}" -map "[v]" -map "[a]" "${ran}"`;
          }
        }

        exec(ffmpegCmd, async (err) => {
          if (fs.existsSync(media)) fs.unlinkSync(media);
          if (err) {
            console.error(`FFMPEG Error (Video Effect ${command}):`, err);
            return reply(MESSAGES.error.general);
          }
          
          if (fs.existsSync(ran)) {
            const buffer453 = fs.readFileSync(ran);
            const messageType = command === 'tomp3' ? {
              audio: buffer453,
              mimetype: 'audio/mpeg'
            } : {
              video: buffer453,
              mimetype: 'video/mp4'
            };
            
            await nazu.sendMessage(from, messageType, {
              quoted: info
            });
            fs.unlinkSync(ran);
          }
        });
      } else {
        reply(command === 'tomp3' ? "🎬 Para converter vídeo para áudio, responda a uma mensagem que contenha um vídeo." : "🎬 Para aplicar este efeito de vídeo, responda a uma mensagem que contenha um vídeo.");
      }
    } catch (e) {
      console.error(e);
      await reply(MESSAGES.error.internal);
    }
  },
};
