import { PREFIX } from "../../config.js";

export default {
  name: "investir",
  description: "Sistema de investimentos e mercado financeiro",
  commands: ["invest", "investir"],
  usage: `${PREFIX}investir`,
  handle: async ({ 
    reply, 
    isGroup, 
    groupData, 
    sender, 
    prefix, 
    pushname, 
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
    
    if (!econ.stockMarket) {
      econ.stockMarket = {
        prices: { tech: 100, gold: 50, crypto: 200, energy: 75 },
        lastUpdate: Date.now()
      };
    }

    if (!me.investments) me.investments = { stocks: {} };

    // --- VER MERCADO ---
    if (!args[0]) {
      let text = `╭━━━⊱ 📈 *MERCADO FINANCEIRO* ⊱━━━╮\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      Object.entries(econ.stockMarket.prices).forEach(([id, price]) => {
        text += `• *${id.toUpperCase()}*: ${price.toLocaleString()} moedas\n`;
      });
      text += `\n💡 Use ${prefix}investir comprar <tipo> <qtd>`;
      return reply(text);
    }
  }
};
