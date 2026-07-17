import { 
    loadEconomy, 
    saveEconomy, 
    getEcoUser, 
    ensureEconomyDefaults, 
    fmt,
    timeLeft,
    getRewardMultipliers
} from "../../utils/database.js";

export default {
    name: "rpg_daily",
    description: "Recompensa diária e streak do RPG",
    commands: ["diario", "daily"],
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
        const now = Date.now();

        const cd = me.cooldowns?.daily || 0;
        if (now < cd) return reply(MESSAGES.rpg.daily.cooldown(timeLeft(cd)));

        // Sistema de Streak
        if (!me.streak) me.streak = { count: 0, lastClaim: 0, record: 0 };
        
        const oneDayMs = 24 * 60 * 60 * 1000;
        const twoDaysMs = 48 * 60 * 60 * 1000;
        const timeSinceLastClaim = now - me.streak.lastClaim;
        
        if (timeSinceLastClaim <= twoDaysMs && timeSinceLastClaim >= oneDayMs) me.streak.count += 1;
        else if (timeSinceLastClaim > twoDaysMs) me.streak.count = 1;
        else me.streak.count = 1;
        
        if (me.streak.count > me.streak.record) me.streak.record = me.streak.count;
        
        const baseReward = 150;
        const streakBonus = Math.min(me.streak.count * 10, 300);
        const totalReward = baseReward + streakBonus;
        
        let extraBonus = 0;
        let bonusMessage = '';
        if (me.streak.count % 7 === 0) {
            extraBonus = 500;
            bonusMessage = MESSAGES.rpg.daily.bonus7;
        }
        if (me.streak.count % 30 === 0) {
            extraBonus += 2000;
            bonusMessage += MESSAGES.rpg.daily.bonus30;
        }
        
        const { xpMultiplier, coinMultiplier } = getRewardMultipliers(me);
        const finalReward = Math.floor((totalReward + extraBonus) * coinMultiplier);
        me.wallet += finalReward;
        me.streak.lastClaim = now;
        me.cooldowns.daily = now + oneDayMs;
        
        const xpGain = Math.floor((50 + (me.streak.count * 5)) * xpMultiplier);
        me.exp = (me.exp || 0) + xpGain;
        
        // Level up check
        const level = me.level || 1;
        const nextLevelXp = 100 * Math.pow(1.5, level - 1);
        let leveledUp = false;
        while (me.exp >= nextLevelXp) {
            me.exp -= nextLevelXp;
            me.level = (me.level || 1) + 1;
            leveledUp = true;
        }
        
        saveEconomy(econ);
        
        let text = MESSAGES.rpg.daily.rewardHeader;
        text += MESSAGES.rpg.daily.rewardBase(fmt(baseReward));
        text += MESSAGES.rpg.daily.rewardStreak(me.streak.count, fmt(streakBonus));
        if (extraBonus > 0) text += MESSAGES.rpg.daily.rewardExtra(fmt(extraBonus));
        text += MESSAGES.rpg.daily.rewardDivider;
        text += MESSAGES.rpg.daily.rewardTotal(fmt(finalReward));
        text += MESSAGES.rpg.daily.rewardXp(xpGain);
        text += MESSAGES.rpg.daily.rewardSequence(me.streak.count, me.streak.count !== 1 ? 's' : '');
        text += MESSAGES.rpg.daily.rewardRecord(me.streak.record, me.streak.record !== 1 ? 's' : '');
        text += MESSAGES.rpg.daily.rewardFooter;
        
        if (bonusMessage) text += bonusMessage;
        if (leveledUp) text += MESSAGES.rpg.daily.levelUp(me.level);
        
        return reply(text);
    }
};
