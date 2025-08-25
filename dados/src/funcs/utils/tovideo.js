const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

async function tovideo(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    // Se for webp animado, converte normalmente; se for imagem, faz um vídeo curto
    const cmd = inputPath.endsWith('.webp')
      ? `ffmpeg -y -i "${inputPath}" -movflags faststart -pix_fmt yuv420p -vf "scale=512:512:flags=lanczos" "${outputPath}"`
      : `ffmpeg -y -loop 1 -i "${inputPath}" -c:v libx264 -t 3 -pix_fmt yuv420p -vf "scale=512:512,format=yuv420p" "${outputPath}"`;

    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        return reject(stderr || error.message);
      }
      // Confirma se o arquivo foi criado
      fs.access(outputPath, fs.constants.F_OK, (err) => {
        if (err) return reject('Falha ao criar vídeo');
        resolve(outputPath);
      });
    });
  });
}

module.exports = { tovideo };