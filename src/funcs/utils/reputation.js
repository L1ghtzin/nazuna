import { debouncedSaveJson } from '../../utils/helpers.js';
// --- SISTEMA DE REPUTAÇÃO E DENÚNCIAS ---
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REP_FILE = path.join(__dirname, '../../../dados/database/reputation.json');
const REPORTS_FILE = path.join(__dirname, '../../../dados/database/reports.json');

const CONFIG = {
    REP_COOLDOWN_MS: 24 * 60 * 60 * 1000, // 24 horas entre reps para mesma pessoa
    MAX_REP_PER_DAY: 5, // Máximo de reps que pode dar por dia
    REPORT_REASONS: [
        'spam', 'ofensa', 'assédio', 'conteúdo_impróprio', 
        'golpe', 'flood', 'divulgação', 'outro'
    ]
};

// Helper para nome de usuário
const getUserName = (userId) => {
    if (!userId || typeof userId !== 'string') return 'unknown';
    return userId.split('@')[0] || userId;
};

// --- REPUTAÇÃO ---

// Carregar dados de reputação
const loadReputation = () => {
    try {
        if (fs.existsSync(REP_FILE)) {
            return JSON.parse(fs.readFileSync(REP_FILE, 'utf8'));
        }
    } catch (err) {
        console.error('[REPUTATION] Erro ao carregar:', err.message);
    }
    return { users: {}, history: [] };
};

