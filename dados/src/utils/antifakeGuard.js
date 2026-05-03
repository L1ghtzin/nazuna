/**
 * Módulo centralizado de Anti-Fake.
 * Verifica DDI, whitelist, resolve LIDs e registra logs de ações.
 */

import { resolveNumber } from './resolveParticipant.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATABASE_DIR = path.join(__dirname, '..', '..', 'database');

export function getAllowedDDIs(groupSettings) {
    const raw = groupSettings?.antifakeDDI || '55';
    return raw.split(',').map(d => d.trim()).filter(Boolean);
}

export function isWhitelisted(number, groupSettings) {
    const whitelist = groupSettings?.antifakeWhitelist || [];
    return whitelist.some(entry => number.startsWith(entry) || number === entry);
}

export async function logAntifakeAction(groupId, entry) {
    const logPath = path.join(DATABASE_DIR, 'grupos', `${groupId}_antifake.json`);
    try {
        let logs = [];
        try {
            const data = await fs.readFile(logPath, 'utf-8');
            logs = JSON.parse(data);
        } catch { }

        logs.push({ timestamp: new Date().toISOString(), ...entry });
        if (logs.length > 100) logs = logs.slice(-100);

        await fs.writeFile(logPath, JSON.stringify(logs, null, 2));
    } catch (err) {
        console.error(`[AntiFake] Erro ao salvar log: ${err.message}`);
    }
}

export async function getAntifakeLogs(groupId, limit = 10) {
    const logPath = path.join(DATABASE_DIR, 'grupos', `${groupId}_antifake.json`);
    try {
        const data = await fs.readFile(logPath, 'utf-8');
        return JSON.parse(data).slice(-limit);
    } catch {
        return [];
    }
}

export async function checkAntifake(participantJid, groupSettings, NazunaSock) {
    if (!groupSettings?.antifake) {
        return { allowed: true, number: '', reason: '', resolved: true };
    }

    const { number, isLid, resolved } = await resolveNumber(participantJid, NazunaSock);

    // LID não resolvido — sem dados para julgar, deixar passar
    if (isLid && !resolved) {
        return { allowed: true, number, reason: 'lid_nao_resolvido', resolved: false };
    }

    if (isWhitelisted(number, groupSettings)) {
        return { allowed: true, number, reason: 'whitelist', resolved };
    }

    const allowedDDIs = getAllowedDDIs(groupSettings);
    if (allowedDDIs.some(ddi => number.startsWith(ddi))) {
        return { allowed: true, number, reason: '', resolved };
    }

    return {
        allowed: false,
        number,
        reason: `DDI não permitido (permitidos: ${allowedDDIs.join(', ')})`,
        resolved
    };
}
