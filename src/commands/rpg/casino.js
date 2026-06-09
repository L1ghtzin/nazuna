import { resolveParamAlias, timeLeft } from "../../utils/helpers.js";

export default {
  name: "casino",
  description: "Jogos de azar e cassino do RPG",
  commands: ["bet", "blackjack", "bj", "coinflip", "crash", "dados", "dice", "moeda", "roleta", "slots", "slotmachine", "cacaniquel"],
  usage: "{prefix}roleta <cor> <valor>",
  handle: async ({ 
    reply, 
    isGroup, 
    groupData, 
    sender, 
    prefix, 
    command,
    q, 
    args,
    loadEconomy, 
    saveEconomy, 
    getEcoUser,
    parseAmount,
    fmt,
    MESSAGES
  }) => {
    if (!isGroup) return reply('⚔️ Este comando funciona apenas em grupos com Modo RPG ativo.');
    if (!groupData.modorpg) return reply(`⚔️ Modo RPG desativado! Use ${prefix}modorpg para ativar.`);
    
    const econ = loadEconomy();
    const me = getEcoUser(econ, sender);

    // --- COINFLIP ---
    if (command === 'coinflip' || command === 'moeda') {
      const choice = resolveParamAlias(args[0]);
      const bet = parseInt(args[1]) || 0;
      if (!['cara', 'coroa'].includes(choice) || bet < 100) return reply(`💡 Use ${prefix}coinflip <cara|coroa> <valor>`);
      if (me.wallet < bet) return reply('💰 Saldo insuficiente!');
      
      const win = Math.random() < 0.48; // 48% chance
      const result = win ? choice : (choice === 'cara' ? 'coroa' : 'cara');
      
      if (win) {
        me.wallet += bet;
        reply(`🪙 Caiu *${result}*! Você ganhou ${bet.toLocaleString()}!`);
      } else {
        me.wallet -= bet;
        reply(`🪙 Caiu *${result}*! Você perdeu ${bet.toLocaleString()}.`);
      }
      saveEconomy(econ);
      return;
    }

    // --- ROLETA ---
    if (command === 'roleta') {
      const color = args[0]?.toLowerCase();
      const bet = parseInt(args[1]) || 0;
      if (!['red', 'black', 'green'].includes(color) || bet < 100) return reply(`💡 Use ${prefix}roleta <red|black|green> <valor>`);
      if (me.wallet < bet) return reply('💰 Saldo insuficiente!');

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
        reply(`🎰 Resultado: *${result.toUpperCase()}*! Você ganhou ${win.toLocaleString()}! (${mult}x)`);
      } else {
        me.wallet -= bet;
        reply(`🎰 Resultado: *${result.toUpperCase()}*! Você perdeu ${bet.toLocaleString()}.\n🎰 A roleta parece viciada...`);
      }
      saveEconomy(econ);
      return;
    }

    // --- SLOTS ---
    if (['slots', 'slotmachine', 'cacaniquel'].includes(command)) {
      // Cooldown de 10 segundos
      const cdSlots = me.cooldowns?.slots || 0;
      if (Date.now() < cdSlots) return reply(`⏳ Aguarde ${timeLeft(cdSlots)} para jogar slots novamente.`);

      if (!args[0]) return reply(`💡 Use ${prefix}slots <valor>`);
      const bet = parseAmount(args[0], me.wallet);
      if (!isFinite(bet) || bet <= 0) return reply(MESSAGES.error.invalid('valor'));
      if (bet < 100) return reply(`💡 Aposta mínima é de 100 gold.`);
      if (me.wallet < bet) return reply('💰 Saldo insuficiente na carteira!');

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
        msg += `🎉 *JACKPOT!* Você alinhou 3 ${slot1} e ganhou *${fmt(win)}* gold! (${multi}x)`;
      } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
        const win = Math.floor(bet * 1.5);
        me.wallet += win - bet;
        msg += `✨ *PAR!* Você combinou 2 símbolos e ganhou *${fmt(win)}* gold! (1.5x)`;
      } else {
        me.wallet -= bet;
        msg += `💀 Você perdeu *${fmt(bet)}* gold. A sorte não está com você!`;
      }
      saveEconomy(econ);
      return reply(msg);
    }

    // --- DADOS ---
    if (command === 'dados' || command === 'dice') {
      const bet = parseInt(args[0]) || 0;
      if (bet < 100) return reply(`💡 Use ${prefix}dados <valor>`);
      if (me.wallet < bet) return reply('💰 Saldo insuficiente!');

      const p1 = Math.floor(Math.random() * 6) + 1;
      const b1 = Math.floor(Math.random() * 6) + 1;
      
      let msg = `🎲 Você: ${p1}\n🎲 Bot: ${b1}\n\n`;
      if (p1 > b1) {
        me.wallet += bet;
        msg += `🎉 Você ganhou ${bet.toLocaleString()}!`;
      } else if (p1 < b1) {
        me.wallet -= bet;
        msg += `💀 Você perdeu ${bet.toLocaleString()}.`;
      } else {
        msg += `🤝 Empate!`;
      }
      saveEconomy(econ);
      return reply(msg);
    }

    // --- CRASH ---
    if (command === 'crash') {
      const bet = parseInt(args[0]) || 0;
      if (bet < 100) return reply(`💡 Use ${prefix}crash <valor>`);
      if (me.wallet < bet) return reply('💰 Saldo insuficiente!');

      const crash = (1 + Math.random() * 2).toFixed(2);
      const exit = (1 + Math.random() * 2).toFixed(2);
      
      let msg = `🚀 Você saiu em: ${exit}x\n💥 Crash em: ${crash}x\n\n`;
      if (parseFloat(exit) < parseFloat(crash)) {
        const win = Math.floor(bet * (parseFloat(exit) - 1));
        me.wallet += win;
        msg += `🎉 Você ganhou ${win.toLocaleString()}!`;
      } else {
        me.wallet -= bet;
        msg += `💀 Você perdeu ${bet.toLocaleString()}.`;
      }
      saveEconomy(econ);
      return reply(msg);
    }
    // --- BLACKJACK ---
    if (command === 'blackjack' || command === 'bj') {
      const bet = parseInt(args[0]) || 0;
      if (bet < 100) return reply(`💡 Use ${prefix}blackjack <valor>`);
      if (me.wallet < bet) return reply('💰 Saldo insuficiente!');

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

      let msg = `🃏 *BLACKJACK*\n\n`;
      msg += `Sua mão: ${pCards.join(' ')} = *${pSum}*\n`;
      msg += `Mesa: ${bCards.join(' ')} = *${bSum}*\n\n`;

      if (pSum > 21) {
        me.wallet -= bet;
        msg += `💀 *BUST!* Você estourou e perdeu ${bet.toLocaleString()}.\n🃏 Que azar...`;
      } else if (bSum > 21 || pSum > bSum) {
        const winnings = pSum === 21 && pCards.length === 2 ? Math.floor(bet * 1.8) : Math.floor(bet * 1.4);
        me.wallet += winnings - bet;
        msg += `🎉 *VITÓRIA RARA!* Você ganhou ${(winnings - bet).toLocaleString()}!`;
      } else if (pSum === bSum) {
        const loss = Math.floor(bet * 0.3);
        me.wallet -= loss;
        msg += `🤝 *EMPATE!*\n💸 Taxa de empate: -${loss.toLocaleString()}`;
      } else {
        me.wallet -= bet;
        msg += `💀 *MESA VENCEU!* Você perdeu ${bet.toLocaleString()}.\n🃏 O dealer parece ter sorte demais...`;
      }
      
      saveEconomy(econ);
      return reply(msg);
    }
  }
};
