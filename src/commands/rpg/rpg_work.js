import {
    loadEconomy,
    saveEconomy,
    getEcoUser,
    ensureEconomyDefaults,
    applyShopBonuses,
    fmt,
    timeLeft,
    addSkillXP,
    updateChallenge,
    updatePeriodChallenge,
    checkEcoLevelUp,
    findKeyIgnoringAccents,
    normalizeParam,
    getRewardMultipliers
} from "../../utils/database.js";
import { getWorkCooldownReduction, consumeEffect } from "../../funcs/utils/consumables.js";

export default {
    name: "rpg_work",
    description: "Sistema de trabalho RPG (Trabalhar, Vagas, Emprego)",
    commands: ["trabalhar", "work", "vagas", "emprego", "demitir"],
    handle: async ({
        reply, isGroup, groupData, sender, prefix, command, args, MESSAGES
    }) => {
        if (!isGroup) return reply(MESSAGES.rpg.core.groupOnly);
        if (!groupData.modorpg) return reply(MESSAGES.rpg.core.disabled(prefix));

        const econ = loadEconomy();
        ensureEconomyDefaults(econ);
        const me = getEcoUser(econ, sender);
        const { workBonus } = applyShopBonuses(me, econ);
        const sub = command.toLowerCase();

        if (sub === 'trabalhar' || sub === 'work') {
            const cd = me.cooldowns?.work || 0;
            if (Date.now() < cd) return reply(MESSAGES.rpg.core.working.cooldown(timeLeft(cd)));
            const job = econ.jobCatalog?.[me.job] || { min: 50, max: 100 };
            const gain = job.min + Math.floor(Math.random() * (job.max - job.min + 1));
            const bonus = Math.floor(gain * (workBonus || 0));
            
            const { xpMultiplier, coinMultiplier } = getRewardMultipliers(me);
            const finalGain = Math.floor((gain + bonus) * coinMultiplier);
            const boostBonus = finalGain - (gain + bonus);
            
            me.wallet += finalGain;
            me.exp = (me.exp || 0) + Math.floor(20 * xpMultiplier);

            const workCooldownReduction = getWorkCooldownReduction(me);
            const baseCooldown = 20 * 60 * 1000;
            const finalCooldown = Math.max(0, baseCooldown - workCooldownReduction);
            me.cooldowns.work = Date.now() + finalCooldown;

            let effectConsumedMsg = '';
            if (workCooldownReduction > 0) {
                consumeEffect(me, 'mate');
                const reductionMin = Math.floor(workCooldownReduction / 60000);
                effectConsumedMsg = `\n⚡ Efeito do Mate consumido! Cooldown reduzido em ${reductionMin} minutos.`;
            }

            addSkillXP(me, 'working', 1); updateChallenge(me, 'work', 1, true); updatePeriodChallenge(me, 'work', 1, true);
            if (!me.stats) me.stats = {};
            me.stats.totalWork = (me.stats.totalWork || 0) + 1;
            me.stats.workCount = (me.stats.workCount || 0) + 1;
            const levelUpRes = checkEcoLevelUp(me);
            saveEconomy(econ);
            let msg = MESSAGES.rpg.core.working.success(fmt(gain), fmt(bonus + boostBonus), fmt(finalGain));
            msg += effectConsumedMsg;
            if (levelUpRes.leveledUp) msg += MESSAGES.rpg.core.working.levelUp(levelUpRes.newLevel);
            return reply(msg);
        }

        if (sub === 'vagas') {
            let jobs = econ.jobCatalog || {};
            if (!jobs || Object.keys(jobs).length === 0) {
                jobs = {
                    "estagiario": { name: "Estagiário", min: 80, max: 140 },
                    "designer": { name: "Designer", min: 150, max: 250 },
                    "programador": { name: "Programador", min: 200, max: 350 },
                    "gerente": { name: "Gerente", min: 260, max: 420 }
                };
            }
            let txt = MESSAGES.rpg.core.employment.catalogHeader;
            Object.entries(jobs).forEach(([k, j]) => {
                txt += MESSAGES.rpg.core.employment.catalogItem(k, j.name, fmt(j.min), fmt(j.max));
            });
            txt += MESSAGES.rpg.core.employment.catalogFooter(prefix);
            return reply(txt);
        }

        if (sub === 'emprego') {
            const rawKey = (args[0] || '');
            if (!rawKey) return reply(MESSAGES.rpg.core.employment.usage(prefix));

            const defaultJobs = {
                "estagiario": { name: "Estagiário", min: 80, max: 140 },
                "designer": { name: "Designer", min: 150, max: 250 },
                "programador": { name: "Programador", min: 200, max: 350 },
                "gerente": { name: "Gerente", min: 260, max: 420 }
            };

            const jobCatalog = (econ.jobCatalog && Object.keys(econ.jobCatalog).length) ? econ.jobCatalog : defaultJobs;
            const key = findKeyIgnoringAccents(jobCatalog, rawKey) || normalizeParam(rawKey);
            const job = jobCatalog[key];
            if (!job) return reply(MESSAGES.rpg.jobNotFound(prefix));

            if (!econ.jobCatalog || Object.keys(econ.jobCatalog).length === 0) {
                econ.jobCatalog = jobCatalog;
            }

            me.job = key;
            saveEconomy(econ);
            return reply(MESSAGES.rpg.core.employment.hired(job.name, fmt(job.min), fmt(job.max), prefix));
        }

        if (sub === 'demitir') {
            me.job = null;
            saveEconomy(econ);
            return reply(MESSAGES.rpg.core.employment.resigned(prefix));
        }
    }
};
