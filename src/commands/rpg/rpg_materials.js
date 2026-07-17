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
        if (!isGroup || !groupData.modorpg) {
            return reply(MESSAGES.rpg.disabled(prefix));
        }

        const econ = loadEconomy();
        ensureEconomyDefaults(econ);
        const me = getEcoUser(econ, sender);
        const sub = command.toLowerCase();

        // Materiais e preços
        if (sub === 'materiais') {
            const mats = me.materials || {};
            const keys = Object.keys(mats).filter(k => mats[k] > 0);
            if (keys.length === 0) return reply(MESSAGES.rpg.materials.empty(prefix));
            let text = MESSAGES.rpg.materials.header;
            for (const k of keys) text += MESSAGES.rpg.materials.itemLine(k, mats[k]);
            text += MESSAGES.rpg.materials.footer;
            return reply(text);
        }

        if (sub === 'precos' || sub === 'preços') {
            const mp = econ.materialsPrices || {};
            let text = MESSAGES.rpg.materials.pricesHeader;
            for (const [k, v] of Object.entries(mp)) text += MESSAGES.rpg.materials.priceLine(k, fmt(v));
            // Receitas básicas
            const r = econ.recipes || {};
            if (Object.keys(r).length > 0) {
                text += MESSAGES.rpg.materials.recipesHeader;
                for (const [key, rec] of Object.entries(r)) {
                    const shopItem = econ.shop?.[key];
                    const name = shopItem?.name || key;
                    const req = Object.entries(rec.requires || {}).map(([mk, mq]) => `${mk} x${mq}`).join(', ');
                    text += MESSAGES.rpg.materials.recipeLine(name, req, fmt(rec.gold || 0));
                }
            }
            text += MESSAGES.rpg.materials.pricesFooter;
            return reply(text);
        }

        if (sub === 'vender') {
            const matKey = (args[0] || '').toLowerCase();
            if (!matKey) return reply(MESSAGES.rpg.materials.sellUsage(prefix));
            const price = (econ.materialsPrices || {})[matKey];
            if (!price) return reply(MESSAGES.rpg.materials.invalidMaterial(prefix));
            const have = me.materials?.[matKey] || 0;
            if (have <= 0) return reply(MESSAGES.rpg.itemNotFound);
            const qtyArg = args[1] || 'all';
            const qty = ['all', 'tudo', 'max'].includes((qtyArg || '').toLowerCase()) ? have : parseAmount(qtyArg, have);
            if (!isFinite(qty) || qty <= 0) return reply(MESSAGES.error.invalid('quantidade'));
            const gain = qty * price;
            me.materials[matKey] = have - qty;
            me.wallet += gain;
            saveEconomy(econ);
            return reply(MESSAGES.rpg.materials.sellSuccess(qty, matKey, fmt(gain)));
        }
    }
};
