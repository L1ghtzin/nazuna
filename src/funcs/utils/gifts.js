// --- SISTEMA DE PRESENTES ---
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GIFTS_FILE = path.join(__dirname, '../../../dados/database/gifts.json');

// Caixas de presente disponíveis
const GIFT_BOXES = {
    comum: {
        id: 'comum',
        name: '📦 Caixa Comum',
        cost: 0,
        cooldown: 24 * 60 * 60 * 1000, // 24 horas
        rewards: [
            { type: 'gold', min: 10, max: 50, chance: 40 },
            { type: 'xp', min: 5, max: 25, chance: 40 },
            { type: 'item', items: ['🍎', '🍊', '🍋'], chance: 15 },
            { type: 'nothing', chance: 5 }
        ]
    },
    rara: {
        id: 'rara',
        name: '🎁 Caixa Rara',
        cost: 500,
        cooldown: 0,
        rewards: [
            { type: 'gold', min: 100, max: 500, chance: 35 },
            { type: 'xp', min: 50, max: 150, chance: 35 },
            { type: 'item', items: ['💎', '🏆', '⭐'], chance: 25 },
            { type: 'nothing', chance: 5 }
        ]
    },
    lendaria: {
        id: 'lendaria',
        name: '✨ Caixa Lendária',
        cost: 2000,
        cooldown: 0,
        rewards: [
            { type: 'gold', min: 500, max: 2000, chance: 30 },
            { type: 'xp', min: 200, max: 500, chance: 30 },
            { type: 'item', items: ['👑', '🌟', '💫', '🔮'], chance: 35 },
            { type: 'nothing', chance: 5 }
        ]
    }
};

// Presentes que podem ser enviados
const SENDABLE_GIFTS = {
    rosa: { id: 'rosa', emoji: '🌹', name: 'Rosa', cost: 50, message: 'uma linda rosa' },
    coracao: { id: 'coracao', emoji: '❤️', name: 'Coração', cost: 100, message: 'um coração cheio de amor' },
    chocolate: { id: 'chocolate', emoji: '🍫', name: 'Chocolate', cost: 75, message: 'um delicioso chocolate' },
    urso: { id: 'urso', emoji: '🧸', name: 'Ursinho', cost: 200, message: 'um ursinho fofo' },
    diamante: { id: 'diamante', emoji: '💎', name: 'Diamante', cost: 500, message: 'um diamante precioso' },
    coroa: { id: 'coroa', emoji: '👑', name: 'Coroa', cost: 1000, message: 'uma coroa real' },
    estrela: { id: 'estrela', emoji: '⭐', name: 'Estrela', cost: 300, message: 'uma estrela brilhante' },
    bolo: { id: 'bolo', emoji: '🎂', name: 'Bolo', cost: 150, message: 'um bolo delicioso' },
    buque: { id: 'buque', emoji: '💐', name: 'Buquê', cost: 250, message: 'um lindo buquê de flores' },
    anel: { id: 'anel', emoji: '💍', name: 'Anel', cost: 2000, message: 'um anel deslumbrante' }
};

// Carregar dados
const loadGifts = () => {
    try {
        if (fs.existsSync(GIFTS_FILE)) {
            return JSON.parse(fs.readFileSync(GIFTS_FILE, 'utf8'));
        }
    } catch (err) {
        console.error('[GIFTS] Erro ao carregar:', err.message);
    }
    return { users: {}, history: [] };
};

