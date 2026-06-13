import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "interacao",
  description: "Comandos de interação (brincadeiras) entre os membros",
  commands: ["chute", "chutar", "tapa", "soco", "socar", "beijo", "beijar", "beijob", "beijarb", "abraco", "abracar", "mata", "matar", "tapar", "goza", "gozar", "mamar", "mamada", "cafune", "morder", "mordida", "lamber", "lambida", "explodir", "sexo", "tomate", "fonfon", "piupiu", "pegarpau", "apalpar"],
  usage: `${global.prefix}chute @usuário`,
  handle: async ({  bot, reply, isGroup, command, menc_os2, prefix, info, getUserName, from, isModoLite, isModoBn , MESSAGES }) => {
    try {
      const comandosImpróprios = ['sexo', 'surubao', 'goza', 'gozar', 'mamar', 'mamada', 'beijob', 'beijarb', 'tapar'];
      
      if (isModoLite && comandosImpróprios.includes(command)) {
        return bot.react('❌', { key: info.key });
      }
      
      if (!isGroup) return reply(MESSAGES.permission.groupOnly);
      if (!isModoBn) return reply(`💔 O modo brincadeira não está ativo nesse grupo.`);
      
      if (!menc_os2) return reply(MESSAGES.error.missing('alguém'));
      
      const gamesPath = path.join(__dirname, '../../funcs/json/games.json');
      const markgamePath = path.join(__dirname, '../../funcs/json/markgame.json');

      let gamesData = fs.existsSync(gamesPath) 
        ? JSON.parse(fs.readFileSync(gamesPath)) 
        : { games2: {} };
        
      let GamezinData = fs.existsSync(markgamePath) 
        ? JSON.parse(fs.readFileSync(markgamePath)) 
        : {};
        
      let gameResponse = GamezinData[command];
      if (Array.isArray(gameResponse)) {
        gameResponse = gameResponse[Math.floor(Math.random() * gameResponse.length)];
      }

      let responseText = gameResponse?.replaceAll('#nome#', `@${getUserName(menc_os2)}`) 
        || `Você acabou de dar um(a) ${command} no(a) @${getUserName(menc_os2)}`;
        
      let media = gamesData.games2?.[command];
      
      if (media?.image) {
        await bot.sendMessage(from, {
          image: media.image,
          caption: responseText,
          mentions: [menc_os2]
        });
      } else if (media?.video) {
        await bot.sendMessage(from, {
          video: media.video,
          caption: responseText,
          mentions: [menc_os2],
          gifPlayback: true
        });
      } else {
        await bot.sendMessage(from, {
          text: responseText,
          mentions: [menc_os2]
        });
      }
    } catch (e) {
      console.error(e);
      await reply(MESSAGES.error.general);
    }
  }
};
