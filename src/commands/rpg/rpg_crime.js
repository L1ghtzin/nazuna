import { 
    loadEconomy, 
    saveEconomy, 
    getEcoUser, 
    ensureEconomyDefaults, 
    fmt,
    timeLeft,
    getUserName,
    getSkillBonus,
    addSkillXP,
    updateChallenge,
    updatePeriodChallenge
} from "../../utils/database.js";

export default {
    name: "rpg_crime",
    description: "Sistema de crimes e assaltos do RPG",
    commands: ["assaltar", "roubar", "crime"],
    handle: async ({ 
    reply, isGroup, groupData, sender, prefix, command, args, menc_os2, bot,
    MESSAGES
  }) => {
        if (!isGroup) return reply(MESSAGES.rpg.groupOnly);
        if (!groupData.modorpg) return reply(MESSAGES.rpg.disabled(prefix));

        const mentioned = menc_os2;
        const econ = loadEconomy();
        ensureEconomyDefaults(econ);
        const me = getEcoUser(econ, sender);
        const sub = command.toLowerCase();

        if (sub === 'assaltar' || sub === 'roubar') {
            if (!mentioned) return reply(MESSAGES.rpg.crime.needTarget);
            if (mentioned === sender) return reply(MESSAGES.rpg.crime.cantTargetSelf);

            const cd = me.cooldowns?.rob || 0;
            if (Date.now() < cd) return reply(MESSAGES.rpg.crime.cooldownRob(timeLeft(cd)));

            const target = getEcoUser(econ, mentioned);
            const maxSteal = Math.min(target.wallet, 300);
            
            if (maxSteal <= 0) {
                me.cooldowns.rob = Date.now() + 10 * 60 * 1000;
                saveEconomy(econ);
                return reply(MESSAGES.rpg.crime.victimNoMoney);
            }

            const chance = Math.random();
            if (chance < 0.5) {
                const amt = 50 + Math.floor(Math.random() * Math.max(1, maxSteal - 49));
                target.wallet -= amt; 
                me.wallet += amt;
                me.cooldowns.rob = Date.now() + 10 * 60 * 1000;
                saveEconomy(econ);
                return reply(MESSAGES.rpg.crime.robSuccess(mentioned.split('@')[0], fmt(amt)), { mentions: [mentioned] });
            } else {
                const multa = 80 + Math.floor(Math.random() * 121);
                const pay = Math.min(me.wallet, multa);
                me.wallet -= pay; 
                target.wallet += pay;
                me.cooldowns.rob = Date.now() + 10 * 60 * 1000;
                saveEconomy(econ);
                return reply(MESSAGES.rpg.crime.robFailed(mentioned.split('@')[0], fmt(pay)), { mentions: [mentioned] });
            }
        }

        if (sub === 'crime') {
            const cd = me.cooldowns?.crime || 0; 
            if (Date.now() < cd) return reply(MESSAGES.rpg.crime.cooldownCrime(timeLeft(cd)));
            
            if (Math.random() < 0.18) {
                const gain = 40 + Math.floor(Math.random() * 61);
                const skillB = getSkillBonus(me, 'crime');
                const totalGain = Math.floor(gain * (1 + skillB * 0.3));
                me.wallet += totalGain;
                me.cooldowns.crime = Date.now() + 30 * 60 * 1000;
                addSkillXP(me, 'crime', 1);
                updateChallenge(me, 'crimeSuccess', 1, true);
                updatePeriodChallenge(me, 'crimeSuccess', 1, true);
                // Rastrear stats
                if (!me.stats) me.stats = {};
                me.stats.totalCrimes = (me.stats.totalCrimes || 0) + 1;
                saveEconomy(econ);
                return reply(MESSAGES.rpg.crime.crimeSuccess(fmt(totalGain)));
            } else {
                const fine = 200 + Math.floor(Math.random() * 401);
                const pay = Math.min(me.wallet, fine);
                me.wallet -= pay;
                me.cooldowns.crime = Date.now() + 30 * 60 * 1000;
                saveEconomy(econ);
                return reply(MESSAGES.rpg.crime.crimeFailed(fmt(pay)));
            }
        }
    }
};
