/**
 * Image Tools - Remoção de fundo e Upscale
 * Usa API vreden.my.id
 */

import axios from 'axios';

const API_BASE = 'https://api.vreden.my.id/api/v1/artificial/imglarger';

/**
 * Remover fundo de uma imagem usando ClearBackdrop API
 * @param {Buffer} buffer - Buffer da imagem
 * @returns {Promise<Object>} Resultado com URL da imagem sem fundo
 */
async function removeBg(buffer) {
  try {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      return { ok: false, msg: 'Buffer da imagem é obrigatório' };
    }

    if (process.env.DEBUG_MODE === 'true') {
      console.log('[RemoveBG] Processando imagem...');
    }

    const FormDataModule = await import('form-data').then(m => m.default).catch(() => null);
    if (!FormDataModule) throw new Error('form-data não disponível');

    const form = new FormDataModule();
    form.append('image', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' });

    const response = await axios.post('https://clearbackdrop.com/api/v1/remove-background?response=json', form, {
      headers: form.getHeaders(),
      timeout: 60000
    });

    if (!response.data?.success || !response.data?.result_url) {
      return { ok: false, msg: 'Não foi possível remover o fundo da imagem' };
    }

    return {
      ok: true,
      status: true,
      result: {
        download: response.data.result_url
      }
    };
  } catch (error) {
    console.error('[RemoveBG] Erro:', error.message);
    return { ok: false, msg: error.message || 'Erro ao remover fundo da imagem' };
  }
}

export default { removeBg };
export { removeBg };
