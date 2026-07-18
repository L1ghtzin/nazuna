import fs from 'fs';
import pathz from 'path';
import { fileURLToPath } from 'url';
import { isUnifiedPath, getUnifiedValue, setUnifiedValue, loadUnifiedSettings } from '../database/unifiedConfig.js';
import { serialize } from '../jsonSerializer.js';
import { writeJsonFileAsync } from '../asyncFs.js';
import { validateAndRepairData } from './dataValidators.js';
import { DATABASE_DIR } from '../paths.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = pathz.dirname(__filename);
const BACKUP_DIR = pathz.join(DATABASE_DIR, 'backups');

export function ensureDirectoryExists(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, {
        recursive: true
      });
    }
    return true;
  } catch (error) {
    console.error(`❌ Erro ao criar diretório ${dirPath}:`, error);
    return false;
  }
}

export function ensureJsonFileExists(filePath, defaultContent = {}) {
  try {
    if (isUnifiedPath(filePath)) {
      const settings = loadUnifiedSettings();
      const key = pathz.basename(filePath).toLowerCase();
      if (settings[key] === undefined) {
        setUnifiedValue(filePath, defaultContent);
      }
      return true;
    }

    if (!fs.existsSync(filePath)) {
      const dirPath = pathz.dirname(filePath);
      ensureDirectoryExists(dirPath);
      fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2));
    }
    return true;
  } catch (error) {
    console.error(`❌ Erro ao criar arquivo JSON ${filePath}:`, error);
    return false;
  }
}

// Cache de arquivos JSON em memória
export const jsonFileCache = new Map();
export const JSON_CACHE_TTL = 30000; // 30 segundos

export const loadJsonFile = (path, defaultValue = {}, useCache = false) => {
  try {
    if (isUnifiedPath(path)) {
      return getUnifiedValue(path, defaultValue);
    }

    // Verifica dados pendentes (debouncedSaveJson) — pendingData agora armazena objetos clonados
    if (pendingData.has(path)) {
      const pendingObj = pendingData.get(path);
      if (pendingObj !== undefined && pendingObj !== null) {
        // Clona para evitar que o caller modifique os dados pendentes de salvamento
        const clonedResult = structuredClone(pendingObj);
        if (useCache) {
          jsonFileCache.set(path, { data: clonedResult, timestamp: Date.now() });
        }
        return clonedResult;
      }
    }

    // Verifica cache se ativado
    if (useCache && jsonFileCache.has(path)) {
      const cached = jsonFileCache.get(path);
      if (Date.now() - cached.timestamp < JSON_CACHE_TTL) {
        return cached.data;
      }
      jsonFileCache.delete(path);
    }
    
    if (!fs.existsSync(path)) return defaultValue;
    
    const data = JSON.parse(fs.readFileSync(path, 'utf-8'));
    
    // Salva no cache se ativado
    if (useCache) {
      jsonFileCache.set(path, { data, timestamp: Date.now() });
    }
    
    return data;
  } catch (error) {
    console.error(`Erro ao carregar arquivo ${path}:`, error);
    return defaultValue;
  }
};

// Limpa cache de JSON
export function clearJsonFileCache(path = null) {
  if (path) {
    jsonFileCache.delete(path);
  } else {
    jsonFileCache.clear();
  }
}

// Limpa caches antigos periodicamente (auto-cleanup)
setInterval(() => {
  const now = Date.now();
  for (const [path, cached] of jsonFileCache.entries()) {
    if (now - cached.timestamp > JSON_CACHE_TTL) {
      jsonFileCache.delete(path);
    }
  }
}, 60000); // A cada 1 minuto

// ═══════════════════════════════════════════════════════════════════
// SISTEMA DE SEGURANÇA JSON - Proteção contra corrupção de dados
// ═══════════════════════════════════════════════════════════════════

/**
 * Cria backup de um arquivo antes de modificá-lo
 */
