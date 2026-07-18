// --- SISTEMA ANTIPALAVRA ---
// Sistema de blacklist de palavras que resultam em banimento automático.
// A persistência fica centralizada em groupManager para respeitar o cache global.

import { MESSAGES } from '../../utils/messages.js';
import { loadGroupDataById, saveGroupDataById } from '../../utils/groupManager.js';

const MAX_BAN_HISTORY = 100;

const nowIso = () => new Date().toISOString();

const normalizeText = (text) => {
    if (!text || typeof text !== 'string') return '';
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
};

const createDefaultConfig = () => ({
    enabled: false,
    blacklist: [],
    stats: {
        totalBans: 0,
        totalDetections: 0,
        lastUpdate: nowIso()
    }
});

const resolveGroupData = async (groupId, persistence = {}) => {
    if (persistence.groupData && typeof persistence.groupData === 'object') {
        return persistence.groupData;
    }

    return loadGroupDataById(groupId, {
        defaultValue: {},
        groupFile: persistence.groupFile
    });
};

const saveGroupData = async (groupId, groupData, persistence = {}) => {
    return saveGroupDataById(groupId, groupData, {
        groupFile: persistence.groupFile
    });
};

const normalizeBlacklistItem = (item) => {
    const palavra = typeof item === 'string' ? item : item?.palavra;
    if (!palavra || typeof palavra !== 'string') return null;

    return {
        palavra: palavra.trim(),
        palavraNormalizada: normalizeText(item.palavraNormalizada || palavra),
        addedAt: item.addedAt || nowIso(),
        detections: Number.isFinite(item.detections) ? item.detections : 0
    };
};

const getAntipalavraConfig = (groupData) => {
    if (!groupData.antipalavra || typeof groupData.antipalavra !== 'object') {
        groupData.antipalavra = createDefaultConfig();
    }

    const config = groupData.antipalavra;
    config.enabled = config.enabled === true;
    config.blacklist = Array.isArray(config.blacklist)
        ? config.blacklist.map(normalizeBlacklistItem).filter(Boolean)
        : [];

    if (!config.stats || typeof config.stats !== 'object') {
        config.stats = createDefaultConfig().stats;
    }

    config.stats.totalBans = Number.isFinite(config.stats.totalBans) ? config.stats.totalBans : 0;
    config.stats.totalDetections = Number.isFinite(config.stats.totalDetections) ? config.stats.totalDetections : 0;
    config.stats.lastUpdate = config.stats.lastUpdate || nowIso();

    return config;
};

const sortBlacklistByDetections = (blacklist) => {
    return [...blacklist].sort((leftItem, rightItem) => {
        return (rightItem.detections || 0) - (leftItem.detections || 0);
    });
};

const buildResult = (success, message, extra = {}) => ({
    success,
    message,
    ...extra
});

const enableAntipalavra = async (groupId, persistence = {}) => {
    const groupData = await resolveGroupData(groupId, persistence);
    const config = getAntipalavraConfig(groupData);

    if (config.enabled) {
        return buildResult(false, MESSAGES.funcs.antiPalavra.alreadyEnabled);
    }

    config.enabled = true;
    config.stats.lastUpdate = nowIso();

    const saved = await saveGroupData(groupId, groupData, persistence);
    return saved
        ? buildResult(true, MESSAGES.funcs.antiPalavra.enabled)
        : buildResult(false, MESSAGES.funcs.antiPalavra.enableError);
};

const disableAntipalavra = async (groupId, persistence = {}) => {
    const groupData = await resolveGroupData(groupId, persistence);
    const config = getAntipalavraConfig(groupData);

    if (!config.enabled) {
        return buildResult(false, MESSAGES.funcs.antiPalavra.alreadyDisabled);
    }

    config.enabled = false;
    config.stats.lastUpdate = nowIso();

    const saved = await saveGroupData(groupId, groupData, persistence);
    return saved
        ? buildResult(true, MESSAGES.funcs.antiPalavra.disabled)
        : buildResult(false, MESSAGES.funcs.antiPalavra.disableError);
};

