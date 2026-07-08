/**
 * JSON Serializer — Camada centralizada de serialização/deserialização do Chainy
 *
 * Objetivos:
 * - Eliminar double-parse (stringify → parse → stringify) dos hot-paths
 * - Centralizar lógica de validação e fallback
 * - Manter pretty-print (null, 2) para compatibilidade visual
 * - Ponto único para futuras otimizações de engine
 */

/**
 * Serializa dados para JSON (pretty-print para manter compatibilidade visual).
 * Retorna { ok: true, json: string } ou { ok: false, error: string }.
 * NÃO faz re-parse para validar — se stringify não lançou exceção, o JSON é válido.
 *
 * @param {*} data - Dados a serializar
 * @returns {{ ok: boolean, json?: string, error?: string }}
 */
export function serialize(data) {
  try {
    if (data === undefined || data === null) {
      return { ok: false, error: 'Dados nulos ou undefined' };
    }

    const json = JSON.stringify(data, null, 2);
    return { ok: true, json };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

/**
 * Deserializa string JSON com fallback seguro.
 *
 * @param {string} content - String JSON
 * @param {*} defaultValue - Valor padrão se parsing falhar
 * @returns {{ ok: boolean, data: *, error?: string }}
 */
export function deserialize(content, defaultValue = {}) {
  try {
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return { ok: false, data: defaultValue, error: 'Conteúdo vazio' };
    }

    const data = JSON.parse(content);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, data: defaultValue, error: error.message };
  }
}

/**
 * Sanitiza string JSON corrompida (BOM, caracteres de controle, trailing commas).
 *
 * @param {string} str - String JSON potencialmente corrompida
 * @returns {string} String sanitizada
 */
export function sanitizeJson(str) {
  if (typeof str !== 'string') return str;

  // Remove BOM
  str = str.replace(/^\uFEFF/, '');

  // Remove caracteres de controle exceto newlines e tabs
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Corrige aspas mal escapadas comuns
  str = str.replace(/\\'/g, "'");

  // Remove trailing commas em arrays e objects
  str = str.replace(/,\s*([\]}])/g, '$1');

  return str.trim();
}
