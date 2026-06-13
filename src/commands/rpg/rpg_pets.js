import { 
    loadEconomy, 
    saveEconomy, 
    getEcoUser, 
    ensureEconomyDefaults, 
    applyPetDegradation,
    matchParam,
    findKeyIgnoringAccents,
    updateQuestProgress,
    SHOP_ITEMS,
    fmt
} from "../../utils/database.js";

export default {
    name: "rpg_pets",
    description: "Sistema de pets, treinamento e batalhas",
    commands: ["pets", "meuspets", "adotar", "adopt", "alimentar", "feed", "treinar", "train", "evoluirpet", "evolve", "renomearpet", "renamepet", "batalhapet", "petbattle", "apostarpet", "petbet"],
    handle: async ({ 
    reply, isGroup, groupData, sender, prefix, command, args, q, pushname, menc_jid2,
    MESSAGES, bot, getLidFromJidCached, isValidJid
  }) => {
        if (!isGroup || !groupData.modorpg) return;

        const econ = loadEconomy();
        ensureEconomyDefaults(econ);
        const me = getEcoUser(econ, sender);
        const sub = command.toLowerCase();

        if (sub === 'pets' || sub === 'meuspets') {
            if (!me.pets) me.pets = [];
            const degradation = applyPetDegradation(me.pets);
            if (degradation.changed) saveEconomy(econ);

            if (me.pets.length === 0) {
                return reply(MESSAGES.rpg.pets.noPets(prefix));
            }

            let text = MESSAGES.rpg.pets.myPetsHeader(pushname, me.pets.length);
            me.pets.forEach((pet, i) => {
                const hungerBar = '█'.repeat(Math.floor(pet.hunger / 10)) + '░'.repeat(10 - Math.floor(pet.hunger / 10));
                const moodBar = '█'.repeat(Math.floor(pet.mood / 10)) + '░'.repeat(10 - Math.floor(pet.mood / 10));
                let statusEmoji = pet.hunger < 20 ? ' ⚠️ FOME CRÍTICA' : pet.hunger < 40 ? ' 🍖 Com fome' : '';
                if (pet.mood < 20) statusEmoji += ' 😢 TRISTE';

                const evolutions = pet.evolutions ? ` ${'⭐'.repeat(pet.evolutions)}` : '';
                text += MESSAGES.rpg.pets.petItem(
                  i + 1, pet.emoji, pet.name, evolutions, statusEmoji, 
                  pet.level, pet.exp, pet.level * 100, pet.hp, pet.maxHp, 
                  pet.attack, pet.defense, pet.wins || 0, pet.losses || 0, 
                  hungerBar, pet.hunger, moodBar, pet.mood
                );
            });
            text += MESSAGES.rpg.pets.commands(prefix);
            return reply(text);
        }

        if (sub === 'adotar' || sub === 'adopt') {
            if (!me.pets) me.pets = [];
            if (me.pets.length >= 5) return reply(MESSAGES.rpg.pets.maxPets);

            const petTypes = {
                lobo: { emoji: '🐺', name: 'Lobo', type: 'lobo', hp: 100, attack: 15, defense: 10, speed: 18, cost: 5000, desc: 'Veloz e leal', element: 'normal' },
                dragao: { emoji: '🐉', name: 'Dragão', type: 'dragao', hp: 150, attack: 25, defense: 15, speed: 12, cost: 15000, desc: 'Poderoso e raro', element: 'fire' },
                fenix: { emoji: '🔥', name: 'Fênix', type: 'fenix', hp: 120, attack: 20, defense: 12, speed: 20, cost: 10000, desc: 'Imortal e místico', element: 'fire' },
                tigre: { emoji: '🐯', name: 'Tigre', type: 'tigre', hp: 110, attack: 18, defense: 11, speed: 16, cost: 7000, desc: 'Feroz e forte', element: 'normal' },
                aguia: { emoji: '🦅', name: 'Águia', type: 'aguia', hp: 90, attack: 22, defense: 8, speed: 25, cost: 6000, desc: 'Ágil e preciso', element: 'wind' }
            };

            const inputType = (q || '').trim().toLowerCase();
            const type = matchParam(inputType, petTypes) || findKeyIgnoringAccents(petTypes, inputType);

            if (!type || !petTypes[type]) {
                let text = MESSAGES.rpg.pets.storeHeader;
                Object.entries(petTypes).forEach(([key, pet]) => {
                    text += MESSAGES.rpg.pets.storeItem(pet.emoji, pet.name, fmt(pet.cost), pet.hp, pet.attack, pet.defense);
                });
                return reply(text + MESSAGES.rpg.pets.storeFooter(prefix));
            }

            const pet = petTypes[type];
            if (me.wallet < pet.cost) return reply(MESSAGES.rpg.pets.insufficientFunds(fmt(pet.cost), fmt(me.wallet)));

            me.wallet -= pet.cost;
            me.pets.push({ ...pet, level: 1, maxHp: pet.hp, exp: 0, hunger: 100, mood: 100, wins: 0, losses: 0, equipment: {}, evolutions: 0, lastUpdate: Date.now() });
            saveEconomy(econ);
            return reply(MESSAGES.rpg.pets.adopted(pet.emoji, pet.name, prefix));
        }

        if (sub === 'alimentar' || sub === 'feed') {
            const index = parseInt(q) - 1;
            if (isNaN(index) || index < 0 || index >= (me.pets?.length || 0)) return reply(MESSAGES.rpg.pets.invalidPetNumber(prefix));
            
            const pet = me.pets[index];
            const foodCost = 100;
            if (me.wallet < foodCost) return reply(MESSAGES.rpg.pets.needFoodMoney(fmt(foodCost)));
            if (pet.hunger >= 100) return reply(MESSAGES.rpg.pets.fullPet(pet.emoji, pet.name));

            me.wallet -= foodCost;
            pet.hunger = Math.min(100, pet.hunger + 30 + Math.floor(Math.random() * 20));
            pet.mood = Math.min(100, pet.mood + 10);
            pet.lastUpdate = Date.now();
            if (pet.hp < pet.maxHp) pet.hp = Math.min(pet.maxHp, pet.hp + Math.floor(pet.maxHp * 0.1));
            
            saveEconomy(econ);
            return reply(MESSAGES.rpg.pets.fed(pet.emoji, pet.name, pet.mood, pet.hunger));
        }

        if (sub === 'treinar' || sub === 'train') {
            const index = parseInt(q) - 1;
            if (isNaN(index) || index < 0 || index >= (me.pets?.length || 0)) return reply(MESSAGES.rpg.pets.invalidPet);
            
            const pet = me.pets[index];
            if (pet.hunger < 30) return reply(MESSAGES.rpg.pets.hungryPet(pet.emoji, pet.name));
            
            const now = Date.now();
            if (pet.lastTrain && (now - pet.lastTrain) < 3600000) return reply(MESSAGES.rpg.pets.tiredPet(pet.emoji, pet.name));

            const expGain = 50 + Math.floor(Math.random() * 30);
            pet.exp += expGain;
            pet.hunger = Math.max(0, pet.hunger - 20);
            pet.lastTrain = now;
            updateQuestProgress(me, 'train_pet', 1);

            if (pet.exp >= pet.level * 100) {
                pet.level++;
                pet.attack += 2 + Math.floor(Math.random() * 3);
                pet.defense += 1 + Math.floor(Math.random() * 2);
                pet.maxHp += 10 + Math.floor(Math.random() * 10);
                pet.hp = pet.maxHp;
                pet.exp = 0;
                saveEconomy(econ);
                return reply(MESSAGES.rpg.pets.evolved(pet.name, pet.level));
            }

            saveEconomy(econ);
            return reply(MESSAGES.rpg.pets.trained(pet.emoji, pet.name, expGain, pet.exp, pet.level * 100));
        }

        if (sub === 'renomearpet' || sub === 'renamepet') {
            const argsList = q.split(' ');
            const index = parseInt(argsList[0]) - 1;
            const newName = argsList.slice(1).join(' ').substring(0, 20);
            if (isNaN(index) || !newName) return reply(MESSAGES.rpg.pets.renameUsage(prefix));
            
            const pet = me.pets[index];
            if (me.wallet < 500) return reply(MESSAGES.rpg.pets.renameCost);
            me.wallet -= 500;
            const oldName = pet.name;
            pet.name = newName;
            saveEconomy(econ);
            return reply(MESSAGES.rpg.pets.renamed(pet.emoji, oldName, pet.name));
        }

        if (sub === 'evoluirpet' || sub === 'evolve') {
            const index = parseInt(q) - 1;
            if (isNaN(index) || index < 0 || index >= (me.pets?.length || 0)) return reply(MESSAGES.rpg.pets.invalidPetNumber(prefix));
            
            const pet = me.pets[index];
            if (!pet.evolutions) pet.evolutions = 0;
            
            const evolutionData = {
                lobo: [
                  { name: 'Lobo Alpha', emoji: '🐺⭐', reqLevel: 10, atkBonus: 15, defBonus: 8, hpBonus: 50, spdBonus: 10 },
                  { name: 'Lobo Lunar', emoji: '🌙🐺', reqLevel: 25, atkBonus: 30, defBonus: 18, hpBonus: 120, spdBonus: 25 },
                  { name: 'Fenrir Despertado', emoji: '🐺💫', reqLevel: 50, atkBonus: 60, defBonus: 40, hpBonus: 250, spdBonus: 50 }
                ],
                dragao: [
                  { name: 'Dragão de Fogo', emoji: '🐲🔥', reqLevel: 15, atkBonus: 25, defBonus: 15, hpBonus: 80, spdBonus: 5 },
                  { name: 'Dragão Ancião', emoji: '🐉⚡', reqLevel: 30, atkBonus: 50, defBonus: 35, hpBonus: 180, spdBonus: 15 },
                  { name: 'Dragão Despertado', emoji: '🐉💥', reqLevel: 60, atkBonus: 100, defBonus: 70, hpBonus: 400, spdBonus: 30 }
                ],
                fenix: [
                  { name: 'Fênix Flamejante', emoji: '🔥⭐', reqLevel: 12, atkBonus: 20, defBonus: 10, hpBonus: 60, spdBonus: 15 },
                  { name: 'Fênix Imortal', emoji: '🔥💫', reqLevel: 28, atkBonus: 40, defBonus: 25, hpBonus: 150, spdBonus: 35 },
                  { name: 'Fênix Celestial', emoji: '🔥👑', reqLevel: 55, atkBonus: 80, defBonus: 50, hpBonus: 320, spdBonus: 70 }
                ],
                tigre: [
                  { name: 'Tigre Real', emoji: '🐯👑', reqLevel: 10, atkBonus: 18, defBonus: 10, hpBonus: 55, spdBonus: 12 },
                  { name: 'Tigre de Jade', emoji: '🐯💚', reqLevel: 25, atkBonus: 35, defBonus: 22, hpBonus: 130, spdBonus: 28 },
                  { name: 'Tigre Divino', emoji: '🐯⚡', reqLevel: 50, atkBonus: 70, defBonus: 45, hpBonus: 280, spdBonus: 55 }
                ],
                aguia: [
                  { name: 'Águia Majestosa', emoji: '🦅⭐', reqLevel: 10, atkBonus: 22, defBonus: 7, hpBonus: 45, spdBonus: 20 },
                  { name: 'Águia Dourada', emoji: '🦅👑', reqLevel: 25, atkBonus: 45, defBonus: 15, hpBonus: 110, spdBonus: 45 },
                  { name: 'Grifo Lendário', emoji: '🦅💫', reqLevel: 50, atkBonus: 90, defBonus: 35, hpBonus: 240, spdBonus: 90 }
                ]
            };

            const petEvolutions = evolutionData[pet.type];
            if (!petEvolutions || pet.evolutions >= petEvolutions.length) {
                return reply(MESSAGES.rpg.pets.maxEvolution(pet.emoji, pet.name));
            }

            const nextEvolution = petEvolutions[pet.evolutions];
            if (pet.level < nextEvolution.reqLevel) {
                return reply(MESSAGES.rpg.pets.needLevelToEvolve(pet.emoji, pet.name, nextEvolution.reqLevel, pet.level));
            }

            if (!me.inventory) me.inventory = {};
            const hasStone = me.inventory['pedra_evolucao'] && me.inventory['pedra_evolucao'] >= 1;

            if (!hasStone) {
                return reply(MESSAGES.rpg.pets.needStone(prefix));
            }

            me.inventory['pedra_evolucao']--;

            const oldName = pet.name;
            const oldEmoji = pet.emoji;
            const oldStats = {
                attack: pet.attack,
                defense: pet.defense,
                maxHp: pet.maxHp,
                speed: pet.speed || 0
            };

            pet.name = nextEvolution.name;
            pet.emoji = nextEvolution.emoji;
            pet.attack += nextEvolution.atkBonus;
            pet.defense += nextEvolution.defBonus;
            pet.maxHp += nextEvolution.hpBonus;
            pet.speed = (pet.speed || 0) + nextEvolution.spdBonus;
            pet.hp = pet.maxHp;
            pet.evolutions++;
            
            saveEconomy(econ);
            
            let text = MESSAGES.rpg.pets.evolutionComplete(oldEmoji, pet.emoji, oldName, pet.name);
            text += MESSAGES.rpg.pets.evolutionStats(
              oldStats.attack, pet.attack, nextEvolution.atkBonus,
              oldStats.defense, pet.defense, nextEvolution.defBonus,
              oldStats.maxHp, pet.maxHp, nextEvolution.hpBonus,
              oldStats.speed, pet.speed, nextEvolution.spdBonus
            );
            
            if (pet.evolutions < petEvolutions.length) {
                const next = petEvolutions[pet.evolutions];
                text += MESSAGES.rpg.pets.nextEvolution(next.name, next.emoji, next.reqLevel);
            } else {
                text += MESSAGES.rpg.pets.finalEvolution(pet.name);
            }
            
            return reply(text);
        }

        if (sub === 'batalhapet' || sub === 'petbattle') {
            if (!menc_jid2 || !menc_jid2[0]) return reply(MESSAGES.rpg.pets.battleMentionArgs(prefix));
            
            let target = menc_jid2[0];
            if (isValidJid(target)) {
                target = await getLidFromJidCached(bot, target) || target;
            }

            if (target === sender) return reply(MESSAGES.rpg.pets.cantBattleSelf);

            const argsList = q.split(' ');
            const index = parseInt(argsList[0]) - 1;
            if (isNaN(index) || index < 0 || index >= (me.pets?.length || 0)) return reply(MESSAGES.rpg.pets.invalidPet);
            
            const opponent = getEcoUser(econ, target);
            if (!opponent.pets || opponent.pets.length === 0) return reply(MESSAGES.rpg.pets.oppNoPets);

            const myPet = me.pets[index];
            if (myPet.hp < myPet.maxHp * 0.2) return reply(MESSAGES.rpg.pets.weakPet(myPet.emoji, myPet.name));
            
            const oppPet = opponent.pets[Math.floor(Math.random() * opponent.pets.length)];
            
            const now = Date.now();
            const PET_BATTLE_COOLDOWN = 10 * 60 * 1000;
            if (me.lastPetBattle && (now - me.lastPetBattle) < PET_BATTLE_COOLDOWN) {
                const remaining = Math.ceil((PET_BATTLE_COOLDOWN - (now - me.lastPetBattle)) / 60000);
                return reply(MESSAGES.rpg.pets.battleCooldown(remaining));
            }

            if (!me.inventory) me.inventory = {};

            const calcStats = (pet) => {
                let totalAtk = pet.attack;
                let totalDef = pet.defense;
                let totalSpd = pet.speed || 0;
                let critBonus = 0;
                let advantage = null;
                
                Object.entries(pet.equipment || {}).forEach(([slot, itemId]) => {
                    const item = SHOP_ITEMS[itemId];
                    if (item) {
                        totalAtk += item.stats?.attack || 0;
                        totalDef += item.stats?.defense || 0;
                        totalSpd += item.stats?.speed || 0;
                        critBonus += item.stats?.critBonus || 0;
                        if (item.advantage) advantage = item.advantage;
                    }
                });
                return { totalAtk, totalDef, totalSpd, critBonus, advantage };
            };

            const myStats = calcStats(myPet);
            const oppStats = calcStats(oppPet);

            const hasAdvantage = myStats.advantage === oppPet.type;
            const oppHasAdvantage = oppStats.advantage === myPet.type;
            const myFirst = myStats.totalSpd >= oppStats.totalSpd;
            
            let myHp = myPet.hp;
            let oppHp = oppPet.hp;
            let turn = 0;
            const maxTurns = 15;
            
            let battleLog = MESSAGES.rpg.pets.battleLogStart;
            battleLog += MESSAGES.rpg.pets.battleLogFighter(myPet.emoji, myPet.name, myPet.level, myHp, myPet.maxHp, myStats.totalAtk, myStats.totalDef, myStats.totalSpd);
            if (hasAdvantage) battleLog += MESSAGES.rpg.pets.typeAdvantage;
            battleLog += MESSAGES.rpg.pets.battleLogVs;
            battleLog += MESSAGES.rpg.pets.battleLogFighter(oppPet.emoji, oppPet.name, oppPet.level, oppHp, oppPet.maxHp, oppStats.totalAtk, oppStats.totalDef, oppStats.totalSpd);
            if (oppHasAdvantage) battleLog += MESSAGES.rpg.pets.typeAdvantage;
            battleLog += MESSAGES.rpg.pets.battleLogBegin;

            while (myHp > 0 && oppHp > 0 && turn < maxTurns) {
                turn++;
                battleLog += MESSAGES.rpg.pets.battleTurn(turn);
                
                const attackers = myFirst ? 
                  [{ pet: myPet, stats: myStats, hp: myHp, isMe: true }, { pet: oppPet, stats: oppStats, hp: oppHp, isMe: false }] :
                  [{ pet: oppPet, stats: oppStats, hp: oppHp, isMe: false }, { pet: myPet, stats: myStats, hp: myHp, isMe: true }];
                
                for (const attacker of attackers) {
                    if (myHp <= 0 || oppHp <= 0) break;
                    const defender = attacker.isMe ? { pet: oppPet, stats: oppStats, hp: oppHp, isMe: false } : { pet: myPet, stats: myStats, hp: myHp, isMe: true };
                    const advantage = attacker.isMe ? hasAdvantage : oppHasAdvantage;
                    
                    let baseDmg = Math.max(1, attacker.stats.totalAtk - Math.floor(defender.stats.totalDef / 2));
                    baseDmg += Math.floor(Math.random() * 11) - 5;
                    if (advantage) baseDmg = Math.floor(baseDmg * 1.5);
                    
                    const critChance = 10 + (attacker.stats.critBonus || 0);
                    const isCrit = Math.random() * 100 < critChance;
                    if (isCrit) baseDmg = Math.floor(baseDmg * 1.8);
                    
                    if (attacker.isMe) {
                        oppHp -= baseDmg;
                        battleLog += MESSAGES.rpg.pets.attackMyPet(attacker.pet.emoji, attacker.pet.name, advantage, isCrit, baseDmg, Math.max(0, oppHp), oppPet.maxHp);
                    } else {
                        myHp -= baseDmg;
                        battleLog += MESSAGES.rpg.pets.attackOppPet(attacker.pet.emoji, attacker.pet.name, advantage, isCrit, baseDmg, Math.max(0, myHp), myPet.maxHp);
                    }
                }
                battleLog += `\n`;
            }

            const won = myHp > oppHp;
            let reward = 0, expGain = 0, itemDropped = null;

            if (won) {
                reward = 1000 + (oppPet.level * 150);
                expGain = 75 + (oppPet.level * 5);
                
                me.wallet += reward;
                myPet.wins = (myPet.wins || 0) + 1;
                myPet.exp = (myPet.exp || 0) + expGain;
                oppPet.losses = (oppPet.losses || 0) + 1;

                if (Math.random() < 0.3) {
                    const oppEquipment = Object.entries(oppPet.equipment || {});
                    if (oppEquipment.length > 0) {
                        const [slot, itemId] = oppEquipment[Math.floor(Math.random() * oppEquipment.length)];
                        const item = SHOP_ITEMS[itemId];
                        if (item) {
                            itemDropped = item.name;
                            me.inventory[itemId] = (me.inventory[itemId] || 0) + 1;
                        }
                    }
                }

                battleLog += MESSAGES.rpg.pets.battleVictory(myPet.emoji, myPet.name);
                battleLog += MESSAGES.rpg.pets.battleRewards(reward.toLocaleString(), expGain);
                if (itemDropped) battleLog += MESSAGES.rpg.pets.itemDrop(itemDropped);

                if (myPet.exp >= myPet.level * 100) {
                    myPet.level++;
                    const atkGain = 2 + Math.floor(Math.random() * 3);
                    const defGain = 1 + Math.floor(Math.random() * 2);
                    const hpGain = 10 + Math.floor(Math.random() * 10);
                    myPet.attack += atkGain;
                    myPet.defense += defGain;
                    myPet.maxHp += hpGain;
                    myPet.hp = myPet.maxHp;
                    myPet.exp = 0;
                    battleLog += MESSAGES.rpg.pets.battleLevelUp(myPet.emoji, myPet.name, myPet.level, atkGain, defGain, hpGain);
                }
            } else {
                oppPet.wins = (oppPet.wins || 0) + 1;
                myPet.losses = (myPet.losses || 0) + 1;
                battleLog += MESSAGES.rpg.pets.battleDefeat(oppPet.emoji, oppPet.name);
            }

            myPet.hunger = Math.max(0, myPet.hunger - 20);
            myPet.hp = Math.max(1, Math.floor(myHp));
            oppPet.hp = Math.max(1, Math.floor(oppHp));
            me.lastPetBattle = now;
            
            saveEconomy(econ);
            return reply(battleLog, { mentions: [target] });
        }

        if (sub === 'apostarpet' || sub === 'petbet') {
            if (!menc_jid2 || !menc_jid2[0]) return reply(MESSAGES.rpg.pets.betMentionArgs(prefix));
            
            let target = menc_jid2[0];
            if (isValidJid(target)) {
                target = await getLidFromJidCached(bot, target) || target;
            }

            if (target === sender) return reply(MESSAGES.rpg.pets.betCantSelf);
            
            const argsArr = q.split(' ');
            const betAmount = parseInt(argsArr[0]) || 0;
            const petIndex = parseInt(argsArr[1]) - 1;
            
            if (betAmount <= 0) return reply(MESSAGES.rpg.pets.betInvalidAmount);
            if (betAmount > me.wallet) return reply(MESSAGES.rpg.pets.betNoMoneyMe);
            
            const opponent = getEcoUser(econ, target);
            if (betAmount > opponent.wallet) return reply(MESSAGES.rpg.pets.betNoMoneyOpp);
            
            if (!me.pets || me.pets.length === 0) return reply(MESSAGES.rpg.pets.betNoPetsMe);
            if (!opponent.pets || opponent.pets.length === 0) return reply(MESSAGES.rpg.pets.betNoPetsOpp);
            
            if (isNaN(petIndex) || petIndex < 0 || petIndex >= me.pets.length) {
                return reply(MESSAGES.rpg.pets.betInvalidPetIndex(prefix));
            }
            
            const myPet = me.pets[petIndex];
            const oppPet = opponent.pets[Math.floor(Math.random() * opponent.pets.length)];
            
            let myHp = myPet.hp;
            let oppHp = oppPet.hp;
            
            while (myHp > 0 && oppHp > 0) {
                const myDmg = Math.max(1, myPet.attack - Math.floor(oppPet.defense / 2) + Math.floor(Math.random() * 10));
                oppHp -= myDmg;
                if (oppHp <= 0) break;
                const oppDmg = Math.max(1, oppPet.attack - Math.floor(myPet.defense / 2) + Math.floor(Math.random() * 10));
                myHp -= oppDmg;
            }
            
            const won = myHp > oppHp;
            let resultMsg = MESSAGES.rpg.pets.betHeader(myPet.emoji, myPet.name, myPet.level, oppPet.emoji, oppPet.name, oppPet.level, betAmount.toLocaleString());
            
            if (won) {
                me.wallet += betAmount;
                opponent.wallet -= betAmount;
                resultMsg += MESSAGES.rpg.pets.betWon(betAmount.toLocaleString());
            } else {
                me.wallet -= betAmount;
                opponent.wallet += betAmount;
                resultMsg += MESSAGES.rpg.pets.betLost(betAmount.toLocaleString());
            }
            
            resultMsg += MESSAGES.rpg.pets.betFooter;
            saveEconomy(econ);
            return reply(resultMsg, { mentions: [target] });
        }
    }
};
