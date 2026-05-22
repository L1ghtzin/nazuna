/**
 * Utilitário de limpeza real do chat via botInvokeMessage.
 * Portado e adaptado do Takeshi Bot para o Nazuna Modularizado.
 * 
 * Utiliza relayMessage com payload botInvokeMessage para efetivamente
 * limpar o histórico visual do chat, ao invés de apenas enviar emojis.
 */

const BOT_CLEAN_EMOJI = '🛡️';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Monta o payload especial de limpeza de chat.
 * Este payload usa botInvokeMessage com uma imagem dummy de dimensões
 * absurdas, o que força o WhatsApp a "limpar" a visualização do chat.
 * @returns {object} Payload para relayMessage
 */
export function buildCleanChatMessage() {
    return {
        botInvokeMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadataVersion: 2,
                    deviceListMetadata: {},
                },
                imageMessage: {
                    url: 'https://mmg.whatsapp.net/o1/v/t62.7118-24/f1/m234/up-oil-image-e1bbfe2b-334b-4c5d-b716-d80edff29301?ccb=9-4&oh=01_Q5AaID0uZoxsi9v2I7KJZEgeJ7IVkFPZkt2yeYf6ps0IWG2g&oe=66E7130B&_nc_sid=000000&mms3=true',
                    mimetype: 'image/png',
                    caption: `${BOT_CLEAN_EMOJI} Limpo ✅️`,
                    fileSha256: 'YVuPx9PoIxL0Oc3xsUc3n3uhttmVYlqUV97LKKvIjL8=',
                    fileLength: '999999999',
                    height: 10000000000000000,
                    width: 99999999999999999999999,
                    mediaKey: '4T8WJKuKvJ9FXSwldCXe5+/IA7aYi5ycf301J0xIZwA=',
                    fileEncSha256: 'jfG3tesFLdqtCzO6cqU51HGGkEtd7+w22aJtaEm2yjE=',
                    directPath: '/v/t62.7118-24/29631950_1467571294644184_4827066390759523804_n.enc?ccb=11-4&oh=01_Q5AaIFPK_QoDRMR4vZIBbMTdy6GreGhSA2HHRAIu0-vAMgqN&oe=66E72F5E&_nc_sid=5e03e0',
                    mediaKeyTimestamp: '1723839207',
                    jpegThumbnail: 'imagenMiniaturaBase64',
                    scansSidecar: 'il8IxPgrhGdtn37jGMVgQVRKlPd/CERE+Nr822DZe2UT9r0YT3KPSQ==',
                    scanLengths: [5373, 24562, 15656, 22918],
                    midQualityFileSha256: 's8Li+/zg2VmzMvJtRAZHPVres8nAPEWcd11nK5b/keY=',
                },
            },
            expiration: 0,
            ephemeralSettingTimestamp: '1723838053',
            disappearingMode: {
                initiator: 'CHANGED_IN_CHAT',
                trigger: 'UNKNOWN',
                initiatedByMe: true,
            },
        },
    };
}

/**
 * Gera texto de scroll (linhas em branco) para empurrar o chat.
 * @returns {string}
 */
function generateScrollText() {
    return '\n'.repeat(500) + '🗑️';
}

/**
 * Envia a limpeza real do chat em um grupo.
 * 1. Envia texto de scroll para empurrar mensagens antigas
 * 2. Aguarda um breve delay
 * 3. Faz relay da mensagem especial botInvokeMessage
 * 
 * @param {object} options
 * @param {object} options.nazu - Instância do socket WhatsApp (baileys)
 * @param {string} options.from - JID do grupo
 * @param {Function} [options.reply] - Função de reply (opcional, para mensagem de sucesso)
 * @param {string} [options.successMessage] - Mensagem de sucesso opcional
 */
export async function sendCleanChat({ nazu, from, reply, successMessage }) {
    // Envia texto de scroll para empurrar visualmente o chat
    await nazu.sendMessage(from, {
        text: `${BOT_CLEAN_EMOJI} \n\n${generateScrollText()}`,
    });

    await delay(2000);

    // Relay da mensagem especial que efetivamente limpa o chat
    await nazu.relayMessage(from, buildCleanChatMessage(), {});

    if (!successMessage) {
        return;
    }

    await delay(2000);

    if (reply) {
        await reply(successMessage);
        return;
    }

    await nazu.sendMessage(from, {
        text: `${BOT_CLEAN_EMOJI} ✅ ${successMessage}`,
    });
}
