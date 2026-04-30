import { 
    loadEconomy, 
    saveEconomy, 
    getEcoUser, 
    ensureEconomyDefaults, 
    fmt
} from "../../utils/database.js";

export default {
    name: "rpg_gambling",
    description: "Sistema de apostas e cassino do RPG",
    commands: ["apostar", "bet", "slots", "cacaniquel", "roulette", "roleta", "blackjack", "bj", "21"],
    handle: async ({ 
    reply, isGroup, groupData, sender, prefix, command, args,
    MESSAGES
  }) => {
        if (!isGroup || !groupData.modorpg) return;

        const econ = loadEconomy();
        ensureEconomyDefaults(econ);
        const me = getEcoUser(econ, sender);
        const sub = command.toLowerCase();

        if (sub === 'apostar' || sub === 'bet') {
            const amt = parseInt(args[0]);
            if (isNaN(amt) || amt <= 0) return reply(`💔 Informe um valor válido para apostar.`);
            if (me.wallet < amt) return reply(`💰 Você não tem gold suficiente.`);

            const win = Math.random() < 0.45;
            if (win) {
                const prize = amt * 2;
                me.wallet += amt; // ganha o que apostou (fica com o dobro)
                saveEconomy(econ);
                return reply(`🎉 Você ganhou! Recebeu ${fmt(prize)}.`);
            } else {
                me.wallet -= amt;
                saveEconomy(econ);
                return reply(`💸 Você perdeu ${fmt(amt)}.`);
            }
        }

        if (sub === 'slots' || sub === 'cacaniquel') {
            const amt = parseInt(args[0]) || 50;
            if (me.wallet < amt) return reply(`💰 Saldo insuficiente.`);
            
            const emojis = ['🍒', '🍋', '🔔', '💎', '7️⃣'];
            const r1 = emojis[Math.floor(Math.random() * emojis.length)];
            const r2 = emojis[Math.floor(Math.random() * emojis.length)];
            const r3 = emojis[Math.floor(Math.random() * emojis.length)];
            
            let win = 0;
            if (r1 === r2 && r2 === r3) {
                win = r1 === '7️⃣' ? amt * 10 : r1 === '💎' ? amt * 5 : amt * 3;
            } else if (r1 === r2 || r2 === r3 || r1 === r3) {
                win = Math.floor(amt * 1.5);
            }

            me.wallet -= amt;
            if (win > 0) me.wallet += win;
            saveEconomy(econ);
            
            return reply(`🎰 [ ${r1} | ${r2} | ${r3} ] 🎰\n\n${win > 0 ? `🎉 GANHOU! +${fmt(win)}` : `💸 PERDEU! -${fmt(amt)}`}`);
        }

        if (sub === 'roulette' || sub === 'roleta') {
            const color = (args[0] || '').toLowerCase();
            const amt = parseInt(args[1]);
            if (!['red', 'black', 'green'].includes(color) || isNaN(amt) || amt <= 0) {
                return reply(`Use: ${prefix}roleta <red|black|green> <valor>`);
            }
            if (me.wallet < amt) return reply(`💰 Saldo insuficiente.`);

            const result = Math.random();
            let landing = '';
            let multiplier = 0;

            if (result < 0.05) { landing = 'green'; multiplier = 14; }
            else if (result < 0.52) { landing = 'red'; multiplier = 2; }
            else { landing = 'black'; multiplier = 2; }

            me.wallet -= amt;
            const won = color === landing;
            if (won) me.wallet += (amt * multiplier);
            saveEconomy(econ);

            return reply(`🎡 A roleta parou em: *${landing.toUpperCase()}*!\n\n${won ? `🎉 PARABÉNS! Você ganhou ${fmt(amt * multiplier)}!` : `💸 Não foi dessa vez. Perdeu ${fmt(amt)}.`}`);
        }
    }
};