const addPalavraBlacklist = async (groupId, palavra, persistence = {}) => {
    if (!palavra || typeof palavra !== 'string') {
        return buildResult(false, MESSAGES.funcs.antiPalavra.invalidWord);
    }

    const palavraNormalizada = normalizeText(palavra);
    if (!palavraNormalizada) {
        return buildResult(false, MESSAGES.funcs.antiPalavra.emptyWord);
    }

    const groupData = await resolveGroupData(groupId, persistence);
    const config = getAntipalavraConfig(groupData);
    const exists = config.blacklist.some((item) => item.palavraNormalizada === palavraNormalizada);

    if (exists) {
        return buildResult(false, MESSAGES.funcs.antiPalavra.alreadyBlacklisted);
    }

    config.blacklist.push({
        palavra: palavra.trim(),
        palavraNormalizada,
        addedAt: nowIso(),
        detections: 0
    });
    config.stats.lastUpdate = nowIso();

    const saved = await saveGroupData(groupId, groupData, persistence);
    return saved
        ? buildResult(true, MESSAGES.funcs.antiPalavra.added(palavra.trim(), config.blacklist.length))
        : buildResult(false, MESSAGES.funcs.antiPalavra.addError);
};

const removePalavraBlacklist = async (groupId, palavra, persistence = {}) => {
    if (!palavra || typeof palavra !== 'string') {
        return buildResult(false, MESSAGES.funcs.antiPalavra.invalidWord);
    }

    const palavraNormalizada = normalizeText(palavra);
    const groupData = await resolveGroupData(groupId, persistence);
    const config = getAntipalavraConfig(groupData);
    const initialLength = config.blacklist.length;

    config.blacklist = config.blacklist.filter((item) => item.palavraNormalizada !== palavraNormalizada);

    if (config.blacklist.length === initialLength) {
        return buildResult(false, MESSAGES.funcs.antiPalavra.notBlacklisted);
    }

    config.stats.lastUpdate = nowIso();

    const saved = await saveGroupData(groupId, groupData, persistence);
    return saved
        ? buildResult(true, MESSAGES.funcs.antiPalavra.removed(palavra.trim(), config.blacklist.length))
        : buildResult(false, MESSAGES.funcs.antiPalavra.removeError);
};

const listPalavrasBlacklist = async (groupId, persistence = {}) => {
    const groupData = await resolveGroupData(groupId, persistence);
    const config = getAntipalavraConfig(groupData);

    if (config.blacklist.length === 0) {
        return buildResult(true, MESSAGES.funcs.antiPalavra.emptyList, { blacklist: [] });
    }

    const sortedBlacklist = sortBlacklistByDetections(config.blacklist);
    return buildResult(true, MESSAGES.funcs.antiPalavra.list(config, sortedBlacklist), {
        blacklist: sortedBlacklist
    });
};

const clearBlacklist = async (groupId, persistence = {}) => {
    const groupData = await resolveGroupData(groupId, persistence);
    const config = getAntipalavraConfig(groupData);

    if (config.blacklist.length === 0) {
        return buildResult(false, MESSAGES.funcs.antiPalavra.alreadyEmpty);
    }

    const removedCount = config.blacklist.length;
    config.blacklist = [];
    config.stats.lastUpdate = nowIso();

    const saved = await saveGroupData(groupId, groupData, persistence);
    return saved
        ? buildResult(true, MESSAGES.funcs.antiPalavra.cleared(removedCount))
        : buildResult(false, MESSAGES.funcs.antiPalavra.clearError);
};

const checkMessage = async (groupId, messageText, persistence = {}) => {
    if (!messageText || typeof messageText !== 'string') {
        return null;
    }

    const groupData = await resolveGroupData(groupId, persistence);
    const config = getAntipalavraConfig(groupData);

    if (!config.enabled || config.blacklist.length === 0) {
        return null;
    }

    const messageNormalized = normalizeText(messageText);
    const detectedItem = config.blacklist.find((item) => {
        return item.palavraNormalizada && messageNormalized.includes(item.palavraNormalizada);
    });

    if (!detectedItem) return null;

    detectedItem.detections++;
    config.stats.totalDetections++;
    config.stats.lastUpdate = nowIso();
    await saveGroupData(groupId, groupData, persistence);

    return {
        detected: true,
        palavra: detectedItem.palavra,
        palavraOriginal: detectedItem.palavra,
        groupData
    };
};

