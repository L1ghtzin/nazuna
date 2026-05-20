import fs from 'fs';
import path from 'path';

/**
 * Utilitário para lidar com erros de criptografia e "Bad MAC" no Baileys.
 * Permite limpar arquivos de sessão problemáticos de forma granular.
 */
class BadMacHandler {
    /**
     * Limpa arquivos de sessão problemáticos (pre-keys, sender-keys, sessions)
     * @param {string} authDir - Diretório onde estão as credenciais (ex: database/qr-code)
     * @param {string} [jid] - JID opcional para remover apenas chaves relacionadas a um usuário específico
     */
    async clearProblematicSessionFiles(authDir, jid = null) {
        try {
            if (!authDir || !fs.existsSync(authDir)) return false;

            const files = fs.readdirSync(authDir);
            let removedCount = 0;

            // Extrai a parte numérica se for um JID/LID para busca no nome do arquivo
            const baseId = jid ? jid.split('@')[0] : null;

            for (const file of files) {
                // NUNCA remova credenciais principais ou chaves de sincronização globais
                if (file === 'creds.json' || file.includes('app-state-sync-key')) {
                    continue;
                }

                const filePath = path.join(authDir, file);
                
                // Tipos de arquivos que geralmente causam problemas de Bad MAC/Decryption
                const isProblematicType = 
                    file.startsWith('pre-key-') || 
                    file.startsWith('sender-key-') || 
                    file.startsWith('session-') ||
                    file.startsWith('app-state-sync-version-');

                if (!isProblematicType) continue;

                let shouldRemove = false;

                if (jid) {
                    // Se JID for fornecido, remove apenas se o arquivo contiver o ID
                    // Baileys usa o JID sanitizado no nome do arquivo
                    if (file.includes(jid) || (baseId && file.includes(baseId))) {
                        shouldRemove = true;
                    }
                } else {
                    // Se nenhum JID for fornecido, remove todos os arquivos desses tipos (limpeza geral)
                    shouldRemove = true;
                }

                if (shouldRemove) {
                    try {
                        fs.unlinkSync(filePath);
                        removedCount++;
                    } catch (e) {
                        // Ignora se não conseguir apagar (ex: arquivo em uso)
                    }
                }
            }

            if (removedCount > 0) {
                console.log(`[BadMacHandler] 🧹 Limpeza concluída: ${removedCount} arquivos removidos em ${authDir}${jid ? ` (Alvo: ${jid})` : ''}`);
            }
            
            return true;
        } catch (error) {
            console.error(`[BadMacHandler] ❌ Erro ao limpar arquivos de sessão:`, error.message);
            return false;
        }
    }

    /**
     * Verifica se o erro é relacionado a MAC ou descriptografia
     * @param {Error} error 
     */
    isBadMacError(error) {
        const msg = error?.message || '';
        return msg.includes('Bad MAC') || msg.includes('decryption failed') || msg.includes('MAC verification failed');
    }
}

export const badMacHandler = new BadMacHandler();
export default badMacHandler;
