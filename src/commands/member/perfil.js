

export default {
  name: "perfil",
  description: "Exibe o perfil completo do usuário",
  commands: ["perfil"],
  usage: "{prefix}perfil [@user]",
  handle: async ({ 
    bot, 
    from, 
    info, 
    reply, 
    sender, 
    pushname, 
    getUserName,
    MESSAGES
  }) => {
    // Captura os dados síncronos necessários antes do fire-and-forget
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
      puta: Math.floor(Math.abs(Math.sin(seed * 1)) * 100),
      gado: Math.floor(Math.abs(Math.cos(seed * 2)) * 100),
      corno: Math.floor(Math.abs(Math.tan(seed * 3) % 1) * 100),
      sortudo: Math.floor(Math.abs(Math.sin(seed * 4)) * 100),
      carisma: Math.floor(Math.abs(Math.cos(seed * 5)) * 100),
      rico: Math.floor(Math.abs(Math.tan(seed * 6) % 1) * 100),
      gostosa: Math.floor(Math.abs(Math.sin(seed * 7)) * 100),
      feio: Math.floor(Math.abs(Math.cos(seed * 8)) * 100)
    };
    
    const pacoteValue = `R$ ${(Math.random() * 10000 + 1).toFixed(2).replace('.', ',')}`;
    
    const hora = new Date().getHours();
    let humors = ['😎 Tranquilão', '🔥 No fogo', '😴 Sonolento', '🤓 Nerd mode', '😜 Loucura total', '🧘 Zen'];
    
    if (hora < 6) humors = ['🌙 Vampirão', '🦉 Corujão', '👻 Assombrado', '🌃 Notívago', '🧛 Drácula'];
    else if (hora < 12) humors = ['☀️ Radiante', '🌅 Matinal', '💪 Disposto', '🥱 Sonolento', '🍳 Café da manhã'];
    else if (hora < 18) humors = ['😎 Tranquilão', '💼 Produtivo', '🍃 Relax', '🤔 Pensativo', '🎯 Focado'];
    else humors = ['🌆 Nostálgico', '🍻 Festivo', '📺 Preguiçoso', '🎮 Gamer', '🍿 Cinéfilo'];
    
    const randomHumor = humors[Math.floor(Math.random() * humors.length)];

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
    
    const emojis = {
      puta: getEmoji(levels.puta, 'puta'),
      gado: getEmoji(levels.gado, 'gado'),
      corno: getEmoji(levels.corno, 'corno'),
      sortudo: getEmoji(levels.sortudo, 'sortudo'),
      carisma: getEmoji(levels.carisma, 'carisma'),
      rico: getEmoji(levels.rico, 'rico'),
      gostosa: getEmoji(levels.gostosa, 'gostosa'),
      feio: getEmoji(levels.feio, 'feio')
    };
    
    const bars = {
      puta: createProgressBar(levels.puta),
      gado: createProgressBar(levels.gado),
      corno: createProgressBar(levels.corno),
      sortudo: createProgressBar(levels.sortudo),
      carisma: createProgressBar(levels.carisma),
      rico: createProgressBar(levels.rico),
      gostosa: createProgressBar(levels.gostosa),
      feio: createProgressBar(levels.feio)
    };

    // Fire-and-forget: libera a fila de mensagens imediatamente
    // A parte pesada (rede) roda em background sem bloquear outros comandos
    (async () => {
      try {
        const defaultProfilePic = 'https://raw.githubusercontent.com/nazuninha/uploads/main/outros/1747053564257_bzswae.bin';

        const fetchWithTimeout = (promise, timeoutMs) => {
          return Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs))
          ]);
        };

        const downloadImageBuffer = async (url) => {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return Buffer.from(await response.arrayBuffer());
        };

        // Pipeline: profilePicUrl → download encadeados, fetchStatus em paralelo
        // Tempo total = max(picUrl + download, fetchStatus) ao invés de picUrl + fetchStatus + download
        const imagePromise = fetchWithTimeout(bot.profilePictureUrl(target, 'image'), 3000)
          .then(url => url || defaultProfilePic)
          .catch(() => defaultProfilePic)
          .then(url => fetchWithTimeout(downloadImageBuffer(url), 6000))
          .catch(() => fetchWithTimeout(downloadImageBuffer(defaultProfilePic), 6000));

        const bioPromise = fetchWithTimeout(bot.fetchStatus(target), 3000).catch(() => null);

        const [imageBuffer, statusData] = await Promise.all([imagePromise, bioPromise]);

        let bio = 'Sem bio disponível';
        let bioSetAt = '';
        if (statusData) {
          let statusStr = '';
          let setAtDate = null;
          
          if (typeof statusData === 'string') {
            statusStr = statusData;
          } else if (Array.isArray(statusData)) {
            statusStr = statusData[0]?.status;
            setAtDate = statusData[0]?.setAt;
          } else if (typeof statusData === 'object') {
            statusStr = statusData.status;
            setAtDate = statusData.setAt;
          }
          
          if (typeof statusStr === 'object' && statusStr !== null) {
            statusStr = statusStr.text || statusStr.status || JSON.stringify(statusStr);
          }
          
          if (statusStr && String(statusStr).trim() !== '' && statusStr !== '[object Object]') {
            bio = String(statusStr).trim();
          }
          
          if (setAtDate) {
            const dateObj = new Date(setAtDate);
            if (!isNaN(dateObj.getTime())) {
              bioSetAt = dateObj.toLocaleString('pt-BR', {
                dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo'
              });
            }
          }
        }

        const bioSetAtStr = bioSetAt ? `\n🕒 *Bio atualizada em*: ${bioSetAt}` : '';
        const perfilText = MESSAGES.member.perfil.text(targetName, pushname || 'Desconhecido', targetId, bio, bioSetAtStr, pacoteValue, randomHumor, emojis, levels, bars);

        await bot.sendMessage(from, { 
          image: imageBuffer, 
          caption: perfilText, 
          mentions: [target] 
        }, { quoted: info });

      } catch (error) {
        console.error('Erro ao processar comando perfil:', error);
        await reply(MESSAGES.error.general).catch(() => {});
      }
    })();
  },
};
