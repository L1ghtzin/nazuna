import { 
    loadEconomy, 
    saveEconomy, 
    getEcoUser, 
    ensureEconomyDefaults, 
    fmt,
    timeLeft
} from "../../utils/database.js";

export default {
    name: "rpg_daily",
    description: "Recompensa diária e streak do RPG",
    commands: ["diario", "daily"],
    handle: async ({ 
    reply, isGroup, groupData, sender, prefix, command, args,
    MESSAGES
  }) => {
        if (!isGroup || !groupData.modorpg) return;

        const econ = loadEconomy();
        ensureEconomyDefaults(econ);
        const me = getEcoUser(econ, sender);
        const now = Date.now();

        const cd = me.cooldowns?.daily || 0;
        if (now < cd) return reply(`⏳ Você já coletou hoje!\n\n🕐 Volte em: ${timeLeft(cd)}`);

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
            bonusMessage = '\n🎉 *BÔNUS DE 7 DIAS:* +500!';
        }
        if (me.streak.count % 30 === 0) {
            extraBonus += 2000;
            bonusMessage += '\n🏆 *BÔNUS DE 30 DIAS:* +2000!';
        }
        
        const finalReward = totalReward + extraBonus;
        me.wallet += finalReward;
        me.streak.lastClaim = now;
        me.cooldowns.daily = now + oneDayMs;
        
        const xpGain = 50 + (me.streak.count * 5);
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
        
        let text = `╭━━━⊱ 🎁 *RECOMPENSA DIÁRIA* ⊱━━━╮\n`;
        text += `│\n│ 💰 Base: +${fmt(baseReward)}\n`;
        text += `│ 🔥 Streak (${me.streak.count}x): +${fmt(streakBonus)}\n`;
        if (extraBonus > 0) text += `│ ✨ Bônus: +${fmt(extraBonus)}\n`;
        text += `│ ━━━━━━━━━━━━━━\n`;
        text += `│ 💵 Total: *${fmt(finalReward)}*\n`;
        text += `│ ⚡ XP: +${xpGain}\n│\n`;
        text += `│ 🔥 Sequência: *${me.streak.count} dia${me.streak.count !== 1 ? 's' : ''}*\n`;
        text += `│ 🏆 Recorde: ${me.streak.record} dia${me.streak.record !== 1 ? 's' : ''}\n│\n`;
        text += `╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;
        
        if (bonusMessage) text += bonusMessage;
        if (leveledUp) text += `\n\n⚡ *LEVEL UP!* Agora você é level ${me.level}!`;
        
        return reply(text);
    }
};
