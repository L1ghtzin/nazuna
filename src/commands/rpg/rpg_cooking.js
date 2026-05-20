import { 
    loadEconomy, 
    saveEconomy, 
    getEcoUser, 
    ensureEconomyDefaults, 
    addSkillXP, 
    updateChallenge, 
    updatePeriodChallenge, 
    updateQuestProgress,
    fmt,
    timeLeft
} from "../../utils/database.js";

export default {
    name: "rpg_cooking",
    description: "Sistema de culinária e alimentação do RPG",
    commands: ["receitas", "cozinhar", "cook", "ingredientes", "comer", "eat", "vendercomida"],
    handle: async ({ 
    reply, isGroup, groupData, sender, prefix, command, args,
    MESSAGES
  }) => {
        if (!isGroup || !groupData.modorpg) return;

        const econ = loadEconomy();
        ensureEconomyDefaults(econ);
        const me = getEcoUser(econ, sender);
        const sub = command.toLowerCase();

        // Inicializa receitas se não existir
        if (!econ.cookingRecipes) {
            econ.cookingRecipes = {
                pao: { name: '🍞 Pão', requires: { trigo: 3 }, gold: 10, sellPrice: 50, energy: 10 },
                sopa: { name: '🍲 Sopa', requires: { cenoura: 2, batata: 2 }, gold: 15, sellPrice: 80, energy: 20 },
                salada: { name: '🥗 Salada', requires: { alface: 2, tomate: 2 }, gold: 12, sellPrice: 60, energy: 15 },
                bolo: { name: '🍰 Bolo', requires: { trigo: 5, ovo: 3 }, gold: 25, sellPrice: 120, energy: 30 },
                pizza: { name: '🍕 Pizza', requires: { trigo: 4, tomate: 3, queijo: 2 }, gold: 35, sellPrice: 150, energy: 40 },
                hamburguer: { name: '🍔 Hambúrguer', requires: { carne: 2, trigo: 3, alface: 1 }, gold: 40, sellPrice: 180, energy: 50 },
                sushi: { name: '🍣 Sushi', requires: { peixe: 4, arroz: 3 }, gold: 50, sellPrice: 200, energy: 45 },
                macarrao: { name: '🍝 Macarrão', requires: { trigo: 3, tomate: 2 }, gold: 20, sellPrice: 90, energy: 25 }
            };
            saveEconomy(econ);
        }

        if (sub === 'receitas') {
            let text = '📖 *RECEITAS CULINÁRIAS*\n\n';
            for (const [key, rec] of Object.entries(econ.cookingRecipes)) {
                const ingredients = Object.entries(rec.requires).map(([ing, qty]) => `${ing} x${qty}`).join(', ');
                text += `${rec.name}\n`;
                text += `  📦 Ingredientes: ${ingredients}\n`;
                text += `  💰 Custo: ${fmt(rec.gold)}\n`;
                text += `  💵 Venda: ${fmt(rec.sellPrice)}\n`;
                text += `  ⚡ Energia: +${rec.energy}\n`;
                text += `  🍳 Cozinhar: ${prefix}cozinhar ${key}\n\n`;
            }
            text += `💡 *Dica:* Plante ingredientes com ${prefix}plantar`;
            return reply(text);
        }

        if (sub === 'cozinhar' || sub === 'cook') {
            const recipeKey = (args[0] || '').toLowerCase();
            if (!recipeKey) return reply(`👨‍🍳 *SISTEMA DE COZINHA*\n\n📖 Veja as receitas disponíveis: ${prefix}receitas\n🍳 Cozinhar: ${prefix}cozinhar <receita>\n\n💡 Exemplo: ${prefix}cozinhar pao`);

            const recipe = econ.cookingRecipes[recipeKey];
            if (!recipe) return reply(`💔 Receita não encontrada! Use ${prefix}receitas para ver todas as receitas disponíveis.`);

            const cd = me.cooldowns?.cook || 0;
            if (Date.now() < cd) return reply(`⏳ Você ainda está cozinhando! Aguarde ${timeLeft(cd)}.`);

            if (me.wallet < recipe.gold) return reply(`💰 Você precisa de ${fmt(recipe.gold)} para cozinhar ${recipe.name}. Saldo atual: ${fmt(me.wallet)}`);

            me.ingredients = me.ingredients || {};
            for (const [ing, qty] of Object.entries(recipe.requires)) {
                if ((me.ingredients[ing] || 0) < qty) {
                    return reply(`📦 Ingredientes insuficientes! Você precisa de ${ing} x${qty}, mas tem apenas x${me.ingredients[ing] || 0}.\n\n🌱 Plante ingredientes com ${prefix}plantar`);
                }
            }

            me.wallet -= recipe.gold;
            for (const [ing, qty] of Object.entries(recipe.requires)) {
                me.ingredients[ing] -= qty;
            }

            me.cookedFood = me.cookedFood || {};
            me.cookedFood[recipeKey] = (me.cookedFood[recipeKey] || 0) + 1;

            addSkillXP(me, 'cooking', 2);
            updateChallenge(me, 'cook', 1, true);
            updatePeriodChallenge(me, 'cook', 1, true);
            updateQuestProgress(me, 'cook', 1);

            me.cooldowns.cook = Date.now() + 3 * 60 * 1000;
            saveEconomy(econ);

            return reply(`👨‍🍳 *COZINHA CONCLUÍDA!*\n\n${recipe.name} preparado com sucesso!\n⚡ Energia: +${recipe.energy}\n💵 Valor de venda: ${fmt(recipe.sellPrice)}\n\n🍴 Use ${prefix}comer ${recipeKey} para consumir\n💰 Use ${prefix}vendercomida ${recipeKey} para vender`);
        }

        if (sub === 'ingredientes') {
            me.ingredients = me.ingredients || {};
            const entries = Object.entries(me.ingredients).filter(([, qty]) => qty > 0);
            if (entries.length === 0) return reply(`📦 *INGREDIENTES*\n\nVocê não possui ingredientes.\n\n🌱 Plante com ${prefix}plantar para conseguir ingredientes!`);

            let text = '📦 *MEUS INGREDIENTES*\n\n';
            for (const [ing, qty] of entries) text += `• ${ing}: x${qty}\n`;
            text += `\n👨‍🍳 Use ${prefix}receitas para ver o que pode cozinhar`;
            return reply(text);
        }

        if (sub === 'comer' || sub === 'eat') {
            const foodKey = (args[0] || '').toLowerCase();
            me.cookedFood = me.cookedFood || {};

            if (!foodKey) {
                const entries = Object.entries(me.cookedFood).filter(([, qty]) => qty > 0);
                if (entries.length === 0) return reply(`🍽️ Você não tem comida preparada.\n\n👨‍🍳 Cozinhe algo com ${prefix}cozinhar`);
                
                let text = '🍽️ *COMIDAS PREPARADAS*\n\n';
                for (const [key, qty] of entries) {
                    const recipe = econ.cookingRecipes?.[key];
                    if (recipe) {
                        text += `${recipe.name} x${qty}\n  ⚡ Energia: +${recipe.energy}\n  💵 Valor: ${fmt(recipe.sellPrice)}\n\n`;
                    }
                }
                text += `🍴 Comer: ${prefix}comer <comida>\n💰 Vender: ${prefix}vendercomida <comida>`;
                return reply(text);
            }

            if (!me.cookedFood[foodKey] || me.cookedFood[foodKey] <= 0) return reply(`💔 Você não tem ${foodKey} preparado.\n\n👨‍🍳 Cozinhe com ${prefix}cozinhar ${foodKey}`);

            const recipe = econ.cookingRecipes?.[foodKey];
            if (!recipe) return reply(`💔 Receita não encontrada.`);

            me.cookedFood[foodKey] -= 1;
            me.energy = (me.energy || 0) + recipe.energy;
            addSkillXP(me, 'cooking', 1);
            saveEconomy(econ);

            return reply(`😋 *DELICIOSO!*\n\nVocê comeu ${recipe.name}!\n⚡ Energia: +${recipe.energy}\n💪 Energia total: ${me.energy}\n\n💡 Quanto mais energia, mais bônus você recebe!`);
        }

        if (sub === 'vendercomida') {
            const foodKey = (args[0] || '').toLowerCase();
            me.cookedFood = me.cookedFood || {};
            if (!foodKey) return reply(`💰 *VENDER COMIDA*\n\nUse: ${prefix}vendercomida <comida>\n\n💡 Veja suas comidas com ${prefix}comer`);

            const qty = parseInt(args[1]) || 1;
            if (!me.cookedFood[foodKey] || me.cookedFood[foodKey] < qty) return reply(`💔 Você não tem ${qty}x ${foodKey}.\n\n🍽️ Você tem: ${me.cookedFood[foodKey] || 0}`);

            const recipe = econ.cookingRecipes?.[foodKey];
            if (!recipe) return reply(`💔 Receita não encontrada.`);

            const totalValue = recipe.sellPrice * qty;
            me.cookedFood[foodKey] -= qty;
            me.wallet += totalValue;
            saveEconomy(econ);

            return reply(`💰 *VENDA CONCLUÍDA!*\n\nVocê vendeu ${qty}x ${recipe.name}\n💵 Ganhou: ${fmt(totalValue)}\n💼 Carteira: ${fmt(me.wallet)}`);
        }
    }
};
