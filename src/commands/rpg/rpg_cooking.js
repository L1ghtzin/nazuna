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
    timeLeft,
    parseAmount
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
            let text = MESSAGES.rpg.cooking.recipesHeader;
            for (const [key, rec] of Object.entries(econ.cookingRecipes)) {
                const ingredients = Object.entries(rec.requires).map(([ing, qty]) => `${ing} x${qty}`).join(', ');
                text += MESSAGES.rpg.cooking.recipeLine(rec.name, ingredients, fmt(rec.gold), fmt(rec.sellPrice), rec.energy, prefix, key);
            }
            text += MESSAGES.rpg.cooking.recipeTip(prefix);
            return reply(text);
        }

        if (sub === 'cozinhar' || sub === 'cook') {
            const recipeKey = (args[0] || '').toLowerCase();
            if (!recipeKey) return reply(MESSAGES.rpg.cooking.systemInfo(prefix));

            const recipe = econ.cookingRecipes[recipeKey];
            if (!recipe) return reply(MESSAGES.rpg.cooking.recipeNotFound(prefix));

            const cd = me.cooldowns?.cook || 0;
            if (Date.now() < cd) return reply(MESSAGES.rpg.cooking.cooldownCook(timeLeft(cd)));

            if (me.wallet < recipe.gold) return reply(MESSAGES.rpg.cooking.insufficientFundsCook(fmt(recipe.gold), recipe.name, fmt(me.wallet)));

            me.ingredients = me.ingredients || {};
            for (const [ing, qty] of Object.entries(recipe.requires)) {
                if ((me.ingredients[ing] || 0) < qty) {
                    return reply(MESSAGES.rpg.cooking.insufficientIngredients(ing, qty, me.ingredients[ing] || 0, prefix));
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

            return reply(MESSAGES.rpg.cooking.cookSuccess(recipe.name, recipe.energy, fmt(recipe.sellPrice), prefix, recipeKey));
        }

        if (sub === 'ingredientes') {
            me.ingredients = me.ingredients || {};
            const entries = Object.entries(me.ingredients).filter(([, qty]) => qty > 0);
            if (entries.length === 0) return reply(MESSAGES.rpg.cooking.ingredientsEmpty(prefix));

            let text = MESSAGES.rpg.cooking.myIngredientsHeader;
            for (const [ing, qty] of entries) text += `• ${ing}: x${qty}\n`;
            text += MESSAGES.rpg.cooking.myIngredientsTip(prefix);
            return reply(text);
        }

        if (sub === 'comer' || sub === 'eat') {
            const foodKey = (args[0] || '').toLowerCase();
            me.cookedFood = me.cookedFood || {};

            if (!foodKey) {
                const entries = Object.entries(me.cookedFood).filter(([, qty]) => qty > 0);
                if (entries.length === 0) return reply(MESSAGES.rpg.cooking.foodEmpty(prefix));
                
                let text = MESSAGES.rpg.cooking.foodHeader;
                for (const [key, qty] of entries) {
                    const recipe = econ.cookingRecipes?.[key];
                    if (recipe) {
                        text += MESSAGES.rpg.cooking.foodItem(recipe.name, qty, recipe.energy, fmt(recipe.sellPrice));
                    }
                }
                text += MESSAGES.rpg.cooking.foodTip(prefix);
                return reply(text);
            }

            if (!me.cookedFood[foodKey] || me.cookedFood[foodKey] <= 0) return reply(MESSAGES.rpg.cooking.foodNotPrepared(foodKey, prefix));

            const recipe = econ.cookingRecipes?.[foodKey];
            if (!recipe) return reply(MESSAGES.rpg.cooking.invalidRecipe);

            me.cookedFood[foodKey] -= 1;
            me.energy = (me.energy || 0) + recipe.energy;
            addSkillXP(me, 'cooking', 1);
            saveEconomy(econ);

            return reply(MESSAGES.rpg.cooking.eatSuccess(recipe.name, recipe.energy, me.energy));
        }

        if (sub === 'vendercomida') {
            const foodKey = (args[0] || '').toLowerCase();
            me.cookedFood = me.cookedFood || {};
            if (!foodKey) return reply(MESSAGES.rpg.cooking.sellUsage(prefix));

            const have = me.cookedFood[foodKey] || 0;
            const qty = parseAmount(args[1], have) || 1;
            if (isNaN(qty) || qty <= 0) return reply(MESSAGES.rpg.cooking.invalidQuantity);
            if (have < qty) return reply(MESSAGES.rpg.cooking.notEnoughFood(qty, foodKey, have));

            const recipe = econ.cookingRecipes?.[foodKey];
            if (!recipe) return reply(MESSAGES.rpg.cooking.invalidRecipe);

            const totalValue = recipe.sellPrice * qty;
            me.cookedFood[foodKey] -= qty;
            me.wallet += totalValue;
            saveEconomy(econ);

            return reply(MESSAGES.rpg.cooking.sellSuccess(qty, recipe.name, fmt(totalValue), fmt(me.wallet)));
        }
    }
};
