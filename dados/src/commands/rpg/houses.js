import { PREFIX } from "../../config.js";

export default {
  name: "casa",
  description: "Sistema de moradia e propriedades",
  commands: ["casa", "house"],
  usage: `${PREFIX}casa`,
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
    if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
    if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);
    
    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);
    
    const houses = {
      'barraca': { name: 'Barraca', price: 5000, income: 100, emoji: '⛺', storage: 50 },
      'cabana': { name: 'Cabana', price: 25000, income: 500, emoji: '🛖', storage: 200 },
      'casa': { name: 'Casa Comum', price: 100000, income: 2500, emoji: '🏠', storage: 1000 },
      'mansao': { name: 'Mansão', price: 500000, income: 10000, emoji: '🏰', storage: 5000 },
      'castelo': { name: 'Castelo', price: 2000000, income: 50000, emoji: '🏰👑', storage: 25000 }
    };

    if (!me.house) me.house = { type: null, lastCollect: 0, decorations: [] };

    // --- VER CASA ---
    if (!args[0]) {
      if (!me.house.type) return reply(`🏠 Você mora na rua! Use ${prefix}comprarcasa para mudar isso.`);
      
      const myHouse = houses[me.house.type];
      let text = `╭━━━⊱ ${myHouse.emoji} *SUA PROPRIEDADE* ⊱━━━╮\n`;
      text += `│ Tipo: ${myHouse.name}\n`;
      text += `│ Renda: ${myHouse.income.toLocaleString()}/dia\n`;
      text += `│ Baú: ${myHouse.storage} itens\n`;
      text += `╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      text += `💡 Use ${prefix}coletarrenda para ganhar moedas`;
      return reply(text);
    }

    // --- COMPRAR ---
    if (args[0] === 'comprar') {
      const type = args[1]?.toLowerCase();
      const house = houses[type];
      if (!house) return reply(`💔 Casa não encontrada!`);
      
      if (me.wallet < house.price) return reply(`💰 Você precisa de ${house.price.toLocaleString()}!`);
      
      me.wallet -= house.price;
      me.house.type = type;
      me.house.lastCollect = Date.now();
      
      saveEconomy(econ);
      return reply(`🎉 Parabéns! Você comprou uma *${house.name}*! ${house.emoji}`);
    }

    // --- COLETAR ---
    if (args[0] === 'coletar' || command === 'coletarrenda') {
      if (!me.house.type) return reply(`💔 Você não tem uma casa!`);
      
      const now = Date.now();
      const diff = now - me.house.lastCollect;
      if (diff < 86400000) {
        const hours = Math.floor((86400000 - diff) / 3600000);
        const mins = Math.floor(((86400000 - diff) % 3600000) / 60000);
        return reply(`⏰ Próxima coleta em: ${hours}h ${mins}min`);
      }
      
      const house = houses[me.house.type];
      me.wallet += house.income;
      me.house.lastCollect = now;
      
      saveEconomy(econ);
      return reply(`💰 *RENDA COLETADA*\n\n${house.emoji} +${house.income.toLocaleString()} moedas`);
    }
  }
};
