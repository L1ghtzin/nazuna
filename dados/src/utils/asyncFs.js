import fsPromises from 'fs/promises';
import pathz from 'path';

/**
 * Versão assíncrona do writeJsonFile - não bloqueia o event loop
 * @param {string} filePath - Caminho do arquivo
 * @param {object} data - Dados a serem salvos
 * @returns {Promise<boolean>}
 */
export const writeJsonFileAsync = async (filePath, data) => {
  try {
    if (data === undefined || data === null) {
      console.error(`❌ writeJsonFileAsync: Tentativa de salvar dados nulos em ${filePath}`);
      return false;
    }
    
    let jsonString;
    try {
      jsonString = JSON.stringify(data, null, 2);
    } catch (stringifyError) {
      console.error(`❌ writeJsonFileAsync: Dados não serializáveis para ${filePath}:`, stringifyError.message);
      return false;
    }
    
    // Valida JSON gerado
    try {
      JSON.parse(jsonString);
    } catch (validateError) {
      console.error(`❌ writeJsonFileAsync: JSON inválido gerado para ${filePath}`);
      return false;
    }
    
    await fsPromises.mkdir(pathz.dirname(filePath), { recursive: true });
    
    // Escreve em arquivo temporário primeiro (operação atômica)
    const tempPath = filePath + '.tmp';
    await fsPromises.writeFile(tempPath, jsonString, 'utf-8');
    
    // Verifica integridade
    try {
      const writtenContent = await fsPromises.readFile(tempPath, 'utf-8');
      JSON.parse(writtenContent);
    } catch (verifyError) {
      console.error(`❌ writeJsonFileAsync: Verificação falhou para ${filePath}`);
      try { await fsPromises.unlink(tempPath); } catch (e) {}
      return false;
    }
    
    // Move arquivo temporário para destino (atômico)
    await fsPromises.rename(tempPath, filePath);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao escrever JSON async em ${filePath}:`, error.message);
    try {
      const tempPath = filePath + '.tmp';
      await fsPromises.unlink(tempPath).catch(() => {});
    } catch (e) {}
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
