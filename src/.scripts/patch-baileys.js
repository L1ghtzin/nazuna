import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho para o arquivo alvo dentro do node_modules local
const TARGET_FILE = path.join(__dirname, '..', '..', 'node_modules', 'baileys', 'lib', 'Socket', 'messages-recv.js');

const INJECTION_MARKER = '// ── STEALTH ANTIDOTE (patch automáticizado) ──';

const INJECTION_CODE = `
                ${INJECTION_MARKER}
                if (node.attrs['decrypt-fail'] === 'hide' || msg.messageStubType === 2) {
                    msg.stealthMeta = {
                        decryptFail: node.attrs['decrypt-fail'],
                        encType: node.content?.[0]?.attrs?.type
                    };
                }
`;

async function applyPatch() {
    console.log('🛡️  [Anti-Stealth] Verificando biblioteca Baileys...');
    
    if (!fs.existsSync(TARGET_FILE)) {
        console.warn('⚠️  [Anti-Stealth] Arquivo do Baileys não encontrado. O bot não iniciou o download das dependências ainda ou o caminho mudou.');
        return;
    }

    let code = fs.readFileSync(TARGET_FILE, 'utf-8');

    // Se já tem o patch, não faz nada
    if (code.includes(INJECTION_MARKER)) {
        console.log('✅  [Anti-Stealth] Patch já aplicado na biblioteca Baileys.');
        return;
    }

    // Busca o ponto exato onde a descriptografia ocorre
    // Padrão encontrado no código compilado do Baileys
    const targetString = 'await decrypt();';
    
    if (!code.includes(targetString)) {
        console.warn('⚠️  [Anti-Stealth] Não foi possível encontrar a função decrypt() no Baileys. A versão pode ser incompatível.');
        return;
    }

    // Faz a substituição injetando o nosso código logo abaixo do decrypt
    code = code.replace(targetString, `${targetString}${INJECTION_CODE}`);

    // Salva o arquivo de volta
    fs.writeFileSync(TARGET_FILE, code, 'utf-8');
    console.log('✅  [Anti-Stealth] Patch aplicado com sucesso! Detecção instantânea de stealth ativada.');
}

applyPatch().catch(err => {
    console.error('❌  [Anti-Stealth] Erro ao aplicar patch:', err.message);
});
