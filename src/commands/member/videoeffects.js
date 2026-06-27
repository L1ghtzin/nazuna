import { execFile } from 'child_process';
import { promisify } from 'util';
import fsp from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execFileAsync = promisify(execFile);


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "videoeffects",
  description: "Aplica efeitos em vídeos",
  commands: ["espelhar", "fastvid", "mirror", "pretoebranco", "reversevid", "rotacionar", "rotate", "sepia", "slowvid", "tomp3", "videobw", "videolento", "videoloop", "videomudo", "videorapido", "videoreverso", "videoslow"],
  usage: "{prefix}videorapido (responda a um vídeo)",
  handle: async ({  
    bot, 
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
        await reply(MESSAGES.member.videoeffects.processing);
        
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

        const inputFile = path.join(__dirname, `../../../dados/database/tmp/${Math.random()}.mp4`);
        const mediaBuffer = await getFileBuffer(encmedia, 'video');
        await fsp.writeFile(inputFile, mediaBuffer);
        
        const outputExt = command === 'tomp3' ? '.mp3' : '.mp4';
        const outputFile = path.join(__dirname, `../../../dados/database/tmp/${Math.random()}${outputExt}`);
        
        let ffmpegArgs;
        if (command === 'tomp3') {
          ffmpegArgs = ['-i', inputFile, '-q:a', '0', '-map', 'a', outputFile];
        } else if (command === 'videoloop') {
          ffmpegArgs = ['-stream_loop', '2', '-i', inputFile, '-c', 'copy', outputFile];
        } else if (command === 'videomudo') {
          ffmpegArgs = ['-i', inputFile, '-an', outputFile];
        } else {
          const effect = videoEffects[command];
          if (['sepia', 'espelhar', 'rotacionar', 'zoom', 'videobw', 'pretoebranco'].includes(command)) {
            ffmpegArgs = ['-i', inputFile, '-vf', effect, outputFile];
          } else {
            ffmpegArgs = ['-i', inputFile, '-filter_complex', effect, '-map', '[v]', '-map', '[a]', outputFile];
          }
        }

        try {
          await execFileAsync('ffmpeg', ffmpegArgs);
        } catch (ffmpegError) {
          console.error(`FFMPEG Error (Video Effect ${command}):`, ffmpegError);
          await fsp.unlink(inputFile).catch(() => {});
          return reply(MESSAGES.error.general);
        }

        await fsp.unlink(inputFile).catch(() => {});
        
        const outputBuffer = await fsp.readFile(outputFile);
        const messageType = command === 'tomp3' ? {
          audio: outputBuffer,
          mimetype: 'audio/mpeg'
        } : {
          video: outputBuffer,
          mimetype: 'video/mp4'
        };
        
        await bot.sendMessage(from, messageType, { quoted: info });
        await fsp.unlink(outputFile).catch(() => {});
      } else {
        reply(command === 'tomp3' ? MESSAGES.member.videoeffects.missingToMp3 : MESSAGES.member.videoeffects.missingEffect);
      }
    } catch (e) {
      console.error(e);
      await reply(MESSAGES.error.general);
    }
  },
};
