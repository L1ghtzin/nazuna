import { timeLeft } from "../../utils/helpers.js";

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
    if (command === 'boost' || command === 'buff') {
      let text = `╭━━━⊱ ⚡ *BOOSTS* ⊱━━━╮\n\n`;
      text += `✨ Boost XP (2x) - 50.000\n💰 Boost Moedas (1.5x) - 75.000\n\n💡 Use ${prefix}boost <tipo>`;
      return reply(text);
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
