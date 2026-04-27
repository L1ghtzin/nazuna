/**
 * SISTEMA ANTISTICKERPLUS
 * 
 * Este módulo detecta figurinhas do tipo Lottie (geralmente do WhatsApp Plus)
 * e aplica punições configuradas por grupo.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GRUPOS_DIR = path.join(__dirname, '../../../database/grupos');

// --- HELPERS ---

/**
 * Carrega dados do grupo
 */
const loadGroupData = (groupId) => {
    try {
        const groupFile = path.join(GRUPOS_DIR, `${groupId}.json`);
        if (fs.existsSync(groupFile)) {
            return JSON.parse(fs.readFileSync(groupFile, 'utf8'));
        }
        return {};
    } catch (err) {
        console.error(`[AntiStickerPlus] Erro ao carregar dados do grupo ${groupId}:`, err.message);
        return {};
    }
};

/**
 * Salva dados do grupo
 */
const saveGroupData = (groupId, data) => {
    try {
        const groupFile = path.join(GRUPOS_DIR, `${groupId}.json`);
        fs.writeFileSync(groupFile, JSON.stringify(data, null, 2));
        return true;
    } catch (err) {
        console.error(`[AntiStickerPlus] Erro ao salvar dados do grupo ${groupId}:`, err.message);
        return false;
    }
};

// --- LOGICA DE DETECÇÃO ---

/**
 * Verifica se a mensagem contém figurinhas Lottie e aplica a punição
 */
export const checkSticker = async (nazu, from, info, groupData, { isGroupAdmin, isOwner, isParceiro, isBotAdmin, reply, getUserName }) => {
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
            // Ação: Apagar mensagem
            if (groupData.antistickerplus_apagar || groupData.antistickerplus_remover) {
                await nazu.sendMessage(from, {
                    delete: info.key
                });
            }

            // Ação: Notificar
            if (groupData.antistickerplus_remover) {
                await reply(
                    `🚫 @${getUserName(sender)}, este grupo não permite esse tipo de figurinha do whatsapp plus (Lottie).`,
                    { mentions: [sender] }
                );
            }

            // Ação: Remover usuário
            if (groupData.antistickerplus_remover && isBotAdmin) {
                await nazu.groupParticipantsUpdate(from, [sender], 'remove');
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
export const handleCommand = async (nazu, from, args, groupData, { reply, prefix }) => {
    const arg = args[0] ? args[0].toLowerCase() : '';

    if (!arg) {
        groupData.antistickerplus = !groupData.antistickerplus;
        
        // Configura padrão se estiver ligando agora
        if (groupData.antistickerplus && !groupData.antistickerplus_remover && !groupData.antistickerplus_apagar) {
            groupData.antistickerplus_apagar = true;
        }

        const status = groupData.antistickerplus ? 'ativado ✅' : 'desativado ❌';
        let msg = `🛡️ *AntiSticker Plus:* ${status}\n\n`;
        
        if (groupData.antistickerplus) {
            msg += `Ação atual: ${groupData.antistickerplus_remover ? 'Remover usuário 🔨' : 'Apenas apagar 🗑️'}\n\n`;
            msg += `*Configuração:* \n`;
            msg += `• ${prefix}antistickerplus apagar\n`;
            msg += `• ${prefix}antistickerplus remover`;
        }

        saveGroupData(from, groupData);
        return reply(msg);
    }

    if (arg === 'apagar') {
        groupData.antistickerplus = true;
        groupData.antistickerplus_apagar = true;
        groupData.antistickerplus_remover = false;
        saveGroupData(from, groupData);
        return reply('✅ Configurado para apenas *apagar* figurinhas Lottie.');
    }

    if (arg === 'remover') {
        groupData.antistickerplus = true;
        groupData.antistickerplus_remover = true;
        groupData.antistickerplus_apagar = false;
        saveGroupData(from, groupData);
        return reply('✅ Configurado para *remover* quem enviar figurinhas Lottie.');
    }

    return reply(`❓ Subcomando inválido.\nUse: ${prefix}antistickerplus [apagar/remover] ou apenas ${prefix}antistickerplus para ligar/desligar.`);
};

export default {
    checkSticker,
    handleCommand
};
