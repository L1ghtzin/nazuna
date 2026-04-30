/**
 * Utilitário para normalização de texto e remoção de acentos
 */
export function normalizar(text) {
    if (!text) return '';
    return text.normalize('NFD')
               .replace(/[\u0300-\u036f]/g, "")
               .toLowerCase()
               .trim();
}

export default normalizar;
