// --- SISTEMA DE CONQUISTAS ---
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ACHIEVEMENTS_FILE = path.join(__dirname, '../../../dados/database/achievements.json');

// Definição de todas as conquistas disponíveis
const ACHIEVEMENTS = {
    // Conquistas de Mensagens
    first_message: {
        id: 'first_message',
        name: '🎉 Primeiro Passo',
        description: 'Enviou sua primeira mensagem',
        icon: '🎉',
        xpReward: 10,
        goldReward: 50
    },
    messages_100: {
        id: 'messages_100',
        name: '💬 Tagarela',
        description: 'Enviou 100 mensagens',
        icon: '💬',
        xpReward: 50,
        goldReward: 200
    },
    messages_1000: {
        id: 'messages_1000',
        name: '🗣️ Palestrante',
        description: 'Enviou 1.000 mensagens',
        icon: '🗣️',
        xpReward: 200,
        goldReward: 1000
    },
    messages_10000: {
        id: 'messages_10000',
        name: '📢 Lenda Falante',
        description: 'Enviou 10.000 mensagens',
        icon: '📢',
        xpReward: 1000,
        goldReward: 5000
    },

    // Conquistas de Comandos
    first_command: {
        id: 'first_command',
        name: '⌨️ Iniciante',
        description: 'Usou seu primeiro comando',
        icon: '⌨️',
        xpReward: 10,
        goldReward: 25
    },
    commands_50: {
        id: 'commands_50',
        name: '🎮 Jogador Casual',
        description: 'Usou 50 comandos',
        icon: '🎮',
        xpReward: 50,
        goldReward: 150
    },
    commands_500: {
        id: 'commands_500',
        name: '🕹️ Gamer',
        description: 'Usou 500 comandos',
        icon: '🕹️',
        xpReward: 200,
        goldReward: 750
    },
    commands_5000: {
        id: 'commands_5000',
        name: '🏆 Mestre dos Comandos',
        description: 'Usou 5.000 comandos',
        icon: '🏆',
        xpReward: 1000,
        goldReward: 3000
    },

    // Conquistas de Jogos
    first_game_win: {
        id: 'first_game_win',
        name: '🥇 Primeira Vitória',
        description: 'Venceu seu primeiro jogo',
        icon: '🥇',
        xpReward: 25,
        goldReward: 100
    },
    wins_10: {
        id: 'wins_10',
        name: '🎖️ Competidor',
        description: 'Venceu 10 jogos',
        icon: '🎖️',
        xpReward: 100,
        goldReward: 500
    },
    wins_50: {
        id: 'wins_50',
        name: '🏅 Campeão',
        description: 'Venceu 50 jogos',
        icon: '🏅',
        xpReward: 300,
        goldReward: 1500
    },
    wins_100: {
        id: 'wins_100',
        name: '👑 Rei dos Jogos',
        description: 'Venceu 100 jogos',
        icon: '👑',
        xpReward: 1000,
        goldReward: 5000
    },
    connect4_master: {
        id: 'connect4_master',
        name: '🔴 Mestre do Connect4',
        description: 'Venceu 25 partidas de Connect4',
        icon: '🔴',
        xpReward: 500,
        goldReward: 2000
    },
    uno_master: {
        id: 'uno_master',
        name: '🃏 Mestre do UNO',
        description: 'Venceu 25 partidas de UNO',
        icon: '🃏',
        xpReward: 500,
        goldReward: 2000
    },
    memory_master: {
        id: 'memory_master',
        name: '🧠 Memória de Elefante',
        description: 'Completou o jogo da memória em menos de 12 tentativas',
        icon: '🧠',
        xpReward: 300,
        goldReward: 1000
    },

    // Conquistas Sociais
    first_gift: {
        id: 'first_gift',
        name: '🎁 Generoso',
        description: 'Enviou seu primeiro presente',
        icon: '🎁',
        xpReward: 25,
        goldReward: 50
    },
    gifts_sent_25: {
        id: 'gifts_sent_25',
        name: '🎄 Papai Noel',
        description: 'Enviou 25 presentes',
        icon: '🎄',
        xpReward: 150,
        goldReward: 500
    },
    positive_rep_10: {
        id: 'positive_rep_10',
        name: '⭐ Querido',
        description: 'Recebeu 10 reputações positivas',
        icon: '⭐',
        xpReward: 100,
        goldReward: 300
    },
    positive_rep_50: {
        id: 'positive_rep_50',
        name: '🌟 Popular',
        description: 'Recebeu 50 reputações positivas',
        icon: '🌟',
        xpReward: 500,
        goldReward: 1500
    },

    // Conquistas de Economia/RPG
    first_gold: {
        id: 'first_gold',
        name: '💰 Primeiro Ouro',
        description: 'Ganhou seu primeiro ouro',
        icon: '💰',
        xpReward: 5,
        goldReward: 100
    },
    gold_1000: {
        id: 'gold_1000',
        name: '💵 Poupador',
        description: 'Acumulou 1.000 de ouro',
        icon: '💵',
        xpReward: 50,
        goldReward: 0
    },
    gold_10000: {
        id: 'gold_10000',
        name: '💎 Rico',
        description: 'Acumulou 10.000 de ouro',
        icon: '💎',
        xpReward: 200,
        goldReward: 0
    },
    gold_100000: {
        id: 'gold_100000',
        name: '🤑 Milionário',
        description: 'Acumulou 100.000 de ouro',
        icon: '🤑',
        xpReward: 1000,
        goldReward: 0
    },

    // Conquistas de Nível
    level_10: {
        id: 'level_10',
        name: '📈 Em Ascensão',
        description: 'Alcançou o nível 10',
        icon: '📈',
        xpReward: 100,
        goldReward: 500
    },
    level_25: {
        id: 'level_25',
        name: '🚀 Experiente',
        description: 'Alcançou o nível 25',
        icon: '🚀',
        xpReward: 250,
        goldReward: 1000
    },
    level_50: {
        id: 'level_50',
        name: '⚡ Veterano',
        description: 'Alcançou o nível 50',
        icon: '⚡',
        xpReward: 500,
        goldReward: 2500
    },
    level_100: {
        id: 'level_100',
        name: '🌈 Lendário',
        description: 'Alcançou o nível 100',
        icon: '🌈',
        xpReward: 2000,
        goldReward: 10000
    },

    // Conquistas Especiais
    daily_streak_7: {
        id: 'daily_streak_7',
        name: '📅 Dedicado',
        description: 'Manteve uma sequência de 7 dias',
        icon: '📅',
        xpReward: 100,
        goldReward: 500
    },
    daily_streak_30: {
        id: 'daily_streak_30',
        name: '🔥 Comprometido',
        description: 'Manteve uma sequência de 30 dias',
        icon: '🔥',
        xpReward: 500,
        goldReward: 2500
    },
    night_owl: {
        id: 'night_owl',
        name: '🦉 Coruja Noturna',
        description: 'Usou comandos entre 00:00 e 05:00',
        icon: '🦉',
        xpReward: 25,
        goldReward: 100
    },
    early_bird: {
        id: 'early_bird',
        name: '🐦 Madrugador',
        description: 'Usou comandos entre 05:00 e 07:00',
        icon: '🐦',
        xpReward: 25,
        goldReward: 100
    },
    collector: {
        id: 'collector',
        name: '🎯 Colecionador',
        description: 'Desbloqueou 20 conquistas',
        icon: '🎯',
        xpReward: 500,
        goldReward: 2000
    },
    completionist: {
        id: 'completionist',
        name: '✨ Completista',
        description: 'Desbloqueou todas as conquistas',
        icon: '✨',
        xpReward: 5000,
        goldReward: 25000
    }
};

