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
    mate: ['mate', 'chimarrao', 'chimarrão', 'tomarmate'],
    cerveja: ['cerveja', 'tomarcerveja', 'bebercerveja', 'breja']
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

        // 1. Verificar cooldown de uso próprio e condições
        if (consumableId === 'mate') {
            const lastUsed = me.cooldowns?.use_mate || 0;
            if (now < lastUsed) {
                return reply(MESSAGES.rpg.consumables.mate.cooldown(timeLeft(lastUsed)));
            }

            const cd = me.cooldowns?.work || 0;
            if (now >= cd) {
                return reply(MESSAGES.rpg.consumables.mate.notTired);
            }
        }

        if (consumableId === 'cerveja') {
            const lastUsed = me.cooldowns?.use_cerveja || 0;
            if (now < lastUsed) {
                return reply(MESSAGES.rpg.consumables.cerveja.cooldown(timeLeft(lastUsed)));
            }

            const cd = me.cooldowns?.explore || 0;
            if (now >= cd) {
                return reply(MESSAGES.rpg.consumables.cerveja.notTired);
            }
        }

        const result = useConsumable(me, consumableId);

        if (!result.success) {
            if (result.error === 'use_cooldown') {
                const cdKey = consumableId === 'mate' ? me.cooldowns?.use_mate : me.cooldowns?.use_cerveja;
                return reply(MESSAGES.rpg.consumables[consumableId].cooldown(timeLeft(cdKey)));
            }
            if (result.error === 'not_tired' || result.error === 'not_tired_explore') {
                return reply(MESSAGES.rpg.consumables[consumableId].notTired);
            }
            if (result.error === 'not_in_inventory') {
                return reply(MESSAGES.rpg.consumables[consumableId].notInInventory(prefix));
            }
            if (result.error === 'daily_limit_reached') {
                return reply(MESSAGES.rpg.consumables[consumableId].dailyLimitReached(result.limit));
            }
            return reply(MESSAGES.rpg.consumables.invalidConsumable);
        }

        saveEconomy(econ);

        const reductionMin = result.reductionMin || 0;
        
        if (consumableId === 'mate') {
            const quality = result.quality || 'standard';
            if (quality === 'washed') {
                return reply(MESSAGES.rpg.consumables.mate.successWashed(
                    result.usageCount,
                    result.dailyLimit
                ));
            } else if (quality === 'special') {
                return reply(MESSAGES.rpg.consumables.mate.successSpecial(
                    reductionMin,
                    result.usageCount,
                    result.dailyLimit
                ));
            } else {
                return reply(MESSAGES.rpg.consumables.mate.successStandard(
                    reductionMin,
                    result.usageCount,
                    result.dailyLimit
                ));
            }
        }

        if (consumableId === 'cerveja') {
            const quality = result.quality || 'standard';
            const drunk = result.drunkLevel || 0;
            let drunkMsg = '';
            if (drunk === 1) drunkMsg = '🥴 *Nível de Álcool:* Alegre (1/3)';
            else if (drunk === 2) drunkMsg = '🥴 *Nível de Álcool:* Altos Risos (2/3)';
            else if (drunk >= 3) drunkMsg = '🥴 *Nível de Álcool:* Completamente Bêbado! (3/3)\n⚠️ _Atenção: suas próximas explorações serão imprevisíveis!_';

            if (quality === 'choca') {
                return reply(MESSAGES.rpg.consumables.cerveja.successChoca(
                    drunkMsg,
                    result.usageCount,
                    result.dailyLimit
                ));
            } else if (quality === 'special') {
                return reply(MESSAGES.rpg.consumables.cerveja.successSpecial(
                    reductionMin,
                    drunkMsg,
                    result.usageCount,
                    result.dailyLimit
                ));
            } else {
                return reply(MESSAGES.rpg.consumables.cerveja.successStandard(
                    reductionMin,
                    drunkMsg,
                    result.usageCount,
                    result.dailyLimit
                ));
            }
        }

        return reply(MESSAGES.rpg.consumables.invalidConsumable);
    }
};
