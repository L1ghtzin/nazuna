import { debouncedSaveJson } from '../../utils/helpers.js';
// --- SISTEMA ANTITOXIC ---
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MESSAGES } from '../../utils/messages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ANTITOXIC_FILE = path.join(__dirname, '../../../dados/database/antitoxic.json');

const CONFIG = {
    COOLDOWN_MS: 30 * 1000, // Cooldown entre avisos para o mesmo usuário
    THRESHOLD: 70, // Score mínimo para considerar tóxico (0-100)
    MAX_WARNINGS: 3, // Avisos antes de ação automática
    WARNING_RESET_MS: 24 * 60 * 60 * 1000, // Reset de avisos após 24h
    ACTIONS: ['avisar', 'apagar', 'mute'],
    DEFAULT_ACTION: 'avisar'
};

// Palavras-chave de detecção de toxicidade e seus pesos (score 1-100)
const TOXIC_KEYWORDS = [
    // Ofensas leves e gerais (Score baixo: ~30-50)
    { word: 'idiota', score: 30 }, { word: 'burro', score: 30 }, { word: 'burra', score: 30 }, { word: 'imbecil', score: 40 },
    { word: 'retardado', score: 40 }, { word: 'retardada', score: 40 }, { word: 'otário', score: 30 }, { word: 'otária', score: 30 },
    { word: 'babaca', score: 30 }, { word: 'estúpido', score: 30 }, { word: 'estúpida', score: 30 }, { word: 'cretino', score: 30 },
    { word: 'cretina', score: 30 }, { word: 'mongol', score: 50 }, { word: 'débil', score: 50 }, { word: 'lixo', score: 30 },
    { word: 'merda', score: 40 }, { word: 'trouxa', score: 30 }, { word: 'inútil', score: 30 }, { word: 'verme', score: 40 },
    { word: 'bosta', score: 40 }, { word: 'escroto', score: 50 }, { word: 'escrota', score: 50 }, { word: 'corno', score: 40 },
    { word: 'corna', score: 40 }, { word: 'chifrudo', score: 40 },
    // Termos mais graves (xingamentos diretos) (Score alto: ~70-90)
    { word: 'foder', score: 80 }, { word: 'f*der', score: 80 }, { word: 'puta', score: 90 }, { word: 'p*ta', score: 90 },
    { word: 'viado', score: 90 }, { word: 'v*ado', score: 90 }, { word: 'caralho', score: 80 }, { word: 'c*ralho', score: 80 },
    { word: 'arrombado', score: 90 }, { word: 'arr*mbado', score: 90 }, { word: 'fdp', score: 90 }, { word: 'filho da puta', score: 100 },
    { word: 'filha da puta', score: 100 }, { word: 'cuzão', score: 90 }, { word: 'cuzona', score: 90 }, { word: 'c*zão', score: 90 },
    { word: 'pau no cu', score: 100 }, { word: 'pau no c*', score: 100 }, { word: 'vagabundo', score: 70 }, { word: 'vagabunda', score: 70 },
    { word: 'desgraçado', score: 70 }, { word: 'desgraçada', score: 70 }, { word: 'miserável', score: 60 }, { word: 'puta que pariu', score: 80 },
    { word: 'pqp', score: 80 }, { word: 'macaco', score: 100 }, { word: 'macaca', score: 100 }, { word: 'preto safado', score: 100 },
    { word: 'preta safada', score: 100 }, { word: 'viadinho', score: 90 }, { word: 'sapatão', score: 90 }, { word: 'bicha', score: 90 },
    { word: 'vadia', score: 90 }, { word: 'piranha', score: 90 }, { word: 'prostituta', score: 80 }, { word: 'cadela', score: 90 },
    // Ameaças (Score máximo: 100)
    { word: 'vou te matar', score: 100 }, { word: 'vou te pegar', score: 80 }, { word: 'vai morrer', score: 100 },
    { word: 'vou te bater', score: 90 }, { word: 'te quebro', score: 90 }, { word: 'te arrebento', score: 90 }
];

// Helper para nome de usuário
const getUserName = (userId) => {
    if (!userId || typeof userId !== 'string') return 'unknown';
    return userId.split('@')[0] || userId;
};

// --- PERSISTÊNCIA ---

const loadAntitoxic = () => {
    try {
        if (fs.existsSync(ANTITOXIC_FILE)) {
            return JSON.parse(fs.readFileSync(ANTITOXIC_FILE, 'utf8'));
        }
    } catch (err) {
        console.error('[ANTITOXIC] Erro ao carregar:', err.message);
    }
    return { groups: {}, userWarnings: {} };
};