// Carregar dados de conquistas
const loadAchievements = () => {
    try {
        if (fs.existsSync(ACHIEVEMENTS_FILE)) {
            return JSON.parse(fs.readFileSync(ACHIEVEMENTS_FILE, 'utf8'));
        }
    } catch (err) {
        console.error('[ACHIEVEMENTS] Erro ao carregar:', err.message);
    }
    return { users: {}, stats: {} };
};

// Salvar dados de conquistas
const saveAchievements = (data) => {
    try {
        const dir = path.dirname(ACHIEVEMENTS_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(ACHIEVEMENTS_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('[ACHIEVEMENTS] Erro ao salvar:', err.message);
    }
};

// Obter dados do usuário
const getUserData = (data, userId) => {
    if (!data.users[userId]) {
        data.users[userId] = {
            unlockedAchievements: [],
            stats: {
                messages: 0,
                commands: 0,
                gamesWon: 0,
                gamesPlayed: 0,
                connect4Wins: 0,
                unoWins: 0,
                memoryBestScore: null,
                giftsSent: 0,
                giftsReceived: 0,
                positiveRep: 0,
                negativeRep: 0,
                dailyStreak: 0,
                lastDaily: null
            }
        };
    }
    return data.users[userId];
};

// Verificar e desbloquear conquista
const checkAndUnlock = (userId, achievementId, customCheck = null) => {
    const data = loadAchievements();
    const user = getUserData(data, userId);
    const achievement = ACHIEVEMENTS[achievementId];

    if (!achievement) return null;
    if (user.unlockedAchievements.includes(achievementId)) return null;

    // Se há uma verificação customizada, usar ela
    if (customCheck && !customCheck(user.stats)) return null;

    // Desbloquear conquista
    user.unlockedAchievements.push(achievementId);
    saveAchievements(data);

    return {
        unlocked: true,
        achievement,
        message: `🏆 *CONQUISTA DESBLOQUEADA!*\n\n` +
                 `${achievement.icon} *${achievement.name}*\n` +
                 `📝 ${achievement.description}\n\n` +
                 `🎁 Recompensas:\n` +
                 `${achievement.xpReward > 0 ? `   ⭐ +${achievement.xpReward} XP\n` : ''}` +
                 `${achievement.goldReward > 0 ? `   💰 +${achievement.goldReward} Gold\n` : ''}`
    };
};

// Incrementar estatística e verificar conquistas relacionadas
const incrementStat = (userId, stat, amount = 1) => {
    const data = loadAchievements();
    const user = getUserData(data, userId);
    
    user.stats[stat] = (user.stats[stat] || 0) + amount;
    saveAchievements(data);

    const unlockedAchievements = [];

    // Verificar conquistas baseadas na estatística
    switch (stat) {
        case 'messages':
            if (user.stats.messages >= 1) {
                const result = checkAndUnlock(userId, 'first_message');
                if (result) unlockedAchievements.push(result);
            }
            if (user.stats.messages >= 100) {
                const result = checkAndUnlock(userId, 'messages_100');
                if (result) unlockedAchievements.push(result);
            }
            if (user.stats.messages >= 1000) {
                const result = checkAndUnlock(userId, 'messages_1000');
                if (result) unlockedAchievements.push(result);
            }
            if (user.stats.messages >= 10000) {
                const result = checkAndUnlock(userId, 'messages_10000');
                if (result) unlockedAchievements.push(result);
            }
            break;

        case 'commands':
            if (user.stats.commands >= 1) {
                const result = checkAndUnlock(userId, 'first_command');
                if (result) unlockedAchievements.push(result);
            }
            if (user.stats.commands >= 50) {
                const result = checkAndUnlock(userId, 'commands_50');
                if (result) unlockedAchievements.push(result);
            }
            if (user.stats.commands >= 500) {
                const result = checkAndUnlock(userId, 'commands_500');
                if (result) unlockedAchievements.push(result);
            }
            if (user.stats.commands >= 5000) {
                const result = checkAndUnlock(userId, 'commands_5000');
                if (result) unlockedAchievements.push(result);
            }
            // Verificar horário
            const hour = new Date().getHours();
            if (hour >= 0 && hour < 5) {
                const result = checkAndUnlock(userId, 'night_owl');
                if (result) unlockedAchievements.push(result);
            }
            if (hour >= 5 && hour < 7) {
                const result = checkAndUnlock(userId, 'early_bird');
                if (result) unlockedAchievements.push(result);
            }
            break;

        case 'gamesWon':
            if (user.stats.gamesWon >= 1) {
                const result = checkAndUnlock(userId, 'first_game_win');
                if (result) unlockedAchievements.push(result);
            }
            if (user.stats.gamesWon >= 10) {
                const result = checkAndUnlock(userId, 'wins_10');
                if (result) unlockedAchievements.push(result);
            }
            if (user.stats.gamesWon >= 50) {
                const result = checkAndUnlock(userId, 'wins_50');
                if (result) unlockedAchievements.push(result);
            }
            if (user.stats.gamesWon >= 100) {
                const result = checkAndUnlock(userId, 'wins_100');
                if (result) unlockedAchievements.push(result);
            }
            break;

        case 'connect4Wins':
            if (user.stats.connect4Wins >= 25) {
                const result = checkAndUnlock(userId, 'connect4_master');
                if (result) unlockedAchievements.push(result);
            }
            break;

        case 'unoWins':
            if (user.stats.unoWins >= 25) {
                const result = checkAndUnlock(userId, 'uno_master');
                if (result) unlockedAchievements.push(result);
            }
            break;

        case 'giftsSent':
            if (user.stats.giftsSent >= 1) {
                const result = checkAndUnlock(userId, 'first_gift');
                if (result) unlockedAchievements.push(result);
            }
            if (user.stats.giftsSent >= 25) {
                const result = checkAndUnlock(userId, 'gifts_sent_25');
                if (result) unlockedAchievements.push(result);
            }
            break;

        case 'positiveRep':
            if (user.stats.positiveRep >= 10) {
                const result = checkAndUnlock(userId, 'positive_rep_10');
                if (result) unlockedAchievements.push(result);
            }
            if (user.stats.positiveRep >= 50) {
                const result = checkAndUnlock(userId, 'positive_rep_50');
                if (result) unlockedAchievements.push(result);
            }
            break;
    }

    // Verificar conquista de colecionador
    if (user.unlockedAchievements.length >= 20) {
        const result = checkAndUnlock(userId, 'collector');
        if (result) unlockedAchievements.push(result);
    }
    if (user.unlockedAchievements.length >= Object.keys(ACHIEVEMENTS).length - 1) {
        const result = checkAndUnlock(userId, 'completionist');
        if (result) unlockedAchievements.push(result);
    }

    return unlockedAchievements;
};

// Verificar conquista de memória (baseado em score)
const checkMemoryAchievement = (userId, attempts) => {
    const data = loadAchievements();
    const user = getUserData(data, userId);

    if (user.stats.memoryBestScore === null || attempts < user.stats.memoryBestScore) {
        user.stats.memoryBestScore = attempts;
        saveAchievements(data);
    }

    if (attempts <= 12) {
        return checkAndUnlock(userId, 'memory_master');
    }
    return null;
};

// Verificar conquista de nível
const checkLevelAchievement = (userId, level) => {
    const unlockedAchievements = [];

    if (level >= 10) {
        const result = checkAndUnlock(userId, 'level_10');
        if (result) unlockedAchievements.push(result);
    }
    if (level >= 25) {
        const result = checkAndUnlock(userId, 'level_25');
        if (result) unlockedAchievements.push(result);
    }
    if (level >= 50) {
        const result = checkAndUnlock(userId, 'level_50');
        if (result) unlockedAchievements.push(result);
    }
    if (level >= 100) {
        const result = checkAndUnlock(userId, 'level_100');
        if (result) unlockedAchievements.push(result);
    }

    return unlockedAchievements;
};

// Verificar conquista de ouro
const checkGoldAchievement = (userId, gold) => {
    const unlockedAchievements = [];

    if (gold >= 1) {
        const result = checkAndUnlock(userId, 'first_gold');
        if (result) unlockedAchievements.push(result);
    }
    if (gold >= 1000) {
        const result = checkAndUnlock(userId, 'gold_1000');
        if (result) unlockedAchievements.push(result);
    }
    if (gold >= 10000) {
        const result = checkAndUnlock(userId, 'gold_10000');
        if (result) unlockedAchievements.push(result);
    }
    if (gold >= 100000) {
        const result = checkAndUnlock(userId, 'gold_100000');
        if (result) unlockedAchievements.push(result);
    }

    return unlockedAchievements;
};

// Verificar conquista de daily streak
const checkDailyStreak = (userId) => {
    const data = loadAchievements();
    const user = getUserData(data, userId);
    const today = new Date().toDateString();

    if (user.stats.lastDaily === today) {
        return [];
    }

    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (user.stats.lastDaily === yesterday) {
        user.stats.dailyStreak++;
    } else {
        user.stats.dailyStreak = 1;
    }
    user.stats.lastDaily = today;
    saveAchievements(data);

    const unlockedAchievements = [];
    if (user.stats.dailyStreak >= 7) {
        const result = checkAndUnlock(userId, 'daily_streak_7');
        if (result) unlockedAchievements.push(result);
    }
    if (user.stats.dailyStreak >= 30) {
        const result = checkAndUnlock(userId, 'daily_streak_30');
        if (result) unlockedAchievements.push(result);
    }

    return unlockedAchievements;
};

// Obter todas as conquistas do usuário
const getUserAchievements = (userId) => {
    const data = loadAchievements();
    const user = getUserData(data, userId);

    const unlocked = user.unlockedAchievements.map(id => ACHIEVEMENTS[id]).filter(Boolean);
    const locked = Object.values(ACHIEVEMENTS).filter(
        a => !user.unlockedAchievements.includes(a.id)
    );

    return {
        unlocked,
        locked,
        total: Object.keys(ACHIEVEMENTS).length,
        unlockedCount: unlocked.length,
        stats: user.stats
    };
};

// Obter lista de conquistas formatada
const formatAchievementsList = (userId) => {
    const { unlocked, locked, total, unlockedCount, stats } = getUserAchievements(userId);

    let message = `🏆 *CONQUISTAS* (${unlockedCount}/${total})\n\n`;

    if (unlocked.length > 0) {
        message += `✅ *Desbloqueadas:*\n`;
        unlocked.forEach(a => {
            message += `${a.icon} ${a.name}\n`;
        });
        message += '\n';
    }

    if (locked.length > 0) {
        message += `🔒 *Bloqueadas:*\n`;
        locked.slice(0, 10).forEach(a => {
            message += `${a.icon} ???\n`;
        });
        if (locked.length > 10) {
            message += `   _... e mais ${locked.length - 10} conquistas_\n`;
        }
    }

    message += `\n📊 *Estatísticas:*\n`;
    message += `💬 Mensagens: ${stats.messages || 0}\n`;
    message += `⌨️ Comandos: ${stats.commands || 0}\n`;
    message += `🎮 Vitórias: ${stats.gamesWon || 0}\n`;
    message += `🔥 Sequência: ${stats.dailyStreak || 0} dias`;

    return message;
};

// Obter todas as conquistas disponíveis
const getAllAchievements = () => ACHIEVEMENTS;

export {
    ACHIEVEMENTS,
    incrementStat,
    checkAndUnlock,
    checkMemoryAchievement,
    checkLevelAchievement,
    checkGoldAchievement,
    checkDailyStreak,
    getUserAchievements,
    formatAchievementsList,
    getAllAchievements
};

export default {
    ACHIEVEMENTS,
    incrementStat,
    checkAndUnlock,
    checkMemoryAchievement,
    checkLevelAchievement,
    checkGoldAchievement,
    checkDailyStreak,
    getUserAchievements,
    formatAchievementsList,
    getAllAchievements
};
