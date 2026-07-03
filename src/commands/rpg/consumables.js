import {
    loadEconomy,
    saveEconomy,
    getEcoUser,
    ensureEconomyDefaults,
    timeLeft
} from "../../utils/database.js";

import {
    useConsumable,
    getConsumableConfig
} from "../../funcs/utils/consumables.js";

const CONSUMABLE_COMMAND_ALIASES = {
    mate: ['mate', 'chimarrao', 'chimarrão', 'tomarmate']
};

export default {
    name: "consumables",
    description: "Consumíveis que aplicam efeitos temporários no RPG",
    commands: Object.values(CONSUMABLE_COMMAND_ALIASES).flat(),
    handle: async ({
        reply, isGroup, groupData, sender, prefix, command, q, args,
        MESSAGES
    }) => {
        if (!isGroup) return reply(MESSAGES.rpg.core.groupOnly);
        if (!groupData.modorpg) return reply(MESSAGES.rpg.core.disabled(prefix));

        const sub = command.toLowerCase();

        let consumableId = null;
        for (const [id, aliases] of Object.entries(CONSUMABLE_COMMAND_ALIASES)) {
            if (aliases.includes(sub)) {
                consumableId = id;
                break;
            }
        }

        if (!consumableId) return reply(MESSAGES.rpg.consumables.invalidConsumable);

        const config = getConsumableConfig(consumableId);
        if (!config) return reply(MESSAGES.rpg.consumables.invalidConsumable);

        const econ = loadEconomy();
        ensureEconomyDefaults(econ);
        const me = getEcoUser(econ, sender);

        const now = Date.now();

        // 1. Verificar cooldown de uso próprio
        if (consumableId === 'mate') {
            const lastUsed = me.cooldowns?.use_mate || 0;
            if (now < lastUsed) {
                return reply(MESSAGES.rpg.consumables.mate.cooldown(timeLeft(lastUsed)));
            }

            // 2. Bloquear uso se não houver cooldown de trabalho ativo
            const cd = me.cooldowns?.work || 0;
            if (now >= cd) {
                return reply(MESSAGES.rpg.consumables.mate.notTired);
            }
        }

        const result = useConsumable(me, consumableId);

        if (!result.success) {
            if (result.error === 'use_cooldown') {
                return reply(MESSAGES.rpg.consumables.mate.cooldown(timeLeft(now + result.timeLeft)));
            }
            if (result.error === 'not_tired') {
                return reply(MESSAGES.rpg.consumables.mate.notTired);
            }
            if (result.error === 'not_in_inventory') {
                return reply(MESSAGES.rpg.consumables.mate.notInInventory(prefix));
            }
            if (result.error === 'daily_limit_reached') {
                return reply(MESSAGES.rpg.consumables.mate.dailyLimitReached(result.limit));
            }
            return reply(MESSAGES.rpg.consumables.invalidConsumable);
        }

        saveEconomy(econ);

        const reductionMin = result.reductionMin || Math.floor((config.effects.workCooldownReduction || 0) / 60000);
        
        if (result.appliedDirectly) {
            return reply(MESSAGES.rpg.consumables.mate.successDirect(
                reductionMin,
                result.usageCount,
                result.dailyLimit
            ));
        }

        return reply(MESSAGES.rpg.consumables.mate.success(
            reductionMin,
            result.usageCount,
            result.dailyLimit
        ));
    }
};