const saveAntitoxic = (data) => {
    try {
        const dir = path.dirname(ANTITOXIC_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        debouncedSaveJson(ANTITOXIC_FILE, data, 1000);
    } catch (err) {
        console.error('[ANTITOXIC] Erro ao salvar:', err.message);
    }
};

// --- CONFIGURAÇÃO DO GRUPO ---

const enableAntitoxic = (groupId, action = CONFIG.DEFAULT_ACTION, prefix = '/') => {
    if (!CONFIG.ACTIONS.includes(action)) {
        action = CONFIG.DEFAULT_ACTION;
    }
    
    const data = loadAntitoxic();
    data.groups[groupId] = {
        enabled: true,
        action,
        threshold: CONFIG.THRESHOLD,
        enabledAt: new Date().toISOString(),
        stats: { detected: 0, warned: 0, deleted: 0, muted: 0 }
    };
    saveAntitoxic(data);
    
    return {
        success: true,
        message: MESSAGES.funcs.antiToxic.enabled(action, CONFIG.THRESHOLD, prefix)
    };
};

const disableAntitoxic = (groupId) => {
    const data = loadAntitoxic();
    if (data.groups[groupId]) {
        data.groups[groupId].enabled = false;
    }
    saveAntitoxic(data);
    
    return {
        success: true,
        message: MESSAGES.funcs.antiToxic.disabled
    };
};

const setAntitoxicAction = (groupId, action) => {
    if (!CONFIG.ACTIONS.includes(action)) {
        return {
            success: false,
            message: MESSAGES.funcs.antiToxic.invalidAction(CONFIG.ACTIONS.join(', '))
        };
    }
    
    const data = loadAntitoxic();
    if (!data.groups[groupId] || !data.groups[groupId].enabled) {
        return { success: false, message: MESSAGES.funcs.antiToxic.notEnabled };
    }
    
    data.groups[groupId].action = action;
    saveAntitoxic(data);
    
    return {
        success: true,
        message: MESSAGES.funcs.antiToxic.actionChanged(action)
    };
};

const setAntitoxicThreshold = (groupId, threshold) => {
    const value = parseInt(threshold);
    if (isNaN(value) || value < 1 || value > 100) {
        return { success: false, message: MESSAGES.funcs.antiToxic.invalidThreshold };
    }
    
    const data = loadAntitoxic();
    if (!data.groups[groupId] || !data.groups[groupId].enabled) {
        return { success: false, message: MESSAGES.funcs.antiToxic.notEnabled };
    }
    
    data.groups[groupId].threshold = value;
    saveAntitoxic(data);
    
    return {
        success: true,
        message: MESSAGES.funcs.antiToxic.thresholdChanged(value)
    };
};

const getAntitoxicStatus = (groupId, prefix = '/') => {
    const data = loadAntitoxic();
    const group = data.groups[groupId];
    
    if (!group || !group.enabled) {
        return {
            success: true,
            enabled: false,
            message: MESSAGES.funcs.antiToxic.statusDisabled(prefix)
        };
    }
    
    return {
        success: true,
        enabled: true,
        message: MESSAGES.funcs.antiToxic.statusEnabled(
            group.action,
            group.threshold,
            group.stats.detected,
            group.stats.warned,
            group.stats.deleted,
            group.stats.muted
        )
    };
};

// --- DETECÇÃO ---

// Analisar mensagem buscando palavras-chave tóxicas
const analyzeMessage = async (message) => {
    const lower = message.toLowerCase();
    let highestToxicity = null;

    for (const item of TOXIC_KEYWORDS) {
        if (lower.includes(item.word)) {
            if (!highestToxicity || item.score > highestToxicity.score) {
                highestToxicity = item;
            }
        }
    }

    if (highestToxicity) {
        return { 
            isToxic: true, 
            score: highestToxicity.score, 
            reason: `Uso da palavra proibida: ${highestToxicity.word}` 
        };
    }
    
    return { isToxic: false, score: 0 };
};

// Processar mensagem (retorna ação a ser tomada)
const processMessage = async (groupId, userId, message) => {
    const data = loadAntitoxic();
    const group = data.groups[groupId];
    
    // Verificar se está ativado
    if (!group || !group.enabled) {
        return { action: 'none' };
    }
    
    // Verificar cooldown
    const userKey = `${groupId}:${userId}`;
    if (data.userWarnings[userKey]) {
        const lastWarning = data.userWarnings[userKey].lastWarning;
        if (Date.now() - lastWarning < CONFIG.COOLDOWN_MS) {
            return { action: 'none', reason: 'cooldown' };
        }
    }
    
    // Analisar mensagem
    const analysis = await analyzeMessage(message);
    
    // Verifica se a mensagem possui toxicidade
    // E se o score da ofensa é MAIOR OU IGUAL ao threshold (sensibilidade) configurado pelo grupo
    if (!analysis.isToxic || analysis.score < group.threshold) {
        return { action: 'none' };
    }
    
    // Atualizar estatísticas
    group.stats.detected++;
    
    // Atualizar avisos do usuário
    if (!data.userWarnings[userKey]) {
        data.userWarnings[userKey] = { count: 0, lastWarning: 0 };
    }
    
    const userWarning = data.userWarnings[userKey];
    
    // Reset se passou muito tempo
    if (Date.now() - userWarning.lastWarning > CONFIG.WARNING_RESET_MS) {
        userWarning.count = 0;
    }
    
    userWarning.count++;
    userWarning.lastWarning = Date.now();
    
    // Determinar ação
    let action = group.action;
    if (userWarning.count >= CONFIG.MAX_WARNINGS && action === 'avisar') {
        action = 'apagar'; // Escala ação após múltiplos avisos
    }
    
    // Atualizar stats
    if (action === 'avisar') group.stats.warned++;
    else if (action === 'apagar') group.stats.deleted++;
    else if (action === 'mute') group.stats.muted++;
    
    saveAntitoxic(data);
    
    return {
        action,
        score: analysis.score,
        reason: analysis.reason || 'Uso de vocabulário ofensivo',
        warningCount: userWarning.count,
        maxWarnings: CONFIG.MAX_WARNINGS
    };
};

// Gerar mensagem de aviso
const generateWarningMessage = (userId, result) => {
    if (result.action === 'avisar') {
        return {
            text: MESSAGES.funcs.antiToxic.warnMsg(getUserName(userId), result.reason, result.warningCount, result.maxWarnings),
            mentions: [userId]
        };
    }
    
    if (result.action === 'apagar') {
        return {
            text: MESSAGES.funcs.antiToxic.deleteMsg(getUserName(userId), result.reason),
            mentions: [userId]
        };
    }
    
    if (result.action === 'mute') {
        return {
            text: MESSAGES.funcs.antiToxic.muteMsg(getUserName(userId), result.reason),
            mentions: [userId]
        };
    }
    
    return null;
};

// Verificar se grupo tem antitoxic ativado
const isEnabled = (groupId) => {
    const data = loadAntitoxic();
    return data.groups[groupId]?.enabled || false;
};

const getGroupAction = (groupId) => {
    const data = loadAntitoxic();
    return data.groups[groupId]?.action || CONFIG.DEFAULT_ACTION;
};

// --- COMANDO (Handler) ---

const handleCommand = async (bot, from, args, groupData, { reply, prefix }) => {
    const arg = args[0] ? args[0].toLowerCase() : '';
    const val = args[1] ? args[1].toLowerCase() : '';

    if (!arg || arg === 'status') {
        const status = getAntitoxicStatus(from, prefix);
        return reply(status.message);
    }

    if (arg === 'on' || arg === 'ativar') {
        const result = enableAntitoxic(from, CONFIG.DEFAULT_ACTION, prefix);
        return reply(result.message);
    }

    if (arg === 'off' || arg === 'desativar') {
        const result = disableAntitoxic(from);
        return reply(result.message);
    }

    if (arg === 'acao' || arg === 'ação' || arg === 'action') {
        if (!val) {
            return reply(MESSAGES.funcs.antiToxic.missingAction(CONFIG.ACTIONS.join(', '), prefix));
        }
        const result = setAntitoxicAction(from, val);
        return reply(result.message);
    }

    if (arg === 'sensibilidade' || arg === 'nivel' || arg === 'threshold') {
        if (!val) {
            return reply(MESSAGES.funcs.antiToxic.missingThreshold(prefix));
        }
        const result = setAntitoxicThreshold(from, val);
        return reply(result.message);
    }

    return reply(MESSAGES.funcs.antiToxic.invalidSubcommand(prefix));
};

export {
    enableAntitoxic,
    disableAntitoxic,
    setAntitoxicAction,
    setAntitoxicThreshold,
    getAntitoxicStatus,
    getGroupAction,
    analyzeMessage,
    processMessage,
    generateWarningMessage,
    isEnabled,
    handleCommand,
    CONFIG as ANTITOXIC_CONFIG
};

export default {
    enableAntitoxic,
    disableAntitoxic,
    setAntitoxicAction,
    setAntitoxicThreshold,
    getAntitoxicStatus,
    getGroupAction,
    analyzeMessage,
    processMessage,
    generateWarningMessage,
    isEnabled,
    handleCommand
};
