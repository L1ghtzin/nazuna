import fs from 'fs';
import pathz from 'path';

export async function sendMenuWithMedia({
  bot,
  from,
  info,
  prefix,
  pushname,
  isGroup,
  nomebot,
  getGroupCustomization,
  isGroupCustomizationEnabled,
  getMenuDesignWithDefaults,
  getMenuLerMaisText,
  isMenuAudioEnabled,
  getMenuAudioPath,
  menuFunction
}) {
  let customBotName = nomebot;
  let customMediaPath = null;

  if (isGroup && isGroupCustomizationEnabled()) {
    const groupCustom = getGroupCustomization(from);
    if (groupCustom) {
      if (groupCustom.customName) customBotName = groupCustom.customName;
      if (groupCustom.customPhoto && fs.existsSync(groupCustom.customPhoto)) {
        customMediaPath = groupCustom.customPhoto;
      }
    }
  }

  let mediaPath;
  let useVideo;
  let mediaBuffer;

  if (customMediaPath) {
    mediaPath = customMediaPath;
    useVideo = false;
    mediaBuffer = fs.readFileSync(mediaPath);
  } else {
    const menuVideoPath = pathz.join(process.cwd(), 'dados/midias/menu.mp4');
    const menuImagePath = pathz.join(process.cwd(), 'dados/midias/menu.jpg');
    useVideo = fs.existsSync(menuVideoPath);
    mediaPath = useVideo ? menuVideoPath : menuImagePath;
    mediaBuffer = fs.readFileSync(mediaPath);
  }

  const customDesign = getMenuDesignWithDefaults(customBotName, pushname, prefix);
  const menuText = await menuFunction(prefix, customBotName, pushname, customDesign);
  const lerMaisPrefix = getMenuLerMaisText();

  if (isMenuAudioEnabled()) {
    const audioPath = getMenuAudioPath();
    if (audioPath && fs.existsSync(audioPath)) {
      const audioBuffer = fs.readFileSync(audioPath);
      await bot.sendMessage(from, { audio: audioBuffer, mimetype: 'audio/mpeg', ptt: false }, { quoted: info });
    }
  }

  await bot.sendMessage(from, {
    [useVideo ? 'video' : 'image']: mediaBuffer,
    caption: lerMaisPrefix + menuText,
    gifPlayback: useVideo,
    mimetype: useVideo ? 'video/mp4' : 'image/jpeg'
  }, { quoted: info });
}
