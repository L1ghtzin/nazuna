import axios from 'axios';
import fsp from 'fs/promises';
import pathz from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { readJsonFileAsync, writeJsonFileAsync } from '../../utils/asyncFs.js';
import * as cheerio from 'cheerio';
import FormData from 'form-data';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = pathz.dirname(__filename);

async function webpToMp4(imageBuffer) {
  const bodyForm = new FormData();
  bodyForm.append('new-image-url', '');
  bodyForm.append('new-image', imageBuffer, 'image.webp');

  const response = await axios.post('https://ezgif.com/webp-to-mp4', bodyForm, {
    headers: {
      ...bodyForm.getHeaders(),
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    }
  });

  const $ = cheerio.load(response.data);
  const file = $('form.ajax-form input[name="file"]').attr('value');
  if (!file) {
    throw new Error('Não foi possível obter o arquivo temporário do Ezgif.');
  }

  const bodyFormThen = new FormData();
  bodyFormThen.append('file', file);
  bodyFormThen.append('convert', 'Convert WebP to MP4!');

  const response2 = await axios.post('https://ezgif.com/webp-to-mp4/' + file, bodyFormThen, {
    headers: {
      ...bodyFormThen.getHeaders(),
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    }
  });

  const $2 = cheerio.load(response2.data);
  const src = $2('div#output > p.outfile > video > source').attr('src');
  if (!src) {
    throw new Error('Erro ao encontrar o vídeo convertido no Ezgif.');
  }

  return 'https:' + src;
}

