import { 
    loadEconomy, 
    saveEconomy, 
    getEcoUser, 
    ensureEconomyDefaults, 
    applyShopBonuses,
    findKeyIgnoringAccents,
    normalizeParam,
    fmt,
    timeLeft
} from "../../utils/database.js";

export default {
    name: "rpg_forge",
    description: "Sistema de forja de equipamentos e ferramentas",
    commands: ["forge", "forjar", "reparar"],
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
        const { forgeBonus } = applyShopBonuses(me, econ);
        
        if (!me.materials) me.materials = {};
        if (!me.inventory) me.inventory = {};

        const rawCraftKey = (args[0] || '').toLowerCase();
        
        // List recipes
        if (!rawCraftKey && (command === 'forjar' || command === 'forge')) {
            let text = MESSAGES.rpg.forge.recipesHeader(fmt(me.wallet));
            const recipes = econ.recipes || {};
            if (Object.keys(recipes).length === 0) {
                text += MESSAGES.rpg.forge.noRecipes;
            } else {
                text += MESSAGES.rpg.forge.recipesTitle;
                for (const [key, recipe] of Object.entries(recipes)) {
                    const item = econ.shop[key];
                    if (!item) continue;
                    const matsText = recipe.requires ? Object.entries(recipe.requires).map(([m, q]) => `${m} x${q}`).join(', ') : '—';
                    text += MESSAGES.rpg.forge.recipeLine(item.name || key, fmt(recipe.gold || 0), matsText, prefix, key);
                }
            }
            return reply(text);
        }

        // Repair logic
        if (command === 'reparar' || command === 'repair') {
            const pick = me.tools?.pickaxe;
            if (!pick) return reply(MESSAGES.rpg.forge.noPickaxe);
            if (pick.dur >= pick.max) return reply(MESSAGES.rpg.forge.pickaxePerfect);
            
            const cost = 200;
            if (me.wallet < cost) return reply(MESSAGES.rpg.forge.repairCost(fmt(cost)));
            
            me.wallet -= cost;
            pick.dur = pick.max;
            saveEconomy(econ);
            return reply(MESSAGES.rpg.forge.repairSuccess(pick.max, pick.max));
        }

        // Craft from recipe
        const craftKey = findKeyIgnoringAccents(econ.recipes || {}, rawCraftKey) || normalizeParam(rawCraftKey);
        if (craftKey && (econ.recipes || {})[craftKey]) {
            const rec = econ.recipes[craftKey];
            const reqs = rec.requires || {};
            for (const [mk, mq] of Object.entries(reqs)) {
                if ((me.materials?.[mk] || 0) < mq) return reply(MESSAGES.rpg.forge.missingMaterials(mk, mq));
            }
            if (me.wallet < (rec.gold || 0)) return reply(MESSAGES.rpg.forge.insufficientGold);

            for (const [mk, mq] of Object.entries(reqs)) me.materials[mk] -= mq;
            me.wallet -= (rec.gold || 0);

            const item = (econ.shop || {})[craftKey];
            if (item?.type === 'tool' && item.toolType === 'pickaxe') {
                me.tools.pickaxe = { tier: item.tier, dur: item.durability, max: item.durability, key: craftKey };
                saveEconomy(econ);
                return reply(MESSAGES.rpg.forge.forgedAndEquipped(item.name));
            }
            
            me.inventory[craftKey] = (me.inventory[craftKey] || 0) + 1;
            saveEconomy(econ);
            return reply(MESSAGES.rpg.forge.forgedItem(item?.name || craftKey));
        }

        // Minigame forge (fallback for 'forjar' without recipe)
        if (command === 'forjar' || command === 'forge') {
            const cd = me.cooldowns?.forge || 0;
            if (Date.now() < cd) return reply(MESSAGES.rpg.forge.cooldown(timeLeft(cd)));
            if (me.wallet < 150) return reply(MESSAGES.rpg.forge.insufficientCoins);
            
            me.wallet -= 150;
            if (Math.random() < 0.35) {
                const gain = 80 + Math.floor(Math.random() * 101);
                const bonus = Math.floor(gain * (forgeBonus || 0) * 0.5);
                me.wallet += (gain + bonus);
                me.cooldowns.forge = Date.now() + 25 * 60 * 1000;
                saveEconomy(econ);
                return reply(MESSAGES.rpg.forge.forgeSuccess(fmt(gain + bonus)));
            } else {
                me.cooldowns.forge = Date.now() + 25 * 60 * 1000;
                saveEconomy(econ);
                return reply(MESSAGES.rpg.forge.forgeFailed);
            }
        }
    }
};
