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
    MESSAGES, nazu, getLidFromJidCached, isValidJid
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
                let text = `╭━━━⊱ 🐾 *SISTEMA DE PETS* ⊱━━━╮\n│ Você ainda não tem companheiros!\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
                text += `🦊 *PETS DISPONÍVEIS:*\n  *Lobo* - Veloz e leal\n🐉 *Dragão* - Poderoso e raro\n🔥 *Fênix* - Imortal e místico\n🐯 *Tigre* - Feroz e forte\n🦅 *Águia* - Ágil e preciso\n\n💡 Use ${prefix}adotar <nome> para começar!`;
                return reply(text);
            }

            let text = `╭━━━⊱ 🐾 *MEUS PETS* ⊱━━━╮\n│ Treinador: *${pushname}*\n│ Total de Pets: ${me.pets.length}/5\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
            me.pets.forEach((pet, i) => {
                const hungerBar = '█'.repeat(Math.floor(pet.hunger / 10)) + '░'.repeat(10 - Math.floor(pet.hunger / 10));
                const moodBar = '█'.repeat(Math.floor(pet.mood / 10)) + '░'.repeat(10 - Math.floor(pet.mood / 10));
                let statusEmoji = pet.hunger < 20 ? ' ⚠️ FOME CRÍTICA' : pet.hunger < 40 ? ' 🍖 Com fome' : '';
                if (pet.mood < 20) statusEmoji += ' 😢 TRISTE';

                text += `${i + 1}. ${pet.emoji} *${pet.name}*${pet.evolutions ? ` ${'⭐'.repeat(pet.evolutions)}` : ''}${statusEmoji}\n`;
                text += `┌─────────────────\n│ 📊 Level ${pet.level} | 💫 ${pet.exp}/${pet.level * 100} EXP\n│ ❤️ HP: ${pet.hp}/${pet.maxHp}\n│ ⚔️ ATK: ${pet.attack} | 🛡️ DEF: ${pet.defense}\n`;
                text += `│ 🏆 ${pet.wins || 0}V | 💀 ${pet.losses || 0}D\n│ 🍖 Fome: ${hungerBar} ${pet.hunger}%\n│ 😊 Humor: ${moodBar} ${pet.mood}%\n└─────────────────\n\n`;
            });
            text += `🎮 *COMANDOS:* ${prefix}alimentar <nº>, ${prefix}treinar <nº>, ${prefix}evoluirpet <nº>, ${prefix}renomearpet <nº> <nome>, ${prefix}batalhapet <nº> @user`;
            return reply(text);
        }

        if (sub === 'adotar' || sub === 'adopt') {
            if (!me.pets) me.pets = [];
            if (me.pets.length >= 5) return reply('🐾 Você já tem o máximo de 5 pets!');

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
                let text = `╭━━━⊱ 🐾 *LOJA DE PETS* ⊱━━━╮\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
                Object.entries(petTypes).forEach(([key, pet]) => {
                    text += `${pet.emoji} *${pet.name}*\n│ Preço: ${fmt(pet.cost)}\n│ ❤️ HP: ${pet.hp} | ⚔️ ATK: ${pet.attack} | 🛡️ DEF: ${pet.defense}\n└─────────────────\n\n`;
                });
                return reply(text + `💡 Use ${prefix}adotar <nome>`);
            }

            const pet = petTypes[type];
            if (me.wallet < pet.cost) return reply(`💰 Você precisa de *${fmt(pet.cost)}*! Saldo: ${fmt(me.wallet)}`);

            me.wallet -= pet.cost;
            me.pets.push({ ...pet, level: 1, maxHp: pet.hp, exp: 0, hunger: 100, mood: 100, wins: 0, losses: 0, equipment: {}, evolutions: 0, lastUpdate: Date.now() });
            saveEconomy(econ);
            return reply(`🎉 Você adotou ${pet.emoji} *${pet.name}*!\n\n💡 Use ${prefix}pets para ver seus companheiros.`);
        }

        if (sub === 'alimentar' || sub === 'feed') {
            const index = parseInt(q) - 1;
            if (isNaN(index) || index < 0 || index >= (me.pets?.length || 0)) return reply(`💔 Pet inválido! Escolha o número do pet em ${prefix}pets.`);
            
            const pet = me.pets[index];
            const foodCost = 100;
            if (me.wallet < foodCost) return reply(`💰 Você precisa de ${fmt(foodCost)} para alimentar!`);
            if (pet.hunger >= 100) return reply(`🍖 ${pet.emoji} *${pet.name}* já está satisfeito!`);

            me.wallet -= foodCost;
            pet.hunger = Math.min(100, pet.hunger + 30 + Math.floor(Math.random() * 20));
            pet.mood = Math.min(100, pet.mood + 10);
            pet.lastUpdate = Date.now();
            if (pet.hp < pet.maxHp) pet.hp = Math.min(pet.maxHp, pet.hp + Math.floor(pet.maxHp * 0.1));
            
            saveEconomy(econ);
            return reply(`🍖 ${pet.emoji} *${pet.name}* comeu!\n😊 Humor: ${pet.mood}/100\n🍖 Fome: ${pet.hunger}/100`);
        }

        if (sub === 'treinar' || sub === 'train') {
            const index = parseInt(q) - 1;
            if (isNaN(index) || index < 0 || index >= (me.pets?.length || 0)) return reply(`💔 Pet inválido!`);
            
            const pet = me.pets[index];
            if (pet.hunger < 30) return reply(`🍖 ${pet.emoji} *${pet.name}* está com fome!`);
            
            const now = Date.now();
            if (pet.lastTrain && (now - pet.lastTrain) < 3600000) return reply(`⏰ ${pet.emoji} *${pet.name}* está cansado!`);

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
                return reply(`⭐ *PET EVOLUIU!* 🐾 *${pet.name}* alcançou o nível ${pet.level}!`);
            }

            saveEconomy(econ);
            return reply(`💪 ${pet.emoji} *${pet.name}* treinou!\n✨ EXP: +${expGain}\n📊 Progresso: ${pet.exp}/${pet.level * 100}`);
        }

        if (sub === 'renomearpet' || sub === 'renamepet') {
            const argsList = q.split(' ');
            const index = parseInt(argsList[0]) - 1;
            const newName = argsList.slice(1).join(' ').substring(0, 20);
            if (isNaN(index) || !newName) return reply(`💔 Use: ${prefix}renomearpet <nº> <nome>`);
            
            const pet = me.pets[index];
            if (me.wallet < 500) return reply(`💰 Renomear custa 500 moedas!`);
            me.wallet -= 500;
            const oldName = pet.name;
            pet.name = newName;
            saveEconomy(econ);
            return reply(`✏️ ${pet.emoji} *${oldName}* agora se chama *${pet.name}*!`);
        }

        if (sub === 'evoluirpet' || sub === 'evolve') {
            const index = parseInt(q) - 1;
            if (isNaN(index) || index < 0 || index >= (me.pets?.length || 0)) return reply(`💔 Pet inválido! Escolha o número do pet em ${prefix}pets.`);
            
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
                return reply(`❌ ${pet.emoji} *${pet.name}* já atingiu sua forma máxima!`);
            }

            const nextEvolution = petEvolutions[pet.evolutions];
            if (pet.level < nextEvolution.reqLevel) {
                return reply(`❌ ${pet.emoji} *${pet.name}* precisa estar no nível ${nextEvolution.reqLevel}!\n\n📊 Nível atual: ${pet.level}`);
            }

            if (!me.inventory) me.inventory = {};
            const hasStone = me.inventory['pedra_evolucao'] && me.inventory['pedra_evolucao'] >= 1;

            if (!hasStone) {
                return reply(`❌ Você precisa de uma *Pedra da Evolução* para evoluir seu pet!\n\n🛒 Compre na ${prefix}loja ou ganhe em batalhas de pets.`);
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
            
            let text = `╭━━━⊱ ✨ *EVOLUÇÃO CONCLUÍDA!* ✨ ⊱━━━╮\n│\n│ ${oldEmoji} ➜ ${pet.emoji}\n│\n│ 🎉 *${oldName}* evoluiu para\n│ 🌟 *${pet.name}*!\n│\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
            text += `📊 *NOVOS ATRIBUTOS:*\n\n⚔️ *ATK:* ${oldStats.attack} ➜ ${pet.attack} *(+${nextEvolution.atkBonus})*\n🛡️ *DEF:* ${oldStats.defense} ➜ ${pet.defense} *(+${nextEvolution.defBonus})*\n`;
            text += `❤️ *HP:* ${oldStats.maxHp} ➜ ${pet.maxHp} *(+${nextEvolution.hpBonus})*\n⚡ *SPD:* ${oldStats.speed} ➜ ${pet.speed} *(+${nextEvolution.spdBonus})*\n\n`;
            
            if (pet.evolutions < petEvolutions.length) {
                const next = petEvolutions[pet.evolutions];
                text += `🔮 *Próxima Evolução:* ${next.name} ${next.emoji}\n📊 *Requisito:* Nível ${next.reqLevel}\n`;
            } else {
                text += `👑 *${pet.name}* atingiu sua FORMA FINAL!`;
            }
            
            return reply(text);
        }

        if (sub === 'batalhapet' || sub === 'petbattle') {
            if (!menc_jid2 || !menc_jid2[0]) return reply(`⚔️ Mencione um adversário para batalhar!\nEx: ${prefix}batalhapet 1 @user`);
            
            let target = menc_jid2[0];
            if (isValidJid(target)) {
                target = await getLidFromJidCached(nazu, target) || target;
            }

            if (target === sender) return reply(`💔 Você não pode batalhar contra seus próprios pets!`);

            const argsList = q.split(' ');
            const index = parseInt(argsList[0]) - 1;
            if (isNaN(index) || index < 0 || index >= (me.pets?.length || 0)) return reply(`💔 Seu pet é inválido!`);
            
            const opponent = getEcoUser(econ, target);
            if (!opponent.pets || opponent.pets.length === 0) return reply(`😢 O adversário não tem pets!`);

            const myPet = me.pets[index];
            if (myPet.hp < myPet.maxHp * 0.2) return reply(`⚠️ ${myPet.emoji} *${myPet.name}* está muito fraco para batalhar! Alimente-o e espere recuperar vida!`);
            
            const oppPet = opponent.pets[Math.floor(Math.random() * opponent.pets.length)];
            
            const now = Date.now();
            const PET_BATTLE_COOLDOWN = 10 * 60 * 1000;
            if (me.lastPetBattle && (now - me.lastPetBattle) < PET_BATTLE_COOLDOWN) {
                const remaining = Math.ceil((PET_BATTLE_COOLDOWN - (now - me.lastPetBattle)) / 60000);
                return reply(`⏰ Você acabou de batalhar. Aguarde *${remaining} minutos*.`);
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
            
            let battleLog = `╭━━━⊱ ⚔️ *BATALHA DE PETS!* ⚔️ ⊱━━━╮\n\n`;
            battleLog += `${myPet.emoji} *${myPet.name}* (Lv.${myPet.level})\n❤️ ${myHp}/${myPet.maxHp} | ⚔️ ${myStats.totalAtk} | 🛡️ ${myStats.totalDef} | ⚡ ${myStats.totalSpd}\n`;
            if (hasAdvantage) battleLog += `✨ *VANTAGEM DE TIPO!*\n`;
            battleLog += `\n🆚\n\n${oppPet.emoji} *${oppPet.name}* (Lv.${oppPet.level})\n❤️ ${oppHp}/${oppPet.maxHp} | ⚔️ ${oppStats.totalAtk} | 🛡️ ${oppStats.totalDef} | ⚡ ${oppStats.totalSpd}\n`;
            if (oppHasAdvantage) battleLog += `✨ *VANTAGEM DE TIPO!*\n`;
            battleLog += `\n╰━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n⚡ *INÍCIO DA BATALHA!*\n\n`;

            while (myHp > 0 && oppHp > 0 && turn < maxTurns) {
                turn++;
                battleLog += `━━━ *Turno ${turn}* ━━━\n`;
                
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
                        battleLog += `⚔️ ${attacker.pet.emoji} ${attacker.pet.name} atacou!\n`;
                        if (advantage) battleLog += `   ✨ *SUPER EFETIVO!*\n`;
                        if (isCrit) battleLog += `   💥 *CRÍTICO!*\n`;
                        battleLog += `   💔 Dano: ${baseDmg}\n   ❤️ HP Oponente: ${Math.max(0, oppHp)}/${oppPet.maxHp}\n`;
                    } else {
                        myHp -= baseDmg;
                        battleLog += `🛡️ ${attacker.pet.emoji} ${attacker.pet.name} contra-atacou!\n`;
                        if (advantage) battleLog += `   ✨ *SUPER EFETIVO!*\n`;
                        if (isCrit) battleLog += `   💥 *CRÍTICO!*\n`;
                        battleLog += `   💔 Dano: ${baseDmg}\n   ❤️ Seu HP: ${Math.max(0, myHp)}/${myPet.maxHp}\n`;
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

                battleLog += `╭━━━⊱ 🏆 *VITÓRIA!* 🏆 ⊱━━━╮\n│ ${myPet.emoji} *${myPet.name}* venceu!\n╰━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
                battleLog += `📊 *RECOMPENSAS:*\n💰 Moedas: +${reward.toLocaleString()}\n✨ EXP: +${expGain}\n`;
                if (itemDropped) battleLog += `🎁 Item dropado: *${itemDropped}*\n`;

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
                    battleLog += `\n╭━━━⊱ ⭐ *LEVEL UP!* ⭐ ⊱━━━╮\n│ ${myPet.emoji} ${myPet.name} → Lv.${myPet.level}\n│ ⚔️ ATK +${atkGain} | 🛡️ DEF +${defGain} | ❤️ HP +${hpGain}\n╰━━━━━━━━━━━━━━━━━━━━━━━╯`;
                }
            } else {
                oppPet.wins = (oppPet.wins || 0) + 1;
                myPet.losses = (myPet.losses || 0) + 1;
                battleLog += `╭━━━⊱ 💀 *DERROTA!* 💀 ⊱━━━╮\n│ ${oppPet.emoji} *${oppPet.name}* venceu!\n╰━━━━━━━━━━━━━━━━━━━━━━━╯\n\n💪 Continue treinando para melhorar!`;
            }

            myPet.hunger = Math.max(0, myPet.hunger - 20);
            myPet.hp = Math.max(1, Math.floor(myHp));
            oppPet.hp = Math.max(1, Math.floor(oppHp));
            me.lastPetBattle = now;
            
            saveEconomy(econ);
            return reply(battleLog, { mentions: [target] });
        }

        if (sub === 'apostarpet' || sub === 'petbet') {
            if (!menc_jid2 || !menc_jid2[0]) return reply(`❌ Marque alguém para apostar!\n\n💡 Uso: ${prefix}apostarpet <valor> <nº pet> @user`);
            
            let target = menc_jid2[0];
            if (isValidJid(target)) {
                target = await getLidFromJidCached(nazu, target) || target;
            }

            if (target === sender) return reply('❌ Você não pode apostar contra si mesmo!');
            
            const argsArr = q.split(' ');
            const betAmount = parseInt(argsArr[0]) || 0;
            const petIndex = parseInt(argsArr[1]) - 1;
            
            if (betAmount <= 0) return reply('❌ Informe um valor válido para apostar!');
            if (betAmount > me.wallet) return reply('❌ Você não tem dinheiro suficiente na carteira!');
            
            const opponent = getEcoUser(econ, target);
            if (betAmount > opponent.wallet) return reply('❌ Seu oponente não tem dinheiro suficiente!');
            
            if (!me.pets || me.pets.length === 0) return reply('🐾 Você não tem pets!');
            if (!opponent.pets || opponent.pets.length === 0) return reply('❌ Seu oponente não tem pets!');
            
            if (isNaN(petIndex) || petIndex < 0 || petIndex >= me.pets.length) {
                return reply(`❌ Pet inválido! Use ${prefix}pets para ver seus pets.`);
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
            let resultMsg = `╭━━━⊱ 🎰 *APOSTA DE PETS* ⊱━━━╮\n\n${myPet.emoji} *${myPet.name}* (Lv.${myPet.level}) VS ${oppPet.emoji} *${oppPet.name}* (Lv.${oppPet.level})\n\n💰 Aposta: ${betAmount.toLocaleString()}\n\n`;
            
            if (won) {
                me.wallet += betAmount;
                opponent.wallet -= betAmount;
                resultMsg += `🏆 *VOCÊ VENCEU!*\n💰 Ganhou: +${betAmount.toLocaleString()}`;
            } else {
                me.wallet -= betAmount;
                opponent.wallet += betAmount;
                resultMsg += `💀 *VOCÊ PERDEU!*\n💸 Perdeu: -${betAmount.toLocaleString()}`;
            }
            
            resultMsg += `\n╰━━━━━━━━━━━━━━━━━━━━━━╯`;
            saveEconomy(econ);
            return reply(resultMsg, { mentions: [target] });
        }
    }
};