const registerBan = async (groupId, userId, palavra, persistence = {}) => {
    const groupData = await resolveGroupData(groupId, persistence);
    const config = getAntipalavraConfig(groupData);

    config.stats.totalBans++;
    config.stats.lastUpdate = nowIso();
    config.banHistory = Array.isArray(config.banHistory) ? config.banHistory : [];
    config.banHistory.push({
        userId,
        palavra,
        bannedAt: nowIso()
    });

    if (config.banHistory.length > MAX_BAN_HISTORY) {
        config.banHistory = config.banHistory.slice(-MAX_BAN_HISTORY);
    }

    return saveGroupData(groupId, groupData, persistence);
};

const getStats = async (groupId, persistence = {}) => {
    const groupData = await resolveGroupData(groupId, persistence);
    const config = getAntipalavraConfig(groupData);

    return {
        enabled: config.enabled,
        totalWords: config.blacklist.length,
        totalBans: config.stats.totalBans,
        totalDetections: config.stats.totalDetections,
        lastUpdate: config.stats.lastUpdate,
        topWords: sortBlacklistByDetections(config.blacklist)
            .slice(0, 5)
            .map((item) => ({
                palavra: item.palavra,
                detections: item.detections
            }))
    };
};

const isActive = async (groupId, persistence = {}) => {
    const groupData = await resolveGroupData(groupId, persistence);
    const config = getAntipalavraConfig(groupData);
    return config.enabled === true;
};

const handleCommand = async (_bot, from, args, groupData, {
    reply,
    prefix,
    groupFile
}) => {
    const subcommand = args[0]?.toLowerCase();
    const word = args.slice(1).join(' ').trim();
    const persistence = { groupData, groupFile };

    if (!subcommand) {
        return reply(MESSAGES.funcs.antiPalavra.usage(prefix));
    }

    if (['on', 'ativar', 'ligar', 'enable'].includes(subcommand)) {
        const result = await enableAntipalavra(from, persistence);
        return reply(result.message);
    }

    if (['off', 'desativar', 'desligar', 'disable'].includes(subcommand)) {
        const result = await disableAntipalavra(from, persistence);
        return reply(result.message);
    }

    if (['add', 'adicionar', 'addpalavra', 'adicionarpalavra'].includes(subcommand)) {
        if (!word) return reply(MESSAGES.funcs.antiPalavra.usage(prefix));
        const result = await addPalavraBlacklist(from, word, persistence);
        return reply(result.message);
    }

    if (['del', 'remover', 'remove', 'rm', 'delete', 'deletar'].includes(subcommand)) {
        if (!word) return reply(MESSAGES.funcs.antiPalavra.usage(prefix));
        const result = await removePalavraBlacklist(from, word, persistence);
        return reply(result.message);
    }

    if (['list', 'lista', 'listar', 'status'].includes(subcommand)) {
        const result = await listPalavrasBlacklist(from, persistence);
        return reply(result.message);
    }

    if (['limpar', 'clear', 'reset'].includes(subcommand)) {
        const result = await clearBlacklist(from, persistence);
        return reply(result.message);
    }

    return reply(MESSAGES.funcs.antiPalavra.invalidSubcommand(prefix));
};

export {
    enableAntipalavra,
    disableAntipalavra,
    addPalavraBlacklist,
    removePalavraBlacklist,
    listPalavrasBlacklist,
    clearBlacklist,
    checkMessage,
    registerBan,
    getStats,
    isActive,
    handleCommand
};

export default {
    enableAntipalavra,
    disableAntipalavra,
    addPalavraBlacklist,
    removePalavraBlacklist,
    listPalavrasBlacklist,
    clearBlacklist,
    checkMessage,
    registerBan,
    getStats,
    isActive,
    handleCommand
};
