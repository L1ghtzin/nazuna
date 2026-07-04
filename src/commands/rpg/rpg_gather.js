import {
    loadEconomy,
    saveEconomy,
    getEcoUser,
    ensureEconomyDefaults,
    applyShopBonuses,
    fmt,
    timeLeft,
    getActivePickaxe,
    getSkillBonus,
    addSkillXP,
    updateChallenge,
    updatePeriodChallenge,
    giveMaterial,
    PICKAXE_TIER_MULT,
    getRewardMultipliers
} from "../../utils/database.js";

export default {
    name: "rpg_gather",
    description: "Sistema de coleta RPG (Mineração, Pesca, Exploração, Caça)",
    commands: ["minerar", "mine", "pescar", "fish", "explorar", "explore", "cacar", "caçar", "hunt"],
    handle: async ({
        reply, isGroup, groupData, sender, prefix, command, MESSAGES
    }) => {
        if (!isGroup) return reply(MESSAGES.rpg.core.groupOnly);
        if (!groupData.modorpg) return reply(MESSAGES.rpg.core.disabled(prefix));

        const econ = loadEconomy();
        ensureEconomyDefaults(econ);
        const me = getEcoUser(econ, sender);
        const { mineBonus, fishBonus, exploreBonus, huntBonus } = applyShopBonuses(me, econ);
        const sub = command.toLowerCase();

        if (sub === 'minerar' || sub === 'mine') {
            const cd = me.cooldowns?.mine || 0;
            if (Date.now() < cd) return reply(MESSAGES.rpg.core.mining.cooldown(timeLeft(cd)));
            const pk = getActivePickaxe(me);
            if (!pk) return reply(MESSAGES.rpg.core.mining.needPickaxe(prefix));
            const tierMult = PICKAXE_TIER_MULT[pk.tier] || 1.0;
            const base = 100 + Math.floor(Math.random() * 101);
            const skillB = getSkillBonus(me, 'mining');
            const raw = Math.floor(base * tierMult);
            const bonus = Math.floor(raw * ((mineBonus || 0) + skillB));
            const total = raw + bonus;
            
            const { coinMultiplier } = getRewardMultipliers(me);
            const finalTotal = Math.floor(total * coinMultiplier);
            const boostBonus = finalTotal - total;
            me.wallet += finalTotal;
            let drops = { pedra: 2 + Math.floor(Math.random() * 3) };
            if (pk.tier === 'ferro' || pk.tier === 'diamante') {
                drops.ferro = (drops.ferro || 0) + 1 + Math.floor(Math.random() * 2);
                drops.carvao = (drops.carvao || 0) + (Math.random() < 0.4 ? 1 : 0);
            }
            if (pk.tier === 'diamante') {
                drops.ferro = (drops.ferro || 0) + (Math.random() < 0.7 ? 1 : 0);
                drops.ouro = (drops.ouro || 0) + (Math.random() < 0.3 ? 1 : 0);
                drops.carvao = (drops.carvao || 0) + (Math.random() < 0.6 ? 1 : 0);
                if (Math.random() < 0.1) drops.diamante = (drops.diamante || 0) + 1;
            }
            for (const [mk, mq] of Object.entries(drops)) if (mq > 0) giveMaterial(me, mk, mq);
            const before = pk.dur; pk.dur = Math.max(0, pk.dur - 1);
            me.tools.pickaxe = { ...pk, max: pk.max ?? (pk.tier === 'bronze' ? 20 : pk.tier === 'ferro' ? 60 : pk.tier === 'diamante' ? 150 : pk.dur) };
            me.cooldowns.mine = Date.now() + 10 * 60 * 1000;
            addSkillXP(me, 'mining', 1); updateChallenge(me, 'mine', 1, true); updatePeriodChallenge(me, 'mine', 1, true);
            if (!me.stats) me.stats = {};
            me.stats.totalMine = (me.stats.totalMine || 0) + 1;
            me.stats.mineCount = (me.stats.mineCount || 0) + 1;
            saveEconomy(econ);
            let dropTxt = Object.entries(drops).filter(([, q]) => q > 0).map(([k, q]) => `${k} x${q}`).join(', ');
            const broke = pk.dur === 0 && before > 0;
            return reply(MESSAGES.rpg.core.mining.success(fmt(finalTotal), (bonus + boostBonus) > 0 ? `(bônus ${fmt(bonus + boostBonus)})` : '', dropTxt || '—', pk.dur, me.tools.pickaxe.max, broke));
        }

        if (sub === 'pescar' || sub === 'fish') {
            const cd = me.cooldowns?.fish || 0;
            if (Date.now() < cd) return reply(MESSAGES.rpg.core.fishing.cooldown(timeLeft(cd)));
            const base = 80 + Math.floor(Math.random() * 121);
            const skillB = getSkillBonus(me, 'fishing');
            const bonus = Math.floor(base * ((fishBonus || 0) + skillB));
            const total = base + bonus;
            
            const { coinMultiplier } = getRewardMultipliers(me);
            const finalTotal = Math.floor(total * coinMultiplier);
            const boostBonus = finalTotal - total;
            me.wallet += finalTotal;
            me.cooldowns.fish = Date.now() + 12 * 60 * 1000;
            addSkillXP(me, 'fishing', 1); updateChallenge(me, 'fish', 1, true); updatePeriodChallenge(me, 'fish', 1, true);
            me.ingredients = me.ingredients || {};
            const fishQty = 2 + Math.floor(Math.random() * 3);
            me.ingredients.peixe = (me.ingredients.peixe || 0) + fishQty;
            if (!me.stats) me.stats = {};
            me.stats.totalFish = (me.stats.totalFish || 0) + 1;
            me.stats.fishCount = (me.stats.fishCount || 0) + 1;
            saveEconomy(econ);
            const bonusText = (bonus + boostBonus) > 0 ? `│ ✨ Bônus: *+${fmt(bonus + boostBonus)}*\n` : '';
            return reply(MESSAGES.rpg.core.fishing.success(fmt(finalTotal), bonusText, fishQty));
        }

        if (sub === 'explorar' || sub === 'explore') {
            const cd = me.cooldowns?.explore || 0;
            if (Date.now() < cd) return reply(MESSAGES.rpg.core.exploring.cooldown(timeLeft(cd)));
            const base = 100 + Math.floor(Math.random() * 151);
            const skillB = getSkillBonus(me, 'exploring');
            const bonus = Math.floor(base * ((exploreBonus || 0) + skillB));
            const total = base + bonus;
            
            const { coinMultiplier } = getRewardMultipliers(me);
            const finalTotal = Math.floor(total * coinMultiplier);
            const boostBonus = finalTotal - total;
            me.wallet += finalTotal;
            me.cooldowns.explore = Date.now() + 15 * 60 * 1000;
            addSkillXP(me, 'exploring', 1); updateChallenge(me, 'explore', 1, true); updatePeriodChallenge(me, 'explore', 1, true);
            if (!me.stats) me.stats = {};
            me.stats.totalExplore = (me.stats.totalExplore || 0) + 1;
            me.stats.exploreCount = (me.stats.exploreCount || 0) + 1;
            const matsGain = {};
            if (Math.random() < 0.6) matsGain.madeira = 1 + Math.floor(Math.random() * 3);
            if (Math.random() < 0.3) matsGain.corda = 1;
            if (Math.random() < 0.4) matsGain.linha = 1 + Math.floor(Math.random() * 2);
            if (Math.random() < 0.2) matsGain.cristal = 1;
            for (const [mk, mq] of Object.entries(matsGain)) giveMaterial(me, mk, mq);
            saveEconomy(econ);
            const bonusText = (bonus + boostBonus) > 0 ? `│ ✨ Bônus: *+${fmt(bonus + boostBonus)}*\n` : '';
            const matsText = Object.keys(matsGain).length > 0 ? `│ 📦 Materiais: ` + Object.entries(matsGain).map(([k, q]) => `${k} x${q}`).join(', ') + `\n` : '';
            return reply(MESSAGES.rpg.core.exploring.success(fmt(finalTotal), bonusText, matsText));
        }

        if (sub === 'cacar' || sub === 'caçar' || sub === 'hunt') {
            const cd = me.cooldowns?.hunt || 0;
            if (Date.now() < cd) return reply(MESSAGES.rpg.core.hunting.cooldown(timeLeft(cd)));
            const base = 60 + Math.floor(Math.random() * 61);
            const skillB = getSkillBonus(me, 'hunting');
            const bonus = Math.floor(base * ((huntBonus || 0) + skillB) * 0.7);
            const total = base + bonus;
            
            const { coinMultiplier } = getRewardMultipliers(me);
            const finalTotal = Math.floor(total * coinMultiplier);
            const boostBonus = finalTotal - total;
            me.wallet += finalTotal;
            me.cooldowns.hunt = Date.now() + 22 * 60 * 1000;
            addSkillXP(me, 'hunting', 1); updateChallenge(me, 'hunt', 1, true); updatePeriodChallenge(me, 'hunt', 1, true);
            me.ingredients = me.ingredients || {};
            const meatQty = 1 + (Math.random() < 0.25 ? 1 : 0);
            me.ingredients.carne = (me.ingredients.carne || 0) + meatQty;
            const huntMats = {};
            if (Math.random() < 0.5) huntMats.couro = 1 + Math.floor(Math.random() * 2);
            for (const [mk, mq] of Object.entries(huntMats)) giveMaterial(me, mk, mq);
            saveEconomy(econ);
            const bonusText = (bonus + boostBonus) > 0 ? `│ ✨ Bônus: *+${fmt(bonus + boostBonus)}*\n` : '';
            const matsText = Object.keys(huntMats).length > 0 ? `│ 📦 Materiais: ` + Object.entries(huntMats).map(([k, q]) => `${k} x${q}`).join(', ') + `\n` : '';
            return reply(MESSAGES.rpg.core.hunting.success(fmt(finalTotal), bonusText, meatQty, matsText));
        }
    }
};
