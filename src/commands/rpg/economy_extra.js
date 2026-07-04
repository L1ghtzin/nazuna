import { timeLeft, resolveParamAlias, findKeyIgnoringAccents, normalizeParam } from "../../utils/helpers.js";

export default {
  name: "rpg-extra",
  description: "Sistemas extras de economia do RPG",
  commands: ["boost", "buff", "cavalos", "corrida", "doacao", "doar", "donate", "gift", "impostos", "impulsionar", "leilao", "leilaorpg", "leiloar", "loteria", "lottery", "mega", "taxes", "tributos"],
  usage: "{prefix}loteria",
  handle: async ({ 
    reply, 
    isGroup, 
    groupData, 
    sender, 
    prefix, 
    pushname, 
    command,
    args,
    menc_jid2,
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

    // --- LOTERIA ---
    if (command === 'loteria' || command === 'lottery' || command === 'mega') {
      if (!econ.lottery) {
        econ.lottery = { jackpot: 100000, tickets: {}, lastDraw: Date.now() };
      } else if (!econ.lottery.tickets) {
        econ.lottery.tickets = {};
      }
      const sub = args[0]?.toLowerCase();
      
      if (!sub || sub === 'ver') {
        const myTickets = econ.lottery.tickets[sender] || 0;
        return reply(MESSAGES.rpg.economy.lotteryHeader(econ.lottery.jackpot.toLocaleString(), myTickets, prefix));
      }
      
      if (sub === 'comprar') {
        const qty = parseInt(args[1]) || 1;
        const cost = 10000 * qty;
        if (me.wallet < cost) return reply(MESSAGES.rpg.economy.insufficientFunds);
        me.wallet -= cost;
        econ.lottery.tickets[sender] = (econ.lottery.tickets[sender] || 0) + qty;
        econ.lottery.jackpot += cost;
        saveEconomy(econ);
        return reply(MESSAGES.rpg.economy.boughtTickets(qty));
      }
    }

    // --- CORRIDA ---
    if (command === 'corrida' || command === 'cavalos') {
      const bet = parseAmount(args[0], me.wallet);
      const horse = parseInt(args[1]) || 0;
      if (!isFinite(bet) || bet < 1000 || horse < 1 || horse > 5) return reply(MESSAGES.rpg.economy.raceUsage(prefix));
      if (me.wallet < bet) return reply(MESSAGES.rpg.economy.insufficientFunds);
      
      const winner = Math.floor(Math.random() * 5) + 1;
      if (horse === winner) {
        const win = bet * 4;
        me.wallet += win - bet;
        reply(MESSAGES.rpg.economy.raceWon(winner, win.toLocaleString()));
      } else {
        me.wallet -= bet;
        reply(MESSAGES.rpg.economy.raceLost(winner, bet.toLocaleString()));
      }
      saveEconomy(econ);
      return;
    }

    // --- LEILÃO ---
    if (command === 'leilao' || command === 'leiloar') {
      if (!econ.auctions) econ.auctions = [];
      const sub = args[0]?.toLowerCase();
      if (!sub || sub === 'ver') {
        if (econ.auctions.length === 0) return reply(MESSAGES.rpg.economy.noAuctions);
        let text = `╭━━━⊱ 🏛️ *LEILÕES* ⊱━━━╮\n`;
        econ.auctions.forEach((a, i) => text += `${i+1}. ${a.item} - Lance: ${a.currentBid.toLocaleString()}\n`);
        return reply(text);
      }
    }

    // --- BOOST ---
    if (command === 'boost' || command === 'buff' || command === 'impulsionar') {
      const boosts = {
        xp: { name: '✨ Boost XP (2x)', price: 50000, duration: 3600000, effect: 'xpBoost' },
        money: { name: '💰 Boost Moedas (1.5x)', price: 75000, duration: 3600000, effect: 'moneyBoost' },
        luck: { name: '🍀 Boost Sorte (+20%)', price: 100000, duration: 3600000, effect: 'luckBoost' },
        power: { name: '⚔️ Boost Poder (+50%)', price: 80000, duration: 1800000, effect: 'powerBoost' },
        mega: { name: '🔥 Mega Boost (Todos)', price: 250000, duration: 1800000, effect: 'megaBoost' }
      };

      const rawSub = (args[0] || '');
      const sub = rawSub ? (resolveParamAlias(rawSub) || findKeyIgnoringAccents(boosts, rawSub) || normalizeParam(rawSub)) : '';

      if (!sub || sub === 'ver') {
        let text = `╭━━━⊱ ⚡ *BOOSTS* ⊱━━━╮\n\n`;

        if (me.activeBoosts && Object.keys(me.activeBoosts).length > 0) {
          let activeCount = 0;
          let activeText = `🔥 *BOOSTS ATIVOS:*\n`;
          for (const [key, boost] of Object.entries(me.activeBoosts)) {
            if (Date.now() < boost.expires) {
              const remaining = Math.ceil((boost.expires - Date.now()) / 60000);
              activeText += `• ${boosts[key]?.name || key}: ${remaining} min restantes\n`;
              activeCount++;
            }
          }
          if (activeCount > 0) {
            text += activeText + `\n`;
          }
        }

        text += `📦 *BOOSTS DISPONÍVEIS:*\n\n`;

        for (const [id, boost] of Object.entries(boosts)) {
          text += `${boost.name}\n`;
          text += `   💰 ${boost.price.toLocaleString()}\n`;
          text += `   ⏰ ${boost.duration / 60000} minutos\n`;
          text += `   🛒 ${prefix}boost ${id}\n\n`;
        }

        return reply(text);
      }

      const boost = boosts[sub];
      if (!boost) return reply(`❌ Boost não encontrado!\n\n💡 Use ${prefix}boost para ver disponíveis`);

      if (me.wallet < boost.price) {
        return reply(`❌ Saldo insuficiente!\n\n💰 Necessário: ${boost.price.toLocaleString()}\n💼 Sua carteira: ${me.wallet.toLocaleString()}`);
      }

      me.wallet -= boost.price;

      if (!me.activeBoosts) me.activeBoosts = {};
      me.activeBoosts[sub] = {
        expires: Date.now() + boost.duration,
        effect: boost.effect
      };

      saveEconomy(econ);

      return reply(`╭━━━⊱ ⚡ *BOOST ATIVADO* ⊱━━━╮\n\n${boost.name}\n⏰ Duração: ${boost.duration / 60000} minutos\n💰 Custo: -${boost.price.toLocaleString()}\n\n🔥 Aproveite os bônus!\n\n╰━━━━━━━━━━━━━━━━━━━━╯`);
    }

    // --- TRIBUTOS ---
    if (command === 'tributos' || command === 'impostos') {
      const totalWealth = (me.wallet || 0) + (me.bank || 0);
      const tax = Math.floor(totalWealth * 0.01);
      return reply(MESSAGES.rpg.economy.taxReport(totalWealth.toLocaleString(), tax.toLocaleString()));
    }

    // --- DOAR ---
    if (command === 'doar' || command === 'doacao') {
      const amount = parseAmount(args[0], me.wallet);
      if (!isFinite(amount) || amount < 1000) return reply(MESSAGES.rpg.economy.donateUsage(prefix));
      if (me.wallet < amount) return reply(MESSAGES.rpg.economy.insufficientFunds);
      
      me.wallet -= amount;
      econ.treasury = (econ.treasury || 0) + amount;
      saveEconomy(econ);
      return reply(MESSAGES.rpg.economy.donated(amount.toLocaleString()));
    }

    // --- PRESENTE ---
    if (command === 'gift') {
      const target = (menc_jid2 && menc_jid2[0]) || null;
      const amount = parseAmount(args[1], me.wallet);
      if (!target || !isFinite(amount) || amount < 100) return reply(MESSAGES.rpg.economy.giftUsage(prefix));
      if (me.wallet < amount) return reply(MESSAGES.rpg.economy.insufficientFunds);
      
      me.wallet -= amount;
      const targetUser = getEcoUser(econ, target);
      targetUser.wallet += amount;
      saveEconomy(econ);
      return reply(MESSAGES.rpg.economy.giftSuccess(amount.toLocaleString(), target.split('@')[0]), { mentions: [target] });
    }
  }
};
