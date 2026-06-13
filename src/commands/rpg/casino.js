import { resolveParamAlias, timeLeft } from "../../utils/helpers.js";

export default {
  name: "casino",
  description: "Jogos de azar e cassino do RPG",
  commands: ["apostar", "bet", "blackjack", "bj", "coinflip", "crash", "dados", "dice", "moeda", "roleta", "slots", "slotmachine", "cacaniquel"],
  usage: "{prefix}roleta <cor> <valor>",
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
    parseAmount,
    fmt,
    MESSAGES
  }) => {
    if (!isGroup) return reply(MESSAGES.rpg.groupOnly);
    if (!groupData.modorpg) return reply(MESSAGES.rpg.disabled(prefix));
    
    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);

    // --- APOSTA SIMPLES ---
    if (command === 'apostar' || command === 'bet') {
      if (!args[0]) return reply(MESSAGES.rpg.casino.usageApostar(prefix, command));
      const bet = parseAmount(args[0], me.wallet);
      if (!isFinite(bet) || bet <= 0) return reply(MESSAGES.error.invalid('valor'));
      if (bet < 100) return reply(MESSAGES.rpg.casino.minBet(100));
      if (me.wallet < bet) return reply(MESSAGES.rpg.casino.insufficientFunds);

      const won = Math.random() < 0.45;
      if (won) {
        me.wallet += bet;
        saveEconomy(econ);
        return reply(MESSAGES.rpg.casino.wonAposta(fmt(bet)));
      }

      me.wallet -= bet;
      saveEconomy(econ);
      return reply(MESSAGES.rpg.casino.lostAposta(fmt(bet)));
    }

    // --- COINFLIP ---
    if (command === 'coinflip' || command === 'moeda') {
      const choice = resolveParamAlias(args[0]);
      const bet = parseInt(args[1]) || 0;
      if (!['cara', 'coroa'].includes(choice) || bet < 100) return reply(MESSAGES.rpg.casino.usageCoinflip(prefix));
      if (me.wallet < bet) return reply(MESSAGES.rpg.casino.insufficientCoinflip);
      
      const win = Math.random() < 0.48; // 48% chance
      const result = win ? choice : (choice === 'cara' ? 'coroa' : 'cara');
      
      if (win) {
        me.wallet += bet;
        reply(MESSAGES.rpg.casino.wonCoinflip(result, bet.toLocaleString()));
      } else {
        me.wallet -= bet;
        reply(MESSAGES.rpg.casino.lostCoinflip(result, bet.toLocaleString()));
      }
      saveEconomy(econ);
      return;
    }

    // --- ROLETA ---
    if (command === 'roleta') {
      const color = args[0]?.toLowerCase();
      const bet = parseInt(args[1]) || 0;
      if (!['red', 'black', 'green'].includes(color) || bet < 100) return reply(MESSAGES.rpg.casino.usageRoleta(prefix));
      if (me.wallet < bet) return reply(MESSAGES.rpg.casino.insufficientFunds);

      // ROLETA NERFADA (Portado do Chainy Original)
      const rand = Math.random();
      let result;
      const otherColors = ['red', 'black', 'green'].filter(c => c !== color);
      
      if (rand < 0.85) {
        result = otherColors[Math.floor(Math.random() * otherColors.length)];
      } else if (rand < 0.97) {
        result = color === 'green' ? otherColors[0] : color;
      } else {
        result = 'green';
      }

      if (color === result) {
        const mult = result === 'green' ? 5 : 1.5;
        const win = Math.floor(bet * mult);
        me.wallet += win - bet;
        reply(MESSAGES.rpg.casino.wonRoleta(result, win.toLocaleString(), mult));
      } else {
        me.wallet -= bet;
        reply(MESSAGES.rpg.casino.lostRoleta(result, bet.toLocaleString()));
      }
      saveEconomy(econ);
      return;
    }

    // --- SLOTS ---
    if (['slots', 'slotmachine', 'cacaniquel'].includes(command)) {
      // Cooldown de 10 segundos
      const cdSlots = me.cooldowns?.slots || 0;
      if (Date.now() < cdSlots) return reply(MESSAGES.rpg.casino.cooldownSlots(timeLeft(cdSlots)));

      if (!args[0]) return reply(MESSAGES.rpg.casino.usageSlots(prefix));
      const bet = parseAmount(args[0], me.wallet);
      if (!isFinite(bet) || bet <= 0) return reply(MESSAGES.error.invalid('valor'));
      if (bet < 100) return reply(MESSAGES.rpg.casino.minBet(100));
      if (me.wallet < bet) return reply(MESSAGES.rpg.casino.insufficientFunds);

      // SLOTS COM PESOS (PORTADO DO TOKYO/ORIGINAL)
      const symbols = ['🍒', '🍋', '🍉', '⭐', '🔔', '🍇', '🍊', '🍓'];
      const getSlot = (idx) => {
        // Cada posição tem preferência por símbolos diferentes
        const weights = [30, 20, 15, 12, 10, 6, 4, 3];
        const shifted = [...weights.slice(idx * 2), ...weights.slice(0, idx * 2)];
        const total = shifted.reduce((a, b) => a + b, 0);
        let rand = Math.random() * total;
        for (let i = 0; i < symbols.length; i++) {
          rand -= shifted[i];
          if (rand <= 0) return symbols[i];
        }
        return symbols[0];
      };

      const slot1 = getSlot(0);
      const slot2 = getSlot(1);
      const slot3 = getSlot(2);

      me.cooldowns = me.cooldowns || {};
      me.cooldowns.slots = Date.now() + 10 * 1000; // 10 segundos

      let msg = `🎰 *CAÇA-NÍQUEIS* 🎰\n\n`;
      msg += `  [ ${slot1} | ${slot2} | ${slot3} ]\n\n`;

      if (slot1 === slot2 && slot2 === slot3) {
        const multi = slot1 === '🍒' ? 5 : slot1 === '🍋' ? 8 : slot1 === '🍉' ? 12 : slot1 === '⭐' ? 20 : slot1 === '🔔' ? 15 : slot1 === '🍇' ? 10 : slot1 === '🍊' ? 6 : 4;
        const win = Math.floor(bet * multi);
        me.wallet += win;
        msg += MESSAGES.rpg.casino.jackpotSlots(slot1, fmt(win), multi);
      } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
        const win = Math.floor(bet * 1.5);
        me.wallet += win - bet;
        msg += MESSAGES.rpg.casino.pairSlots(fmt(win));
      } else {
        me.wallet -= bet;
        msg += MESSAGES.rpg.casino.lostSlots(fmt(bet));
      }
      saveEconomy(econ);
      return reply(msg);
    }

    // --- DADOS ---
    if (command === 'dados' || command === 'dice') {
      const bet = parseInt(args[0]) || 0;
      if (bet < 100) return reply(MESSAGES.rpg.casino.usageDados(prefix));
      if (me.wallet < bet) return reply(MESSAGES.rpg.casino.insufficientCoinflip);

      const p1 = Math.floor(Math.random() * 6) + 1;
      const b1 = Math.floor(Math.random() * 6) + 1;
      
      let resultMsg = '';
      if (p1 > b1) {
        me.wallet += bet;
        resultMsg = MESSAGES.rpg.casino.dadosWon(bet.toLocaleString());
      } else if (p1 < b1) {
        me.wallet -= bet;
        resultMsg = MESSAGES.rpg.casino.dadosLost(bet.toLocaleString());
      } else {
        resultMsg = MESSAGES.rpg.casino.dadosTie;
      }
      saveEconomy(econ);
      return reply(MESSAGES.rpg.casino.dadosResult(p1, b1, resultMsg));
    }

    // --- CRASH ---
    if (command === 'crash') {
      const bet = parseInt(args[0]) || 0;
      if (bet < 100) return reply(MESSAGES.rpg.casino.usageCrash(prefix));
      if (me.wallet < bet) return reply(MESSAGES.rpg.casino.insufficientCoinflip);

      const crash = (1 + Math.random() * 2).toFixed(2);
      const exit = (1 + Math.random() * 2).toFixed(2);
      
      let resultMsg = '';
      if (parseFloat(exit) < parseFloat(crash)) {
        const win = Math.floor(bet * (parseFloat(exit) - 1));
        me.wallet += win;
        resultMsg = MESSAGES.rpg.casino.crashWon(win.toLocaleString());
      } else {
        me.wallet -= bet;
        resultMsg = MESSAGES.rpg.casino.crashLost(bet.toLocaleString());
      }
      saveEconomy(econ);
      return reply(MESSAGES.rpg.casino.crashResult(exit, crash, resultMsg));
    }

    // --- BLACKJACK ---
    if (command === 'blackjack' || command === 'bj') {
      const bet = parseInt(args[0]) || 0;
      if (bet < 100) return reply(MESSAGES.rpg.casino.usageBlackjack(prefix));
      if (me.wallet < bet) return reply(MESSAGES.rpg.casino.insufficientCoinflip);

      // BLACKJACK NERFADO: Dealer tem cartas viciadas
      const getPlayerCard = () => {
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const weights = [5, 3, 3, 4, 5, 6, 8, 10, 12, 15, 12, 10, 7]; 
        const total = weights.reduce((a, b) => a + b, 0);
        let rand = Math.random() * total;
        for (let i = 0; i < values.length; i++) {
          rand -= weights[i];
          if (rand <= 0) return values[i];
        }
        return values[0];
      };
      
      const getDealerCard = () => {
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const weights = [8, 6, 7, 8, 9, 10, 12, 10, 8, 6, 5, 5, 6]; 
        const total = weights.reduce((a, b) => a + b, 0);
        let rand = Math.random() * total;
        for (let i = 0; i < values.length; i++) {
          rand -= weights[i];
          if (rand <= 0) return values[i];
        }
        return values[0];
      };
      
      const getValue = (cards) => {
        let total = 0;
        let aces = 0;
        cards.forEach(c => {
          if (c === 'A') { aces++; total += 11; }
          else if (['J', 'Q', 'K'].includes(c)) total += 10;
          else total += parseInt(c);
        });
        while (total > 21 && aces > 0) { total -= 10; aces--; }
        return total;
      };

      const pCards = [getPlayerCard(), getPlayerCard()];
      const bCards = [getDealerCard(), getDealerCard()];
      
      while (getValue(pCards) < 17) pCards.push(getPlayerCard());
      while (getValue(bCards) < 17) bCards.push(getDealerCard());
      
      const pSum = getValue(pCards);
      const bSum = getValue(bCards);

      let resultMsg = '';
      if (pSum > 21) {
        me.wallet -= bet;
        resultMsg = MESSAGES.rpg.casino.bjBust(bet.toLocaleString());
      } else if (bSum > 21 || pSum > bSum) {
        const winnings = pSum === 21 && pCards.length === 2 ? Math.floor(bet * 1.8) : Math.floor(bet * 1.4);
        me.wallet += winnings - bet;
        resultMsg = MESSAGES.rpg.casino.bjWon((winnings - bet).toLocaleString());
      } else if (pSum === bSum) {
        const loss = Math.floor(bet * 0.3);
        me.wallet -= loss;
        resultMsg = MESSAGES.rpg.casino.bjTie(loss.toLocaleString());
      } else {
        me.wallet -= bet;
        resultMsg = MESSAGES.rpg.casino.bjLost(bet.toLocaleString());
      }
      
      saveEconomy(econ);
      return reply(MESSAGES.rpg.casino.blackjackResult(pCards.join(' '), pSum, bCards.join(' '), bSum, resultMsg));
    }
  }
};
