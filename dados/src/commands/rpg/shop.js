import { PREFIX } from "../../config.js";
import { findKeyIgnoringAccents, normalizeParam } from "../../utils/helpers.js";

export default {
  name: "lojapremium",
  description: "Loja de itens exclusivos",
  commands: ["buypremium", "comprarpremium", "lojadeluxo", "lojapremium", "premiumshop"],
  usage: `${PREFIX}lojapremium`,
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
    if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
    if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);
    
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
      let text = `╭━━━⊱ 💎 *LOJA PREMIUM* ⊱━━━╮\n╰━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      Object.entries(premiumItems).forEach(([id, item]) => {
        text += `${item.name}\n   💰 ${item.price.toLocaleString()} moedas\n   📝 ${item.desc}\n   🛒 ${prefix}comprarpremium ${id}\n\n`;
      });
      return reply(text);
    }

    // --- COMPRAR ---
    if (command === 'comprarpremium' || command === 'buypremium') {
      const rawItemId = (args[0] || '');
      if (!rawItemId) return reply(`💔 Informe o item! Veja a loja: ${prefix}lojapremium`);
      
      const itemId = findKeyIgnoringAccents(premiumItems, rawItemId) || normalizeParam(rawItemId).replace(/\s+/g, '_');
      const item = premiumItems[itemId];
      if (!item) return reply(`💔 Item não encontrado! Veja a loja: ${prefix}lojapremium`);
      
      const econ = loadEconomy();
      const me = getEcoUser(econ, sender);
      
      if (me.wallet < item.price) {
        return reply(`💔 Saldo insuficiente! Necessário: ${item.price.toLocaleString()}`);
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
      return reply(`╭━━━⊱ ✅ *COMPRA PREMIUM* ⊱━━━╮\n│ 🛒 ${item.name}\n│ 💰 -${item.price.toLocaleString()}\n╰━━━━━━━━━━━━━━━━━━━━━━━━━╯`);
    }
  }
};
