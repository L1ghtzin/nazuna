import fs from 'fs';
import pathz from 'path';

export default {
  name: "menu",
  description: "Menus e guias do bot",
  commands: ["admmenu", "alteradores", "changers", "changersmenu", "comandos", "commands", "downloadmenu", "downmenu", "ferramentas", "gamemenu", "help", "membermenu", "membmenu", "menu", "menuadm", "menuadmin", "menuadmins", "menualterador", "menualteradores", "menubn", "menubrincadeira", "menubrincadeiras", "menudono", "menudown", "menudownload", "menudownloads", "menuferramenta", "menuferramentas", "menufig", "menugeral", "menulogo", "menulogos", "menumemb", "menumembros", "menusticker", "ownermenu", "stickermenu", "tools", "toolsmenu"],
  handle: async ({ 
    nazu, from, info, command, reply, prefix, pushname, isGroup,
    nomebot, menus, getGroupCustomization, isGroupCustomizationEnabled,
    getMenuDesignWithDefaults, getMenuLerMaisText, isMenuAudioEnabled,
    getMenuAudioPath, isOwner
  , MESSAGES }) => {
    const cmd = command.toLowerCase();
    
    // Função local para simplificar envio dos sub-menus
    const sendMenuWithMedia = async (menuType, menuFunction) => {
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
      
      let mediaPath, useVideo, mediaBuffer;
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
          await nazu.sendMessage(from, { audio: audioBuffer, mimetype: 'audio/mpeg', ptt: false }, { quoted: info });
        }
      }
      
      await nazu.sendMessage(from, {
        [useVideo ? 'video' : 'image']: mediaBuffer,
        caption: lerMaisPrefix + menuText,
        gifPlayback: useVideo,
        mimetype: useVideo ? 'video/mp4' : 'image/jpeg'
      }, { quoted: info });
    };

    try {
      if (['menu', 'help', 'comandos', 'commands'].includes(cmd)) {
        await sendMenuWithMedia('principal', menus.menu);
      }
      else if (['alteradores', 'menualterador', 'menualteradores', 'changersmenu', 'changers'].includes(cmd)) {
        await sendMenuWithMedia('alteradores', menus.menuAlterador);
      }
      else if (['menulogo', 'menulogos'].includes(cmd)) {
        await sendMenuWithMedia('logos', menus.menuLogos);
      }
      else if (['menubn', 'menubrincadeira', 'menubrincadeiras', 'gamemenu'].includes(cmd)) {
        await sendMenuWithMedia('brincadeiras', menus.menubn);
      }
      else if (['menudown', 'menudownload', 'menudownloads', 'downmenu', 'downloadmenu'].includes(cmd)) {
        await sendMenuWithMedia('downloads', menus.menudown);
      }
      else if (['ferramentas', 'menuferramentas', 'menuferramenta', 'toolsmenu', 'tools'].includes(cmd)) {
        await sendMenuWithMedia('ferramentas', menus.menuFerramentas);
      }
      else if (['menuadm', 'menuadmin', 'menuadmins', 'admmenu'].includes(cmd)) {
        await sendMenuWithMedia('admin', menus.menuadm);
      }
      else if (['menumembros', 'menumemb', 'menugeral', 'membmenu', 'membermenu'].includes(cmd)) {
        await sendMenuWithMedia('membros', menus.menuMembros);
      }
      else if (['menudono', 'ownermenu'].includes(cmd)) {
        if (!isOwner) return reply(MESSAGES.permission.ownerOnly);
        await sendMenuWithMedia('dono', menus.menuDono);
      }
      else if (['stickermenu', 'menusticker', 'menufig'].includes(cmd)) {
        await sendMenuWithMedia('stickers', menus.menuSticker);
      }
    } catch (e) {
      console.error('Erro ao enviar menu:', e);
      reply(MESSAGES.error.general);
    }
  }
};
