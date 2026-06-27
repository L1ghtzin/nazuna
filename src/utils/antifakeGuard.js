/**
 * Modulo centralizado de Anti-Fake.
 * Verifica DDI, whitelist, resolve LIDs e registra logs de acoes.
 */

import path from 'path';
import { readJsonFileAsync, writeJsonFileAsync } from './asyncFs.js';
import { GRUPOS_DIR } from './paths.js';
import { resolveParticipant } from './resolveParticipant.js';

const antifakeLogWriteQueues = new Map();

function normalizeNumeric(value) {
    return String(value || '').replace(/\D/g, '');
}

function getAntifakeLogPath(groupId) {
    return path.join(GRUPOS_DIR, `${groupId}_antifake.json`);
}

export function getAllowedDDIs(groupSettings) {
    const raw = groupSettings?.antifakeDDI || '55';
    const ddis = String(raw)
        .split(',')
        .map(normalizeNumeric)
        .filter(Boolean);

    return ddis.length ? ddis : ['55'];
}

export function isWhitelisted(number, groupSettings) {
    const whitelist = groupSettings?.antifakeWhitelist || [];
    const normalizedNumber = normalizeNumeric(number);

    return whitelist.some(entry => {
        const normalizedEntry = normalizeNumeric(entry);
        return normalizedEntry && normalizedNumber === normalizedEntry;
    });
}

export async function logAntifakeAction(groupId, entry) {
    const logPath = getAntifakeLogPath(groupId);
    const previousQueue = antifakeLogWriteQueues.get(logPath) || Promise.resolve();

    const nextQueue = previousQueue.then(async () => {
        const currentLogs = await readJsonFileAsync(logPath, []);
        const logs = Array.isArray(currentLogs) ? currentLogs : [];
        const nextLogs = [
            ...logs,
            { timestamp: new Date().toISOString(), ...entry }
        ].slice(-100);

        const saved = await writeJsonFileAsync(logPath, nextLogs);
        if (!saved) {
            throw new Error('writeJsonFileAsync retornou false');
        }
    });

    const queuedWrite = nextQueue.catch(() => {});
    antifakeLogWriteQueues.set(logPath, queuedWrite);

    try {
        await nextQueue;
    } catch (err) {
        console.error(`[AntiFake] Erro ao salvar log: ${err.message}`);
    } finally {
        if (antifakeLogWriteQueues.get(logPath) === queuedWrite) {
            antifakeLogWriteQueues.delete(logPath);
        }
    }
}

export async function getAntifakeLogs(groupId, limit = 10) {
    const logs = await readJsonFileAsync(getAntifakeLogPath(groupId), []);
    return Array.isArray(logs) ? logs.slice(-limit) : [];
}

export async function checkAntifake(participantJid, groupSettings, ChainySock, groupMetadata = null) {
    if (!groupSettings?.antifake) {
        return { allowed: true, number: '', reason: '', resolved: true };
    }

    const { number, isLid, resolved } = await resolveParticipant(participantJid, ChainySock, groupMetadata);
    const normalizedNumber = normalizeNumeric(number);

    // LID nao resolvido: sem dados para julgar, deixa passar.
    if (isLid && !resolved) {
        return { allowed: true, number, reason: 'lid_nao_resolvido', resolved: false };
    }

    if (!normalizedNumber) {
        return { allowed: true, number, reason: 'numero_nao_identificado', resolved };
    }

    if (isWhitelisted(normalizedNumber, groupSettings)) {
        return { allowed: true, number: normalizedNumber, reason: 'whitelist', resolved };
    }

    const allowedDDIs = getAllowedDDIs(groupSettings);
    if (allowedDDIs.some(ddi => normalizedNumber.startsWith(ddi))) {
        return { allowed: true, number: normalizedNumber, reason: '', resolved };
    }

    return {
        allowed: false,
        number: normalizedNumber,
        reason: `DDI nao permitido (permitidos: ${allowedDDIs.join(', ')})`,
        resolved
    };
}
