import {
    loadEconomy,
    saveEconomy,
    getEcoUser,
    ensureEconomyDefaults,
    fmt
} from "../../utils/database.js";

export default {
    name: "rpg_shop",
    description: "Sistema de loja e inventário RPG",
    commands: ["loja", "lojarps", "comprar", "buy", "inventario", "inv"],
    handle: async ({
        reply, isGroup, groupData, sender, prefix, command, args, MESSAGES
    }) => {
        if (!isGroup) return reply(MESSAGES.rpg.core.groupOnly);
        if (!groupData.modorpg) return reply(MESSAGES.rpg.core.disabled(prefix));

        const econ = loadEconomy();
        ensureEconomyDefaults(econ);
        const me = getEcoUser(econ, sender);
        const sub = command.toLowerCase();

        if (sub === 'loja' || sub === 'lojarps') {
            let text = MESSAGES.rpg.core.shop.header;
            for (const [k, it] of Object.entries(econ.shop || {})) {
                text += MESSAGES.rpg.core.shop.item(k, it.name, fmt(it.price));
            }
            text += MESSAGES.rpg.core.shop.footer(prefix);
            return reply(text);
        }

        if (sub === 'comprar' || sub === 'buy') {
            const key = (args[0] || '').toLowerCase();
            const it = econ.shop?.[key];
            if (!it) return reply(MESSAGES.rpg.invalidItem);
            if (me.wallet < it.price) return reply(MESSAGES.rpg.insufficientCoins(it.price));
            me.wallet -= it.price;
            if (it.type === 'tool') {
                me.tools = me.tools || {};
                me.tools[it.toolType] = { tier: it.tier, dur: it.durability, max: it.durability, key };
            } else {
                me.inventory[key] = (me.inventory[key] || 0) + 1;
            }
            saveEconomy(econ);
            return reply(MESSAGES.rpg.core.shop.buySuccess(it.name));
        }

        if (sub === 'inventario' || sub === 'inv') {
            let text = MESSAGES.rpg.core.inventory.header;
            let count = 0;
            for (const [k, q] of Object.entries(me.inventory || {})) {
                if (q > 0) {
                    text += MESSAGES.rpg.core.inventory.item(k, q);
                    count++;
                }
            }
            if (count === 0) text += MESSAGES.rpg.core.inventory.empty;
            text += MESSAGES.rpg.core.inventory.footer;
            return reply(text);
        }
    }
};
