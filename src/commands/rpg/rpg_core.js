import {
    loadEconomy,
    saveEconomy,
    getEcoUser,
    ensureEconomyDefaults,
    ensureUserChallenge,
    applyShopBonuses,
    loadLevelingSafe,
    getUserName,
    fmt,
    parseAmount,
    timeLeft,
    getActivePickaxe,
    ensureUserSkills,
    SKILL_LIST,
    getSkillBonus,
    addSkillXP,
    updateChallenge,
    updatePeriodChallenge,
    isChallengeCompleted,
    findKeyIgnoringAccents,
    normalizeParam,
    updateQuestProgress,
    checkEcoLevelUp,
    giveMaterial,
    PICKAXE_TIER_MULT
} from "../../utils/database.js";
import { getWorkCooldownReduction, consumeEffect } from "../../funcs/utils/consumables.js";

export default {
    name: "rpg_core",
    description: "Sistema central de RPG (Economia, Trabalhos, Banco)",
    commands: [
        "perfilrpg", "carteira", "banco", "depositar", "dep", "sacar", "saque", "transferir", "pix", "loja", "lojarps", "comprar", "buy", "inventario", "inv", "minerar", "mine", "trabalhar", "work", "vagas", "emprego", "demitir", "pescar", "fish", "explorar", "explore", "cacar", "caçar", "hunt", "resetrpg"
    ],
    handle: async ({ 
    reply, 
        isGroup, 
        groupData, 
        sender, 
        prefix, 
        command, 
        q, 
        args, 
        menc_jid2, 
        pushname, 
        AllgroupMembers, 
        isOwner, 
        isSubOwner, 
        nmrdn, 
        isBotSender,
        relationshipManager,
    MESSAGES
  }) => {
        if (!isGroup) return reply(MESSAGES.rpg.core.groupOnly);
        if (!groupData.modorpg) return reply(MESSAGES.rpg.core.disabled(prefix));

        const econ = loadEconomy();
        ensureEconomyDefaults(econ);
        const me = getEcoUser(econ, sender);
        const { mineBonus, workBonus, bankCapacity, fishBonus, exploreBonus, huntBonus } = applyShopBonuses(me, econ);
        const sub = command.toLowerCase();

        if (sub === 'perfilrpg') {
            const total = (me.wallet||0) + (me.bank||0);
            const level = me.level || 1;
            const exp = me.exp || 0;
            const nextLevelXp = 100 * Math.pow(1.5, level - 1);
            const expProgress = `${exp}/${Math.floor(nextLevelXp)}`;
            const expPercent = Math.min(100, Math.floor((exp / nextLevelXp) * 100));
            
            // Skills
            ensureUserSkills(me);
            const topSkills = SKILL_LIST.map(sk => ({ name: sk, level: me.skills[sk]?.level || 1 }))
              .sort((a,b) => b.level - a.level).slice(0, 3);
            
            // Estatísticas gerais
            const battlesWon = me.battlesWon || 0;
            const battlesLost = me.battlesLost || 0;
            const totalBattles = battlesWon + battlesLost;
            const winRate = totalBattles > 0 ? Math.floor((battlesWon / totalBattles) * 100) : 0;
            
            const achievements = Object.keys(me.achievements || {}).length;
            const pets = (me.pets || []).length;
            const premiumItems = Object.keys(me.premiumItems || {}).length;
            
            // Progresso de prestige
            const prestigeLevel = me.prestige?.level || 0;
            const prestigeMultiplier = me.prestige?.bonusMultiplier || 1;
            
            // Reputação
            const reputation = me.reputation?.points || 0;
            const karma = me.reputation?.karma || 0;
            
            // Streak diário
            const streak = me.streak?.count || 0;
            
            // Classe
            const classes = {
              'guerreiro': { emoji: '⚔️', name: 'Guerreiro' },
              'mago': { emoji: '🧙', name: 'Mago' },
              'arqueiro': { emoji: '🏹', name: 'Arqueiro' },
              'curandeiro': { emoji: '💚', name: 'Curandeiro' },
              'ladino': { emoji: '🗡️', name: 'Ladino' },
              'paladino': { emoji: '🛡️', name: 'Paladino' }
            };
            const classeInfo = me.classe ? `${classes[me.classe]?.emoji} ${classes[me.classe]?.name}` : 'Nenhuma';
            
            // Clã
            let clanInfo = 'Nenhum';
            if (me.clan && econ.clans && econ.clans[me.clan]) {
              const myClan = econ.clans[me.clan];
              clanInfo = myClan.name || 'Sem nome';
            }
            
            // Casa
            const casas = {
              'barraca': { emoji: '⛺', name: 'Barraca' },
              'cabana': { emoji: '🏚️', name: 'Cabana' },
              'casa': { emoji: '🏠', name: 'Casa' },
              'mansao': { emoji: '🏰', name: 'Mansão' },
              'castelo': { emoji: '🏯', name: 'Castelo' }
            };
            const houseInfo = me.house?.type ? `${casas[me.house.type]?.emoji || ''} ${casas[me.house.type]?.name || me.house.type}` : 'Nenhuma';
            
            // Família e Relacionamento
            if (!me.family) me.family = { spouse: null, children: [], parents: [], siblings: [] };
            const familyChildren = (me.family.children || []).length;
            
            // Buscar relacionamento ativo do sistema de relacionamentos
            let familySpouse = 'Solteiro(a)';
            let relationshipType = '';
            let relationshipEmoji = '';
            const mentions = [];
            
            const activePair = relationshipManager?.getActivePairForUser ? relationshipManager.getActivePairForUser(sender) : null;
            if (activePair && activePair.partnerId) {
              familySpouse = `@${activePair.partnerId.split('@')[0]}`;
              mentions.push(activePair.partnerId);
              
              if (activePair.pair?.status === 'casamento') {
                relationshipType = 'Casado(a)';
                relationshipEmoji = '💍';
              } else if (activePair.pair?.status === 'namoro') {
                relationshipType = 'Namorando';
                relationshipEmoji = '💞';
              } else if (activePair.pair?.status === 'brincadeira') {
                relationshipType = 'Brincadeira';
                relationshipEmoji = '🎈';
              }
            } else if (me.family.spouse) {
                familySpouse = `@${me.family.spouse.split('@')[0]}`;
                mentions.push(me.family.spouse);
                relationshipType = 'Casado(a)';
                relationshipEmoji = '💍';
            }
            
            let text = MESSAGES.rpg.core.profile.header(pushname);
            
            text += MESSAGES.rpg.core.profile.exp(level, expProgress, expPercent, prestigeLevel, prestigeMultiplier.toFixed(2), `${streak} dia${streak !== 1 ? 's' : ''}`);
            
            text += MESSAGES.rpg.core.profile.finances(fmt(me.wallet), fmt(me.bank), fmt(total), me.job ? econ.jobCatalog?.[me.job]?.name || me.job : 'Desempregado(a)');
            
            text += MESSAGES.rpg.core.profile.custom(classeInfo, clanInfo, houseInfo);
            
            text += MESSAGES.rpg.core.profile.combat(battlesWon, battlesLost, winRate, me.power || 100);
            
            text += MESSAGES.rpg.core.profile.skillsHeader;
            topSkills.forEach((sk, i) => {
              const prefixChar = i === topSkills.length - 1 ? '└' : '├';
              const skillName = sk.name.charAt(0).toUpperCase() + sk.name.slice(1);
              text += `${prefixChar} ${skillName}: Lv.${sk.level}\n`;
            });
            text += `\n`;
            
            text += MESSAGES.rpg.core.profile.familyHeader;
            if (relationshipEmoji) {
              text += MESSAGES.rpg.core.profile.familyStatus(relationshipEmoji, relationshipType, familySpouse);
            } else {
              text += MESSAGES.rpg.core.profile.familySingle;
            }
            text += MESSAGES.rpg.core.profile.familyChildren(familyChildren);
            
            text += MESSAGES.rpg.core.profile.collectibles(achievements, pets, premiumItems);
            
            text += MESSAGES.rpg.core.profile.reputation(reputation, karma);
            
            text += MESSAGES.rpg.core.profile.footer(prefix);
            
            return reply(text, mentions.length > 0 ? { mentions } : undefined);
        }

        if (sub === 'carteira') return reply(MESSAGES.rpg.core.wallet(fmt(me.wallet)));
        if (sub === 'banco') return reply(MESSAGES.rpg.core.bank(fmt(me.bank), fmt(bankCapacity)));

        if (sub === 'depositar' || sub === 'dep') {
            const amount = parseAmount(args[0], me.wallet);
            if (!amount || amount <= 0) return reply(MESSAGES.rpg.core.deposit.invalidAmount);
            if (amount > me.wallet) return reply(MESSAGES.rpg.core.deposit.insufficientFunds);
            const space = bankCapacity - me.bank;
            const toDep = Math.min(amount, space);
            if (toDep <= 0) return reply(MESSAGES.rpg.core.deposit.bankFull);
            me.wallet -= toDep; me.bank += toDep;
            saveEconomy(econ);
            return reply(MESSAGES.rpg.core.deposit.success(fmt(toDep), fmt(me.bank)));
        }

        if (sub === 'sacar' || sub === 'saque') {
            const amount = parseAmount(args[0], me.bank);
            if (!amount || amount <= 0) return reply(MESSAGES.rpg.core.withdraw.invalidAmount);
            if (amount > me.bank) return reply(MESSAGES.rpg.core.withdraw.insufficientFunds);
            const taxa = Math.floor(amount * 0.05);
            me.bank -= amount; me.wallet += (amount - taxa);
            saveEconomy(econ);
            return reply(MESSAGES.rpg.core.withdraw.success(fmt(amount), fmt(taxa), fmt(amount - taxa)));
        }

        if (sub === 'transferir' || sub === 'pix') {
            const mentioned = menc_jid2?.[0];
            if (!mentioned) return reply(MESSAGES.rpg.core.transfer.usage(prefix, sub));
            if (mentioned === sender) return reply(MESSAGES.rpg.core.transfer.selfError);
            // Busca o valor numérico entre os args, ignorando a menção
            const rawArgs = q ? q.trim().split(/\s+/) : [];
            const numericArg = rawArgs.find(a => !a.startsWith('@') && (/^\d+/.test(a) || a === 'tudo' || a === 'all' || a === 'metade' || a === 'half'));
            const amount = parseAmount(numericArg, me.wallet);
            if (!isFinite(amount) || amount <= 0) return reply(MESSAGES.rpg.core.transfer.invalidAmount);
            // TAXA DE TRANSFERÊNCIA: 15%
            const taxa = Math.floor(amount * 0.15);
            const totalNeeded = amount + taxa;
            if (totalNeeded > me.wallet) return reply(MESSAGES.rpg.core.transfer.insufficientFunds(fmt(amount), fmt(taxa), fmt(totalNeeded), fmt(me.wallet)));
            const other = getEcoUser(econ, mentioned);
            me.wallet -= totalNeeded;
            other.wallet += amount;
            saveEconomy(econ);
            return reply(MESSAGES.rpg.core.transfer.success(fmt(amount), fmt(taxa), fmt(totalNeeded), mentioned.split('@')[0]), { mentions: [mentioned] });
        }

        if (sub === 'minerar' || sub === 'mine') {
            const cd = me.cooldowns?.mine || 0;
            if (Date.now() < cd) return reply(MESSAGES.rpg.core.mining.cooldown(timeLeft(cd)));
            const pk = getActivePickaxe(me);
            if (!pk) return reply(MESSAGES.rpg.core.mining.needPickaxe(prefix));
            // Cálculo de ouro com base na picareta e bônus (BALANCEADO)
            const tierMult = PICKAXE_TIER_MULT[pk.tier] || 1.0;
            const base = 100 + Math.floor(Math.random() * 101); // 100-200
            const skillB = getSkillBonus(me, 'mining');
            const raw = Math.floor(base * tierMult);
            const bonus = Math.floor(raw * ((mineBonus || 0) + skillB));
            const total = raw + bonus;
            me.wallet += total;
            // Quedas de materiais (chances balanceadas)
            let drops = { pedra: 2 + Math.floor(Math.random() * 3) }; // 2-4
            if (pk.tier === 'ferro' || pk.tier === 'diamante') {
                drops.ferro = (drops.ferro || 0) + 1 + Math.floor(Math.random() * 2); // 1-2
                drops.carvao = (drops.carvao || 0) + (Math.random() < 0.4 ? 1 : 0); // 40% chance
            }
            if (pk.tier === 'diamante') {
                drops.ferro = (drops.ferro || 0) + (Math.random() < 0.7 ? 1 : 0); // 70% chance de +1
                drops.ouro = (drops.ouro || 0) + (Math.random() < 0.3 ? 1 : 0); // 30% chance
                drops.carvao = (drops.carvao || 0) + (Math.random() < 0.6 ? 1 : 0); // 60% chance
                if (Math.random() < 0.1) drops.diamante = (drops.diamante || 0) + 1; // 10% chance
            }
            for (const [mk, mq] of Object.entries(drops)) if (mq > 0) giveMaterial(me, mk, mq);
            // Durabilidade
            const before = pk.dur; pk.dur = Math.max(0, pk.dur - 1);
            me.tools.pickaxe = { ...pk, max: pk.max ?? (pk.tier === 'bronze' ? 20 : pk.tier === 'ferro' ? 60 : pk.tier === 'diamante' ? 150 : pk.dur) };
            me.cooldowns.mine = Date.now() + 10 * 60 * 1000; // 10 min
            addSkillXP(me, 'mining', 1); updateChallenge(me, 'mine', 1, true); updatePeriodChallenge(me, 'mine', 1, true);
            // Rastrear stats
            if (!me.stats) me.stats = {};
            me.stats.totalMine = (me.stats.totalMine || 0) + 1;
            me.stats.mineCount = (me.stats.mineCount || 0) + 1;
            saveEconomy(econ);
            let dropTxt = Object.entries(drops).filter(([, q]) => q > 0).map(([k, q]) => `${k} x${q}`).join(', ');
            const broke = pk.dur === 0 && before > 0;
            return reply(MESSAGES.rpg.core.mining.success(fmt(total), bonus > 0 ? `(bônus ${fmt(bonus)})` : '', dropTxt || '—', pk.dur, me.tools.pickaxe.max, broke));
        }

        if (sub === 'trabalhar' || sub === 'work') {
            const cd = me.cooldowns?.work || 0;
            if (Date.now() < cd) return reply(MESSAGES.rpg.core.working.cooldown(timeLeft(cd)));
            const job = econ.jobCatalog?.[me.job] || { min: 50, max: 100 };
            const gain = job.min + Math.floor(Math.random() * (job.max - job.min + 1));
            const bonus = Math.floor(gain * (workBonus || 0));
            me.wallet += (gain + bonus);
            me.exp = (me.exp || 0) + 20;
            
            const workCooldownReduction = getWorkCooldownReduction(me);
            const baseCooldown = 20 * 60 * 1000;
            const finalCooldown = Math.max(0, baseCooldown - workCooldownReduction);
            me.cooldowns.work = Date.now() + finalCooldown;
            
            let effectConsumedMsg = '';
            if (workCooldownReduction > 0) {
                consumeEffect(me, 'mate');
                const reductionMin = Math.floor(workCooldownReduction / 60000);
                effectConsumedMsg = `\n⚡ Efeito do Mate consumido! Cooldown reduzido em ${reductionMin} minutos.`;
            }
            
            addSkillXP(me, 'working', 1); updateChallenge(me, 'work', 1, true); updatePeriodChallenge(me, 'work', 1, true);
            if (!me.stats) me.stats = {};
            me.stats.totalWork = (me.stats.totalWork || 0) + 1;
            me.stats.workCount = (me.stats.workCount || 0) + 1;
            const levelUpRes = checkEcoLevelUp(me);
            saveEconomy(econ);
            let msg = MESSAGES.rpg.core.working.success(fmt(gain), fmt(bonus), fmt(gain + bonus));
            msg += effectConsumedMsg;
            if (levelUpRes.leveledUp) msg += MESSAGES.rpg.core.working.levelUp(levelUpRes.newLevel);
            return reply(msg);
        }

        if (sub === 'loja' || sub === 'lojarps') {
            let text = MESSAGES.rpg.core.shop.header;
            for (const [k, it] of Object.entries(econ.shop || {})) {
                text += MESSAGES.rpg.core.shop.item(k, it.name, fmt(it.price));
            }
            text += MESSAGES.rpg.core.shop.footer(prefix);
            return reply(text);
        }

        if (sub === 'comprar' || sub === 'buy') {
            const key = (args[0] || '').toLowerCase();
            const it = econ.shop?.[key];
            if (!it) return reply(MESSAGES.rpg.invalidItem);
            if (me.wallet < it.price) return reply(MESSAGES.rpg.insufficientCoins(it.price));
            me.wallet -= it.price;
            if (it.type === 'tool') {
                me.tools = me.tools || {};
                me.tools[it.toolType] = { tier: it.tier, dur: it.durability, max: it.durability, key };
            } else {
                me.inventory[key] = (me.inventory[key] || 0) + 1;
            }
            saveEconomy(econ);
            return reply(MESSAGES.rpg.core.shop.buySuccess(it.name));
        }

        if (sub === 'inventario' || sub === 'inv') {
            let text = MESSAGES.rpg.core.inventory.header;
            let count = 0;
            for (const [k, q] of Object.entries(me.inventory || {})) {
                if (q > 0) {
                    text += MESSAGES.rpg.core.inventory.item(k, q);
                    count++;
                }
            }
            if (count === 0) text += MESSAGES.rpg.core.inventory.empty;
            text += MESSAGES.rpg.core.inventory.footer;
            return reply(text);
        }

        if (sub === 'vagas') {
            let jobs = econ.jobCatalog || {};
            if (!jobs || Object.keys(jobs).length === 0) {
              jobs = {
                "estagiario": { name: "Estagiário", min: 80, max: 140 },
                "designer": { name: "Designer", min: 150, max: 250 },
                "programador": { name: "Programador", min: 200, max: 350 },
                "gerente": { name: "Gerente", min: 260, max: 420 }
              };
            }

            let txt = MESSAGES.rpg.core.employment.catalogHeader;
            Object.entries(jobs).forEach(([k, j]) => {
              txt += MESSAGES.rpg.core.employment.catalogItem(k, j.name, fmt(j.min), fmt(j.max));
            });
            txt += MESSAGES.rpg.core.employment.catalogFooter(prefix);
            return reply(txt);
        }

        if (sub === 'emprego') {
            const rawKey = (args[0] || '');
            if (!rawKey) return reply(MESSAGES.rpg.core.employment.usage(prefix));

            const defaultJobs = {
              "estagiario": { name: "Estagiário", min: 80, max: 140 },
              "designer": { name: "Designer", min: 150, max: 250 },
              "programador": { name: "Programador", min: 200, max: 350 },
              "gerente": { name: "Gerente", min: 260, max: 420 }
            };

            const jobCatalog = (econ.jobCatalog && Object.keys(econ.jobCatalog).length) ? econ.jobCatalog : defaultJobs;
            const key = findKeyIgnoringAccents(jobCatalog, rawKey) || normalizeParam(rawKey);
            const job = jobCatalog[key];
            if (!job) return reply(MESSAGES.rpg.jobNotFound(prefix));

            if (!econ.jobCatalog || Object.keys(econ.jobCatalog).length === 0) {
              econ.jobCatalog = jobCatalog;
            }

            me.job = key;
            saveEconomy(econ);
            return reply(MESSAGES.rpg.core.employment.hired(job.name, fmt(job.min), fmt(job.max), prefix));
        }

        if (sub === 'demitir') {
            me.job = null;
            saveEconomy(econ);
            return reply(MESSAGES.rpg.core.employment.resigned(prefix));
        }

        if (sub === 'pescar' || sub === 'fish') {
            const cd = me.cooldowns?.fish || 0;
            if (Date.now() < cd) return reply(MESSAGES.rpg.core.fishing.cooldown(timeLeft(cd)));
            const base = 80 + Math.floor(Math.random() * 121); // 80-200 (BALANCEADO)
            const skillB = getSkillBonus(me, 'fishing');
            const bonus = Math.floor(base * ((fishBonus || 0) + skillB));
            const total = base + bonus;
            me.wallet += total;
            me.cooldowns.fish = Date.now() + 12 * 60 * 1000; // 12 min
            addSkillXP(me, 'fishing', 1); updateChallenge(me, 'fish', 1, true); updatePeriodChallenge(me, 'fish', 1, true);
            
            // Adiciona peixe como ingrediente
            me.ingredients = me.ingredients || {};
            const fishQty = 2 + Math.floor(Math.random() * 3); // 2-4 peixes
            me.ingredients.peixe = (me.ingredients.peixe || 0) + fishQty;
            
            // Rastrear stats
            if (!me.stats) me.stats = {};
            me.stats.totalFish = (me.stats.totalFish || 0) + 1;
            me.stats.fishCount = (me.stats.fishCount || 0) + 1;
            
            saveEconomy(econ);
            
            const bonusText = bonus > 0 ? `│ ✨ Bônus: *+${fmt(bonus)}*\n` : '';
            return reply(MESSAGES.rpg.core.fishing.success(fmt(total), bonusText, fishQty));
        }

        if (sub === 'explorar' || sub === 'explore') {
            const cd = me.cooldowns?.explore || 0;
            if (Date.now() < cd) return reply(MESSAGES.rpg.core.exploring.cooldown(timeLeft(cd)));
            const base = 100 + Math.floor(Math.random() * 151); // 100-250 (BALANCEADO)
            const skillB = getSkillBonus(me, 'exploring');
            const bonus = Math.floor(base * ((exploreBonus || 0) + skillB));
            const total = base + bonus;
            me.wallet += total;
            me.cooldowns.explore = Date.now() + 15 * 60 * 1000; // 15 min
            addSkillXP(me, 'exploring', 1); updateChallenge(me, 'explore', 1, true); updatePeriodChallenge(me, 'explore', 1, true);
            // Rastrear stats
            if (!me.stats) me.stats = {};
            me.stats.totalExplore = (me.stats.totalExplore || 0) + 1;
            me.stats.exploreCount = (me.stats.exploreCount || 0) + 1;
            
            // Adiciona materiais da exploração
            const matsGain = {};
            if (Math.random() < 0.6) matsGain.madeira = 1 + Math.floor(Math.random() * 3); // 60% chance, 1-3 madeira
            if (Math.random() < 0.3) matsGain.corda = 1; // 30% chance, 1 corda
            if (Math.random() < 0.4) matsGain.linha = 1 + Math.floor(Math.random() * 2); // 40% chance, 1-2 linha
            if (Math.random() < 0.2) matsGain.cristal = 1; // 20% chance, 1 cristal (raro)
            
            for (const [mk, mq] of Object.entries(matsGain)) giveMaterial(me, mk, mq);
            
            saveEconomy(econ);
            
            const bonusText = bonus > 0 ? `│ ✨ Bônus: *+${fmt(bonus)}*\n` : '';
            const matsText = Object.keys(matsGain).length > 0 ? `│ 📦 Materiais: ` + Object.entries(matsGain).map(([k, q]) => `${k} x${q}`).join(', ') + `\n` : '';
            return reply(MESSAGES.rpg.core.exploring.success(fmt(total), bonusText, matsText));
        }

        if (sub === 'cacar' || sub === 'caçar' || sub === 'hunt') {
            const cd = me.cooldowns?.hunt || 0;
            if (Date.now() < cd) return reply(MESSAGES.rpg.core.hunting.cooldown(timeLeft(cd)));
            const base = 22 + Math.floor(Math.random() * 34); // 22-55 (nerfado)
            const skillB = getSkillBonus(me, 'hunting');
            const bonus = Math.floor(base * ((huntBonus || 0) + skillB) * 0.4); // bônus reduzido 60%
            const total = base + bonus;
            me.wallet += total;
            me.cooldowns.hunt = Date.now() + 22 * 60 * 1000; // 22 min
            addSkillXP(me, 'hunting', 1); updateChallenge(me, 'hunt', 1, true); updatePeriodChallenge(me, 'hunt', 1, true);
            
            // Adiciona carne como ingrediente
            me.ingredients = me.ingredients || {};
            const meatQty = 1 + (Math.random() < 0.25 ? 1 : 0); // 1-2 carnes (25% chance de pegar 2)
            me.ingredients.carne = (me.ingredients.carne || 0) + meatQty;
            
            // Adiciona materiais da caça
            const huntMats = {};
            if (Math.random() < 0.5) huntMats.couro = 1 + Math.floor(Math.random() * 2); // 50% chance, 1-2 couro
            
            for (const [mk, mq] of Object.entries(huntMats)) giveMaterial(me, mk, mq);
            
            saveEconomy(econ);
            
            const bonusText = bonus > 0 ? `│ ✨ Bônus: *+${fmt(bonus)}*\n` : '';
            const matsText = Object.keys(huntMats).length > 0 ? `│ 📦 Materiais: ` + Object.entries(huntMats).map(([k, q]) => `${k} x${q}`).join(', ') + `\n` : '';
            return reply(MESSAGES.rpg.core.hunting.success(fmt(total), bonusText, meatQty, matsText));
        }

        if (sub === 'resetrpg' && isOwner) {
            const target = menc_jid2?.[0];
            if (!target) return reply(MESSAGES.rpg.core.reset.needMention);
            delete econ.users[target];
            saveEconomy(econ);
            return reply(MESSAGES.rpg.core.reset.success(target.split('@')[0]), { mentions: [target] });
        }
    }
};