export function createBackup(filePath) {
  try {
    if (!fs.existsSync(filePath)) return true;
    
    const backupDir = BACKUP_DIR;
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const fileName = pathz.basename(filePath);
    const timestamp = Date.now();
    const backupPath = pathz.join(backupDir, `${fileName}.${timestamp}.bak`);
    
    fs.copyFileSync(filePath, backupPath);
    
    // Manter apenas os últimos 5 backups por arquivo
    const allBackups = fs.readdirSync(backupDir)
      .filter(f => f.startsWith(fileName + '.') && f.endsWith('.bak'))
      .sort()
      .reverse();
    
    if (allBackups.length > 5) {
      allBackups.slice(5).forEach(oldBackup => {
        try { fs.unlinkSync(pathz.join(backupDir, oldBackup)); } catch (e) { console.error('Error removing old backup:', e); }
      });
    }
    
    return true;
  } catch (error) {
    console.error(`⚠️ Erro ao criar backup de ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Tenta recuperar arquivo de backup
 */
export function recoverFromBackup(filePath) {
  try {
    const backupDir = BACKUP_DIR;
    if (!fs.existsSync(backupDir)) return null;
    
    const fileName = pathz.basename(filePath);
    const backups = fs.readdirSync(backupDir)
      .filter(f => f.startsWith(fileName + '.') && f.endsWith('.bak'))
      .sort()
      .reverse();
    
    for (const backup of backups) {
      try {
        const backupPath = pathz.join(backupDir, backup);
        const content = fs.readFileSync(backupPath, 'utf-8');
        const data = JSON.parse(content);
        console.log(`✅ Recuperado de backup: ${backup}`);
        return data;
      } catch (e) {
        continue; // Tenta próximo backup
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Limpa string JSON de caracteres inválidos
 */
export function sanitizeJsonString(str) {
  if (typeof str !== 'string') return str;
  
  // Remove BOM
  str = str.replace(/^\uFEFF/, '');
  
  // Remove caracteres de controle exceto newlines e tabs
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Corrige aspas mal escapadas comuns
  str = str.replace(/\\'/g, "'");
  
  // Remove trailing commas em arrays e objects
  str = str.replace(/,\s*([\]}])/g, '$1');
  
  return str.trim();
}



export const pendingData = new Map();
export const saveTimers = new Map();

/**
 * Carrega arquivo JSON com múltiplas camadas de proteção
 */
export function loadJsonFileSafe(filePath, defaultValue = {}, expectedStructure = null) {
  let data = null;
  let recovered = false;
  
  try {
    // pendingData agora armazena objetos clonados (sem necessidade de JSON.parse)
    if (pendingData.has(filePath)) {
      const pendingObj = pendingData.get(filePath);
      if (pendingObj !== undefined && pendingObj !== null) {
        // Clona para evitar race condition de referências (caller modificar o cache pendente)
        data = structuredClone(pendingObj);
      }
    }

    if (!data) {
      // Verifica se arquivo existe
      if (!fs.existsSync(filePath)) {
        ensureJsonFileExists(filePath, defaultValue);
        return defaultValue;
      }
    
      // Lê conteúdo do arquivo
      let content = fs.readFileSync(filePath, 'utf-8');
      
      // Verifica se arquivo está vazio
      if (!content || content.trim() === '') {
        console.warn(`⚠️ Arquivo vazio: ${filePath}, usando valor padrão`);
        data = defaultValue;
        recovered = true;
      } else {
        // Tenta parse normal
        try {
          data = JSON.parse(content);
        } catch (parseError) {
          console.warn(`⚠️ JSON inválido em ${filePath}, tentando sanitizar...`);
          
          // Tenta sanitizar e parsear novamente
          try {
            content = sanitizeJsonString(content);
            data = JSON.parse(content);
            console.log(`✅ JSON recuperado após sanitização: ${filePath}`);
            recovered = true;
          } catch (sanitizeError) {
            console.error(`❌ Falha ao sanitizar ${filePath}, tentando backup...`);
            
            // Tenta recuperar de backup
            data = recoverFromBackup(filePath);
            
            if (data) {
              recovered = true;
            } else {
              console.error(`❌ Sem backup disponível para ${filePath}, usando valor padrão`);
              data = defaultValue;
              recovered = true;
            }
          }
        }
      }
    }
    
    // Valida e repara estrutura se especificada (sem comparação O(n) via stringify)
    if (expectedStructure && data) {
      const repairResult = validateAndRepairData(data, expectedStructure);
      if (repairResult.repaired) {
        data = repairResult.data;
        recovered = true;
      }
    }
    
    // Se houve recuperação, salva arquivo corrigido
    if (recovered && data) {
      try {
        createBackup(filePath);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`✅ Arquivo reparado e salvo: ${filePath}`);
      } catch (saveError) {
        console.error(`⚠️ Erro ao salvar arquivo reparado: ${filePath}`);
      }
    }
    
    return data || defaultValue;
    
  } catch (error) {
    console.error(`❌ Erro crítico ao carregar ${filePath}:`, error.message);
    return defaultValue;
  }
}

/**
 * Salva arquivo JSON com proteção contra corrupção
 */
export function saveJsonFileSafe(filePath, data, createBackupFile = true) {
  try {
    // Valida dados antes de salvar
    if (data === undefined) {
      console.error(`❌ Tentativa de salvar undefined em ${filePath}`);
      return false;
    }
    
    // Serializa uma única vez (sem double-parse para validação)
    const result = serialize(data);
    if (!result.ok) {
      console.error(`❌ Dados não serializáveis para ${filePath}:`, result.error);
      return false;
    }
    
    // Cria backup antes de sobrescrever
    if (createBackupFile && fs.existsSync(filePath)) {
      createBackup(filePath);
    }
    
    // Garante que diretório existe
    const dirPath = pathz.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Escreve em arquivo temporário e move (operação atômica)
    const tempPath = filePath + '.tmp';
    fs.writeFileSync(tempPath, result.json, 'utf-8');
    fs.renameSync(tempPath, filePath);
    
    return true;
    
  } catch (error) {
    console.error(`❌ Erro ao salvar ${filePath}:`, error.message);
    
    // Tenta limpar arquivo temporário se existir
    try {
      const tempPath = filePath + '.tmp';
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch (e) { console.error('Erro ao limpar arquivo temporário JSON:', e.message); }
    
    return false;
  }
}

/**
 * Salva arquivo JSON de forma assíncrona para não bloquear a thread principal (Safe Win Performance)
 */
export async function saveJsonFileAsync(filePath, data, createBackupFile = true) {
  try {
    if (data === undefined) return false;
    
    // Serializa uma única vez (sem double-parse)
    const result = serialize(data);
    if (!result.ok) return false;
    
    if (createBackupFile && fs.existsSync(filePath)) {
      createBackup(filePath);
    }
    
    await fs.promises.writeFile(filePath, result.json, 'utf-8');
    return true;
  } catch (error) {
    console.error(`❌ Erro ao salvar async ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Sistema de Debounce Global para não floodar o disco com operações pesadas (RPG, Leveling)
 */
export function debouncedSaveJson(filePath, data, delayMs = 3000) {
  if (isUnifiedPath(filePath)) {
    setUnifiedValue(filePath, data);
    return;
  }

  // Deep-clone defensivo via structuredClone (mais rápido que stringify para clone)
  // e serializa só no momento do flush, evitando bloquear o event loop agora
  const clonedData = structuredClone(data);

  // Armazena o clone em vez da string serializada
  pendingData.set(filePath, clonedData);

  if (saveTimers.has(filePath)) {
    clearTimeout(saveTimers.get(filePath));
  }

  const timer = setTimeout(async () => {
    try {
      const dataToSave = pendingData.get(filePath);
      if (dataToSave) {
        await writeJsonFileAsync(filePath, dataToSave);
      }
      pendingData.delete(filePath);
      saveTimers.delete(filePath);
    } catch (error) {
      console.error(`❌ Erro no debounce save de ${filePath}:`, error);
    }
  }, delayMs);

  saveTimers.set(filePath, timer);
}

/**
 * Força salvar todos os debounces pendentes (útil no exit)
 */
export function flushAllDebouncedSaves() {
  for (const [filePath, dataObj] of pendingData.entries()) {
    try {
      writeJsonFileAsync(filePath, dataObj).catch(e => {
        console.error(`Erro no flush final de ${filePath}`, e);
      });
    } catch (e) {
      console.error(`Erro no flush final de ${filePath}`, e);
    }
  }
  pendingData.clear();
  for (const timer of saveTimers.values()) clearTimeout(timer);
  saveTimers.clear();
}
