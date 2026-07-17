/**
 * Aliases/variações comuns de parâmetros para jogos/RPG
 */
export const PARAM_ALIASES = {
  // Pets
  'lobo': ['lobo', 'wolf', 'lobinho', 'lôbo'],
  'dragao': ['dragao', 'dragão', 'dragon', 'dracarys', 'drago'],
  'fenix': ['fenix', 'fênix', 'phoenix', 'fenixe', 'phenix'],
  'tigre': ['tigre', 'tiger', 'tigrinho', 'tigrão'],
  'aguia': ['aguia', 'águia', 'eagle', 'falcao', 'falcão'],
  'gato': ['gato', 'cat', 'gatinho', 'felino'],
  'cao': ['cao', 'cão', 'cachorro', 'dog', 'doguinho', 'caozinho', 'cãozinho'],
  'coelho': ['coelho', 'rabbit', 'bunny', 'coelhinho'],
  'coruja': ['coruja', 'owl', 'corujinha'],
  'urso': ['urso', 'bear', 'ursinho'],
  // Cores
  'vermelho': ['vermelho', 'red', 'rubro', 'encarnado', 'vermelha'],
  'preto': ['preto', 'black', 'negro', 'preta'],
  'verde': ['verde', 'green'],
  'azul': ['azul', 'blue'],
  'branco': ['branco', 'white', 'branca'],
  'amarelo': ['amarelo', 'yellow', 'dourado', 'amarela'],
  'roxo': ['roxo', 'purple', 'violeta', 'roxa'],
  'laranja': ['laranja', 'orange'],
  // Ações do coinflip
  'cara': ['cara', 'heads', 'caras', 'c'],
  'coroa': ['coroa', 'tails', 'coroas', 'co'],
  // Materiais
  'pedra': ['pedra', 'stone', 'rock', 'rocha'],
  'ferro': ['ferro', 'iron', 'metal', 'aço', 'aco'],
  'ouro': ['ouro', 'gold', 'dourado'],
  'diamante': ['diamante', 'diamond', 'diamant', 'brilhante'],
  'madeira': ['madeira', 'wood', 'lenha'],
  'carvao': ['carvao', 'carvão', 'coal'],
  'corda': ['corda', 'rope'],
  'couro': ['couro', 'leather'],
  'linha': ['linha', 'thread', 'fio'],
  'cristal': ['cristal', 'crystal'],
  // Empregos
  'estagiario': ['estagiario', 'estagiário', 'estag', 'intern'],
  'designer': ['designer', 'design', 'grafico', 'gráfico'],
  'programador': ['programador', 'dev', 'developer', 'coder', 'prog'],
  'gerente': ['gerente', 'manager', 'chefe', 'ger'],
  // Ferramentas
  'pickaxe_bronze': ['pickaxe_bronze', 'picareta_bronze', 'picaretabronze', 'bronze'],
  'pickaxe_ferro': ['pickaxe_ferro', 'picareta_ferro', 'picaretaferro', 'pferro'],
  'pickaxe_diamante': ['pickaxe_diamante', 'picareta_diamante', 'picaretadiamante', 'pdiamante'],
  // Itens premium
  'titulo_lendario': ['titulo_lendario', 'titulo', 'título', 'titulolendario'],
  'mascote_raro': ['mascote_raro', 'mascote', 'mascoteraro'],
  'mansao': ['mansao', 'mansão', 'mansion', 'casa'],
  'yate': ['yate', 'iate', 'yacht', 'barco'],
  'jet_privado': ['jet_privado', 'jato', 'jet', 'aviao', 'avião'],
  'diamante_eterno': ['diamante_eterno', 'diamanteeterno', 'eternodiamond'],
  'coroa_rei': ['coroa_rei', 'coroa', 'crown', 'coroareal'],
  'boost_permanente': ['boost_permanente', 'boostperm', 'permanenteboost'],
  'protecao_vip': ['protecao_vip', 'protecaovip', 'vip', 'proteção'],
  'multiplicador_xp': ['multiplicador_xp', 'multxp', 'xpmult', 'multiplicadorxp'],
  // Boosts
  'xp': ['xp', 'experiencia', 'experiência', 'exp', 'sxp'],
  'money': ['money', 'dinheiro', 'grana', 'coins', 'moedas'],
  'luck': ['luck', 'sorte', 'lucky'],
  'power': ['power', 'poder', 'força', 'forca'],
  'mega': ['mega', 'all', 'todos', 'full'],
  // Outros
  'sim': ['sim', 'yes', 's', 'y', 'si', 'positivo'],
  'nao': ['nao', 'não', 'no', 'n', 'negativo'],
  'confirmar': ['confirmar', 'confirm', 'confirmado', 'ok', 'sim', 'aceito', 'aceitar']
};

