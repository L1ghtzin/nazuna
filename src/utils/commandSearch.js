import { execDynamicCommand, getAllCommandList } from './dynamicCommand.js';

// ==================== CACHE DE COMANDOS (Performance) ====================
// Extrai a lista de comandos UMA VEZ e cacheia em memória.
// Antes: 3 funções liam 1.2MB do disco a cada comando não-encontrado (3.6MB de I/O).
// Agora: 0 bytes de I/O após a primeira chamada.
let _commandListCache = null;
let _commandNGramsCache = null;

// Inicializa o cache de comandos assincronamente ao carregar o módulo
getAllCommandList().then(list => {
  _commandListCache = list;
  _commandNGramsCache = list.map(cmd => ({
    command: cmd,
    nGrams: generateNGrams(cmd.toLowerCase(), 2)
  }));
}).catch(err => {
  console.error('Erro ao inicializar cache de comandos:', err);
});

export function getCommandListCached() {
  return _commandListCache || [];
}

/**
 * Helper para gerar N-grams
 */
function generateNGrams(word, n) {
  const nGrams = [];
  for (let i = 0; i < word.length - n + 1; i++) {
    nGrams.push(word.slice(i, i + n));
  }
  return nGrams;
}

/**
 * Calcula a similaridade entre duas palavras usando N-grams pré-calculados se disponíveis
 */
function fuzzySimilarity(targetNGrams, targetLength, commandObj) {
  const nGrams2 = commandObj.nGrams;
  if (!nGrams2 || nGrams2.length === 0) return 0;
  
  const commonNGrams = targetNGrams.filter(nGram => nGrams2.includes(nGram));
  const similarity = Math.round((2 * commonNGrams.length) / (targetLength + nGrams2.length) * 100);
  return isNaN(similarity) ? 0 : similarity;
}

/**
 * Busca comandos similares ao digitado pelo usuário
 */
export function Commands(targetWord, prefix = '.') {
  try {
    if (!_commandNGramsCache) return { command: null, similarity: 0, suggested: null };
    
    let mostSimilarCommand = '';
    let highestSimilarity = -1;
    
    const targetNGrams = generateNGrams(targetWord.toLowerCase(), 2);
    const targetLength = targetNGrams.length;
    
    for (const cmdObj of _commandNGramsCache) {
      if (cmdObj.command === targetWord) continue;
      
      const similarity = fuzzySimilarity(targetNGrams, targetLength, cmdObj);
      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        mostSimilarCommand = cmdObj.command;
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
 */
export function getTotalCommands() {
  return getCommandListCached().length;
}

/**
 * Retorna os top N comandos mais similares
 */
export function getTopSimilarCommands(target, limit = 3) {
  try {
    if (!_commandNGramsCache) return [];
    
    const similarities = [];
    const targetNGrams = generateNGrams(target.toLowerCase(), 2);
    const targetLength = targetNGrams.length;
    
    for (const cmdObj of _commandNGramsCache) {
      if (cmdObj.command === target) continue;
      
      const similarity = fuzzySimilarity(targetNGrams, targetLength, cmdObj);
      if (similarity > 30) {
        similarities.push({ command: cmdObj.command, similarity });
      }
    }
    
    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, limit);
  } catch (error) {
    console.error('Erro ao buscar top comandos similares:', error);
    return [];
  }
}
