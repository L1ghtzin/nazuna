import { handleAntiSpam } from './security/antiSpam.js';
import { handleAntiMedia } from './security/antiMedia.js';
import { handleAntiPayment } from './security/antiPayment.js';
import { handleAntiStatus } from './security/antiStatus.js';
import { handleAntiDel } from './security/antiDel.js';
import { handleAFK, handleAFKMention } from './security/afk.js';
import { handleMutedUsers } from './security/mutedUsers.js';
import { handleRentalMode, handleActivationCode } from './security/rentalMode.js';
import { 
    handleMinMessage, 
    handleAntiBtn, 
    handleSoAdmBypass, 
    handleBlockedCommands 
} from './security/miscSecurity.js';

/**
 * Função principal que atua apenas como maestro.
 * Ela vai rodar cada um dos módulos de segurança até que um deles
 * decida que o fluxo de mensagens deve ser interrompido.
 */
export async function processGroupSecurity(context) {
    const checks = [
        handleMinMessage,
        handleAntiStatus,
        handleAntiBtn,
        handleAntiPayment,
        handleAntiMedia,
        handleSoAdmBypass,
        handleAntiDel,
        handleBlockedCommands,
        handleAntiSpam,
        handleAFK,
        handleAFKMention,
        handleMutedUsers,
        handleRentalMode,
        handleActivationCode
    ];

    for (const check of checks) {
        const stopProcessing = await check(context);
        if (stopProcessing) {
            return { stopProcessing: true };
        }
    }

    return { stopProcessing: false };
}
