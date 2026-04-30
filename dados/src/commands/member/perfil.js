import { PREFIX } from "../../config.js";

export default {
  name: "perfil",
  description: "Exibe o perfil completo do usuário",
  commands: ["perfil"],
  usage: `${PREFIX}perfil [@user]`,
  handle: async ({ 
    nazu, 
    from, 
    info, 
    reply, 
    sender, 
    pushname, 
    getUserName,
    MESSAGES
  }) => {
    try {
      let target = sender;
      let mentionedUser = null;
      
      if (info.message?.extendedTextMessage?.contextInfo?.mentionedJid && info.message.extendedTextMessage.contextInfo.mentionedJid.length > 0) {
        mentionedUser = info.message.extendedTextMessage.contextInfo.mentionedJid[0];
      } else if (info.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        mentionedUser = info.message.extendedTextMessage.contextInfo.participant;
      }
      
      target = mentionedUser || sender;
      const targetId = getUserName(target);
      const targetName = `@${targetId}`;
      
      const seed = target.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      
      const levels = {
        puta: Math.floor(((Math.sin(seed * 1) * 50 + 50)) % 101),
        gado: Math.floor(((Math.cos(seed * 2) * 50 + 50)) % 101),
        corno: Math.floor(((Math.tan(seed * 3) * 50 + 50)) % 101),
        sortudo: Math.floor(((Math.sin(seed * 4) * 50 + 50)) % 101),
        carisma: Math.floor(((Math.cos(seed * 5) * 50 + 50)) % 101),
        rico: Math.floor(((Math.tan(seed * 6) * 50 + 50)) % 101),
        gostosa: Math.floor(((Math.sin(seed * 7) * 50 + 50)) % 101),
        feio: Math.floor(((Math.cos(seed * 8) * 50 + 50)) % 101)
      };
      
      const pacoteValue = `R$ ${(Math.random() * 10000 + 1).toFixed(2).replace('.', ',')}`;
      
      const hora = new Date().getHours();
      let humors = ['😎 Tranquilão', '🔥 No fogo', '😴 Sonolento', '🤓 Nerd mode', '😜 Loucura total', '🧘 Zen'];
      
      if (hora < 6) humors = ['🌙 Vampirão', '🦉 Corujão', '👻 Assombrado', '🌃 Notívago', '🧛 Drácula'];
      else if (hora < 12) humors = ['☀️ Radiante', '🌅 Matinal', '💪 Disposto', '🥱 Sonolento', '🍳 Café da manhã'];
      else if (hora < 18) humors = ['😎 Tranquilão', '💼 Produtivo', '🍃 Relax', '🤔 Pensativo', '🎯 Focado'];
      else humors = ['🌆 Nostálgico', '🍻 Festivo', '📺 Preguiçoso', '🎮 Gamer', '🍿 Cinéfilo'];
      
      const randomHumor = humors[Math.floor(Math.random() * humors.length)];
      
      let profilePic = 'https://raw.githubusercontent.com/nazuninha/uploads/main/outros/1747053564257_bzswae.bin';
      try {
        profilePic = await nazu.profilePictureUrl(target, 'image');
      } catch (error) {}
      
      let bio = 'Sem bio disponível';
      let bioSetAt = '';
      try {
        const statusData = await nazu.fetchStatus(target);
        if (statusData?.[0]?.status) {
          bio = statusData[0].status;
          bioSetAt = new Date(statusData[0].setAt).toLocaleString('pt-BR', {
            dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo'
          });
        }
      } catch (error) {}
      
      const createProgressBar = (percent, size = 10) => {
        const filled = Math.min(size, Math.max(0, Math.round((percent / 100) * size)));
        return '▰'.repeat(filled) + '▱'.repeat(size - filled);
      };
      
      const getEmoji = (value, type) => {
        const emojis = {
          puta: [ [80, '🔥🔥'], [50, '🔥'], [20, '💨'], [0, '😇'] ],
          gado: [ [80, '🐂🐂'], [50, '🐂'], [20, '🐄'], [0, '🐑'] ],
          corno: [ [80, 'DeerDeer'], [50, 'Deer'], [20, '🎄'], [0, '🌿'] ],
          sortudo: [ [80, '🍀'], [50, '🍀'], [20, '🎲'], [0, '🎰'] ],
          carisma: [ [80, '✨✨'], [50, '✨'], [20, '⭐'], [0, '🌟'] ],
          rico: [ [80, '💰💰'], [50, '💰'], [20, '💸'], [0, '💵'] ],
          gostosa: [ [80, '🥵🥵'], [50, '🥵'], [20, '😏'], [0, '👀'] ],
          feio: [ [80, '👹👹'], [50, '👹'], [20, '👺'], [0, '👽'] ]
        };
        const set = emojis[type] || [];
        for (const [limit, emoji] of set) { if (value >= limit) return emoji; }
        return '▪️';
      };
      
      const perfilText = `*📋 Perfil completo de ${targetName} 📋*

👤 *Nome*: ${pushname || 'Desconhecido'}
📱 *Número*: ${targetId}
📜 *Bio*: ${bio}${bioSetAt ? `\n🕒 *Bio atualizada em*: ${bioSetAt}` : ''}
💰 *Valor do Pacote*: ${pacoteValue} 🫦
😊 *Humor*: ${randomHumor}

🎭 *Níveis*:
  ${getEmoji(levels.puta, 'puta')} ┃ Puta: ${levels.puta}% ${createProgressBar(levels.puta)}
  ${getEmoji(levels.gado, 'gado')} ┃ Gado: ${levels.gado}% ${createProgressBar(levels.gado)}
  ${getEmoji(levels.corno, 'corno')} ┃ Corno: ${levels.corno}% ${createProgressBar(levels.corno)}
  ${getEmoji(levels.sortudo, 'sortudo')} ┃ Sorte: ${levels.sortudo}% ${createProgressBar(levels.sortudo)}
  ${getEmoji(levels.carisma, 'carisma')} ┃ Carisma: ${levels.carisma}% ${createProgressBar(levels.carisma)}
  ${getEmoji(levels.rico, 'rico')} ┃ Rico: ${levels.rico}% ${createProgressBar(levels.rico)}
  ${getEmoji(levels.gostosa, 'gostosa')} ┃ Gostosa: ${levels.gostosa}% ${createProgressBar(levels.gostosa)}
  ${getEmoji(levels.feio, 'feio')} ┃ Feio: ${levels.feio}% ${createProgressBar(levels.feio)}`.trim();
      
      await nazu.sendMessage(from, { 
        image: { url: profilePic }, 
        caption: perfilText, 
        mentions: [target] 
      }, { quoted: info });
      
    } catch (error) {
      console.error('Erro ao processar comando perfil:', error);
      await reply('Ocorreu um erro ao gerar o perfil 💔');
    }
  },
};
