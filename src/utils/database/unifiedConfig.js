import fs from 'fs';
import pathz from 'path';
import { writeJsonFile, writeJsonFileQueued } from './_core.js';
import { OWNER_CONFIG_FILE } from '../paths.js';

const FILE_TO_KEY = {
  'antipv.json': 'antiPV',
  'premium.json': 'premium',
  'antispam.json': 'antiSpam',
  'globalblocks.json': 'globalBlocks',
  'botstate.json': 'botState',
  'msgprefix.json': 'msgPrefix',
  'msgboton.json': 'msgBotOn',
  'cmdnotfound.json': 'cmdNotFound',
  'subdonos.json': 'subdonos',
  'menudesign.json': 'menuDesign'
};

const UNIFIED_FILES = Object.keys(FILE_TO_KEY);

let unifiedSettings = null;

export function isUnifiedPath(filePath) {
  if (!filePath || typeof filePath !== 'string') return false;
  const basename = pathz.basename(filePath).toLowerCase();
  return UNIFIED_FILES.includes(basename);
}

export function loadUnifiedSettings() {
  if (unifiedSettings) return unifiedSettings;
  try {
    if (fs.existsSync(OWNER_CONFIG_FILE)) {
      unifiedSettings = JSON.parse(fs.readFileSync(OWNER_CONFIG_FILE, 'utf-8'));
    } else {
      unifiedSettings = {};
    }
  } catch (error) {
    console.error('❌ Erro ao carregar ownerConfig.json, inicializando objeto vazio:', error.message);
    unifiedSettings = {};
  }
  return unifiedSettings;
}

export function getUnifiedValue(filePath, defaultValue = {}) {
  const settings = loadUnifiedSettings();
  const filename = pathz.basename(filePath).toLowerCase();
  const key = FILE_TO_KEY[filename];
  if (!key) return defaultValue;
  if (settings[key] === undefined) {
    settings[key] = defaultValue;
  }
  return settings[key];
}

export function setUnifiedValue(filePath, data) {
  const settings = loadUnifiedSettings();
  const filename = pathz.basename(filePath).toLowerCase();
  const key = FILE_TO_KEY[filename];
  if (!key) return;
  settings[key] = data;
  writeJsonFile(OWNER_CONFIG_FILE, settings);
}

export async function setUnifiedValueAsync(filePath, data) {
  const settings = loadUnifiedSettings();
  const filename = pathz.basename(filePath).toLowerCase();
  const key = FILE_TO_KEY[filename];
  if (!key) return;
  settings[key] = data;
  await writeJsonFileQueued(OWNER_CONFIG_FILE, settings);
}


