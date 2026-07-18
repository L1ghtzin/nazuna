import {
    loadEconomy,
    saveEconomy,
    getEcoUser,
    ensureEconomyDefaults,
    applyShopBonuses,
    fmt,
    timeLeft,
    getActivePickaxe,
    getSkillBonus,
    addSkillXP,
    updateChallenge,
    updatePeriodChallenge,
    giveMaterial,
    PICKAXE_TIER_MULT,
    getRewardMultipliers
} from "../../utils/database.js";

export default {
    name: "rpg_gather",
    description: "Sistema de coleta RPG (Mineração, Pesca, Exploração, Caça)",
    commands: ["minerar", "mine", "pescar", "fish", "explorar", "explore", "cacar", "caçar", "hunt"],
    handle: async ({
        reply, isGroup, groupData, sender, prefix, command, MESSAGES
    }) => {
        if (!isGroup) return reply(MESSAGES.rpg.core.groupOnly);
        if (!groupData.modorpg) return reply(MESSAGES.rpg.core.disabled(prefix));

        const econ = loadEconomy();
        ensureEconomyDefaults(econ);
        const me = getEcoUser(econ, sender);
        const { mineBonus, fishBonus, exploreBonus, huntBonus } = applyShopBonuses(me, econ);
        const sub = command.toLowerCase();

        if (sub === 'minerar' || sub === 'mine') {
            const cd = me.cooldowns?.mine || 0;
            if (Date.now() < cd) return reply(MESSAGES.rpg.core.mining.cooldown(timeLeft(cd)));
            const pk = getActivePickaxe(me);
            if (!pk) return reply(MESSAGES.rpg.core.mining.needPickaxe(prefix));
            const tierMult = PICKAXE_TIER_MULT[pk.tier] || 1.0;
            const base = 100 + Math.floor(Math.random() * 101);
            const skillB = getSkillBonus(me, 'mining');
            const raw = Math.floor(base * tierMult);
            const bonus = Math.floor(raw * ((mineBonus || 0) + skillB));
            const total = raw + bonus;
            
            const { coinMultiplier } = getRewardMultipliers(me);
            const finalTotal = Math.floor(total * coinMultiplier);
            const boostBonus = finalTotal - total;
            me.wallet += finalTotal;
            let drops = { pedra: 2 + Math.floor(Math.random() * 3) };
            if (pk.tier === 'ferro' || pk.tier === 'diamante') {
                drops.ferro = (drops.ferro || 0) + 1 + Math.floor(Math.random() * 2);
                drops.carvao = (drops.carvao || 0) + (Math.random() < 0.4 ? 1 : 0);
            }
            if (pk.tier === 'diamante') {
                drops.ferro = (drops.ferro || 0) + (Math.random() < 0.7 ? 1 : 0);
                drops.ouro = (drops.ouro || 0) + (Math.random() < 0.3 ? 1 : 0);
                drops.carvao = (drops.carvao || 0) + (Math.random() < 0.6 ? 1 : 0);
                if (Math.random() < 0.1) drops.diamante = (drops.diamante || 0) + 1;
            }
            for (const [mk, mq] of Object.entries(drops)) if (mq > 0) giveMaterial(me, mk, mq);
            const before = pk.dur; pk.dur = Math.max(0, pk.dur - 1);
            me.tools.pickaxe = { ...pk, max: pk.max ?? (pk.tier === 'bronze' ? 20 : pk.tier === 'ferro' ? 60 : pk.tier === 'diamante' ? 150 : pk.dur) };
            me.cooldowns.mine = Date.now() + 10 * 60 * 1000;
            addSkillXP(me, 'mining', 1); updateChallenge(me, 'mine', 1, true); updatePeriodChallenge(me, 'mine', 1, true);
            if (!me.stats) me.stats = {};
            me.stats.totalMine = (me.stats.totalMine || 0) + 1;
            me.stats.mineCount = (me.stats.mineCount || 0) + 1;
            saveEconomy(econ);
            let dropTxt = Object.entries(drops).filter(([, q]) => q > 0).map(([k, q]) => `${k} x${q}`).join(', ');
            const broke = pk.dur === 0 && before > 0;
            return reply(MESSAGES.rpg.core.mining.success(fmt(finalTotal), (bonus + boostBonus) > 0 ? `(bônus ${fmt(bonus + boostBonus)})` : '', dropTxt || '—', pk.dur, me.tools.pickaxe.max, broke));
        }

        if (sub === 'pescar' || sub === 'fish') {
            const cd = me.cooldowns?.fish || 0;
            if (Date.now() < cd) return reply(MESSAGES.rpg.core.fishing.cooldown(timeLeft(cd)));
            
            // --- SISTEMA DE LOMBRA / CALMA ---
            const lombra = me.lombraLevel || 0;
            const calma = me.calmaLevel || 0;
            let lombraMult = 1.0;
            let lombraMsg = "";
            let fishQtyBonus = 0;
            let moneyLost = 0;
            let forceZeroGains = false;
            let longCd = false;

            if (lombra > 0) {
                // Decrementa o nível de lombra a cada pescaria
                me.lombraLevel = Math.max(0, lombra - 1);
                const roll = Math.random();

                if (roll < 0.60) {
                    // Brisa da Paz: Pescaria super tranquila e lucrativa (+40% a +100% de bônus baseado no lombraLevel)
                    lombraMult = 1.4 + (lombra * 0.2);
                    fishQtyBonus = 1 + Math.floor(Math.random() * 2); // +1 ou +2 peixes
                    lombraMsg = `\n\n🌿 *BRISA DA PAZ* 🧘‍♂️\nVocê pescou com extrema paciência e tranquilidade, observando as nuvens...\n🪙 Bônus de Calmante: *+${Math.round((lombraMult - 1) * 100)}%* em moedas!\n🐟 Peixes extras: *+${fishQtyBonus}* peixes capturados!`;
                } else if (roll < 0.80) {
                    // Larica: Bônus de +30%, mas come 1 ingrediente (peixe ou carne)
                    lombraMult = 1.3;
                    lombraMsg = `\n\n🥪 *LARICA* 🤤\nVocê ficou tão relaxado que bateu aquela larica monstra! Pescou bem (+30% de moedas), mas assou um lanchinho no meio da calmaria...\n`;
                    me.ingredients = me.ingredients || {};
                    if ((me.ingredients.peixe || 0) > 0) {
                        me.ingredients.peixe -= 1;
                        lombraMsg += `⚠️ Consumiu *1x Peixe* do seu estoque.`;
                    } else if ((me.ingredients.carne || 0) > 0) {
                        me.ingredients.carne -= 1;
                        lombraMsg += `⚠️ Consumiu *1x Carne* do seu estoque.`;
                    } else {
                        lombraMsg += `🏜️ Como não tinha peixe nem carne no estoque, sua barriga ficou roncando de fome!`;
                    }
                } else if (roll < 0.90) {
                    // Brisa Torta: Dormiu na beirada, peixe roubou isca (-20% coins, cooldown aumenta)
                    lombraMult = 0.8;
                    longCd = true;
                    lombraMsg = `\n\n💀 *BRISA TORTA* 💤\nVocê viajou legal observando o reflexo da água e cochilou na beira do rio. O peixe roubou a isca e levou embora o lucro!\n⏳ Cooldown de pescar aumentado em 6 minutos (ressaca da lombra).`;
                } else {
                    // BADTRIP: Perda direta de dinheiro, ganho zero, cooldown aumentado
                    forceZeroGains = true;
                    longCd = true;
                    moneyLost = 100 + Math.floor(Math.random() * 151); // 100 a 250
                    me.wallet = Math.max(0, me.wallet - moneyLost);
                    lombraMsg = `\n\n💀 *BADTRIP / PARANOIA* 🧠💥\nVocê ouviu um barulho de galho quebrando, achou que era a polícia vindo confiscar sua vara, jogou sua carteira no rio em pânico e saiu correndo!\n💸 Prejuízo: Perdeu *${moneyLost}* moedas.\n❌ Lucro da pesca: *R$ 0,00* e cooldown de pescar aumentado em 6 minutos.`;
                }
            } else if (calma > 0) {
                // Cigarro clássico: 90% seguro! 10% de queimar a calça e perder dinheiro
                me.calmaLevel = Math.max(0, calma - 1);
                const roll = Math.random();

                if (roll < 0.90) {
                    lombraMult = 1.0 + (calma * 0.25);
                    lombraMsg = `\n\n🚬 *PESCA TRANQUILA* 😌\nVocê fumou seu cigarro de palha na beira da água com toda a calma do mundo.\n🪙 Bônus de Calma: *+${Math.round((lombraMult - 1) * 100)}%* de moedas adicionais.`;
                } else {
                    // Cinza na calça: Queimou a calça e perdeu moedas
                    moneyLost = 40 + Math.floor(Math.random() * 51); // 40 a 90
                    me.wallet = Math.max(0, me.wallet - moneyLost);
                    lombraMsg = `\n\n🚬 *CINZA NA CALÇA* 👖🔥\nVocê deu uma tragada forte, mas uma cinza acesa caiu no seu bolso e queimou sua calça! Algumas moedas caíram pelo buraco e sumiram na terra.\n💸 Prejuízo: Perdeu *${moneyLost}* moedas pelo buraco da calça.`;
                }
            }

            const base = 80 + Math.floor(Math.random() * 121);
            const skillB = getSkillBonus(me, 'fishing');
            const bonus = Math.floor(base * ((fishBonus || 0) + skillB));
            const total = forceZeroGains ? 0 : Math.floor((base + bonus) * lombraMult);
            
            const { coinMultiplier } = getRewardMultipliers(me);
            const finalTotal = forceZeroGains ? 0 : Math.floor(total * coinMultiplier);
            const boostBonus = finalTotal - total;
            me.wallet += finalTotal;
            
            // Cooldown padrão é 12 min. Se foi brisa torta ou badtrip, vira 18 min.
            const fishCooldownDuration = longCd ? 18 * 60 * 1000 : 12 * 60 * 1000;
            me.cooldowns.fish = Date.now() + fishCooldownDuration;
            
            addSkillXP(me, 'fishing', 1); updateChallenge(me, 'fish', 1, true); updatePeriodChallenge(me, 'fish', 1, true);
            me.ingredients = me.ingredients || {};
            const fishQty = 2 + Math.floor(Math.random() * 3) + fishQtyBonus;
            me.ingredients.peixe = (me.ingredients.peixe || 0) + fishQty;
            if (!me.stats) me.stats = {};
            me.stats.totalFish = (me.stats.totalFish || 0) + 1;
            me.stats.fishCount = (me.stats.fishCount || 0) + 1;
            saveEconomy(econ);
            
            const bonusText = (bonus + boostBonus) > 0 ? `│ ✨ Bônus: *+${fmt(bonus + boostBonus)}*\n` : '';
            let replyText = MESSAGES.rpg.core.fishing.success(fmt(finalTotal), bonusText, fishQty);
            if (lombraMsg) {
                replyText += lombraMsg;
            }
            return reply(replyText);
        }

        if (sub === 'explorar' || sub === 'explore') {
            const cd = me.cooldowns?.explore || 0;
            if (Date.now() < cd) return reply(MESSAGES.rpg.core.exploring.cooldown(timeLeft(cd)));
            
            // --- SISTEMA DE EMBRIAGUEZ ---
            const drunk = me.drunkLevel || 0;
            if (drunk > 0) {
                // Diminui o nível de embriaguez conforme caminha
                me.drunkLevel = Math.max(0, drunk - 1);
                
                const roll = Math.random();
                me.cooldowns.explore = Date.now() + 15 * 60 * 1000;
                addSkillXP(me, 'exploring', 1);
                updateChallenge(me, 'explore', 1, true);
                updatePeriodChallenge(me, 'explore', 1, true);
                if (!me.stats) me.stats = {};
                me.stats.totalExplore = (me.stats.totalExplore || 0) + 1;
                me.stats.exploreCount = (me.stats.exploreCount || 0) + 1;
                if (roll < 0.45) {
                    // Delírio Benigno (Alucinação Lucrativa)
                    const goldGain = 200 + Math.floor(Math.random() * 201); // ganha mais gold
                    me.wallet += goldGain;
                    
                    const matsGain = {};
                    if (Math.random() < 0.5) matsGain.cristal = 1;
                    if (Math.random() < 0.5) matsGain.ouro = 1;
                    for (const [mk, mq] of Object.entries(matsGain)) giveMaterial(me, mk, mq);
                    
                    saveEconomy(econ);
                    
                    const matsText = Object.keys(matsGain).length > 0 
                        ? `\n│ 📦 Coisas que achou jogadas: ` + Object.entries(matsGain).map(([k, q]) => `${k} x${q}`).join(', ') 
                        : '';
                    const sobrietyText = me.drunkLevel === 0 ? 'Sóbrio ☀️' : `Ainda Bêbado (${me.drunkLevel}/3) 🥴`;

                    return reply(MESSAGES.rpg.core.exploring.drunkBenign(fmt(goldGain), matsText, sobrietyText));
                } else if (roll < 0.85) {
                    // Delírio Maligno (Alucinação de Perigo)
                    const goldLost = Math.min(me.wallet, 50 + Math.floor(Math.random() * 101));
                    me.wallet -= goldLost;
                    
                    saveEconomy(econ);
                    const sobrietyText = me.drunkLevel === 0 ? 'Sóbrio ☀️' : `Ainda Bêbado (${me.drunkLevel}/3) 🥴`;
                    
                    return reply(MESSAGES.rpg.core.exploring.drunkMalign(fmt(goldLost), sobrietyText));
                } else {
                    // Blackout (Apagão / Penalidade)
                    me.cooldowns.explore = Date.now() + 25 * 60 * 1000; // 25 minutos de cooldown por causa da ressaca
                    saveEconomy(econ);
                    
                    return reply(MESSAGES.rpg.core.exploring.drunkBlackout());
                }
            }

            // --- EXPLORAÇÃO NORMAL ---
            const base = 100 + Math.floor(Math.random() * 151);
            const skillB = getSkillBonus(me, 'exploring');
            const bonus = Math.floor(base * ((exploreBonus || 0) + skillB));
            const total = base + bonus;
            
            const { coinMultiplier } = getRewardMultipliers(me);
            const finalTotal = Math.floor(total * coinMultiplier);
            const boostBonus = finalTotal - total;
            me.wallet += finalTotal;
            me.cooldowns.explore = Date.now() + 15 * 60 * 1000;
            addSkillXP(me, 'exploring', 1); updateChallenge(me, 'explore', 1, true); updatePeriodChallenge(me, 'explore', 1, true);
            if (!me.stats) me.stats = {};
            me.stats.totalExplore = (me.stats.totalExplore || 0) + 1;
            me.stats.exploreCount = (me.stats.exploreCount || 0) + 1;
            const matsGain = {};
            if (Math.random() < 0.6) matsGain.madeira = 1 + Math.floor(Math.random() * 3);
            if (Math.random() < 0.3) matsGain.corda = 1;
            if (Math.random() < 0.4) matsGain.linha = 1 + Math.floor(Math.random() * 2);
            if (Math.random() < 0.2) matsGain.cristal = 1;
            for (const [mk, mq] of Object.entries(matsGain)) giveMaterial(me, mk, mq);
            saveEconomy(econ);
            const bonusText = (bonus + boostBonus) > 0 ? `│ ✨ Bônus: *+${fmt(bonus + boostBonus)}*\n` : '';
            const matsText = Object.keys(matsGain).length > 0 ? `│ 📦 Materiais: ` + Object.entries(matsGain).map(([k, q]) => `${k} x${q}`).join(', ') + `\n` : '';
            return reply(MESSAGES.rpg.core.exploring.success(fmt(finalTotal), bonusText, matsText));
        }

        if (sub === 'cacar' || sub === 'caçar' || sub === 'hunt') {
            const cd = me.cooldowns?.hunt || 0;
            if (Date.now() < cd) return reply(MESSAGES.rpg.core.hunting.cooldown(timeLeft(cd)));
            const base = 60 + Math.floor(Math.random() * 61);
            const skillB = getSkillBonus(me, 'hunting');
            const bonus = Math.floor(base * ((huntBonus || 0) + skillB) * 0.7);
            const total = base + bonus;
            
            const { coinMultiplier } = getRewardMultipliers(me);
            const finalTotal = Math.floor(total * coinMultiplier);
            const boostBonus = finalTotal - total;
            me.wallet += finalTotal;
            me.cooldowns.hunt = Date.now() + 22 * 60 * 1000;
            addSkillXP(me, 'hunting', 1); updateChallenge(me, 'hunt', 1, true); updatePeriodChallenge(me, 'hunt', 1, true);
            me.ingredients = me.ingredients || {};
            const meatQty = 1 + (Math.random() < 0.25 ? 1 : 0);
            me.ingredients.carne = (me.ingredients.carne || 0) + meatQty;
            const huntMats = {};
            if (Math.random() < 0.5) huntMats.couro = 1 + Math.floor(Math.random() * 2);
            for (const [mk, mq] of Object.entries(huntMats)) giveMaterial(me, mk, mq);
            saveEconomy(econ);
            const bonusText = (bonus + boostBonus) > 0 ? `│ ✨ Bônus: *+${fmt(bonus + boostBonus)}*\n` : '';
            const matsText = Object.keys(huntMats).length > 0 ? `│ 📦 Materiais: ` + Object.entries(huntMats).map(([k, q]) => `${k} x${q}`).join(', ') + `\n` : '';
            return reply(MESSAGES.rpg.core.hunting.success(fmt(finalTotal), bonusText, meatQty, matsText));
        }
    }
};
