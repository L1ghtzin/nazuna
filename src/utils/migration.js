import fs from 'fs/promises';
import path, { join } from 'path';
import { toLID } from './toLID.js';

const isValidJid = (str) => /^\d+@s\.whatsapp\.net$/.test(str);

/**
 * Busca LID de um JID com tentativas
 */
export async function fetchLidWithRetry(ChainySock, jid, retries = 2) {
    for (let i = 0; i < retries; i++) {
        try {
            const result = await ChainySock.onWhatsApp(jid);
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
        } catch (err) { console.error('Migration error:', err); }
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
            } catch (err) { console.error('Migration link error:', err); }
        }

        const lid = jidToLidMap.get(jid);
        if (!lid) continue;

        try {
            const newPath = oldPath.replace(jid, lid);
            await fs.rename(oldPath, newPath);
            totalReplacements++;
        } catch (err) { console.error('Migration old link error:', err); }
    }
    return { totalReplacements, totalRemovals };
}


async function fetchLidsInBatches(ChainySock, uniqueJids, batchSize = 5) {
    const jidToLidMap = new Map();
    for (let i = 0; i < uniqueJids.length; i += batchSize) {
        const batch = uniqueJids.slice(i, i + batchSize);
        const batchPromises = batch.map(jid => fetchLidWithRetry(ChainySock, jid));
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
export async function performMigration(ChainySock, databaseDir, configPath) {
    // Flag de migração completa para evitar scans repetidos
    const migrationFlagFile = path.join(databaseDir, '.migration_complete');
    try {
        await fs.access(migrationFlagFile);
        return; // Já migrado
    } catch (e) { console.error('Overall migration error:', e); }

    try {
        const scanResult = await scanForJids(databaseDir, configPath);
        const { uniqueJids, affectedFiles, jidFiles } = scanResult;

        if (uniqueJids.length === 0) {
            await fs.writeFile(migrationFlagFile, 'Migration completed at ' + new Date().toISOString());
            return;
        }

        const { jidToLidMap } = await fetchLidsInBatches(ChainySock, uniqueJids);
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
    
    // Roda a migração de blacklists em paralelo
    await migrateBlacklists(ChainySock, databaseDir).catch(err => {
        console.error('❌ Erro na migração de blacklists:', err.message);
    });
}

/**
 * Atualiza o LID do dono no config.json
 */
export async function updateOwnerLid(ChainySock, numerodono, config, configPath) {
    const ownerJid = `${numerodono}@s.whatsapp.net`;
    try {
        const result = await fetchLidWithRetry(ChainySock, ownerJid);
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

/**
 * Migra todas as blacklists locais (Global e de Grupo) para o formato array-of-objects
 */
export async function migrateBlacklists(ChainySock, databaseDir) {
    const flagFile = join(databaseDir, '.blacklist_migration_complete_v4');
    try {
        await fs.access(flagFile);
        return; // Já migrado
    } catch (e) {}

    // Limpa as flags das tentativas de migração parciais antigas
    for (const oldFlag of ['.blacklist_migration_complete', '.blacklist_migration_complete_v2', '.blacklist_migration_complete_v3']) {
        try {
            await fs.unlink(join(databaseDir, oldFlag));
        } catch (err) {}
    }

    console.log('⏳ [MIGRAÇÃO] Iniciando migração e resolução de LIDs das blacklists...');
    try {
        let globaisAtualizados = 0;
        let gruposAtualizados = 0;

        // 1. Blacklist Global
        const globalBLPath = join(databaseDir, 'dono', 'globalBlacklist.json');
        let globalData = null;
        try {
            const content = await fs.readFile(globalBLPath, 'utf-8');
            globalData = JSON.parse(content);
        } catch (e) {}
        
        if (globalData && globalData.users) {
            // Conversão de dicionário legado para array caso ainda não seja
            if (!Array.isArray(globalData.users)) {
                const arrayUsers = [];
                for (const [key, entry] of Object.entries(globalData.users)) {
                    const cleanJid = key.endsWith('@s.whatsapp.net') ? key : null;
                    const cleanLid = key.endsWith('@lid') ? key : null;
                    
                    const existing = arrayUsers.find(u => (cleanLid && u.lid === cleanLid) || (cleanJid && u.number === cleanJid.replace(/\D/g, '')));
                    if (!existing) {
                        arrayUsers.push({
                            lid: cleanLid || '',
                            number: cleanJid ? cleanJid.replace(/\D/g, '') : '',
                            name: entry.addedBy || '',
                            reason: entry.reason || '',
                            createdAt: entry.addedAt || new Date().toISOString(),
                            createdBy: entry.addedBy || 'Desconhecido'
                        });
                    }
                }
                globalData.users = arrayUsers;
            }

            // Resolução profunda de LIDs pendentes
            let globalModified = false;
            for (const entry of globalData.users) {
                if (!entry.lid && entry.number) {
                    const jid = `${entry.number}@s.whatsapp.net`;
                    try {
                        let lid = await toLID(jid, ChainySock);
                        if (!lid) {
                            const result = await ChainySock.onWhatsApp(jid);
                            if (result && result[0] && result[0].lid) {
                                lid = result[0].lid.replace(/:.*/, '');
                            }
                        }
                        if (lid) {
                            entry.lid = lid;
                            globalModified = true;
                            globaisAtualizados++;
                        }
                    } catch (err) {
                        console.warn(`[MIGRAÇÃO] Falha ao obter LID para ${jid}:`, err.message);
                    }
                }
            }

            if (globalModified || globaisAtualizados > 0) {
                await fs.writeFile(globalBLPath, JSON.stringify(globalData, null, 2), 'utf-8');
            }
        }

        // 2. Blacklists de Grupo
        const gruposDir = join(databaseDir, 'grupos');
        let files = [];
        try {
            files = await fs.readdir(gruposDir);
        } catch (e) {}
        
        for (const file of files) {
            if (!file.endsWith('.json')) continue;
            const groupPath = join(gruposDir, file);
            try {
                const groupContent = await fs.readFile(groupPath, 'utf-8');
                const groupData = JSON.parse(groupContent);
                if (groupData && groupData.blacklist) {
                    // Conversão de dicionário legado para array caso ainda não seja
                    if (!Array.isArray(groupData.blacklist)) {
                        const arrayBlacklist = [];
                        for (const [key, entry] of Object.entries(groupData.blacklist)) {
                            const cleanJid = key.endsWith('@s.whatsapp.net') ? key : null;
                            const cleanLid = key.endsWith('@lid') ? key : null;
                            
                            const existing = arrayBlacklist.find(u => (cleanLid && u.lid === cleanLid) || (cleanJid && u.number === cleanJid.replace(/\D/g, '')));
                            if (!existing) {
                                arrayBlacklist.push({
                                    lid: cleanLid || '',
                                    number: cleanJid ? cleanJid.replace(/\D/g, '') : '',
                                    name: '',
                                    reason: entry.reason || 'Sem motivo',
                                    createdAt: entry.date ? new Date(entry.date).toISOString() : new Date().toISOString(),
                                    createdBy: 'Admin'
                                });
                            }
                        }
                        groupData.blacklist = arrayBlacklist;
                    }

                    // Resolução profunda de LIDs pendentes
                    let groupModified = false;
                    for (const entry of groupData.blacklist) {
                        if (!entry.lid && entry.number) {
                            const jid = `${entry.number}@s.whatsapp.net`;
                            try {
                                let lid = await toLID(jid, ChainySock);
                                if (!lid) {
                                    const result = await ChainySock.onWhatsApp(jid);
                                    if (result && result[0] && result[0].lid) {
                                        lid = result[0].lid.replace(/:.*/, '');
                                    }
                                }
                                if (lid) {
                                    entry.lid = lid;
                                    groupModified = true;
                                    gruposAtualizados++;
                                }
                            } catch (err) {
                                console.warn(`[MIGRAÇÃO] Falha ao obter LID para ${jid} no grupo ${file}:`, err.message);
                            }
                        }
                    }

                    if (groupModified || gruposAtualizados > 0) {
                        await fs.writeFile(groupPath, JSON.stringify(groupData, null, 2), 'utf-8');
                    }
                }
            } catch (e) {}
        }

        console.log(`✅ [MIGRAÇÃO] LIDs de Blacklists resolvidos! Globais atualizados: ${globaisAtualizados}, Grupos atualizados: ${gruposAtualizados}`);
        await fs.writeFile(flagFile, 'Migration completed at ' + new Date().toISOString(), 'utf-8');
    } catch (err) {
        console.error('❌ [MIGRAÇÃO] Erro ao migrar blacklists:', err.message);
    }
}