export function formatUptime(seconds, longFormat = false, showZero = false) {
  const d = Math.floor(seconds / (24 * 3600));
  const h = Math.floor(seconds % (24 * 3600) / 3600);
  const m = Math.floor(seconds % 3600 / 60);
  const s = Math.floor(seconds % 60);
  const formats = longFormat ? {
    d: val => `${val} ${val === 1 ? 'dia' : 'dias'}`,
    h: val => `${val} ${val === 1 ? 'hora' : 'horas'}`,
    m: val => `${val} ${val === 1 ? 'minuto' : 'minutos'}`,
    s: val => `${val} ${val === 1 ? 'segundo' : 'segundos'}`
  } : {
    d: val => `${val}d`,
    h: val => `${val}h`,
    m: val => `${val}m`,
    s: val => `${val}s`
  };
  const uptimeStr = [];
  if (d > 0 || showZero) uptimeStr.push(formats.d(d));
  if (h > 0 || showZero) uptimeStr.push(formats.h(h));
  if (m > 0 || showZero) uptimeStr.push(formats.m(m));
  if (s > 0 || showZero) uptimeStr.push(formats.s(s));
  return uptimeStr.length > 0 ? uptimeStr.join(longFormat ? ', ' : ' ') : longFormat ? '0 segundos' : '0s';
}

export const normalizar = (texto, keepCase = false) => {
  if (!texto || typeof texto !== 'string') return '';
  const normalizedText = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return keepCase ? normalizedText : normalizedText.toLowerCase();
};

export const normalizeClanName = (name) => {
  if (!name) return "";
  return normalizar(name).replace(/\s+/g, "");
};

/**
 * Normaliza parâmetro de comando para comparação
 * Remove acentos, espaços extras, converte para minúsculas
 */
export const normalizeParam = (param) => {
  if (!param || typeof param !== 'string') return '';
  return param
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Normaliza espaços
    .replace(/[_\-]/g, ''); // Remove underscores e hífens
};

/**
 * Compara dois textos ignorando acentos e case
 */
export const compareParams = (input, target) => {
  return normalizeParam(input) === normalizeParam(target);
};

/**
 * Encontra uma chave em um objeto ignorando acentos
 * Retorna a chave original se encontrada
 */
export const findKeyIgnoringAccents = (obj, searchKey) => {
  if (!obj || typeof obj !== 'object' || !searchKey) return null;
  
  const normalizedSearch = normalizeParam(searchKey);
  
  // Primeiro tenta match exato (mais rápido)
  if (obj[searchKey]) return searchKey;
  if (obj[normalizedSearch]) return normalizedSearch;
  
  // Depois tenta normalizado
  for (const key of Object.keys(obj)) {
    if (normalizeParam(key) === normalizedSearch) {
      return key;
    }
  }
  
  return null;
};

/**
 * Encontra item em array ignorando acentos
 */
export const findInArrayIgnoringAccents = (arr, searchItem) => {
  if (!Array.isArray(arr) || !searchItem) return null;
  
  const normalizedSearch = normalizeParam(searchItem);
  
  return arr.find(item => {
    if (typeof item === 'string') {
      return normalizeParam(item) === normalizedSearch;
    }
    if (item && typeof item === 'object' && item.name) {
      return normalizeParam(item.name) === normalizedSearch;
    }
    return false;
  });
};

export function timeLeft(targetMs) {
  const diff = targetMs - Date.now();
  if (diff <= 0) return '0s';
  const s = Math.ceil(diff / 1000);
  const m = Math.floor(s / 60); const rs = s % 60; const h = Math.floor(m / 60); const rm = m % 60;
  return h > 0 ? `${h}h ${rm}m` : (m > 0 ? `${m}m ${rs}s` : `${rs}s`);
}

/**
 * Resolve um parâmetro para sua forma canônica usando aliases
 */
export const resolveParamAlias = (input) => {
  if (!input) return null;
  
  const normalized = normalizeParam(input);
  
  for (const [canonical, aliases] of Object.entries(PARAM_ALIASES)) {
    for (const alias of aliases) {
      if (normalizeParam(alias) === normalized) {
        return canonical;
      }
    }
  }
  
  return normalized; // Retorna normalizado se não encontrou alias
};

/**
 * Verifica se um parâmetro corresponde a uma das opções válidas
 * Retorna a opção válida encontrada ou null
 */
export const matchParam = (input, validOptions) => {
  if (!input || !validOptions) return null;
  
  const normalizedInput = normalizeParam(input);
  const resolvedInput = resolveParamAlias(input);
  
  // validOptions pode ser array ou objeto
  if (Array.isArray(validOptions)) {
    for (const option of validOptions) {
      if (normalizeParam(option) === normalizedInput || 
          normalizeParam(option) === resolvedInput) {
        return option;
      }
    }
  } else if (typeof validOptions === 'object') {
    for (const key of Object.keys(validOptions)) {
      if (normalizeParam(key) === normalizedInput || 
          normalizeParam(key) === resolvedInput) {
        return key;
      }
    }
  }
  
  return null;
};

// Escapes a string to be used safely in RegExp construction
export function escapeRegExp(str) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Formata respostas de IA para o padrão do WhatsApp
 */
export const formatAIResponse = (text) => {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/\*\*\*([^*]+)\*\*\*/g, '*$1*')  // ***text*** -> *text*
    .replace(/\*\*([^*]+)\*\*/g, '*$1*')      // **text** -> *text*
    .replace(/_{2,}([^_]+)_{2,}/g, '_$1_')    // __text__ -> _text_
    .replace(/```[\s\S]*?```/g, '')     // Remove blocos de código
    .replace(/`([^`]+)`/g, '$1')    // Remove inline code
    .replace(/^#{1,6}\s+/gm, '')    // Remove headers markdown
    .replace(/\n{3,}/g, '\n\n')     // Limita quebras de linha
    .trim();
};
