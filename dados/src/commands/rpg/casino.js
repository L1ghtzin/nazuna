import { PREFIX } from "../../config.js";
import { resolveParamAlias, timeLeft } from "../../utils/helpers.js";

export default {
  name: "casino",
  description: "Jogos de azar e cassino do RPG",
  commands: ["bet", "blackjack", "coinflip", "crash", "dados", "dice", "moeda", "roleta", "slots"],
  usage: `${PREFIX}roleta <cor> <valor>`,
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

      const rand = Math.random() * 100;
      let result;
      if (rand < 2) result = 'green';
      else if (rand < 51) result = 'red';
      else result = 'black';

      if (color === result) {
        const mult = color === 'green' ? 14 : 2;
        const win = bet * mult;
        me.wallet += win - bet;
        reply(`🎰 Resultado: *${result.toUpperCase()}*! Você ganhou ${win.toLocaleString()}!`);
      } else {
        me.wallet -= bet;
        reply(`🎰 Resultado: *${result.toUpperCase()}*! Você perdeu ${bet.toLocaleString()}.`);
      }
      saveEconomy(econ);
      return;
    }

    // --- SLOTS ---
    if (command === 'slots') {
      const bet = parseInt(args[0]) || 0;
      if (bet < 100) return reply(`💡 Use ${prefix}slots <valor>`);
      if (me.wallet < bet) return reply('💰 Saldo insuficiente!');

      const emojis = ['🍒', '🍋', '🔔', '💎', '7️⃣'];
      const r1 = emojis[Math.floor(Math.random() * emojis.length)];
      const r2 = emojis[Math.floor(Math.random() * emojis.length)];
      const r3 = emojis[Math.floor(Math.random() * emojis.length)];

      let msg = `🎰 [ ${r1} | ${r2} | ${r3} ] 🎰\n\n`;
      if (r1 === r2 && r2 === r3) {
        const win = bet * 10;
        me.wallet += win;
        msg += `✨ JACKPOT! Você ganhou ${win.toLocaleString()}!`;
      } else if (r1 === r2 || r2 === r3 || r1 === r3) {
        const win = Math.floor(bet * 1.5);
        me.wallet += win - bet;
        msg += `🎉 Combinou 2! Ganhou ${win.toLocaleString()}!`;
      } else {
        me.wallet -= bet;
        msg += `😢 Perdeu ${bet.toLocaleString()}.`;
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
  }
};
