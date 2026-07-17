import { 
    loadEconomy, 
    ensureEconomyDefaults, 
    fmt
} from "../../utils/database.js";

export default {
    name: "ranking",
    description: "Rankings do RPG",
    commands: ["maiores", "toprich", "topriqueza", "toprpg"],
    handle: async ({ 
    reply, isGroup, groupData, command, prefix,
    MESSAGES
  }) => {
        if (isGroup && !groupData.modorpg) {
            return reply(MESSAGES.rpg.disabled(prefix));
        }

        const econ = loadEconomy();
        ensureEconomyDefaults(econ);

        if (command === 'toprpg' || command === 'topriqueza' || command === 'toprich' || command === 'maiores') {
            const arr = Object.entries(econ.users)
                .map(([id, u]) => [id, (u.wallet || 0) + (u.bank || 0)])
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);

            if (arr.length === 0) return reply(MESSAGES.rpg.notEnoughData);

            let text = MESSAGES.rpg.rankingHeader;
            const mentions = [];
            arr.forEach(([id, total], i) => {
                const medal = ['🥇', '🥈', '🥉'][i] || `${i + 1}.`;
                text += MESSAGES.rpg.rankingItem(medal, id.split('@')[0], fmt(total));
                mentions.push(id);
            });
            text += MESSAGES.rpg.rankingFooter;
            return reply(text, { mentions });
        }
    }
};