// Salvar dados de reputação
const saveReputation = (data) => {
    try {
        const dir = path.dirname(REP_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        debouncedSaveJson(REP_FILE, data, 1000);
    } catch (err) {
        console.error('[REPUTATION] Erro ao salvar:', err.message);
    }
};

// Obter dados do usuário
const getUserRepData = (data, userId) => {
    if (!data.users[userId]) {
        data.users[userId] = {
            positive: 0,
            negative: 0,
            givenToday: 0,
            lastGivenDate: null,
            givenTo: {} // userId -> timestamp do último rep dado
        };
    }
    return data.users[userId];
};

// Dar reputação
const giveRep = (fromId, toId, isPositive = true) => {
    if (fromId === toId) {
        return { success: false, message: '❌ Você não pode dar reputação para si mesmo!' };
    }
    
    const data = loadReputation();
    const giver = getUserRepData(data, fromId);
    const receiver = getUserRepData(data, toId);
    const now = Date.now();
    const today = new Date().toDateString();
    
    // Reset contador diário
    if (giver.lastGivenDate !== today) {
        giver.givenToday = 0;
        giver.lastGivenDate = today;
    }
    
    // Verificar limite diário
    if (giver.givenToday >= CONFIG.MAX_REP_PER_DAY) {
        return { 
            success: false, 
            message: `❌ Você já deu ${CONFIG.MAX_REP_PER_DAY} reputações hoje!\n⏳ Tente novamente amanhã.`
        };
    }
    
    // Verificar cooldown para esta pessoa específica
    if (giver.givenTo[toId]) {
        const timePassed = now - giver.givenTo[toId];
        if (timePassed < CONFIG.REP_COOLDOWN_MS) {
            const remaining = CONFIG.REP_COOLDOWN_MS - timePassed;
            const hours = Math.floor(remaining / (60 * 60 * 1000));
            const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
            return {
                success: false,
                message: `❌ Você já deu rep para esta pessoa recentemente!\n⏳ Aguarde: ${hours}h ${minutes}min`
            };
        }
    }
    
    // Dar reputação
    if (isPositive) {
        receiver.positive++;
    } else {
        receiver.negative++;
    }
    
    giver.givenToday++;
    giver.givenTo[toId] = now;
    
    // Registrar histórico
    data.history.push({
        from: fromId,
        to: toId,
        type: isPositive ? 'positive' : 'negative',
        date: new Date().toISOString()
    });
    
    // Manter apenas últimos 1000 registros
    if (data.history.length > 1000) {
        data.history = data.history.slice(-1000);
    }
    
    saveReputation(data);
    
    const total = receiver.positive - receiver.negative;
    const emoji = isPositive ? '👍' : '👎';
    const type = isPositive ? 'positiva' : 'negativa';
    
    return {
        success: true,
        message: `${emoji} *REPUTAÇÃO*\n\n` +
                 `@${getUserName(fromId)} deu reputação ${type} para @${getUserName(toId)}!\n\n` +
                 `📊 Rep de @${getUserName(toId)}: ${total >= 0 ? '+' : ''}${total}\n` +
                 `   👍 ${receiver.positive} | 👎 ${receiver.negative}`,
        mentions: [fromId, toId]
    };
};

// Ver reputação
const getRep = (userId) => {
    const data = loadReputation();
    const user = getUserRepData(data, userId);
    const total = user.positive - user.negative;
    
    let rank = '🆕 Novato';
    if (total >= 100) rank = '👑 Lendário';
    else if (total >= 50) rank = '⭐ Estrela';
    else if (total >= 25) rank = '🌟 Popular';
    else if (total >= 10) rank = '💫 Conhecido';
    else if (total >= 5) rank = '✨ Ativo';
    else if (total < -10) rank = '💀 Tóxico';
    else if (total < -5) rank = '⚠️ Suspeito';
    
    return {
        success: true,
        message: `📊 *REPUTAÇÃO*\n\n` +
                 `👤 @${getUserName(userId)}\n` +
                 `🏆 Rank: ${rank}\n\n` +
                 `📈 Total: ${total >= 0 ? '+' : ''}${total}\n` +
                 `👍 Positivas: ${user.positive}\n` +
                 `👎 Negativas: ${user.negative}`,
        mentions: [userId],
        data: { positive: user.positive, negative: user.negative, total, rank }
    };
};

// Ranking de reputação
const getRepRanking = (limit = 10) => {
    const data = loadReputation();
    
    const rankings = Object.entries(data.users)
        .map(([odIUserId, userData]) => ({
            odIUserId,
            odIUserId: odIUserId,
            userId: odIUserId,
            total: userData.positive - userData.negative,
            positive: userData.positive,
            negative: userData.negative
        }))
        .filter(u => u.total !== 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, limit);
    
    if (rankings.length === 0) {
        return { success: true, message: '📊 *RANKING DE REPUTAÇÃO*\n\nNenhum usuário com reputação ainda!' };
    }
    
    let message = '📊 *RANKING DE REPUTAÇÃO*\n\n';
    rankings.forEach((user, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        const sign = user.total >= 0 ? '+' : '';
        message += `${medal} @${getUserName(user.userId)} - ${sign}${user.total}\n`;
    });
    
    return { 
        success: true, 
        message,
        mentions: rankings.map(r => r.userId)
    };
};

// --- DENÚNCIAS ---

// Carregar denúncias
const loadReports = () => {
    try {
        if (fs.existsSync(REPORTS_FILE)) {
            return JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf8'));
        }
    } catch (err) {
        console.error('[REPORTS] Erro ao carregar:', err.message);
    }
    return { reports: [], resolved: [] };
};

// Salvar denúncias
const saveReports = (data) => {
    try {
        const dir = path.dirname(REPORTS_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        debouncedSaveJson(REPORTS_FILE, data, 1000);
    } catch (err) {
        console.error('[REPORTS] Erro ao salvar:', err.message);
    }
};

// Criar denúncia
const createReport = (reporterId, targetId, reason, description = '', groupId = null) => {
    if (reporterId === targetId) {
        return { success: false, message: '❌ Você não pode denunciar a si mesmo!' };
    }
    
    // Validar motivo
    const validReason = CONFIG.REPORT_REASONS.find(r => 
        r.toLowerCase() === reason.toLowerCase() || 
        r.replace('_', ' ').toLowerCase() === reason.toLowerCase()
    ) || 'outro';
    
    const data = loadReports();
    
    // Verificar se já existe denúncia pendente do mesmo usuário contra o mesmo alvo
    const existingReport = data.reports.find(r => 
        r.reporter === reporterId && 
        r.target === targetId && 
        r.status === 'pending'
    );
    
    if (existingReport) {
        return { success: false, message: '❌ Você já tem uma denúncia pendente contra este usuário!' };
    }
    
    const report = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        reporter: reporterId,
        target: targetId,
        reason: validReason,
        description: description.slice(0, 500),
        groupId,
        status: 'pending',
        createdAt: new Date().toISOString(),
        resolvedAt: null,
        resolvedBy: null,
        resolution: null
    };
    
    data.reports.push(report);
    saveReports(data);
    
    return {
        success: true,
        report,
        message: `🚨 *DENÚNCIA REGISTRADA*\n\n` +
                 `📋 ID: ${report.id}\n` +
                 `👤 Denunciado: @${getUserName(targetId)}\n` +
                 `📌 Motivo: ${validReason}\n` +
                 `${description ? `📝 Descrição: ${description.slice(0, 100)}${description.length > 100 ? '...' : ''}\n` : ''}` +
                 `\n✅ Sua denúncia foi registrada e será analisada.`,
        mentions: [targetId],
        notifyOwner: true
    };
};

// Listar denúncias pendentes (para admins/dono)
const listPendingReports = () => {
    const data = loadReports();
    const pending = data.reports.filter(r => r.status === 'pending');
    
    if (pending.length === 0) {
        return { success: true, message: '🚨 *DENÚNCIAS PENDENTES*\n\n✅ Nenhuma denúncia pendente!' };
    }
    
    let message = `🚨 *DENÚNCIAS PENDENTES* (${pending.length})\n\n`;
    pending.slice(0, 10).forEach(r => {
        message += `📋 *ID:* ${r.id}\n`;
        message += `👤 Alvo: @${getUserName(r.target)}\n`;
        message += `📌 Motivo: ${r.reason}\n`;
        message += `📅 Data: ${new Date(r.createdAt).toLocaleDateString('pt-BR')}\n\n`;
    });
    
    if (pending.length > 10) {
        message += `_... e mais ${pending.length - 10} denúncias_`;
    }
    
    return { 
        success: true, 
        message,
        mentions: pending.slice(0, 10).map(r => r.target)
    };
};

// Resolver denúncia (para admins/dono)
const resolveReport = (reportId, resolverId, resolution) => {
    const data = loadReports();
    const report = data.reports.find(r => r.id === reportId);
    
    if (!report) {
        return { success: false, message: '❌ Denúncia não encontrada!' };
    }
    
    if (report.status !== 'pending') {
        return { success: false, message: '❌ Esta denúncia já foi resolvida!' };
    }
    
    report.status = 'resolved';
    report.resolvedAt = new Date().toISOString();
    report.resolvedBy = resolverId;
    report.resolution = resolution.slice(0, 200);
    
    saveReports(data);
    
    return {
        success: true,
        message: `✅ *DENÚNCIA RESOLVIDA*\n\n` +
                 `📋 ID: ${report.id}\n` +
                 `👤 Alvo: @${getUserName(report.target)}\n` +
                 `📝 Resolução: ${resolution}`,
        report,
        mentions: [report.target, report.reporter]
    };
};

// Ver denúncias de um usuário
const getUserReports = (userId) => {
    const data = loadReports();
    const asTarget = data.reports.filter(r => r.target === userId);
    const pending = asTarget.filter(r => r.status === 'pending').length;
    const resolved = asTarget.filter(r => r.status === 'resolved').length;
    
    return {
        success: true,
        message: `🚨 *DENÚNCIAS - @${getUserName(userId)}*\n\n` +
                 `📊 Total: ${asTarget.length}\n` +
                 `⏳ Pendentes: ${pending}\n` +
                 `✅ Resolvidas: ${resolved}`,
        mentions: [userId],
        data: { total: asTarget.length, pending, resolved }
    };
};

// Listar motivos válidos
const listReasons = (prefix = '/') => {
    return {
        success: true,
        message: `🚨 *MOTIVOS PARA DENÚNCIA*\n\n` +
                 CONFIG.REPORT_REASONS.map(r => `• ${r.replace('_', ' ')}`).join('\n') +
                 `\n\n💡 Use: ${prefix}denunciar @user <motivo> [descrição]`
    };
};

// Alias for compatibility
const reportUser = (reporterId, targetId, groupId, reason, description = '') => {
    return createReport(reporterId, targetId, reason, description, groupId);
};

export {
    giveRep,
    getRep,
    getRepRanking,
    createReport,
    reportUser,
    listPendingReports,
    resolveReport,
    getUserReports,
    listReasons,
    CONFIG as REP_CONFIG
};

export default {
    giveRep,
    getRep,
    getRepRanking,
    createReport,
    reportUser,
    listPendingReports,
    resolveReport,
    getUserReports,
    listReasons
};
