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
        if (!isGroup || !groupData.modorpg) return;

        const econ = loadEconomy();
        ensureEconomyDefaults(econ);
        const me = getEcoUser(econ, sender);
        const { forgeBonus } = applyShopBonuses(me, econ);
        
        if (!me.materials) me.materials = {};
        if (!me.inventory) me.inventory = {};

        const rawCraftKey = (args[0] || '').toLowerCase();
        
        // List recipes
        if (!rawCraftKey && (command === 'forjar' || command === 'forge')) {
            let text = `╭━━━⊱ ⚒️ *RECEITAS DE FORJA* ⊱━━━╮\n│ 💰 Seu gold: ${fmt(me.wallet)}\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
            const recipes = econ.recipes || {};
            if (Object.keys(recipes).length === 0) {
                text += `💔 Nenhuma receita disponível.`;
            } else {
                text += `📜 *RECEITAS DISPONÍVEIS*\n\n`;
                for (const [key, recipe] of Object.entries(recipes)) {
                    const item = econ.shop[key];
                    if (!item) continue;
                    text += `🔸 *${item.name || key}*\n   💰 Custo: ${fmt(recipe.gold || 0)}\n`;
                    if (recipe.requires) {
                        text += `   📦 Materiais: ` + Object.entries(recipe.requires).map(([m, q]) => `${m} x${q}`).join(', ') + `\n`;
                    }
                    text += `   💡 Forjar: ${prefix}forjar ${key}\n\n`;
                }
            }
            return reply(text);
        }

        // Repair logic
        if (command === 'reparar' || command === 'repair') {
            const pick = me.tools?.pickaxe;
            if (!pick) return reply(`💔 Você não possui uma picareta para reparar.`);
            if (pick.dur >= pick.max) return reply('🛠️ Sua picareta já está em perfeito estado.');
            
            const cost = 200;
            if (me.wallet < cost) return reply(`💰 O conserto custa ${fmt(cost)}.`);
            
            me.wallet -= cost;
            pick.dur = pick.max;
            saveEconomy(econ);
            return reply(`🛠️ Picareta reparada com sucesso! Durabilidade: ${pick.max}/${pick.max}.`);
        }

        // Craft from recipe
        const craftKey = findKeyIgnoringAccents(econ.recipes || {}, rawCraftKey) || normalizeParam(rawCraftKey);
        if (craftKey && (econ.recipes || {})[craftKey]) {
            const rec = econ.recipes[craftKey];
            const reqs = rec.requires || {};
            for (const [mk, mq] of Object.entries(reqs)) {
                if ((me.materials?.[mk] || 0) < mq) return reply(`💔 Faltam materiais: ${mk} x${mq}.`);
            }
            if (me.wallet < (rec.gold || 0)) return reply(`💔 Gold insuficiente.`);

            for (const [mk, mq] of Object.entries(reqs)) me.materials[mk] -= mq;
            me.wallet -= (rec.gold || 0);

            const item = (econ.shop || {})[craftKey];
            if (item?.type === 'tool' && item.toolType === 'pickaxe') {
                me.tools.pickaxe = { tier: item.tier, dur: item.durability, max: item.durability, key: craftKey };
                saveEconomy(econ);
                return reply(`⚒️ Você forjou e equipou ${item.name}!`);
            }
            
            me.inventory[craftKey] = (me.inventory[craftKey] || 0) + 1;
            saveEconomy(econ);
            return reply(`⚒️ Você forjou ${item?.name || craftKey}!`);
        }

        // Minigame forge (fallback for 'forjar' without recipe)
        if (command === 'forjar' || command === 'forge') {
            const cd = me.cooldowns?.forge || 0;
            if (Date.now() < cd) return reply(`⏳ Aguarde ${timeLeft(cd)} para forjar novamente.`);
            if (me.wallet < 150) return reply(`💰 Você precisa de 150 moedas.`);
            
            me.wallet -= 150;
            if (Math.random() < 0.35) {
                const gain = 80 + Math.floor(Math.random() * 101);
                const bonus = Math.floor(gain * (forgeBonus || 0) * 0.5);
                me.wallet += (gain + bonus);
                me.cooldowns.forge = Date.now() + 25 * 60 * 1000;
                saveEconomy(econ);
                return reply(`⚒️ Forja bem-sucedida! Lucro ${fmt(gain + bonus)}.`);
            } else {
                me.cooldowns.forge = Date.now() + 25 * 60 * 1000;
                saveEconomy(econ);
                return reply(`🔥 A forja falhou.`);
            }
        }
    }
};
