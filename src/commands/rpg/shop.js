import { findKeyIgnoringAccents, normalizeParam } from "../../utils/helpers.js";

export default {
  name: "lojapremium",
  description: "Loja de itens exclusivos",
  commands: ["buypremium", "comprarpremium", "lojadeluxo", "lojapremium", "premiumshop"],
  usage: "{prefix}lojapremium",
  handle: async ({ 
    reply, 
    isGroup, 
    groupData, 
    sender, 
    prefix, 
    command,
    args,
    loadEconomy, 
    saveEconomy, 
    getEcoUser,
    MESSAGES
  }) => {
    if (!isGroup) return reply(MESSAGES.rpg.groupOnly);
    if (!groupData.modorpg) return reply(MESSAGES.rpg.disabled(prefix));
    
    const premiumItems = {
      'titulo_lendario': { name: '🏅 Título Lendário', price: 500000, desc: 'Título exclusivo no perfil' },
      'mascote_raro': { name: '🦄 Mascote Raro', price: 750000, desc: 'Mascote especial que dá bônus' },
      'mansao': { name: '🏰 Mansão', price: 2000000, desc: 'Propriedade de luxo (+5000 renda/dia)', income: 5000 },
      'yate': { name: '🛥️ Iate', price: 1500000, desc: 'Barco de luxo (+bônus pesca)' },
      'jet_privado': { name: '✈️ Jato Privado', price: 5000000, desc: 'Viaje instantaneamente' },
      'diamante_eterno': { name: '💎 Diamante Eterno', price: 10000000, desc: 'Item colecionável raro' },
      'coroa_rei': { name: '👑 Coroa Real', price: 25000000, desc: 'Símbolo máximo de poder' },
      'boost_permanente': { name: '⚡ Boost Permanente', price: 3000000, desc: '+50% em todas atividades' },
      'protecao_vip': { name: '🛡️ Proteção VIP', price: 1000000, desc: 'Proteção eterna contra roubos' },
      'multiplicador_xp': { name: '✨ Multiplicador XP', price: 2500000, desc: '2x XP permanente' }
    };

    // --- VER LOJA ---
    if (command === 'lojapremium' || command === 'premiumshop' || command === 'lojadeluxo') {
      let text = MESSAGES.rpg.shop.premiumMenu;
      Object.entries(premiumItems).forEach(([id, item]) => {
        text += MESSAGES.rpg.shop.premiumItemLine(item.name, item.price.toLocaleString(), item.desc, prefix, id);
      });
      return reply(text);
    }

    // --- COMPRAR ---
    if (command === 'comprarpremium' || command === 'buypremium') {
      const rawItemId = (args[0] || '');
      if (!rawItemId) return reply(MESSAGES.rpg.shop.missingItemArgs(prefix));
      
      const itemId = findKeyIgnoringAccents(premiumItems, rawItemId) || normalizeParam(rawItemId).replace(/\s+/g, '_');
      const item = premiumItems[itemId];
      if (!item) return reply(MESSAGES.rpg.shop.itemNotFoundArgs(prefix));
      
      const econ = loadEconomy();
      const me = getEcoUser(econ, sender);
      
      if (me.wallet < item.price) {
        return reply(MESSAGES.rpg.shop.insufficientFunds(item.price.toLocaleString()));
      }
      
      me.wallet -= item.price;
      me.premiumItems = me.premiumItems || {};
      me.premiumItems[itemId] = (me.premiumItems[itemId] || 0) + 1;
      
      // Efeitos
      if (itemId === 'boost_permanente') me.permanentBoost = true;
      if (itemId === 'protecao_vip') me.vipProtection = true;
      if (itemId === 'multiplicador_xp') me.xpMultiplier = 2;
      if (item.income) me.dailyIncome = (me.dailyIncome || 0) + item.income;
      
      saveEconomy(econ);
      return reply(MESSAGES.rpg.shop.buyPremium(item.name, item.price.toLocaleString()));
    }
  }
};
