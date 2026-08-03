// ═══════════════════════════════════════════════════════════════════
// STATIC DATA LOADER — Carregador de dados estáticos (somente leitura)
// Ponto único de acesso para todos os arquivos JSON de src/funcs/json/
// Dados são carregados UMA ÚNICA vez por arquivo e mantidos em RAM
// permanentemente (sem TTL, sem clone, sem debounce — são imutáveis).
// ═══════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JSON_DIR = path.resolve(__dirname, '../json');

/** Cache permanente em memória — uma entrada por arquivo, nunca expira. */
const cache = new Map();

/**
 * Mapeamento de aliases de comandos para seus respectivos arquivos JSON.
 * Permite que comandos usem `staticData.getRandom('cantada')` sem saber o nome exato do arquivo.
 */
const ALIAS_MAP = {
  // Textos aleatórios
  cantada: 'cantadas.json',
  cantadas: 'cantadas.json',
  curiosidade: 'curiosidades.json',
  curiosidades: 'curiosidades.json',
  fato: 'curiosidades.json',
  fatocurioso: 'curiosidades.json',
  conselho: 'conselhos.json',
  conselhos: 'conselhos.json',
  conselhobiblico: 'conselhosbiblicos.json',
  conselhosbiblicos: 'conselhosbiblicos.json',
  versiculo: 'conselhosbiblicos.json',
  biblia: 'conselhosbiblicos.json',
  piada: 'piadas.json',
  piadas: 'piadas.json',
  charada: 'charadas.json',
  charadas: 'charadas.json',
  enigma: 'charadas.json',
  motivacional: 'motivacionais.json',
  motivacionais: 'motivacionais.json',
  motivacao: 'motivacionais.json',
  frasemotivacional: 'motivacionais.json',
  elogio: 'elogios.json',
  elogios: 'elogios.json',
  elogiar: 'elogios.json',
  reflexao: 'reflexoes.json',
  reflexoes: 'reflexoes.json',
  pensamento: 'reflexoes.json',

  // Jogos & Dinâmicas
  eununca: 'eununca.json',
  inever: 'eununca.json',
  vab: 'vab.json',
  verdadeoudesafio: 'vab.json',
  verdade: 'vab.json',
  desafio: 'vab.json',
  quiz: 'quiz.json',
  forca: 'forca.json',
  hangman: 'forca.json',
  wordle: 'wordle.json',
  anagrama: 'anagrama.json',
  cacapalavras: 'cacapalavras.json',
  digitacao: 'digitacao.json',
  typing: 'digitacao.json',
  stop: 'stop.json',
  batalhanaval: 'batalhanaval.json',
  games: 'games.json',
  gamestext: 'gamestext.json',
  gamestext2: 'gamestext2.json',
  markgame: 'markgame.json',
  ranks: 'ranks.json',
  autohorariosgames: 'autoHorariosGames.json'
};

/**
 * Resolve o nome de um arquivo JSON a partir de um alias, comando ou nome de arquivo.
 * @param {string} nameOrAlias
 * @returns {string} Nome exato do arquivo JSON
 */
function resolveFileName(nameOrAlias) {
  if (!nameOrAlias) return '';
  const clean = String(nameOrAlias).trim().toLowerCase().replace(/\.json$/, '');
  return ALIAS_MAP[clean] || `${clean}.json`;
}

/**
 * Carrega e retorna os dados de um arquivo JSON com cache permanente.
 * Primeira chamada lê do disco (síncrono, rápido), demais retornam da RAM.
 * @param {string} nameOrAlias - Nome ou alias do arquivo JSON
 * @param {any} [defaultValue=null] - Valor padrão se não existir
 * @returns {any} Dados parseados do JSON
 */
export function get(nameOrAlias, defaultValue = null) {
  const fileName = resolveFileName(nameOrAlias);
  if (!fileName) return defaultValue;

  if (cache.has(fileName)) return cache.get(fileName);

  const filePath = path.join(JSON_DIR, fileName);
  try {
    if (!fs.existsSync(filePath)) {
      cache.set(fileName, defaultValue);
      return defaultValue;
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    cache.set(fileName, data);
    return data;
  } catch (error) {
    console.error(`[staticData] Falha ao carregar ${fileName}:`, error.message);
    cache.set(fileName, defaultValue);
    return defaultValue;
  }
}

/**
 * Extrai uma lista (Array) de qualquer formato de JSON.
 * Suporta arrays diretos e objetos com chaves comuns (palavras, frases, etc).
 * @param {any} data
 * @returns {any[]}
 */
function extractList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object') {
    const commonKeys = ['perguntas', 'palavras', 'frases', 'itens', 'items', 'options', 'categorias'];
    for (const key of commonKeys) {
      if (Array.isArray(data[key])) return data[key];
    }
    return Object.values(data);
  }
  return [];
}

/**
 * Obtém todos os itens como Array a partir de um arquivo ou alias.
 * @param {string} nameOrAlias
 * @returns {any[]}
 */
export function getList(nameOrAlias) {
  return extractList(get(nameOrAlias));
}

/**
 * Retorna um item aleatório de uma lista ou categoria.
 * @param {string} nameOrAlias
 * @returns {any|null}
 */
export function getRandom(nameOrAlias) {
  const list = getList(nameOrAlias);
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Retorna informações e estatísticas sobre um arquivo JSON.
 * @param {string} nameOrAlias
 * @returns {{ file: string, type: string, total: number, keys?: string[] }|null}
 */
export function getInfo(nameOrAlias) {
  const fileName = resolveFileName(nameOrAlias);
  const data = get(fileName);
  if (data === null || data === undefined) return null;

  const isArr = Array.isArray(data);
  return {
    file: fileName,
    type: isArr ? 'array' : typeof data,
    total: isArr ? data.length : Object.keys(data).length,
    ...(isArr ? {} : { keys: Object.keys(data) })
  };
}

/**
 * Invalida o cache de um arquivo específico (útil em hot-reload).
 * @param {string} nameOrAlias
 */
export function invalidate(nameOrAlias) {
  const fileName = resolveFileName(nameOrAlias);
  cache.delete(fileName);
}

/** Invalida todo o cache estático. */
export function invalidateAll() {
  cache.clear();
}

export const staticData = {
  get,
  getList,
  getRandom,
  getInfo,
  invalidate,
  invalidateAll,
  resolveFileName,
  ALIAS_MAP
};

export default staticData;
