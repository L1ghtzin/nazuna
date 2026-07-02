/**
 * SISTEMA ANTISTICKERPLUS
 * 
 * Este módulo detecta figurinhas do tipo Lottie (geralmente do WhatsApp Plus)
 * e aplica punições configuradas por grupo.
 */

import { MESSAGES } from '../../utils/messages.js';
import { saveGroupDataById } from '../../utils/groupManager.js';

const persistGroupData = async (groupId, groupData, { groupFile } = {}) => {
    const saved = await saveGroupDataById(groupId, groupData, { groupFile });
    if (!saved) {
        console.error(`[AntiStickerPlus] Erro ao salvar dados do grupo ${groupId}`);
    }
    return saved;
};

// --- LOGICA DE DETECÇÃO ---

/**
 * Verifica se a mensagem contém figurinhas Lottie e aplica a punição
 */
export const checkSticker = async (bot, from, info, groupData, { isGroupAdmin, isOwner, isParceiro, isBotAdmin, reply, getUserName }) => {
    if (!groupData.antistickerplus || isGroupAdmin || isOwner || isParceiro || !info?.message) {
        return;
    }

    try {
        const msg = info.message;
        const sender = info.key.participant || info.key.remoteJid;

        // Extrai a figurinha (normal ou lottie, direta ou marcada)
        const stickerMsg =
            msg?.stickerMessage ||
            msg?.lottieStickerMessage?.message?.stickerMessage ||
            msg?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage ||
            msg?.extendedTextMessage?.contextInfo?.quotedMessage?.lottieStickerMessage?.message?.stickerMessage;

        if (stickerMsg && stickerMsg?.isLottie === true) {
            // Ação: Apagar mensagem (sempre)
            await bot.sendMessage(from, {
                delete: info.key
            });

            // Ação: Remover usuário (se configurado)
            if (groupData.antistickerplus_remover && isBotAdmin) {
                await bot.groupParticipantsUpdate(from, [sender], 'remove');
                await reply(
                    MESSAGES.funcs.antiSticker.warnAdmin(getUserName(sender)),
                    { mentions: [sender] }
                );
            } else {
                await reply(
                    MESSAGES.funcs.antiSticker.warnUser(getUserName(sender)),
                    { mentions: [sender] }
                );
            }
        }
    } catch (err) {
        console.error("[AntiStickerPlus] Erro na detecção:", err);
    }
};

// --- COMANDO (Handler) ---

/**
 * Lida com o comando antistickerplus
 */
export const handleCommand = async (bot, from, args, groupData, { reply, prefix, groupFile }) => {
    const arg = args[0] ? args[0].toLowerCase() : '';

    if (!arg) {
        groupData.antistickerplus = !groupData.antistickerplus;
        
        // Configura padrão se estiver ligando agora
        if (groupData.antistickerplus && !groupData.antistickerplus_remover && !groupData.antistickerplus_apagar) {
            groupData.antistickerplus_apagar = true;
        }

        const status = groupData.antistickerplus
            ? MESSAGES.funcs.antiSticker.statusEnabled
            : MESSAGES.funcs.antiSticker.statusDisabled;
        const actionMsg = groupData.antistickerplus 
            ? (groupData.antistickerplus_remover ? MESSAGES.funcs.antiSticker.actionRemove : MESSAGES.funcs.antiSticker.actionDelete)
            : '';
        const msg = MESSAGES.funcs.antiSticker.status(status, actionMsg, prefix);

        await persistGroupData(from, groupData, { groupFile });
        return reply(msg);
    }

    if (arg === 'apagar') {
        groupData.antistickerplus = true;
        groupData.antistickerplus_apagar = true;
        groupData.antistickerplus_remover = false;
        await persistGroupData(from, groupData, { groupFile });
        return reply(MESSAGES.funcs.antiSticker.configApagar);
    }

    if (arg === 'remover') {
        groupData.antistickerplus = true;
        groupData.antistickerplus_remover = true;
        groupData.antistickerplus_apagar = false;
        await persistGroupData(from, groupData, { groupFile });
        return reply(MESSAGES.funcs.antiSticker.configRemover);
    }

    return reply(MESSAGES.funcs.antiSticker.invalidSubcommand(prefix));
};

export default {
    checkSticker,
    handleCommand
};