// Salvar dados
const saveGifts = (data) => {
    try {
        const dir = path.dirname(GIFTS_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(GIFTS_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('[GIFTS] Erro ao salvar:', err.message);
    }
};

// Obter dados do usuário
const getUserData = (data, userId) => {
    if (!data.users[userId]) {
        data.users[userId] = {
            lastDailyBox: null,
            giftsSent: 0,
            giftsReceived: 0,
            giftsToday: 0,
            lastGiftDate: null,
            inventory: {}
        };
    }
    return data.users[userId];
};

// Helper para nome de usuário
const getUserName = (userId) => {
    if (!userId || typeof userId !== 'string') return 'unknown';
    return userId.split('@')[0] || userId;
};

// Rolar recompensa de caixa
const rollReward = (box) => {
    const roll = Math.random() * 100;
    let cumulative = 0;
    
    for (const reward of box.rewards) {
        cumulative += reward.chance;
        if (roll <= cumulative) {
            if (reward.type === 'nothing') {
                return { type: 'nothing', message: '💨 A caixa estava vazia!' };
            }
            if (reward.type === 'gold') {
                const amount = Math.floor(Math.random() * (reward.max - reward.min + 1)) + reward.min;
                return { type: 'gold', amount, message: `💰 Você ganhou ${amount} gold!` };
            }
            if (reward.type === 'xp') {
                const amount = Math.floor(Math.random() * (reward.max - reward.min + 1)) + reward.min;
                return { type: 'xp', amount, message: `⭐ Você ganhou ${amount} XP!` };
            }
            if (reward.type === 'item') {
                const item = reward.items[Math.floor(Math.random() * reward.items.length)];
                return { type: 'item', item, message: `🎁 Você ganhou: ${item}` };
            }
        }
    }
    
    return { type: 'nothing', message: '💨 A caixa estava vazia!' };
};

// Abrir caixa diária
const openDailyBox = (userId) => {
    const data = loadGifts();
    const user = getUserData(data, userId);
    const now = Date.now();
    
    // Verificar cooldown
    if (user.lastDailyBox) {
        const timePassed = now - user.lastDailyBox;
        if (timePassed < GIFT_BOXES.comum.cooldown) {
            const remaining = GIFT_BOXES.comum.cooldown - timePassed;
            const hours = Math.floor(remaining / (60 * 60 * 1000));
            const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
            return {
                success: false,
                message: `⏳ Você já abriu sua caixa diária!\n\n🕐 Próxima em: ${hours}h ${minutes}min`
            };
        }
    }
    
    user.lastDailyBox = now;
    const reward = rollReward(GIFT_BOXES.comum);
    
    // Adicionar item ao inventário se for item
    if (reward.type === 'item') {
        user.inventory[reward.item] = (user.inventory[reward.item] || 0) + 1;
    }
    
    saveGifts(data);
    
    return {
        success: true,
        reward,
        message: `📦 *CAIXA DIÁRIA*\n\n${reward.message}`
    };
};

// Abrir caixa comprada
const openBox = (userId, boxType, userGold) => {
    const box = GIFT_BOXES[boxType];
    if (!box) {
        return { success: false, message: '❌ Tipo de caixa inválido!' };
    }
    
    if (box.cost > 0 && userGold < box.cost) {
        return { success: false, message: `❌ Você precisa de ${box.cost} gold para abrir esta caixa!` };
    }
    
    const data = loadGifts();
    const user = getUserData(data, userId);
    const reward = rollReward(box);
    
    if (reward.type === 'item') {
        user.inventory[reward.item] = (user.inventory[reward.item] || 0) + 1;
    }
    
    saveGifts(data);
    
    return {
        success: true,
        reward,
        cost: box.cost,
        message: `${box.name}\n\n${reward.message}`
    };
};

// Enviar presente
const sendGift = (fromId, toId, giftType) => {
    if (fromId === toId) {
        return { success: false, message: '❌ Você não pode enviar presente para si mesmo!' };
    }
    
    const gift = SENDABLE_GIFTS[giftType.toLowerCase()];
    if (!gift) {
        const available = Object.values(SENDABLE_GIFTS).map(g => `${g.emoji} ${g.name} (${g.cost}g)`).join('\n');
        return { 
            success: false, 
            message: `❌ Presente inválido!\n\n🎁 *Presentes disponíveis:*\n${available}`
        };
    }
    
    const data = loadGifts();
    const sender = getUserData(data, fromId);
    const receiver = getUserData(data, toId);
    const today = new Date().toDateString();
    
    // Reset contador diário se for um novo dia
    if (sender.lastGiftDate !== today) {
        sender.giftsToday = 0;
        sender.lastGiftDate = today;
    }
    
    // Limite de presentes por dia
    if (sender.giftsToday >= 5) {
        return { success: false, message: '❌ Você já enviou 5 presentes hoje! Tente novamente amanhã.' };
    }
    
    sender.giftsSent++;
    sender.giftsToday++;
    receiver.giftsReceived++;
    receiver.inventory[gift.emoji] = (receiver.inventory[gift.emoji] || 0) + 1;
    
    // Registrar no histórico
    data.history.push({
        from: fromId,
        to: toId,
        gift: gift.id,
        date: new Date().toISOString()
    });
    
    // Manter apenas últimos 1000 registros
    if (data.history.length > 1000) {
        data.history = data.history.slice(-1000);
    }
    
    saveGifts(data);
    
    return {
        success: true,
        gift,
        message: `🎁 *PRESENTE ENVIADO!*\n\n` +
                 `@${getUserName(fromId)} enviou ${gift.message} ${gift.emoji}\n` +
                 `para @${getUserName(toId)}!\n\n` +
                 `💰 Custo: ${gift.cost} gold`,
        mentions: [fromId, toId]
    };
};

// Ver inventário de presentes
const getInventory = (userId) => {
    const data = loadGifts();
    const user = getUserData(data, userId);
    
    const items = Object.entries(user.inventory).filter(([_, count]) => count > 0);
    
    if (items.length === 0) {
        return {
            success: true,
            message: `🎒 *SEU INVENTÁRIO*\n\n📭 Vazio!\n\nAbra caixas ou receba presentes para preencher.`
        };
    }
    
    let message = `🎒 *SEU INVENTÁRIO*\n\n`;
    items.forEach(([item, count]) => {
        message += `${item} x${count}\n`;
    });
    
    message += `\n📊 *Estatísticas:*\n`;
    message += `🎁 Enviados: ${user.giftsSent}\n`;
    message += `📥 Recebidos: ${user.giftsReceived}`;
    
    return { success: true, message };
};

// Listar presentes disponíveis
const listGifts = (prefix = '/') => {
    let message = `🎁 *PRESENTES DISPONÍVEIS*\n\n`;
    
    Object.values(SENDABLE_GIFTS).forEach(gift => {
        message += `${gift.emoji} *${gift.name}* - ${gift.cost} gold\n`;
    });
    
    message += `\n💡 Use: ${prefix}presente @user <nome>\n`;
    message += `📌 Exemplo: ${prefix}presente @user rosa`;
    
    return { success: true, message };
};

// Listar caixas disponíveis
const listBoxes = (prefix = '/') => {
    let message = `📦 *CAIXAS DISPONÍVEIS*\n\n`;
    
    Object.values(GIFT_BOXES).forEach(box => {
        const cost = box.cost === 0 ? 'Grátis (1x/dia)' : `${box.cost} gold`;
        message += `${box.name}\n   💰 ${cost}\n\n`;
    });
    
    message += `💡 Use: ${prefix}caixa <tipo>\n`;
    message += `📌 Exemplo: ${prefix}caixa rara`;
    
    return { success: true, message };
};

export {
    GIFT_BOXES,
    SENDABLE_GIFTS,
    openDailyBox,
    openBox,
    sendGift,
    getInventory,
    listGifts,
    listBoxes,
    getUserData,
    loadGifts,
    saveGifts
};

export default {
    GIFT_BOXES,
    SENDABLE_GIFTS,
    openDailyBox,
    openBox,
    sendGift,
    getInventory,
    listGifts,
    listBoxes
};
