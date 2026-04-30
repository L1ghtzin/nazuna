import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_PATH = path.join(__dirname, 'config.json');

let config = {};
try {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
} catch (error) {
    console.error('Erro ao carregar config.json:', error.message);
}

export const PREFIX = config.prefixo || '!';
export const NOMEDONO = config.nomedono || '';
export const NUMERODONO = config.numerodono || '';
export const NOMEBOT = config.nomebot || '';

export default config;
