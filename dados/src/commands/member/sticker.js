import axios from 'axios';
import fs from 'fs';
import pathz from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = pathz.dirname(__filename);

export default {
  name: "sticker",
  description: "Comandos de figurinhas e stickers",
  commands: ["attp", "brat", "bratvid", "emojimix", "figualeatoria", "figurinhas", "mudarpack", "packfig", "qc", "randomsticker", "rename", "renomear", "rgtake", "s", "s2", "st", "st2", "sticker", "sticker2", "stickerpack", "stk", "stk2", "take", "ttp"],
  handle: async ({ 
    nazu, from, info, command, q, reply, prefix, pushname,
    sendSticker, getFileBuffer, isQuotedSticker, isQuotedImage, isQuotedVideo,
    isImage, isVideo, nomebot, sender, USERS_DIR, optimizer, isGroup,
    MESSAGES
  }) => {
    const cmd = command.toLowerCase();

    // ═══════════════════════════════════════════════════════════════
    // 🎨 BRAT / BRATVID
    // ═══════════════════════════════════════════════════════════════
    if (['brat', 'bratvid'].includes(cmd)) {
      if (!q) return reply(MESSAGES.error.noText);
      const isAnimated = cmd === 'bratvid';
      const url = `https://api.siputzx.my.id/api/m/brat?text=${encodeURIComponent(q)}&isAnimated=${isAnimated}`;
      await reply(MESSAGES.general.wait);
      try {
        const buffer = await axios.get(url, { responseType: 'arraybuffer' }).then(res => Buffer.from(res.data));
        return await sendSticker(nazu, from, { sticker: buffer, pack: nomebot, author: pushname });
      } catch (e) {
        return reply(MESSAGES.error.general);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 🤡 EMOJIMIX
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'emojimix') {
      if (!q) return reply("Cade os emojis? 💔");
      const url = `https://api.siputzx.my.id/api/m/emojimix?emo=${encodeURIComponent(q)}`;
      try {
        const buffer = await axios.get(url, { responseType: 'arraybuffer' }).then(res => Buffer.from(res.data));
        return await sendSticker(nazu, from, { sticker: buffer, pack: nomebot, author: pushname });
      } catch (e) {
        return reply(MESSAGES.error.general);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 💬 QUOTELY (QC)
    // ═══════════════════════════════════════════════════════════════
    if (cmd === 'qc') {
      if (!q) return reply("Cade o texto? 💔");
      const url = `https://api.siputzx.my.id/api/m/quotely?text=${encodeURIComponent(q)}&name=${encodeURIComponent(pushname)}`;
      try {
        const buffer = await axios.get(url, { responseType: 'arraybuffer' }).then(res => Buffer.from(res.data));
        return await sendSticker(nazu, from, { sticker: buffer, pack: nomebot, author: pushname });
      } catch (e) {
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
        
        if (!boij && !boij2) return reply(`Marque uma imagem ou um vídeo de até 9.9 segundos para fazer figurinha, com o comando: ${prefix + command} (mencionando a mídia)`);
        
        const isVideo2 = !!boij;
        if (isVideo2 && boij.seconds > 9.9) return reply(`O vídeo precisa ter no máximo 9.9 segundos para ser convertido em figurinha.`);
        
        const buffer = await getFileBuffer(isVideo2 ? boij : boij2, isVideo2 ? 'video' : 'image');
        
        const isS2 = ['s2', 'sticker2', 'st2', 'stk2'].includes(cmd);
        
        await sendSticker(nazu, from, {
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
        await nazu.sendMessage(from, {
          sticker: { url: `https://raw.githubusercontent.com/badDevelopper/Testfigu/main/fig (${Math.floor(Math.random() * 8051)}).webp` }
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
        if (!isQuotedSticker) return reply('Você usou de forma errada... Marque uma figurinha.');
        let author = "";
        let packname = "";
        if (!q) return reply(`Formato errado, utilize:\n${prefix}${command} Autor/Pack\nEx: ${prefix}${command} By:/Hiudy`);
        
        if (q.includes("/")) {
          author = q.split("/")[0] || "";
          packname = q.split("/")[1] || "";
        } else {
          packname = q;
          author = "";
        }
        if (!packname) return reply(`Formato errado, utilize:\n${prefix}${command} Autor/Pack\nEx: ${prefix}${command} By:/Hiudy`);
        
        const encmediats = await getFileBuffer(info.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage, 'sticker');
        await sendSticker(nazu, from, {
          sticker: `data:image/jpeg;base64,${encmediats.toString('base64')}`,
          author: packname,
          packname: author,
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
        if (!q) return reply(`Formato errado, utilize:\n${prefix}${command} Autor/Pack\nEx: ${prefix}${command} By:/Hiudy`);
        
        if (q.includes("/")) {
          author = q.split("/")[0] || "";
          pack = q.split("/")[1] || "";
        } else {
          pack = q;
          author = "";
        }
        if (!pack) return reply(`Formato errado, utilize:\n${prefix}${command} Autor/Pack\nEx: ${prefix}${command} By:/Hiudy`);
        
        const filePath = pathz.join(USERS_DIR, 'take.json');
        const dataTake = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf-8')) : {};
        dataTake[sender] = { author, pack };
        fs.writeFileSync(filePath, JSON.stringify(dataTake, null, 2), 'utf-8');
        reply(`Autor e pacote salvos com sucesso!\nAutor: ${author || "(vazio)"}\nPacote: ${pack}`);
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
        if (!isQuotedSticker) return reply('Você usou de forma errada... Marque uma figurinha.');
        const filePath = pathz.join(USERS_DIR, 'take.json');
        if (!fs.existsSync(filePath)) return reply('Nenhum autor e pacote salvos. Use o comando *rgtake* primeiro.');
        const dataTake = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (!dataTake[sender]) return reply('Você não tem autor e pacote salvos. Use o comando *rgtake* primeiro.');
        
        const { author, pack } = dataTake[sender];
        const encmediats = await getFileBuffer(info.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage, 'sticker');
        
        await sendSticker(nazu, from, {
          sticker: `data:image/jpeg;base64,${encmediats.toString('base64')}`,
          author: pack,
          packname: author,
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
        if (!q) return reply(`🎨 *Gerador de Figurinhas*\n\n🔢 *Como usar:*\n• Escolha quantas figurinhas deseja (1-15)\n• Ex: ${prefix}figurinhas 10\n• Ex: ${prefix}figurinhas 5\n\n✨ As figurinhas serão enviadas uma por uma!\n${isGroup ? '📬 *Nota:* Em grupos, as figurinhas serão enviadas no seu privado!' : ''}`);
        
        const quantidade = parseInt(q);
        if (isNaN(quantidade) || quantidade < 1 || quantidade > 15) return reply(`💔 Número inválido! Escolha entre 1 e 15 figurinhas.`);
        
        const destino = isGroup ? sender : from;
        await reply(isGroup ? `📬 Enviando ${quantidade} figurinha${quantidade > 1 ? 's' : ''} no seu privado...\n⏳ Aguarde um momento!` : `🎨 Enviando ${quantidade} figurinha${quantidade > 1 ? 's' : ''}...\n⏳ Aguarde um momento!`);
        
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
            
            await nazu.sendMessage(destino, { sticker: Buffer.from(stickerResponse.data) });
            successCount++;
            await new Promise(resolve => setTimeout(resolve, 800));
          } catch (stickerError) {
            console.error(`Erro ao enviar figurinha ${i + 1}:`, stickerError.message);
            failCount++;
          }
        }
        
        await nazu.sendMessage(destino, { text: `✅ Pronto!\n\n📊 *Resultado:*\n• Enviadas: ${successCount} figurinha${successCount !== 1 ? 's' : ''}\n${failCount > 0 ? `• Falhas: ${failCount}\n` : ''}` });
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
      try {
        if (!q) return reply('Cadê o texto?');
        
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
        
        const tempDir = pathz.join(__dirname, '../midias/temp_attp_' + Date.now());
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        
        await reply('⏳ Gerando sticker animado... aguarde!');
        
        const numFrames = 18;
        const downloadPromises = [];
        
        for (let i = 0; i < numFrames; i++) {
          const cor = cores[i % cores.length];
          const imageUrl = `https://huratera.sirv.com/PicsArt_08-01-10.00.42.png?profile=Example-Text&text.0.text=${encodeURIComponent(processedText)}&text.0.outline.color=000000&text.0.outline.blur=0&text.0.outline.opacity=55&text.0.color=${cor}&text.0.font.family=${fonteEscolhida}&text.0.font.weight=bold&text.0.background.color=ff0000`;
          const imagePath = pathz.join(tempDir, `frame_${String(i).padStart(3, '0')}.png`);
          
          downloadPromises.push(
            axios({ url: imageUrl, method: 'GET', responseType: 'arraybuffer' }).then(response => {
              fs.writeFileSync(imagePath, response.data);
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
        
        await sendSticker(nazu, from, {
          sticker: fs.readFileSync(outputWebp),
          author: pushname,
          packname: nomebot, 
          type: 'image'
        }, { quoted: info });
        
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (cleanupError) {}
      } catch (e) {
        console.error(e);
        await reply(MESSAGES.error.general);
      }
      return;
    }
  }
};
