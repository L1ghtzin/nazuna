import fs from 'fs';
import pathz from 'path';
import { fileURLToPath } from 'url';
import { writeJsonFile } from './_core.js';
import { writeJsonFileAsync } from '../asyncFs.js';
import { DATABASE_DIR } from '../paths.js';

const UNIFIED_SETTINGS_FILE = pathz.join(DATABASE_DIR, 'systemConfig.json');

const UNIFIED_FILES = [
  'antipv.json',
  'premium.json',
  'bangp.json',
  'antiflood.json',
  'antispam.json',
  'globalblocks.json',
  'botstate.json',
  'modolite.json'
];

let unifiedSettings = null;

export function isUnifiedPath(filePath) {
  if (!filePath || typeof filePath !== 'string') return false;
  const basename = pathz.basename(filePath).toLowerCase();
  return UNIFIED_FILES.includes(basename);
}

export function loadUnifiedSettings() {
  if (unifiedSettings) return unifiedSettings;
  try {
    if (fs.existsSync(UNIFIED_SETTINGS_FILE)) {
      unifiedSettings = JSON.parse(fs.readFileSync(UNIFIED_SETTINGS_FILE, 'utf-8'));
    } else {
      unifiedSettings = {};
    }
  } catch (error) {
    console.error('❌ Erro ao carregar systemConfig.json, inicializando objeto vazio:', error.message);
    unifiedSettings = {};
  }
  return unifiedSettings;
}

export function getUnifiedValue(filePath, defaultValue = {}) {
  const settings = loadUnifiedSettings();
  const key = pathz.basename(filePath).toLowerCase();
  if (settings[key] === undefined) {
    settings[key] = defaultValue;
  }
  return settings[key];
}

export function setUnifiedValue(filePath, data) {
  const settings = loadUnifiedSettings();
  const key = pathz.basename(filePath).toLowerCase();
  settings[key] = data;
  writeJsonFile(UNIFIED_SETTINGS_FILE, settings);
}

export async function setUnifiedValueAsync(filePath, data) {
  const settings = loadUnifiedSettings();
  const key = pathz.basename(filePath).toLowerCase();
  settings[key] = data;
  await writeJsonFileAsync(UNIFIED_SETTINGS_FILE, settings);
}

// Migra arquivos legados se eles existirem no disco
export function migrateLegacyFiles() {
  const settings = loadUnifiedSettings();
  let modified = false;

  const legacyPaths = [
    { name: 'antipv.json', path: pathz.join(DATABASE_DIR, 'antipv.json') },
    { name: 'premium.json', path: pathz.join(DATABASE_DIR, 'dono', 'premium.json') },
    { name: 'bangp.json', path: pathz.join(DATABASE_DIR, 'dono', 'bangp.json') },
    { name: 'antiflood.json', path: pathz.join(DATABASE_DIR, 'antiflood.json') },
    { name: 'antispam.json', path: pathz.join(DATABASE_DIR, 'antispam.json') },
    { name: 'globalblocks.json', path: pathz.join(DATABASE_DIR, 'globalBlocks.json') },
    { name: 'botstate.json', path: pathz.join(DATABASE_DIR, 'botState.json') },
    { name: 'modolite.json', path: pathz.join(DATABASE_DIR, 'modolite.json') }
  ];

  for (const item of legacyPaths) {
    if (fs.existsSync(item.path)) {
      try {
        const raw = fs.readFileSync(item.path, 'utf-8');
        const parsed = JSON.parse(raw);
        if (settings[item.name] === undefined) {
          settings[item.name] = parsed;
          modified = true;
          console.log(`📦 [MIGRAÇÃO] Importado ${item.name} para o systemConfig.json.`);
        }
        fs.unlinkSync(item.path);
        console.log(`🗑️ [MIGRAÇÃO] Arquivo físico antigo removido: ${item.name}`);
      } catch (err) {
        console.error(`❌ [MIGRAÇÃO] Erro ao migrar arquivo legado ${item.name}:`, err.message);
      }
    }
  }

  if (modified) {
    writeJsonFile(UNIFIED_SETTINGS_FILE, settings);
  }
}
