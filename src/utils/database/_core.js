// ==================== DATABASE CORE ====================
// Funções de IO de baixo nível e self-test do banco de dados.

import fs from 'fs';
import pathz from 'path';
import { ensureDirectoryExists, loadJsonFile } from '../helpers.js';
import { ECONOMY_FILE, LEVELING_FILE, COMMAND_ALIASES_FILE, CUSTOM_AUTORESPONSES_FILE, CMD_NOT_FOUND_FILE } from '../paths.js';
import { isUnifiedPath, setUnifiedValue } from './unifiedConfig.js';
import { serialize } from '../jsonSerializer.js';

export function writeJsonFile(filePath, data) {
  if (isUnifiedPath(filePath)) {
    setUnifiedValue(filePath, data);
    return true;
  }
  try {
    if (data === undefined || data === null) {
      console.error(`❌ writeJsonFile: Tentativa de salvar dados nulos em ${filePath}`);
      return false;
    }
    // Serializa uma única vez via módulo centralizado
    const result = serialize(data);
    if (!result.ok) {
      console.error(`❌ writeJsonFile: Dados não serializáveis para ${filePath}:`, result.error);
      return false;
    }
    ensureDirectoryExists(pathz.dirname(filePath));
    const tempPath = filePath + '.tmp';
    fs.writeFileSync(tempPath, result.json, 'utf-8');
    fs.renameSync(tempPath, filePath);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao escrever JSON em ${filePath}:`, error.message);
    return false;
  }
}

const databaseSelfTests = [{
  name: 'economy.json',
  path: ECONOMY_FILE,
  validate: (data) => {
    const issues = [];
    if (!data || typeof data !== 'object') {
      issues.push('Arquivo não pôde ser carregado como objeto.');
      return issues;
    }
    if (typeof data.users !== 'object') issues.push('Campo "users" ausente ou inválido.');
    if (typeof data.shop !== 'object') issues.push('Campo "shop" ausente ou inválido.');
    if (typeof data.materialsPrices !== 'object') issues.push('Campo "materialsPrices" ausente ou inválido.');
    return issues;
  }
}, {
  name: 'leveling.json',
  path: LEVELING_FILE,
  validate: (data) => {
    const issues = [];
    if (!data || typeof data !== 'object') {
      issues.push('Arquivo não pôde ser carregado como objeto.');
      return issues;
    }
    if (!Array.isArray(data.patents)) issues.push('Campo "patents" ausente ou não é um array.');
    if (typeof data.users !== 'object') issues.push('Campo "users" ausente ou inválido.');
    return issues;
  }
}, {
  name: 'commandAliases.json',
  path: COMMAND_ALIASES_FILE,
  validate: (data) => {
    const issues = [];
    if (!data || typeof data !== 'object') {
      issues.push('Arquivo não pôde ser carregado como objeto.');
      return issues;
    }
    if (!Array.isArray(data.aliases)) issues.push('Campo "aliases" ausente ou inválido.');
    return issues;
  }
}, {
  name: 'customAutoResponses.json',
  path: CUSTOM_AUTORESPONSES_FILE,
  validate: (data) => {
    const issues = [];
    if (!data || typeof data !== 'object') {
      issues.push('Arquivo não pôde ser carregado como objeto.');
      return issues;
    }
    if (!Array.isArray(data.responses)) issues.push('Campo "responses" ausente ou inválido.');
    return issues;
  }
}, {
  name: 'cmdNotFound.json',
  path: CMD_NOT_FOUND_FILE,
  validate: (data) => {
    const issues = [];
    if (!data || typeof data !== 'object') {
      issues.push('Arquivo não pôde ser carregado como objeto.');
      return issues;
    }
    if (typeof data.enabled !== 'boolean') issues.push('Campo "enabled" ausente ou inválido.');
    if (typeof data.message !== 'string') issues.push('Campo "message" ausente ou inválido.');
    return issues;
  }
}];

export const runDatabaseSelfTest = ({ log = false } = {}) => {
  const results = databaseSelfTests.map(test => {
    try {
      const content = loadJsonFile(test.path, null);
      const issues = test.validate(content) || [];
      return {
        name: test.name,
        path: test.path,
        ok: issues.length === 0,
        issues
      };
    } catch (error) {
      return {
        name: test.name,
        path: test.path,
        ok: false,
        issues: [`Erro ao carregar: ${error.message || error}`]
      };
    }
  });

  if (log) {
    results.forEach(result => {
      if (result.ok) {
        console.log(`✅ [DB Test] ${result.name} pronto.`);
      } else {
        console.warn(`⚠️ [DB Test] Problemas detectados em ${result.name}:\n- ${result.issues.join('\n- ')}`);
      }
    });
  }

  return {
    ok: results.every(result => result.ok),
    results
  };
};
