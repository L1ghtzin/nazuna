import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_PATH = path.join(__dirname, '..', 'dados', 'config.json');

// Função de migração síncrona para o config.json
try {
    if (!fs.existsSync(CONFIG_PATH)) {
        const legacyPath1 = path.join(__dirname, '..', 'dados', 'src', 'config.json');
        const legacyPath2 = path.join(__dirname, 'config.json');
        
        const targetDir = path.dirname(CONFIG_PATH);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        
        if (fs.existsSync(legacyPath1)) {
            console.log('🔄 Migrando config.json antigo de dados/src/ para dados/config.json...');
            fs.renameSync(legacyPath1, CONFIG_PATH);
            try {
                const srcDir = path.dirname(legacyPath1);
                if (fs.readdirSync(srcDir).length === 0) {
                    fs.rmdirSync(srcDir);
                }
            } catch {}
        } else if (fs.existsSync(legacyPath2)) {
            console.log('🔄 Migrando config.json temporário de src/ para dados/config.json...');
            fs.renameSync(legacyPath2, CONFIG_PATH);
        }
    }
} catch (migErr) {
    console.error('⚠️ Erro ao executar migração do config.json:', migErr.message);
}

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

export { CONFIG_PATH };
export default config;
