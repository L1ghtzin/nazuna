import fs from 'fs/promises';
import path, { join } from 'path';

const isValidJid = (str) => /^\d+@s\.whatsapp\.net$/.test(str);

/**
 * Busca LID de um JID com tentativas
 */
export async function fetchLidWithRetry(NazunaSock, jid, retries = 2) {
    for (let i = 0; i < retries; i++) {
        try {
            const result = await NazunaSock.onWhatsApp(jid);
            if (result && result[0] && result[0].lid) {
                return { jid, lid: result[0].lid };
            }
        } catch (err) {
            if (i === retries - 1) throw err;
            await new Promise(r => setTimeout(r, 1000));
        }
    }
    return null;
}

/**
 * Coleta todos os JIDs de um objeto JSON recursivamente
 */
function collectJidsFromJson(obj, jidsSet = new Set()) {
    if (Array.isArray(obj)) {
        obj.forEach(item => collectJidsFromJson(item, jidsSet));
    } else if (obj && typeof obj === 'object') {
        Object.values(obj).forEach(value => collectJidsFromJson(value, jidsSet));
    } else if (typeof obj === 'string' && isValidJid(obj)) {
        jidsSet.add(obj);
    }
    return jidsSet;
}

/**
 * Substitui JIDs por LIDs em um objeto JSON recursivamente
 */
function replaceJidsInJson(obj, jidToLidMap, orphanJidsSet, replacementsCount = { count: 0 }, removalsCount = { count: 0 }) {
    if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
            const newItem = replaceJidsInJson(item, jidToLidMap, orphanJidsSet, replacementsCount, removalsCount);
            if (newItem !== item) obj[index] = newItem;
        });
    } else if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            if (typeof value === 'string' && isValidJid(value)) {
                if (jidToLidMap.has(value)) {
                    obj[key] = jidToLidMap.get(value);
                    replacementsCount.count++;
                } else if (orphanJidsSet.has(value)) {
                    delete obj[key];
                    removalsCount.count++;
                }
            } else {
                const newValue = replaceJidsInJson(value, jidToLidMap, orphanJidsSet, replacementsCount, removalsCount);
                if (newValue !== value) obj[key] = newValue;
            }
        });
    } else if (typeof obj === 'string' && isValidJid(obj)) {
        if (jidToLidMap.has(obj)) {
            replacementsCount.count++;
            return jidToLidMap.get(obj);
        } else if (orphanJidsSet.has(obj)) {
            removalsCount.count++;
            return null;
        }
    }
    return obj;
}

/**
 * Escaneia um diretório em busca de JIDs em arquivos JSON
 */
async function scanForJids(directory, configPath) {
    const uniqueJids = new Set();
    const affectedFiles = new Map();
    const jidFiles = new Map();

    const scanFileContent = async (filePath) => {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const jsonObj = JSON.parse(content);
            const fileJids = collectJidsFromJson(jsonObj);
            if (fileJids.size > 0) {
                affectedFiles.set(filePath, Array.from(fileJids));
                fileJids.forEach(jid => uniqueJids.add(jid));
            }
        } catch (parseErr) {
            const jidPattern = /(\d+@s\.whatsapp\.net)/g;
            const content = await fs.readFile(filePath, 'utf-8');
            let match;
            const fileJids = new Set();
            while ((match = jidPattern.exec(content)) !== null) {
                const jid = match[1];
                uniqueJids.add(jid);
                fileJids.add(jid);
            }
            if (fileJids.size > 0) {
                affectedFiles.set(filePath, Array.from(fileJids));
            }
        }
    };

    const checkAndScanFilename = async (fullPath) => {
        try {
            const basename = path.basename(fullPath, '.json');
            const filenameMatch = basename.match(/(\d+@s\.whatsapp\.net)/);
            if (filenameMatch) {
                const jidFromName = filenameMatch[1];
                if (isValidJid(jidFromName)) {
                    uniqueJids.add(jidFromName);
                    jidFiles.set(jidFromName, fullPath);
                }
            }
            await scanFileContent(fullPath);
        } catch (err) {
            console.error(`Erro ao processar ${fullPath}: ${err.message}`);
        }
    };

    const scanDir = async (dirPath) => {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = join(dirPath, entry.name);
                if (entry.isDirectory()) {
                    await scanDir(fullPath);
                } else if (entry.name.endsWith('.json')) {
                    await checkAndScanFilename(fullPath);
                }
            }
        } catch (err) {
            console.error(`Erro ao escanear diretório ${dirPath}: ${err.message}`);
        }
    };

    await scanDir(directory);

    if (configPath) {
        try {
            await scanFileContent(configPath);
        } catch (err) {}
    }

    return {
        uniqueJids: Array.from(uniqueJids),
        affectedFiles: Array.from(affectedFiles.entries()),
        jidFiles: Array.from(jidFiles.entries())
    };
}