export default {
  name: "sticker",
  description: "Comandos de figurinhas e stickers",
  commands: ["attp", "brat", "bratvid", "emojimix", "figualeatoria", "figurinhas", "mudarpack", "packfig", "qc", "randomsticker", "rename", "renomear", "rgtake", "s", "s2", "st", "st2", "sticker", "sticker2", "stickerpack", "stk", "stk2", "take", "togif", "ttp"],
  handle: async ({ 
    bot, from, info, command, q, reply, prefix, pushname,
    sendSticker, getFileBuffer, isQuotedSticker, isQuotedImage, isQuotedVideo,
    isImage, isVideo, nomebot, sender, USERS_DIR, isGroup,
    MESSAGES, quotedMessageContent
  }) => {
    const cmd = command.toLowerCase();

    // ═══════════════════════════════════════════════════════════════
    // 🎨 BRAT / BRATVID
    // ═══════════════════════════════════════════════════════════════
    if (['brat', 'bratvid'].includes(cmd)) {
      if (!q) return reply(MESSAGES.error.missing('um texto'));
      const isAnimated = cmd === 'bratvid';
      const delay = 500;
      
      await reply(MESSAGES.general.wait);
      
      let apiUrl;
      let usedSystemZone = false;

      // Tenta a API primária (SystemZone)
      try {
        const response = await axios.get(`https://systemzone.store/api/brat?text=${encodeURIComponent(q)}${isAnimated ? '&animado=true' : ''}`);
        if (response.data && response.data.status && response.data.imagem) {
          apiUrl = response.data.imagem;
          usedSystemZone = true;
        } else {
          throw new Error('Resposta inválida do SystemZone');
        }
      } catch (e) {
        console.error('Erro na API primária do SystemZone, usando fallback Siputzx:', e.message);
      }

      // Se falhou no SystemZone ou se for bratvid (animado)
      if (!apiUrl) {
        apiUrl = `https://api.siputzx.my.id/api/m/brat?text=${encodeURIComponent(q)}&isAnimated=${isAnimated}&delay=${delay}`;
      }

      try {
        return await sendSticker(bot, from, { 
          sticker: { url: apiUrl }, 
          packname: nomebot, 
          author: pushname,
          type: (isAnimated && !usedSystemZone) ? 'video' : 'image'
        });
      } catch (e) {
        console.error('Erro no comando brat:', e);
        
        // Se usamos SystemZone e deu erro ao enviar, tentamos a Siputzx como último recurso
        if (usedSystemZone) {
          try {
            console.log('Tentando novamente com fallback Siputzx...');
            const fallbackUrl = `https://api.siputzx.my.id/api/m/brat?text=${encodeURIComponent(q)}&isAnimated=${isAnimated}&delay=${delay}`;
            return await sendSticker(bot, from, { 
              sticker: { url: fallbackUrl }, 
              packname: nomebot, 
              author: pushname,
              type: isAnimated ? 'video' : 'image'
            });
          } catch (fallbackErr) {
            console.error('Erro no fallback Siputzx:', fallbackErr);
          }
        }
        return reply(MESSAGES.error.general);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 🤡 EMOJIMIX
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'emojimix') {
      if (!q) return reply(MESSAGES.member.sticker.missingEmojis);
      const url = `https://api.siputzx.my.id/api/m/emojimix?emo=${encodeURIComponent(q)}`;
      try {
        const buffer = await axios.get(url, { responseType: 'arraybuffer' }).then(res => Buffer.from(res.data));
        return await sendSticker(bot, from, { sticker: buffer, packname: nomebot, author: pushname });
      } catch (e) {
        return reply(MESSAGES.error.general);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 💬 QUOTELY (QC)
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'qc') {
      if (!q) return reply(MESSAGES.member.sticker.missingText);
      await reply(MESSAGES.general.wait);
      try {
        let ppimg;
        try {
          ppimg = await bot.profilePictureUrl(sender, 'image');
        } catch {
          ppimg = 'https://telegra.ph/file/b5427ea4b8701bc47e751.jpg';
        }

        const json = {
          "type": "quote",
          "format": "png",
          "backgroundColor": "#1b1b1b",
          "width": 512,
          "height": 768,
          "scale": 2,
          "messages": [{
            "entities": [],
            "avatar": true,
            "from": {
              "id": 1,
              "name": pushname,
              "photo": {
                "url": ppimg
              }
            },
            "text": q,
            "replyMessage": {}
          }]
        };

        const res = await axios.post('https://cognima-quote.onrender.com/generate', json, {
          headers: { 'Content-Type': 'application/json' }
        });

        const buffer = Buffer.from(res.data.result.image, 'base64');
        return await sendSticker(bot, from, { 
          sticker: buffer, 
          packname: nomebot, 
          author: pushname 
        });
      } catch (e) {
        console.error("Erro no QC:", e);
        return reply(MESSAGES.error.general);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 📄 STICKER PADRÃO E S2
    // ═══════════════════════════════════════════════════════════════
    if (['s', 'sticker', 'st', 'stk', 's2', 'sticker2', 'st2', 'stk2'].includes(cmd)) {
      try {
        const RSM = info.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const boij2 = RSM?.imageMessage || info.message?.imageMessage || RSM?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessageV2?.message?.imageMessage || info.message?.viewOnceMessage?.message?.imageMessage || RSM?.viewOnceMessage?.message?.imageMessage;
        const boij = RSM?.videoMessage || info.message?.videoMessage || RSM?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessageV2?.message?.videoMessage || info.message?.viewOnceMessage?.message?.videoMessage || RSM?.viewOnceMessage?.message?.videoMessage;
        
        if (!boij && !boij2) return reply(MESSAGES.member.sticker.missingMedia(prefix + command));
        
        const isVideo2 = !!boij;
        if (isVideo2 && boij.seconds > 9.9) return reply(MESSAGES.member.sticker.videoTooLong);
        
        const buffer = await getFileBuffer(isVideo2 ? boij : boij2, isVideo2 ? 'video' : 'image');
        
        const isS2 = ['s2', 'sticker2', 'st2', 'stk2'].includes(cmd);
        
        await sendSticker(bot, from, {
          sticker: buffer,
          author: pushname,
          packname: nomebot, 
          type: isVideo2 ? 'video' : 'image',
          forceSquare: !isS2
        }, { quoted: info });
      } catch (e) {
        console.error(e);
        await reply(MESSAGES.error.general);
      }
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // 🎲 FIG ALEATÓRIA
    // ═══════════════════════════════════════════════════════════════
    if (['figualeatoria', 'randomsticker'].includes(cmd)) {
      try {
        await bot.sendMessage(from, {
          sticker: { url: `https://raw.githubusercontent.com/badDevelopper/Testfigu/main/fig (${Math.floor(Math.random() * 8051)}).webp` }
        }, { quoted: info });
      } catch (e) {
        console.error(e);
        await reply(MESSAGES.error.general);
      }
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // 🎞️ TO GIF
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'togif') {
      try {
        if (!isQuotedSticker) {
          return reply(MESSAGES.error.missing('uma figurinha'));
        }

        await reply(MESSAGES.general.wait);

        const stickerMsg = quotedMessageContent?.stickerMessage;
        const stickerBuffer = await getFileBuffer(stickerMsg, 'sticker');

        const videoUrl = await webpToMp4(stickerBuffer);

        await bot.sendMessage(from, { 
          video: { url: videoUrl }, 
          gifPlayback: true 
        }, { quoted: info });
      } catch (e) {
        console.error(e);
        await reply(MESSAGES.error.general);
      }
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // ✏️ RENAME
    // ═══════════════════════════════════════════════════════════════
    if (['rename', 'renomear', 'mudarpack'].includes(cmd)) {
      try {
        if (!isQuotedSticker) return reply(MESSAGES.member.sticker.missingQuotedStickerRename);
        let author = "";
        let packname = "";
        if (!q) return reply(MESSAGES.member.sticker.invalidFormatRename(prefix, command));
        
        if (q.includes("/")) {
          author = q.split("/")[0] || "";
          packname = q.split("/")[1] || "";
        } else {
          packname = q;
          author = "";
        }
        if (!packname) return reply(MESSAGES.member.sticker.invalidFormatRename(prefix, command));
        
        const encmediats = await getFileBuffer(quotedMessageContent?.stickerMessage, 'sticker');
        await sendSticker(bot, from, {
          sticker: `data:image/jpeg;base64,${encmediats.toString('base64')}`,
          author: author,
          packname: packname,
          rename: true
        }, { quoted: info });
      } catch (e) {
        console.error(e);
        await reply(MESSAGES.error.general);
      }
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // 📝 RGTAKE
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'rgtake') {
      try {
        let author = "";
        let pack = "";
        if (!q) return reply(MESSAGES.member.sticker.invalidFormatTake(prefix, command));
        
        if (q.includes("/")) {
          author = q.split("/")[0] || "";
          pack = q.split("/")[1] || "";
        } else {
          pack = q;
          author = "";
        }
        if (!pack) return reply(MESSAGES.member.sticker.invalidFormatTake(prefix, command));
        
        const filePath = pathz.join(USERS_DIR, 'take.json');
        const dataTake = await readJsonFileAsync(filePath, {});
        dataTake[sender] = { author, pack };
        await writeJsonFileAsync(filePath, dataTake);
        reply(MESSAGES.member.sticker.takeSaveSuccess(author, pack));
      } catch (e) {
        console.error(e);
        await reply(MESSAGES.error.general);
      }
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // 🏷️ TAKE
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'take') {
      try {
        if (!isQuotedSticker) return reply(MESSAGES.member.sticker.missingQuotedStickerRename);
        const filePath = pathz.join(USERS_DIR, 'take.json');
        const dataTake = await readJsonFileAsync(filePath, {});
        if (!Object.keys(dataTake).length) return reply(MESSAGES.member.sticker.takeNoSaved);
        if (!dataTake[sender]) return reply(MESSAGES.member.sticker.takeMissingSaved);
        
        const { author, pack } = dataTake[sender];
        const encmediats = await getFileBuffer(quotedMessageContent?.stickerMessage, 'sticker');
        
        await sendSticker(bot, from, {
          sticker: `data:image/jpeg;base64,${encmediats.toString('base64')}`,
          author: author,
          packname: pack,
          rename: true
        }, { quoted: info });
      } catch (e) {
        console.error(e);
        await reply(MESSAGES.error.general);
      }
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // 📦 PACKFIG / FIGURINHAS
    // ═══════════════════════════════════════════════════════════════
    if (['figurinhas', 'stickerpack', 'packfig'].includes(cmd)) {
      try {
        if (!q) return reply(MESSAGES.member.sticker.packfigUsage(prefix, isGroup));
        
        const quantidade = parseInt(q);
        if (isNaN(quantidade) || quantidade < 1 || quantidade > 15) return reply(MESSAGES.member.sticker.packfigInvalidAmount);
        
        const destino = isGroup ? sender : from;
        await reply(MESSAGES.member.sticker.packfigSending(quantidade, isGroup));
        
        const usedNumbers = new Set();
        let successCount = 0;
        let failCount = 0;
        
        for (let i = 0; i < quantidade; i++) {
          try {
            let randomNum;
            do {
              randomNum = Math.floor(Math.random() * 8051);
            } while (usedNumbers.has(randomNum));
            usedNumbers.add(randomNum);
            
            const stickerUrl = `https://raw.githubusercontent.com/badDevelopper/Testfigu/main/fig (${randomNum}).webp`;
            const stickerResponse = await axios.get(stickerUrl, { responseType: 'arraybuffer', timeout: 120000 });
            
            await bot.sendMessage(destino, { sticker: Buffer.from(stickerResponse.data) });
            successCount++;
            await new Promise(resolve => setTimeout(resolve, 800));
          } catch (stickerError) {
            console.error(`Erro ao enviar figurinha ${i + 1}:`, stickerError.message);
            failCount++;
          }
        }
        
        await bot.sendMessage(destino, { text: MESSAGES.member.sticker.packfigResult(successCount, failCount) });
      } catch (e) {
        console.error(e);
        await reply(MESSAGES.error.general);
      }
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // ✨ ATTP
    // ═══════════════════════════════════════════════════════════════
    if (['attp', 'ttp'].includes(cmd)) {
      let tempDir;
      try {
        if (!q) return reply(MESSAGES.member.sticker.attpMissingText);
        
        function breakText(text, maxCharsPerLine = 20) {
          const words = text.split(' ');
          const lines = [];
          let currentLine = '';
          for (const word of words) {
            if ((currentLine + word).length <= maxCharsPerLine) {
              currentLine += (currentLine ? ' ' : '') + word;
            } else {
              if (currentLine) lines.push(currentLine);
              currentLine = word;
            }
          }
          if (currentLine) lines.push(currentLine);
          return lines.join('%0A');
        }
        
        let processedText = q.length > 20 ? breakText(q, 20) : q;
        const cores = ["f702ff", "ff0202", "00ff2e", "efff00", "00ecff", "3100ff", "ffb400", "ff00b0", "00ff95", "9d00ff", "ff6b00", "00fff7", "ff00d4", "a8ff00", "ff0062", "00b3ff", "d4ff00", "ff009d"];
        const fontes = ["Days%20One", "Domine", "Exo", "Fredoka%20One", "Gentium%20Basic", "Gloria%20Hallelujah", "Great%20Vibes", "Orbitron", "PT%20Serif", "Pacifico"];
        const fonteEscolhida = fontes[Math.floor(Math.random() * fontes.length)];
        
        tempDir = pathz.join(__dirname, '../midias/temp_attp_' + Date.now() + '_' + Math.random().toString(36).slice(2));
        await fsp.mkdir(tempDir, { recursive: true });
        
        await reply(MESSAGES.member.sticker.attpGenerating);
        
        const numFrames = 18;
        const downloadPromises = [];
        
        for (let i = 0; i < numFrames; i++) {
          const cor = cores[i % cores.length];
          const imageUrl = `https://huratera.sirv.com/PicsArt_08-01-10.00.42.png?profile=Example-Text&text.0.text=${encodeURIComponent(processedText)}&text.0.outline.color=000000&text.0.outline.blur=0&text.0.outline.opacity=55&text.0.color=${cor}&text.0.font.family=${fonteEscolhida}&text.0.font.weight=bold&text.0.background.color=ff0000`;
          const imagePath = pathz.join(tempDir, `frame_${String(i).padStart(3, '0')}.png`);
          
          downloadPromises.push(
            axios({ url: imageUrl, method: 'GET', responseType: 'arraybuffer' }).then(async (response) => {
              await fsp.writeFile(imagePath, response.data);
            })
          );
        }
        
        await Promise.all(downloadPromises);
        
        const outputVideo = pathz.join(tempDir, 'output.mp4');
        const ffmpegCmd = `ffmpeg -framerate 10 -i ${pathz.join(tempDir, 'frame_%03d.png')} -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white" -c:v libx264 -pix_fmt yuv420p -t 2 ${outputVideo}`;
        
        await execAsync(ffmpegCmd);
        
        const outputWebp = pathz.join(tempDir, 'output.webp');
        const webpCmd = `ffmpeg -i ${outputVideo} -vcodec libwebp -filter:v fps=fps=15 -lossless 0 -compression_level 6 -q:v 50 -loop 0 -preset picture -an -vsync 0 ${outputWebp}`;
        
        await execAsync(webpCmd);
        
        const stickerBuffer = await fsp.readFile(outputWebp);
        await sendSticker(bot, from, {
          sticker: stickerBuffer,
          author: pushname,
          packname: nomebot, 
          type: 'image'
        }, { quoted: info });
        
      } catch (e) {
        console.error(e);
        await reply(MESSAGES.error.general);
      } finally {
        if (tempDir) {
          await fsp.rm(tempDir, { recursive: true, force: true }).catch(cleanupError => console.error('Error cleaning up sticker temp dir:', cleanupError));
        }
      }
      return;
    }
  }
};
