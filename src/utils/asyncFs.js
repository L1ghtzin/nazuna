import fsPromises from 'fs/promises';
import pathz from 'path';
import { isUnifiedPath, setUnifiedValueAsync, getUnifiedValue } from './database/unifiedConfig.js';
import { serialize } from './jsonSerializer.js';
import { clearJsonFileCache } from './helpers/jsonIo.js';

/**
 * Versão assíncrona do writeJsonFile - não bloqueia o event loop
 * @param {string} filePath - Caminho do arquivo
 * @param {object} data - Dados a serem salvos
 * @returns {Promise<boolean>}
 */
export const writeJsonFileAsync = async (filePath, data) => {
  clearJsonFileCache(filePath);
  if (isUnifiedPath(filePath)) {
    await setUnifiedValueAsync(filePath, data);
    return true;
  }
  let tempPath = null;
  try {
    if (data === undefined || data === null) {
      console.error(`❌ writeJsonFileAsync: Tentativa de salvar dados nulos em ${filePath}`);
      return false;
    }
    await fsPromises.mkdir(pathz.dirname(filePath), { recursive: true });
    
    // A serialização (stringify) DEVE ocorrer após os awaits anteriores.
    // Isso garante que capturamos o estado mais recente do objeto (que pode
    // ter sido mutado de forma síncrona enquanto a thread estava pausada no mkdir).
    // Serializa uma única vez — sem double-parse para validação.
    const result = serialize(data);
    if (!result.ok) {
      console.error(`❌ writeJsonFileAsync: Dados não serializáveis para ${filePath}:`, result.error);
      return false;
    }
    
    // Escreve em arquivo temporário e move (operação atômica)
    tempPath = `${filePath}.${Date.now()}.${Math.random().toString(36).substring(2, 7)}.tmp`;
    await fsPromises.writeFile(tempPath, result.json, 'utf-8');
    
    // Move arquivo temporário para destino (atômico)
    await fsPromises.rename(tempPath, filePath);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao escrever JSON async em ${filePath}:`, error.message);
    if (tempPath) {
      try {
        await fsPromises.unlink(tempPath).catch(() => {});
      } catch (e) { 
        if (e && e.code !== 'ENOENT') console.error('Error checking file existance:', e); 
      }
    }
    return false;
  }
};

/**
 * Leitura assíncrona de arquivo JSON
 * @param {string} filePath - Caminho do arquivo
 * @param {object} defaultValue - Valor padrão se arquivo não existir
 * @returns {Promise<object>}
 */
export const readJsonFileAsync = async (filePath, defaultValue = {}) => {
  if (isUnifiedPath(filePath)) {
    return getUnifiedValue(filePath, defaultValue);
  }
  try {
    const content = await fsPromises.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`❌ Erro ao ler JSON async de ${filePath}:`, error.message);
    }
    return defaultValue;
  }
};

/**
 * Verifica se arquivo existe (assíncrono)
 * @param {string} filePath - Caminho do arquivo
 * @returns {Promise<boolean>}
 */
export const fileExistsAsync = async (filePath) => {
  try {
    await fsPromises.access(filePath);
    return true;
  } catch {
    return false;
  }
};
