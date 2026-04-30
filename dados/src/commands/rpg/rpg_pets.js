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
    commands: ["pets", "meuspets", "adotar", "adopt", "alimentar", "feed", "treinar", "train", "evoluirpet", "evolve", "renomearpet", "renamepet", "batalhapet", "petbattle"],
    handle: async ({ 
    reply, isGroup, groupData, sender, prefix, command, args, q, pushname, menc_jid2,
    MESSAGES
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
                lobo: { emoji: '🐺', name: 'Lobo', type: 'lobo', hp: 100, attack: 15, defense: 10, speed: 18, cost: 5000, desc: 'Veloz e leal' },
                dragao: { emoji: '🐉', name: 'Dragão', type: 'dragao', hp: 150, attack: 25, defense: 15, speed: 12, cost: 15000, desc: 'Poderoso e raro' },
                fenix: { emoji: '🔥', name: 'Fênix', type: 'fenix', hp: 120, attack: 20, defense: 12, speed: 20, cost: 10000, desc: 'Imortal e místico' },
                tigre: { emoji: '🐯', name: 'Tigre', type: 'tigre', hp: 110, attack: 18, defense: 11, speed: 16, cost: 7000, desc: 'Feroz e forte' },
                aguia: { emoji: '🦅', name: 'Águia', type: 'aguia', hp: 90, attack: 22, defense: 8, speed: 25, cost: 6000, desc: 'Ágil e preciso' }
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
    }
};
