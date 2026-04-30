import { PREFIX } from "../../config.js";
import { timeLeft } from "../../utils/helpers.js";

export default {
  name: "rpg-extra",
  description: "Sistemas extras de economia do RPG",
  commands: ["boost", "buff", "cavalos", "corrida", "doacao", "doar", "donate", "evolucao", "evoluir", "gift", "impostos", "impulsionar", "leilao", "leilaorpg", "leiloar", "loteria", "lottery", "maiores", "mega", "meustats", "mystats", "presente", "prestige", "statsrpg", "taxes", "toprich", "topriqueza", "tributos"],
  usage: `${PREFIX}loteria`,
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
    MESSAGES
  }) => {
    if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
    if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);
    
    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);

    // --- LOTERIA ---
    if (command === 'loteria' || command === 'lottery' || command === 'mega') {
      if (!econ.lottery) econ.lottery = { jackpot: 100000, tickets: {}, lastDraw: Date.now() };
      const sub = args[0]?.toLowerCase();
      
      if (!sub || sub === 'ver') {
        const myTickets = econ.lottery.tickets[sender] || 0;
        return reply(`╭━━━⊱ 🎫 *LOTERIA* ⊱━━━╮\n💰 Jackpot: ${econ.lottery.jackpot.toLocaleString()}\n🎟️ Seus bilhetes: ${myTickets}\n💵 Preço: 10.000/cada\n\n💡 Use ${prefix}loteria comprar <qtd>`);
      }
      
      if (sub === 'comprar') {
        const qty = parseInt(args[1]) || 1;
        const cost = 10000 * qty;
        if (me.wallet < cost) return reply('💰 Saldo insuficiente!');
        me.wallet -= cost;
        econ.lottery.tickets[sender] = (econ.lottery.tickets[sender] || 0) + qty;
        econ.lottery.jackpot += cost;
        saveEconomy(econ);
        return reply(`✅ Você comprou ${qty} bilhetes!`);
      }
    }

    // --- CORRIDA ---
    if (command === 'corrida' || command === 'cavalos') {
      const bet = parseInt(args[0]) || 0;
      const horse = parseInt(args[1]) || 0;
      if (bet < 1000 || horse < 1 || horse > 5) return reply(`💡 Use ${prefix}corrida <valor> <1-5>`);
      if (me.wallet < bet) return reply('💰 Saldo insuficiente!');
      
      const winner = Math.floor(Math.random() * 5) + 1;
      if (horse === winner) {
        const win = bet * 4;
        me.wallet += win - bet;
        reply(`🏁 Cavalo ${winner} venceu! Você ganhou ${win.toLocaleString()}! 🏇`);
      } else {
        me.wallet -= bet;
        reply(`🏁 Cavalo ${winner} venceu! Você perdeu ${bet.toLocaleString()}. 🐎`);
      }
      saveEconomy(econ);
      return;
    }

    // --- LEILÃO ---
    if (command === 'leilao' || command === 'leiloar') {
      if (!econ.auctions) econ.auctions = [];
      const sub = args[0]?.toLowerCase();
      if (!sub || sub === 'ver') {
        if (econ.auctions.length === 0) return reply('🏛️ Nenhum leilão ativo.');
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
      return reply(`🏦 *TRIBUTOS*\n\nSua riqueza: ${totalWealth.toLocaleString()}\nImposto devido: ${tax.toLocaleString()}\n\n✅ Tudo em dia!`);
    }

    // --- DOAR ---
    if (command === 'doar' || command === 'doacao') {
      const amount = parseInt(args[0]) || 0;
      if (amount < 1000) return reply(`💡 Use ${prefix}doar <valor>`);
      if (me.wallet < amount) return reply('💰 Saldo insuficiente!');
      
      me.wallet -= amount;
      econ.treasury = (econ.treasury || 0) + amount;
      saveEconomy(econ);
      return reply(`💝 Obrigado! Você doou ${amount.toLocaleString()} para o tesouro.`);
    }

    // --- PRESENTE ---
    if (command === 'presente' || command === 'gift') {
      const target = (menc_jid2 && menc_jid2[0]) || null;
      const amount = parseInt(args[1]) || 0;
      if (!target || amount < 100) return reply(`💡 Use ${prefix}presente @user <valor>`);
      if (me.wallet < amount) return reply('💰 Saldo insuficiente!');
      
      me.wallet -= amount;
      const targetUser = getEcoUser(econ, target);
      targetUser.wallet += amount;
      saveEconomy(econ);
      return reply(`🎁 Você enviou ${amount.toLocaleString()} moedas para @${target.split('@')[0]}!`, { mentions: [target] });
    }
  }
};
