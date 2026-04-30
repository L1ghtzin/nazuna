import { execDynamicCommand, getAllCommandList } from './dynamicCommand.js';

// ==================== CACHE DE COMANDOS (Performance) ====================
// Extrai a lista de comandos UMA VEZ e cacheia em memória.
// Antes: 3 funções liam 1.2MB do disco a cada comando não-encontrado (3.6MB de I/O).
// Agora: 0 bytes de I/O após a primeira chamada.
let _commandListCache = null;

// Inicializa o cache de comandos assincronamente ao carregar o módulo
getAllCommandList().then(list => {
  _commandListCache = list;
  console.log(`📋 Cache de comandos dinâmicos inicializado: ${list.length} comandos carregados`);
}).catch(err => {
  console.error('Erro ao inicializar cache de comandos:', err);
});

export function getCommandListCached() {
  return _commandListCache || [];
}

/**
 * Calcula a similaridade entre duas palavras usando N-grams
 * @param {string} word1 - Primeira palavra
 * @param {string} word2 - Segunda palavra
 * @returns {number} - Porcentagem de similaridade (0-100)
 */
function fuzzySimilarity(word1, word2) {
  function generateNGrams(word, n) {
    const nGrams = [];
    for (let i = 0; i < word.length - n + 1; i++) {
      nGrams.push(word.slice(i, i + n))
    }
    return nGrams;
  };
  
  const nGrams1 = generateNGrams(word1.toLowerCase(), 2)
  const nGrams2 = generateNGrams(word2.toLowerCase(), 2)
  const commonNGrams = nGrams1.filter(nGram => nGrams2.includes(nGram))
  const similarity = Math.round((2 * commonNGrams.length) / (nGrams1.length + nGrams2.length) * 100)
  return isNaN(similarity) ? 0 : similarity;
}

/**
 * Busca comandos similares ao digitado pelo usuário
 * @param {string} targetWord - Comando digitado pelo usuário
 * @param {string} prefix - Prefixo do bot (ex: "!")
 * @returns {object} - Objeto com comando similar e porcentagem
 */
export function Commands(targetWord, prefix = '.') {
  try {
    const commands = getCommandListCached();
    let mostSimilarCommand = '';
    let highestSimilarity = -1;
    
    for (const extractedCommand of commands) {
      const similarity = fuzzySimilarity(targetWord, extractedCommand);
      if (similarity > highestSimilarity && extractedCommand !== targetWord) {
        highestSimilarity = similarity;
        mostSimilarCommand = extractedCommand;
      }
    }
    
    // Retorna comando com sugestão apenas se similaridade for maior que 40%
    if (highestSimilarity >= 40) {
      return { 
        command: mostSimilarCommand, 
        similarity: highestSimilarity,
        suggested: `${prefix}${mostSimilarCommand}`
      };
    }
    
    return { command: null, similarity: 0, suggested: null };
  } catch (error) {
    console.error('Erro ao buscar comandos similares:', error);
    return { command: null, similarity: 0, suggested: null };
  }
}

/**
 * Conta o total de comandos disponíveis no bot
 * @returns {number} - Total de comandos encontrados
 */
export function getTotalCommands() {
  return getCommandListCached().length;
}

/**
 * Retorna os top N comandos mais similares
 * @param {string} target - Comando digitado
 * @param {number} limit - Quantidade de sugestões (padrão: 3)
 * @returns {array} - Array de objetos com comandos e similaridades
 */
export function getTopSimilarCommands(target, limit = 3) {
  try {
    const commands = getCommandListCached();
    const similarities = [];
    
    for (const extractedCommand of commands) {
      const similarity = fuzzySimilarity(target, extractedCommand);
      if (similarity > 30 && extractedCommand !== target) {
        similarities.push({ command: extractedCommand, similarity });
      }
    }
    
    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, limit);
  } catch (error) {
    console.error('Erro ao buscar top comandos similares:', error);
    return [];
  }
}