/**
 * Substitui JIDs por LIDs no conteúdo dos arquivos
 */
async function replaceJidsInContent(affectedFiles, jidToLidMap, orphanJidsSet) {
    let totalReplacements = 0;
    let totalRemovals = 0;

    for (const [filePath, jids] of affectedFiles) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            let jsonObj = JSON.parse(content);
            const replacementsCount = { count: 0 };
            const removalsCount = { count: 0 };
            replaceJidsInJson(jsonObj, jidToLidMap, orphanJidsSet, replacementsCount, removalsCount);
            if (replacementsCount.count > 0 || removalsCount.count > 0) {
                await fs.writeFile(filePath, JSON.stringify(jsonObj, null, 2), 'utf-8');
                totalReplacements += replacementsCount.count;
                totalRemovals += removalsCount.count;
            }
        } catch (err) {
            console.error(`Erro ao substituir em ${filePath}: ${err.message}`);
        }
    }
    return { totalReplacements, totalRemovals };
}

/**
 * Renomeia arquivos que usam JID como nome para LID
 */
async function handleJidFiles(jidFiles, jidToLidMap, orphanJidsSet) {
    let totalReplacements = 0;
    let totalRemovals = 0;

    for (const [jid, oldPath] of jidFiles) {
        if (orphanJidsSet.has(jid)) {
            try {
                await fs.unlink(oldPath);
                totalRemovals++;
                continue;
            } catch (err) {}
        }

        const lid = jidToLidMap.get(jid);
        if (!lid) continue;

        try {
            const newPath = oldPath.replace(jid, lid);
            await fs.rename(oldPath, newPath);
            totalReplacements++;
        } catch (err) {}
    }
    return { totalReplacements, totalRemovals };
}


async function fetchLidsInBatches(NazunaSock, uniqueJids, batchSize = 5) {
    const jidToLidMap = new Map();
    for (let i = 0; i < uniqueJids.length; i += batchSize) {
        const batch = uniqueJids.slice(i, i + batchSize);
        const batchPromises = batch.map(jid => fetchLidWithRetry(NazunaSock, jid));
        const batchResults = await Promise.allSettled(batchPromises);
        batchResults.forEach((result) => {
            if (result.status === 'fulfilled' && result.value) {
                jidToLidMap.set(result.value.jid, result.value.lid);
            }
        });
        if (i + batchSize < uniqueJids.length) await new Promise(r => setTimeout(r, 200));
    }
    return { jidToLidMap };
}

/**
 * Executa a migração completa
 */
export async function performMigration(NazunaSock, databaseDir, configPath) {
    // Flag de migração completa para evitar scans repetidos
    const migrationFlagFile = path.join(databaseDir, '.migration_complete');
    try {
        await fs.access(migrationFlagFile);
        return; // Já migrado
    } catch (e) {}

    try {
        const scanResult = await scanForJids(databaseDir, configPath);
        const { uniqueJids, affectedFiles, jidFiles } = scanResult;

        if (uniqueJids.length === 0) {
            await fs.writeFile(migrationFlagFile, 'Migration completed at ' + new Date().toISOString());
            return;
        }

        const { jidToLidMap } = await fetchLidsInBatches(NazunaSock, uniqueJids);
        const orphanJidsSet = new Set(uniqueJids.filter(jid => !jidToLidMap.has(jid)));

        if (jidToLidMap.size > 0) {
            await handleJidFiles(jidFiles, jidToLidMap, orphanJidsSet);
            const filteredAffected = affectedFiles.filter(([filePath]) => !jidFiles.some(([, jidPath]) => jidPath === filePath));
            await replaceJidsInContent(filteredAffected, jidToLidMap, orphanJidsSet);
        }
        
        // Marca como completo mesmo se houve falhas parciais (para não travar o bot em cada boot)
        await fs.writeFile(migrationFlagFile, 'Migration attempt at ' + new Date().toISOString());
    } catch (err) {
        console.error(`❌ Erro durante a migração: ${err.message}`);
    }
}

/**
 * Atualiza o LID do dono no config.json
 */
export async function updateOwnerLid(NazunaSock, numerodono, config, configPath) {
    const ownerJid = `${numerodono}@s.whatsapp.net`;
    try {
        const result = await fetchLidWithRetry(NazunaSock, ownerJid);
        if (result) {
            config.lidowner = result.lid;
            await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
            return result.lid;
        }
    } catch (err) {
        console.error(`❌ Erro ao atualizar LID do dono: ${err.message}`);
    }
    return null;
}
