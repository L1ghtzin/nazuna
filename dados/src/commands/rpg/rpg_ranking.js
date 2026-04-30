import { 
    loadEconomy, 
    ensureEconomyDefaults, 
    fmt
} from "../../utils/database.js";

export default {
    name: "rpg_ranking",
    description: "Rankings do RPG",
    commands: ["maiores", "toprich", "topriqueza", "toprpg"],
    handle: async ({ 
    reply, isGroup, groupData, command,
    MESSAGES
  }) => {
        if (isGroup && !groupData.modorpg) return;

        const econ = loadEconomy();
        ensureEconomyDefaults(econ);

        if (command === 'toprpg' || command === 'topriqueza' || command === 'toprich' || command === 'maiores') {
            const arr = Object.entries(econ.users)
                .map(([id, u]) => [id, (u.wallet || 0) + (u.bank || 0)])
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);

            if (arr.length === 0) return reply(`💔 Sem dados suficientes para ranking.`);

            let text = '⚔️ 🏆 *RANKING DE RIQUEZA* 🏆 ⚔️\n\n';
            const mentions = [];
            arr.forEach(([id, total], i) => {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                text += `${medal} @${id.split('@')[0]} — 💰 ${fmt(total)}\n`;
                mentions.push(id);
            });
            text += `\n✨ Continue jogando para subir no rank!`;
            return reply(text, { mentions });
        }
    }
};
