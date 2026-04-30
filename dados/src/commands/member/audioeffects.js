import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PREFIX } from "../../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "audioeffects",
  description: "Aplica efeitos em áudios",
  commands: [
    'speedup', 'boyvoice', 'vozmenino', 'womenvoice', 'vozmulher', 'manvoice', 'vozhomem', 
    'childvoice', 'vozcrianca', 'vozeco', 'eco', 'slowvoice', 'vozlenta', 'audiolento', 
    'fastvoice', 'vozrapida', 'audiorapido', 'cavevoice', 'vozcaverna', 'bass', 'bass2', 
    'bass3', 'volumeboost', 'aumentarvolume', 'reverb', 'overdrive', 'equalizer', 'equalizar', 
    'reverse', 'audioreverso', 'pitch', 'flanger', 'grave', 'vozgrave', 'chorus', 'phaser', 
    'tremolo', 'vibrato', 'lowpass'
  ],
  usage: `${PREFIX}speedup (responda a um áudio)`,
  handle: async ({  
    nazu, 
    from, 
    info, 
    reply, 
    isMedia, 
    isQuotedAudio, 
    getFileBuffer, 
    command 
  , MESSAGES }) => {
    try {
      if (isMedia && !info.message.imageMessage && !info.message.videoMessage || isQuotedAudio) {
        const audioEffects = {
          speedup: 'atempo=1.06,asetrate=44100*1.25',
          boyvoice: 'atempo=1.06,asetrate=44100*1.25',
          vozmenino: 'atempo=1.06,asetrate=44100*1.25',
          womenvoice: 'asetrate=44100*1.25,atempo=0.8',
          vozmulher: 'asetrate=44100*1.25,atempo=0.8',
          manvoice: 'asetrate=44100*0.8,atempo=1.2',
          vozhomem: 'asetrate=44100*0.8,atempo=1.2',
          childvoice: 'asetrate=44100*1.4,atempo=0.9',
          vozcrianca: 'asetrate=44100*1.4,atempo=0.9',
          vozeco: 'aecho=0.8:0.88:60:0.4',
          eco: 'aecho=0.8:0.88:60:0.4',
          slowvoice: 'atempo=0.6',
          vozlenta: 'atempo=0.6',
          audiolento: 'atempo=0.6',
          fastvoice: 'atempo=1.5',
          vozrapida: 'atempo=1.5',
          audiorapido: 'atempo=1.5',
          cavevoice: 'aecho=0.6:0.3:1000:0.5',
          vozcaverna: 'aecho=0.6:0.3:1000:0.5',
          bass: 'bass=g=5',
          bass2: 'bass=g=10',
          bass3: 'bass=g=15',
          volumeboost: 'volume=1.5',
          aumentarvolume: 'volume=1.5',
          reverb: 'aecho=0.8:0.88:60:0.4',
          drive: 'afftdn=nf=-25',
          equalizer: 'equalizer=f=100:width_type=h:width=200:g=3,equalizer=f=1000:width_type=h:width=200:g=-1,equalizer=f=10000:width_type=h:width=200:g=4',
          equalizar: 'equalizer=f=100:width_type=h:width=200:g=3,equalizer=f=1000:width_type=h:width=200:g=-1,equalizer=f=10000:width_type=h:width=200:g=4',
          reverse: 'areverse',
          audioreverso: 'areverse',
          pitch: 'asetrate=44100*0.8',
          flanger: 'flanger',
          grave: 'atempo=0.9,asetrate=44100',
          vozgrave: 'atempo=0.9,asetrate=44100',
          chorus: 'chorus=0.7:0.9:55:0.4:0.25:2',
          phaser: 'aphaser=type=t:decay=0.4',
          tremolo: 'tremolo=f=6:d=0.8',
          vibrato: 'vibrato=f=6',
          lowpass: 'lowpass=f=500'
        };

        const muk = isQuotedAudio ? info.message.extendedTextMessage.contextInfo.quotedMessage.audioMessage : info.message.audioMessage;
        await reply('🎵 Processando áudio... Por favor, aguarde alguns segundos.');
        
        const rane = path.join(__dirname, `../../database/tmp/${Math.random()}.mp3`);
        const buffimg = await getFileBuffer(muk, 'audio');
        fs.writeFileSync(rane, buffimg);
        
        const gem = rane;
        const ran = path.join(__dirname, `../../database/tmp/${Math.random()}.mp3`);
        const effect = audioEffects[command];

        exec(`ffmpeg -i "${gem}" -filter:a "${effect}" "${ran}"`, async (err) => {
          if (fs.existsSync(gem)) fs.unlinkSync(gem);
          if (err) {
            console.error(`FFMPEG Error (Audio Effect ${command}):`, err);
            return reply(MESSAGES.error.general);
          }
          
          if (fs.existsSync(ran)) {
            const hah = fs.readFileSync(ran);
            await nazu.sendMessage(from, {
              audio: hah,
              mimetype: 'audio/mpeg'
            }, {
              quoted: info
            });
            fs.unlinkSync(ran);
          }
        });
      } else {
        reply(" Para aplicar este efeito de áudio, responda a uma mensagem que contenha um áudio.");
      }
    } catch (e) {
      console.error(e);
      await reply(MESSAGES.error.internal);
    }
  },
};
