import {
    loadEconomy,
    saveEconomy,
    getEcoUser,
    ensureEconomyDefaults,
    fmt,
    parseAmount
} from "../../utils/database.js";

export default {
    name: "rpg_materials",
    description: "Visualização e venda de materiais do RPG",
    commands: ["materiais", "precos", "preços", "vender"],
    handle: async ({
        reply, isGroup, groupData, sender, prefix, command, args,
        MESSAGES
    }) => {
        if (!isGroup || !groupData.modorpg) return;

        const econ = loadEconomy();
        ensureEconomyDefaults(econ);
        const me = getEcoUser(econ, sender);
        const sub = command.toLowerCase();

        // Materiais e preços
        if (sub === 'materiais') {
            const mats = me.materials || {};
            const keys = Object.keys(mats).filter(k => mats[k] > 0);
            if (keys.length === 0) return reply(`╭━━━⊱ ⛏️ *MATERIAIS* ⛏️ ⊱━━━╮\n│\n│ 📭 Você não possui materiais\n│\n│ ⛏️ Mine para coletar!\n│ Use: ${prefix}minerar\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯`);
            let text = '╭━━━⊱ ⛏️ *MATERIAIS* ⛏️ ⊱━━━╮\n│\n';
            for (const k of keys) text += `│ 💎 ${k}: ${mats[k]}\n`;
            text += '│\n╰━━━━━━━━━━━━━━━━━━━━━━╯';
            return reply(text);
        }

        if (sub === 'precos' || sub === 'preços') {
            const mp = econ.materialsPrices || {};
            let text = '╭━━━⊱ 💱 *PREÇOS* 💱 ⊱━━━╮\n│\n│ 💎 *MATERIAIS (unidade)*\n│\n';
            for (const [k, v] of Object.entries(mp)) text += `│ 🔸 ${k}: ${fmt(v)}\n`;
            // Receitas básicas
            const r = econ.recipes || {};
            if (Object.keys(r).length > 0) {
                text += '│\n│ 📜 *RECEITAS*\n│\n';
                for (const [key, rec] of Object.entries(r)) {
                    const shopItem = econ.shop?.[key];
                    const name = shopItem?.name || key;
                    const req = Object.entries(rec.requires || {}).map(([mk, mq]) => `${mk} x${mq}`).join(', ');
                    text += `│ 🔨 ${name}\n│    ${req} + ${fmt(rec.gold || 0)}\n`;
                }
            }
            text += '│\n╰━━━━━━━━━━━━━━━━━━━━━━━━╯';
            return reply(text);
        }

        if (sub === 'vender') {
            const matKey = (args[0] || '').toLowerCase();
            if (!matKey) return reply(`╭━━━⊱ 💰 *VENDER MATERIAIS* 💰 ⊱━━━╮\n│\n│ 📝 *Uso:*\n│ ${prefix}vender <material> <qtd|all>\n│\n│ 💡 *Exemplo:*\n│ ${prefix}vender ferro 10\n│ ${prefix}vender ouro all\n│\n│ 💱 Ver preços: ${prefix}precos\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━╯`);
            const price = (econ.materialsPrices || {})[matKey];
            if (!price) return reply(`❌ Material inválido.\n\n💱 Veja preços com ${prefix}precos`);
            const have = me.materials?.[matKey] || 0;
            if (have <= 0) return reply(MESSAGES.rpg.itemNotFound);
            const qtyArg = args[1] || 'all';
            const qty = ['all', 'tudo', 'max'].includes((qtyArg || '').toLowerCase()) ? have : parseAmount(qtyArg, have);
            if (!isFinite(qty) || qty <= 0) return reply(MESSAGES.error.invalidQuantity);
            const gain = qty * price;
            me.materials[matKey] = have - qty;
            me.wallet += gain;
            saveEconomy(econ);
            return reply(`╭━━━⊱ ✅ *VENDA* ✅ ⊱━━━╮\n│\n│   Vendeu: ${qty}x ${matKey}\n│ 💰 Ganhou: ${fmt(gain)}\n│\n╰━━━━━━━━━━━━━━━━━━━━━╯`);
        }
    }
};
