const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const webp = require('node-webpmux');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');

const generateTempFileName = (extension) => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    const tmpDir = path.join(__dirname, '../../../database/tmp');
    if (!fsSync.existsSync(tmpDir)) fsSync.mkdirSync(tmpDir, { recursive: true });
    return path.join(tmpDir, `${timestamp}_${random}.${extension}`);
};

async function getBuffer(url) {
    const { data } = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(data);
}

async function getVideoDuration(inputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(inputPath, (err, metadata) => {
            if (err) return reject(err);
            resolve(metadata.format.duration);
        });
    });
}

async function convertToWebp(media, isVideo = false, forceSquare = false) {
    const tmpFileOut = generateTempFileName('webp');
    const tmpFileIn = generateTempFileName(isVideo ? 'mp4' : 'jpg');

    await fs.writeFile(tmpFileIn, media);

    let scaleOption;
    if (forceSquare) {
        scaleOption = "scale=320:320,fps=15";
    } else {
        scaleOption = "scale='min(320,iw)':'min(320,ih)':force_original_aspect_ratio=decrease,pad=320:320:(ow-iw)/2:(oh-ih)/2:color=white@0.0,fps=15";
    }

    let outputOptions = [
        "-vcodec", "libwebp",
        "-vf", scaleOption,
        "-loop", "0",
        "-pix_fmt", "yuva420p",
        "-lossless", "0",
        "-compression_level", "6"
    ];

    if (isVideo) {
        const duration = await getVideoDuration(tmpFileIn);
        if (!duration) throw new Error("Não foi possível obter duração do vídeo");

        const targetSizeBytes = 900000;
        const targetBitrate = Math.floor((targetSizeBytes * 8) / duration);
        outputOptions.push("-b:v", `${targetBitrate}`);
    } else {
        outputOptions.push("-quality", "50");
    }

    await new Promise((resolve, reject) => {
        ffmpeg(tmpFileIn)
            .addOutputOptions(outputOptions)
            .toFormat("webp")
            .on("error", reject)
            .on("end", resolve)
            .save(tmpFileOut);
    });

    const buff = await fs.readFile(tmpFileOut);

    if (buff.length > 1000000) {
        console.warn(`Arquivo gerado tem ${buff.length} bytes (>1MB). Considere reduzir qualidade.`);
    }

    await fs.unlink(tmpFileIn).catch(() => {});
    await fs.unlink(tmpFileOut).catch(() => {});
    return buff;
}

async function writeExif(media, metadata, isVideo = false, rename = false, forceSquare = false) {
    const wMedia = rename ? media : await convertToWebp(media, isVideo, forceSquare);
    const tmpFileIn = generateTempFileName('webp');
    const tmpFileOut = generateTempFileName('webp');

    await fs.writeFile(tmpFileIn, wMedia);

    try {
        if (metadata.packname || metadata.author) {
            const img = new webp.Image();
            const json = {
                "sticker-pack-id": `https://github.com/hiudyy`,
                "sticker-pack-name": metadata.packname,
                "sticker-pack-publisher": metadata.author,
                "emojis": ["NazuninhaBot"]
            };
            const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
            const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8");
            const exif = Buffer.concat([exifAttr, jsonBuff]);
            exif.writeUIntLE(jsonBuff.length, 14, 4);

            await img.load(tmpFileIn);
            img.exif = exif;
            await img.save(tmpFileOut);
        } else {
            await fs.copyFile(tmpFileIn, tmpFileOut);
        }
    } catch (err) {
        console.error("Erro ao processar EXIF:", err);
        await fs.copyFile(tmpFileIn, tmpFileOut);
    }

    const buff = await fs.readFile(tmpFileOut);

    await fs.unlink(tmpFileIn).catch(() => {});
    await fs.unlink(tmpFileOut).catch(() => {});
    return buff;
}

const sendSticker = async (nazu, jid, { sticker: path, type = 'image', packname = '', author = '', rename = false, forceSquare = false }, { quoted } = {}) => {
    if (!['image', 'video'].includes(type)) {
        throw new Error('O tipo de mídia deve ser "image" ou "video".');
    }

    let buff;
    if (Buffer.isBuffer(path)) {
        buff = path;
    } else if (/^data:.*?\/.*?;base64,/i.test(path)) {
        buff = Buffer.from(path.split(',')[1], 'base64');
    } else if (fsSync.existsSync(path)) {
        buff = fsSync.readFileSync(path);
    } else if (path.url) {
        buff = await getBuffer(path.url);
    } else {
        buff = Buffer.alloc(0);
    }

    let buffer;
    if (packname || author) {
        buffer = await writeExif(buff, { packname, author }, type === 'video', rename, forceSquare);
    } else {
        buffer = await convertToWebp(buff, type === 'video', forceSquare);
    }

    await nazu.sendMessage(jid, { sticker: buffer, ...(packname || author ? { packname, author } : {}) }, { quoted });
    return buffer;
};

module.exports = {
    sendSticker
};