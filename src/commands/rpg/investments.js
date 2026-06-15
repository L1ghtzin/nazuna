
export default {
  name: "investir",
  description: "Sistema de investimentos e mercado financeiro",
  commands: ["invest", "investir", "sell"],
  usage: "{prefix}investir",
  handle: async ({ 
    reply, 
    isGroup, 
    groupData, 
    sender, 
    prefix, 
    command,
    pushname, 
    args,
    q,
    loadEconomy, 
    saveEconomy, 
    getEcoUser,
    parseAmount,
    MESSAGES
  }) => {
    if (!isGroup) return reply(MESSAGES.rpg.groupOnly);
    if (!groupData.modorpg) return reply(MESSAGES.rpg.disabled(prefix));
    
    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);
    
    if (!me.investments) {
      me.investments = {
        stocks: {},
        totalInvested: 0,
        totalProfit: 0,
        lastDividend: 0
      };
    }

    if (!econ.stockMarket) {
      econ.stockMarket = {
        prices: { tech: 100, gold: 50, crypto: 200, energy: 75 },
        lastUpdate: Date.now()
      };
    }

    // Atualizar preços diariamente
    const now = Date.now();
    if (now - econ.stockMarket.lastUpdate > 86400000) {
      for (const stock in econ.stockMarket.prices) {
        const change = (Math.random() - 0.5) * 20; // -10% a +10%
        econ.stockMarket.prices[stock] = Math.max(10, econ.stockMarket.prices[stock] + change);
      }
      econ.stockMarket.lastUpdate = now;
    }

    const cmd = command.toLowerCase();
    const subcommand = args[0]?.toLowerCase();

    // --- VENDER (pode ser comando direto ou subcomando de investir) ---
    if (cmd === 'sell' || ['sell', 'vender'].includes(subcommand)) {
      const isDirectSell = cmd === 'sell';
      const rawStockType = (isDirectSell ? args[0] : args[1])?.toLowerCase();

      const aliases = {
        'tecnologia': 'tech', 'tech': 'tech',
        'ouro': 'gold', 'gold': 'gold',
        'cripto': 'crypto', 'crypto': 'crypto', 'bitcoin': 'crypto', 'btc': 'crypto',
        'energia': 'energy', 'energy': 'energy'
      };
      const stockType = aliases[rawStockType];
      const have = stockType ? (me.investments.stocks[stockType] || 0) : 0;
      const amount = parseAmount(isDirectSell ? args[1] : args[2], have) || 1;

      if (isNaN(amount) || amount <= 0) {
        return reply(MESSAGES.error.invalid('quantidade'));
      }

      if (!stockType || have < amount) {
        return reply(MESSAGES.error.notEnough('ações'));
      }

      const price = Math.floor(econ.stockMarket.prices[stockType]);
      const totalValue = price * amount;

      me.investments.stocks[stockType] -= amount;
      me.wallet += totalValue;
      me.investments.totalProfit += totalValue;

      let text = `╭━━━⊱ 💵 *VENDA DE AÇÕES* 💵 ⊱━━━╮\n`;
      text += `│\n`;
      text += `│ ✅ Ações vendidas!\n│\n`;
      text += `│ 📊 Ação: ${stockType.toUpperCase()}\n`;
      text += `│ 📈 Quantidade: ${amount}\n`;
      text += `│ 💰 Recebido: ${totalValue.toLocaleString()}\n`;
      text += `│ 💼 Lucro acumulado: ${me.investments.totalProfit.toLocaleString()}\n`;
      text += `│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

      saveEconomy(econ);
      return reply(text);
    }

    // --- COMPRAR (subcomando ou padrão de investir) ---
    const aliasesForBuy = {
      'tecnologia': 'tech', 'tech': 'tech',
      'ouro': 'gold', 'gold': 'gold',
      'cripto': 'crypto', 'crypto': 'crypto', 'bitcoin': 'crypto', 'btc': 'crypto',
      'energia': 'energy', 'energy': 'energy'
    };
    
    if (args[0] === 'comprar' || (args[0] && aliasesForBuy[args[0]?.toLowerCase()])) {
      const rawStockType = (args[0] === 'comprar') ? args[1]?.toLowerCase() : args[0]?.toLowerCase();
      const stockType = aliasesForBuy[rawStockType];

      if (!stockType || !econ.stockMarket.prices[stockType]) {
        return reply(MESSAGES.rpg.invalidItem + ' Escolha: tecnologia, ouro, bitcoin, energia');
      }

      const price = Math.floor(econ.stockMarket.prices[stockType]);
      const maxAffordable = Math.floor(me.wallet / price);
      const amount = parseAmount((args[0] === 'comprar') ? args[2] : args[1], maxAffordable) || 1;

      if (isNaN(amount) || amount <= 0) {
        return reply(MESSAGES.error.invalid('quantidade'));
      }

      const totalCost = price * amount;

      if (me.wallet < totalCost) {
        return reply(`💰 Você precisa de ${totalCost.toLocaleString()} moedas!`);
      }

      me.wallet -= totalCost;
      me.investments.stocks[stockType] = (me.investments.stocks[stockType] || 0) + amount;
      me.investments.totalInvested += totalCost;

      let text = `╭━━━⊱ 💼 *INVESTIMENTO* 💼 ⊱━━━╮\n`;
      text += `│\n`;
      text += `│ ✅ Investimento realizado!\n│\n`;
      text += `│ 📊 Ação: ${stockType.toUpperCase()}\n`;
      text += `│ 📈 Quantidade: ${amount}\n`;
      text += `│ 💰 Valor: ${totalCost.toLocaleString()}\n`;
      text += `│ 💼 Total investido: ${me.investments.totalInvested.toLocaleString()}\n`;
      text += `│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

      saveEconomy(econ);
      return reply(text);
    }

    // --- VER MERCADO (Padrão) ---
    let text = `╭━━━⊱ 📈 *MERCADO DE AÇÕES* 📈 ⊱━━━╮\n`;
    text += `│\n`;
    text += `│ 👤 Investidor: ${pushname}\n`;
    text += `│\n`;
    text += `│ 💼 *AÇÕES DISPONÍVEIS:*\n│\n`;

    const stocks = {
      tech: { name: 'Tecnologia', emoji: '💻' },
      gold: { name: 'Ouro', emoji: '🪙' },
      crypto: { name: 'Bitcoin', emoji: '₿' },
      energy: { name: 'Energia', emoji: '⚡' }
    };

    for (const [key, stock] of Object.entries(stocks)) {
      const price = Math.floor(econ.stockMarket.prices[key]);
      const owned = me.investments.stocks[key] || 0;
      text += `│ ${stock.emoji} *${stock.name}*\n`;
      text += `│ 💰 Preço: ${price.toLocaleString()}\n`;
      text += `│ 📊 Você tem: ${owned}\n│\n`;
    }

    text += `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
    text += `💡 Use ${prefix}investir comprar <nome> <qtd>\n`;
    text += `💡 Exemplo: ${prefix}investir comprar bitcoin 5`;

    saveEconomy(econ);
    return reply(text);
  }
};
