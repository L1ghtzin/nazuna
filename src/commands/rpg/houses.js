export default {
  name: "casa",
  description: "Sistema de moradia e propriedades",
  commands: ["casa", "house", "coletarrenda"],
  usage: "{prefix}casa",
  handle: async ({ 
    reply, 
    isGroup, 
    groupData, 
    sender, 
    prefix, 
    pushname, 
    command,
    args,
    loadEconomy, 
    saveEconomy, 
    getEcoUser,
    MESSAGES
  }) => {
    if (!isGroup) return reply(MESSAGES.rpg.groupOnly);
    if (!groupData.modorpg) return reply(MESSAGES.rpg.disabled(prefix));
    
    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);
    
    const casas = {
      'barraca': { emoji: '⛺', name: 'Barraca', price: 5000, bonus: { storage: 10, regen: 1 }, renda: 100 },
      'cabana': { emoji: '🏚️', name: 'Cabana de Madeira', price: 25000, bonus: { storage: 25, regen: 2 }, renda: 500 },
      'casa': { emoji: '🏠', name: 'Casa Simples', price: 100000, bonus: { storage: 50, regen: 3 }, renda: 2000 },
      'mansao': { emoji: '🏰', name: 'Mansão', price: 500000, bonus: { storage: 100, regen: 5 }, renda: 10000 },
      'castelo': { emoji: '🏯', name: 'Castelo', price: 2000000, bonus: { storage: 200, regen: 10 }, renda: 50000 }
    };

    const decoracoes = {
      'altar': { emoji: '⛩️', name: 'Altar Místico', price: 10000, bonus: 'xp', value: 10 },
      'bau': { emoji: '📦', name: 'Baú Reforçado', price: 15000, bonus: 'storage', value: 20 },
      'jardim': { emoji: '🌸', name: 'Jardim Encantado', price: 20000, bonus: 'regen', value: 2 },
      'forja': { emoji: '🔥', name: 'Forja Caseira', price: 30000, bonus: 'craft', value: 15 },
      'biblioteca': { emoji: '📚', name: 'Biblioteca', price: 25000, bonus: 'xp', value: 15 }
    };

    if (!me.house) {
      me.house = { type: null, decorations: [], lastCollect: 0 };
    }
    
    // Default to 'ver' if it's the alias coletarrenda or empty args
    const sub = command === 'coletarrenda' ? 'coletar' : (args[0]?.toLowerCase() || 'ver');

    // Ver informações da casa
    if (sub === 'ver') {
      let text = `╭━━━⊱ 🏠 *SUA CASA* ⊱━━━╮\n\n`;

      if (me.house.type) {
        const casa = casas[me.house.type];
        text += `${casa.emoji} *${casa.name}*\n\n`;
        text += `📦 Armazenamento: +${casa.bonus.storage}\n`;
        text += `💚 Regeneração: +${casa.bonus.regen}/h\n`;
        text += `💰 Renda passiva: ${casa.renda}/dia\n\n`;

        if (me.house.decorations && me.house.decorations.length > 0) {
          text += `🎨 *Decorações:*\n`;
          me.house.decorations.forEach(d => {
            const dec = decoracoes[d];
            if (dec) text += `• ${dec.emoji} ${dec.name}\n`;
          });
        }

        text += `\n💡 *Comandos:*\n`;
        text += `• ${prefix}casa coletar - Coletar renda\n`;
        text += `• ${prefix}casa decorar <item>\n`;
      } else {
        text += `${MESSAGES.rpg.house.noHouse}\n\n`;
        text += `🏘️ *CASAS DISPONÍVEIS:*\n\n`;
        for (const [id, data] of Object.entries(casas)) {
          text += `${data.emoji} *${data.name}*\n`;
          text += `   💰 ${data.price.toLocaleString()} | 📦 +${data.bonus.storage}\n\n`;
        }
        text += `💡 Use: ${prefix}casa comprar <tipo>`;
      }

      return reply(text);
    }

    // Comprar casa
    if (sub === 'comprar') {
      const tipo = args[1]?.toLowerCase();
      if (!tipo || !casas[tipo]) {
        return reply(MESSAGES.rpg.house.invalidType);
      }

      const casa = casas[tipo];
      if (me.wallet < casa.price) {
        return reply(MESSAGES.rpg.house.insufficientFunds(casa.price.toLocaleString(), casa.name));
      }

      me.wallet -= casa.price;
      me.house.type = tipo;
      me.house.lastCollect = Date.now();

      saveEconomy(econ);
      return reply(MESSAGES.rpg.house.bought(casa.emoji, casa.name, casa.bonus.storage, casa.renda));
    }

    // Coletar renda
    if (sub === 'coletar') {
      if (!me.house.type) return reply(MESSAGES.rpg.house.noHouse);

      const casa = casas[me.house.type];
      const agora = Date.now();
      const tempoPassado = agora - me.house.lastCollect;
      const diasPassados = Math.floor(tempoPassado / 86400000);

      if (diasPassados < 1) {
        const tempoRestante = 86400000 - tempoPassado;
        const horas = Math.floor(tempoRestante / 3600000);
        const minutos = Math.floor((tempoRestante % 3600000) / 60000);
        return reply(MESSAGES.rpg.house.cooldownCollect(horas, minutos));
      }

      const rendaTotal = Math.min(diasPassados, 7) * casa.renda; // Máximo 7 dias acumulados
      me.wallet += rendaTotal;
      me.house.lastCollect = agora;

      saveEconomy(econ);
      return reply(MESSAGES.rpg.house.collected(casa.emoji, casa.name, rendaTotal.toLocaleString(), Math.min(diasPassados, 7)));
    }

    // Decorar
    if (sub === 'decorar') {
      if (!me.house.type) return reply(MESSAGES.rpg.house.noHouse);

      const decId = args[1]?.toLowerCase();
      if (!decId) {
        let text = `🎨 *DECORAÇÕES DISPONÍVEIS*\n\n`;
        for (const [id, data] of Object.entries(decoracoes)) {
          const owned = (me.house.decorations || []).includes(id) ? '✅' : '';
          text += `${data.emoji} *${data.name}* ${owned}\n`;
          text += `   💰 ${data.price.toLocaleString()} | +${data.value} ${data.bonus}\n\n`;
        }
        text += `💡 Use: ${prefix}casa decorar <nome>`;
        return reply(text);
      }

      if (!decoracoes[decId]) return reply(MESSAGES.rpg.house.invalidDecor);
      
      if (!me.house.decorations) me.house.decorations = [];
      if (me.house.decorations.includes(decId)) return reply(MESSAGES.rpg.house.decorAlreadyOwned);

      const dec = decoracoes[decId];
      if (me.wallet < dec.price) return reply(MESSAGES.rpg.house.decorCost(dec.price.toLocaleString()));

      me.wallet -= dec.price;
      me.house.decorations.push(decId);

      saveEconomy(econ);
      return reply(MESSAGES.rpg.house.decorAdded(dec.emoji, dec.name, dec.value, dec.bonus));
    }

    return reply(MESSAGES.rpg.house.usageInfo(prefix));
  }
};
