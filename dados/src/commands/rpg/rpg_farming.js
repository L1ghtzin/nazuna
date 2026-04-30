import { 
    loadEconomy, 
    saveEconomy, 
    getEcoUser, 
    ensureEconomyDefaults, 
    addSkillXP, 
    updateChallenge, 
    updatePeriodChallenge, 
    updateQuestProgress,
    fmt
} from "../../utils/database.js";

export default {
    name: "rpg_farming",
    description: "Sistema de plantação e colheita do RPG",
    commands: ["plantacao", "plantação", "horta", "plantar", "plant", "farm", "colher", "harvest", "sementes"],
    handle: async ({ 
    reply, isGroup, groupData, sender, prefix, command, args,
    MESSAGES
  }) => {
        if (!isGroup || !groupData.modorpg) return;

        const econ = loadEconomy();
        ensureEconomyDefaults(econ);
        const me = getEcoUser(econ, sender);
        const sub = command.toLowerCase();

        // Inicializa sementes se não existir
        if (!econ.seeds) {
            econ.seeds = {
                trigo: { name: '🌾 Trigo', cost: 20, growTime: 5 * 60 * 1000, yield: { trigo: 3 } },
                cenoura: { name: '🥕 Cenoura', cost: 15, growTime: 4 * 60 * 1000, yield: { cenoura: 2 } },
                batata: { name: '🥔 Batata', cost: 15, growTime: 4 * 60 * 1000, yield: { batata: 2 } },
                tomate: { name: '🍅 Tomate', cost: 18, growTime: 6 * 60 * 1000, yield: { tomate: 3 } },
                alface: { name: '🥬 Alface', cost: 12, growTime: 3 * 60 * 1000, yield: { alface: 2 } },
                milho: { name: '🌽 Milho', cost: 25, growTime: 7 * 60 * 1000, yield: { milho: 4 } },
                arroz: { name: '🌾 Arroz', cost: 22, growTime: 8 * 60 * 1000, yield: { arroz: 4 } },
                cana: { name: '🌿 Cana-de-açúcar', cost: 30, growTime: 10 * 60 * 1000, yield: { acucar: 5 } },
                galinha: { name: '🐔 Galinha', cost: 35, growTime: 15 * 60 * 1000, yield: { ovo: 2 } },
                vaca: { name: '🐄 Vaca', cost: 50, growTime: 20 * 60 * 1000, yield: { queijo: 3 } }
            };
            saveEconomy(econ);
        }

        if (sub === 'plantacao' || sub === 'plantação' || sub === 'horta') {
            me.farm = me.farm || { plots: [], maxPlots: 4, lastExpansion: 0 };
            const now = Date.now();
            let text = '🌾 *MINHA PLANTAÇÃO*\n\n';
            text += `📊 Terrenos: ${me.farm.plots.length}/${me.farm.maxPlots}\n\n`;

            if (me.farm.plots.length === 0) {
                text += '🌱 Sua plantação está vazia!\n\n';
            } else {
                me.farm.plots.forEach((plot, idx) => {
                    const timeLeft = plot.readyAt - now;
                    const isReady = timeLeft <= 0;
                    const seed = econ.seeds?.[plot.seed] || { name: plot.seed };
                    text += `🌱 *Terreno ${idx + 1}*\n  Semente: ${seed.name}\n`;
                    if (isReady) text += `  ✅ Pronto para colher!\n`;
                    else text += `  ⏳ Pronto em: ${Math.ceil(timeLeft / 60000)} min\n`;
                    text += `\n`;
                });
            }
            text += `💡 *Comandos:*\n🌱 Plantar: ${prefix}plantar <semente>\n🌾 Colher: ${prefix}colher\n📦 Sementes: ${prefix}sementes`;
            return reply(text);
        }

        if (sub === 'plantar' || sub === 'plant' || sub === 'farm') {
            const seedKey = (args[0] || '').toLowerCase();
            if (!seedKey) {
                let text = '🌱 *SISTEMA DE PLANTAÇÃO*\n\n📦 *Sementes Disponíveis:*\n\n';
                for (const [key, seed] of Object.entries(econ.seeds)) {
                    const mins = Math.floor(seed.growTime / 60000);
                    const yieldText = Object.entries(seed.yield).map(([k, v]) => `${k} x${v}`).join(', ');
                    text += `${seed.name}\n  💰 Custo: ${fmt(seed.cost)}\n  ⏱️ Tempo: ${mins} min\n  🌾 Colheita: ${yieldText}\n\n`;
                }
                text += `🌱 Plantar: ${prefix}plantar <semente>\n💡 Exemplo: ${prefix}plantar trigo`;
                return reply(text);
            }

            const seed = econ.seeds[seedKey];
            if (!seed) return reply(`💔 Semente não encontrada! Use ${prefix}plantar para ver as sementes disponíveis.`);

            me.farm = me.farm || { plots: [], maxPlots: 4, lastExpansion: 0 };
            if (me.farm.plots.length >= me.farm.maxPlots) return reply(`🌾 Todos os seus terrenos estão ocupados! Aguarde a colheita ou expanda sua fazenda.`);

            if (me.wallet < seed.cost) return reply(`💰 Você precisa de ${fmt(seed.cost)} para plantar ${seed.name}. Saldo: ${fmt(me.wallet)}`);

            me.wallet -= seed.cost;
            const now = Date.now();
            me.farm.plots.push({ seed: seedKey, plantedAt: now, readyAt: now + seed.growTime });

            addSkillXP(me, 'farming', 1);
            updateChallenge(me, 'plant', 1, true);
            updatePeriodChallenge(me, 'plant', 1, true);
            saveEconomy(econ);

            return reply(`🌱 ${seed.name} plantado com sucesso!\n\n⏱️ Estará pronto para colher em ${Math.floor(seed.growTime / 60000)} minutos.\n🌾 Terrenos ocupados: ${me.farm.plots.length}/${me.farm.maxPlots}`);
        }

        if (sub === 'colher' || sub === 'harvest') {
            me.farm = me.farm || { plots: [], maxPlots: 4, lastExpansion: 0 };
            if (me.farm.plots.length === 0) return reply(`🌾 Você não tem nada plantado!`);

            const now = Date.now();
            const readyPlots = me.farm.plots.filter(plot => plot.readyAt <= now);
            if (readyPlots.length === 0) {
                const nextReady = Math.min(...me.farm.plots.map(p => p.readyAt));
                return reply(`⏳ Nenhuma planta está pronta para colher ainda.\n🕐 Próxima colheita em: ${Math.ceil((nextReady - now) / 60000)} minuto(s)`);
            }

            me.ingredients = me.ingredients || {};
            let harvestedText = '';
            let totalValue = 0;

            readyPlots.forEach(plot => {
                const seed = econ.seeds?.[plot.seed];
                if (seed && seed.yield) {
                    for (const [ingredient, qty] of Object.entries(seed.yield)) {
                        me.ingredients[ingredient] = (me.ingredients[ingredient] || 0) + qty;
                        harvestedText += `${ingredient} x${qty}, `;
                        totalValue += qty * 10;
                    }
                }
            });

            me.farm.plots = me.farm.plots.filter(plot => plot.readyAt > now);
            addSkillXP(me, 'farming', readyPlots.length * 2);
            updateChallenge(me, 'harvest', readyPlots.length, true);
            updatePeriodChallenge(me, 'harvest', readyPlots.length, true);
            updateQuestProgress(me, 'gather', readyPlots.length);
            saveEconomy(econ);

            return reply(`🌾 *COLHEITA CONCLUÍDA!*\n\n✅ Plantas colhidas: ${readyPlots.length}\n📦 Ingredientes obtidos:\n${harvestedText.slice(0, -2)}\n\n💵 Valor estimado: ${fmt(totalValue)}\n🌱 Terrenos livres: ${me.farm.maxPlots - me.farm.plots.length}/${me.farm.maxPlots}`);
        }

        if (sub === 'sementes') {
            let text = '🌱 *CATÁLOGO DE SEMENTES*\n\n';
            for (const [key, seed] of Object.entries(econ.seeds)) {
                const mins = Math.floor(seed.growTime / 60000);
                text += `${seed.name}\n  💰 Custo: ${fmt(seed.cost)}\n  ⏱️ Crescimento: ${mins} min\n  🌱 Plantar: ${prefix}plantar ${key}\n\n`;
            }
            return reply(text);
        }
    }
};
