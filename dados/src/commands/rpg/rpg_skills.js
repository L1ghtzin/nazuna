import { 
    loadEconomy, 
    saveEconomy, 
    getEcoUser, 
    ensureEconomyDefaults, 
    ensureUserSkills,
    ensureUserPeriodChallenges,
    isPeriodCompleted,
    skillXpForNext,
    fmt
} from "../../utils/database.js";

const SKILL_LIST = ['mining', 'working', 'fishing', 'exploring', 'hunting', 'cooking', 'farming'];

export default {
    name: "rpg_skills",
    description: "Visualização de habilidades e desafios do RPG",
    commands: ["habilidades", "desafiosemanal", "desafiomensal", "conquistas", "achievements", "medalhas"],
    handle: async ({ 
    reply, isGroup, groupData, sender, prefix, command, args, pushname,
    MESSAGES
  }) => {
        if (!isGroup || !groupData.modorpg) return;

        const econ = loadEconomy();
        ensureEconomyDefaults(econ);
        const me = getEcoUser(econ, sender);
        const sub = command.toLowerCase();

        if (sub === 'habilidades') {
            ensureUserSkills(me);
            let text = '📚 *SUAS HABILIDADES*\n\n';
            for (const s of SKILL_LIST) {
                const sk = me.skills[s] || { level: 1, xp: 0 };
                text += `• ${s.toUpperCase()}: Nível ${sk.level} (${sk.xp}/${skillXpForNext(sk.level)})\n`;
            }
            return reply(text);
        }

        if (sub === 'desafiosemanal' || sub === 'desafiomensal') {
            ensureUserPeriodChallenges(me);
            const show = sub === 'desafiosemanal' ? me.weeklyChallenge : me.monthlyChallenge;
            if (!show) return reply(`💔 Desafio não disponível.`);

            const labels = { mine: 'Minerações', work: 'Trabalhos', fish: 'Pescarias', explore: 'Explorações', hunt: 'Caçadas', crimeSuccess: 'Crimes OK', plant: 'Plantações', harvest: 'Colheitas', cook: 'Cozinhas' };
            let text = `🏅 *DESAFIO ${sub === 'desafiosemanal' ? 'SEMANAL' : 'MENSAL'}*\n\n`;
            for (const t of (show.tasks || [])) {
                text += `• ${labels[t.type] || t.type}: ${t.progress || 0}/${t.target}\n`;
            }
            text += `\n💰 Prêmio: ${fmt(show.reward)} ${show.claimed ? '(COLETADO)' : ''}`;
            
            if (isPeriodCompleted(show) && !show.claimed) {
                text += `\n\n💡 Use: ${prefix}${sub} coletar`;
            }

            if ((args[0] || '').toLowerCase() === 'coletar') {
                if (show.claimed) return reply(`💔 Você já coletou este prêmio.`);
                if (!isPeriodCompleted(show)) return reply(`💔 Complete todas as tarefas para coletar.`);
                me.wallet += show.reward; 
                show.claimed = true; 
                saveEconomy(econ);
                return reply(`🎉 Você coletou ${fmt(show.reward)} do ${sub === 'desafiosemanal' ? 'desafio semanal' : 'desafio mensal'}!`);
            }
            return reply(text);
        }

        if (sub === 'conquistas' || sub === 'achievements' || sub === 'medalhas') {
            me.stats = me.stats || { totalMine: 0, totalWork: 0, totalFish: 0, totalHunt: 0, totalExplore: 0, totalWins: 0, totalCrimes: 0 };
            
            const achievements = [
                { id: 'minerador', name: '⛏️ Minerador', desc: 'Minere 100 vezes', req: me.stats.totalMine >= 100, progress: `${me.stats.totalMine || 0}/100` },
                { id: 'trabalhador', name: '💼 Trabalhador', desc: 'Trabalhe 50 vezes', req: me.stats.totalWork >= 50, progress: `${me.stats.totalWork || 0}/50` },
                { id: 'pescador', name: '🎣 Pescador', desc: 'Pesque 75 vezes', req: me.stats.totalFish >= 75, progress: `${me.stats.totalFish || 0}/75` },
                { id: 'cacador', name: '🏹 Caçador', desc: 'Cace 50 vezes', req: me.stats.totalHunt >= 50, progress: `${me.stats.totalHunt || 0}/50` },
                { id: 'explorador', name: '🗺️ Explorador', desc: 'Explore 100 vezes', req: me.stats.totalExplore >= 100, progress: `${me.stats.totalExplore || 0}/100` },
                { id: 'gladiador', name: '⚔️ Gladiador', desc: 'Vença 25 batalhas', req: me.stats.totalWins >= 25, progress: `${me.stats.totalWins || 0}/25` },
                { id: 'milionario', name: '💰 Milionário', desc: 'Tenha 500K no banco', req: (me.bank || 0) >= 500000, progress: `${(me.bank || 0).toLocaleString()}/500.000` },
                { id: 'veterano', name: '🏆 Veterano', desc: 'Alcance nível 50', req: (me.level || 1) >= 50, progress: `${me.level || 1}/50` }
            ];
            
            let text = `╭━━━⊱ 🏅 *CONQUISTAS* ⊱━━━╮\n│ Aventureiro: *${pushname}*\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
            for (const ach of achievements) {
                text += `${ach.req ? '✅' : '🔒'} *${ach.name}*\n  ${ach.desc}\n  📊 Progresso: ${ach.progress}\n\n`;
            }
            return reply(text);
        }
    }
};
