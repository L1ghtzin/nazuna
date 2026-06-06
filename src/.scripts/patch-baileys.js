import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho para o arquivo alvo dentro do node_modules local
const TARGET_FILE = path.join(__dirname, '..', '..', 'node_modules', 'baileys', 'lib', 'Socket', 'messages-recv.js');

const INJECTION_MARKER_START = '// ── STEALTH ANTIDOTE START ──';
const INJECTION_MARKER_END = '// ── STEALTH ANTIDOTE END ──';

const INJECTION_CODE = `
                ${INJECTION_MARKER_START}
                try {
                    const stealthDecryptFail = node.attrs?.['decrypt-fail'] || encNode?.attrs?.['decrypt-fail'] || null;
                    const stealthFailedToDecrypt = msg.messageStubType === proto.WebMessageInfo.StubType.CIPHERTEXT;
                    if (stealthDecryptFail || stealthFailedToDecrypt) {
                        msg.stealthMeta = {
                            decryptFail: stealthDecryptFail,
                            encType: encNode?.attrs?.type || null,
                            failedToDecrypt: stealthFailedToDecrypt,
                            stubReason: msg.messageStubParameters?.[0] || null,
                            rawNodeAttrs: node.attrs || {},
                            rawEncAttrs: encNode?.attrs || {},
                            childTags: Array.isArray(node.content) ? node.content.filter(c => typeof c === 'object' && c && c.tag).map(c => c.tag) : []
                        };
                    }
                }
                catch (stealthErr) {
                    logger.debug({ stealthErr }, 'stealth meta capture failed');
                }
                ${INJECTION_MARKER_END}
`;

async function applyPatch() {
    console.log('🛡️  [Anti-Stealth] Verificando biblioteca Baileys...');
    
    if (!fs.existsSync(TARGET_FILE)) {
        console.warn('⚠️  [Anti-Stealth] Arquivo do Baileys não encontrado. O bot não iniciou o download das dependências ainda ou o caminho mudou.');
        return;
    }

    let code = fs.readFileSync(TARGET_FILE, 'utf-8');

    // Estratégia Blindada: Vamos localizar os dois pontos âncoras originais do Baileys
    // e substituir TUDO que estiver no meio deles pela nossa versão mais recente.
    // Isso garante que qualquer lixo ou erro de sintaxe antigo seja aniquilado.
    const anchorStart = 'await decrypt();';
    const anchorEnd = 'if (msg.key?.remoteJid && msg.key?.id && msg.message && messageRetryManager) {';

    if (!code.includes(anchorStart) || !code.includes(anchorEnd)) {
        console.warn('⚠️  [Anti-Stealth] Ponto de injeção não encontrado. A versão do Baileys pode ser incompatível.');
        return;
    }

    const startIndex = code.indexOf(anchorStart) + anchorStart.length;
    const endIndex = code.indexOf(anchorEnd);

    const before = code.substring(0, startIndex);
    const middle = code.substring(startIndex, endIndex);
    const after = code.substring(endIndex);

    // Verifica se já está 100% atualizado e sem sujeiras
    if (middle.includes(INJECTION_MARKER_START) && middle.includes('encNode?.attrs?.[\'decrypt-fail\']') && !middle.includes('stealth meta capture failed\');')) {
        console.log('✅  [Anti-Stealth] Patch já está na versão mais recente e perfeitamente limpo.');
        return;
    }

    console.log('🔄  [Anti-Stealth] Aplicando/Atualizando patch com método blindado...');
    
    // Reconstrói o arquivo com as âncoras e a nossa injeção no meio
    code = before + '\n' + INJECTION_CODE + '\n                ' + after;

    fs.writeFileSync(TARGET_FILE, code, 'utf-8');
    console.log('✅  [Anti-Stealth] Patch aplicado e resquícios limpos com sucesso!');
}

applyPatch().catch(err => {
    console.error('❌  [Anti-Stealth] Erro ao aplicar patch:', err.message);
});
