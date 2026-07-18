// ===================================================================
// DATABASE I/O FACADE (FACHADA UNIFICADA DE PERSISTÊNCIA)
// Único ponto de entrada para leitura/escrita de arquivos JSON do banco.
// Substitui o uso direto de asyncFs.js, helpers.js e _core.js em comandos.
// ===================================================================
//
//  API PÚBLICA:
//   - db.read(file, default?)        -> leitura síncrona com cache TTL 30s (hot path)
//   - db.readAsync(file, default?)   -> leitura assíncrona (não bloqueia event loop)
//   - db.writeSync(file, data)       -> gravação síncrona atômica sem backup
//   - db.writeSafe(file, data)       -> gravação síncrona atômica COM backup automático
//   - db.writeAsync(file, data)      -> gravação assíncrona isolada (cuidado com race conditions)
//   - db.queue(file, data)           -> gravação assíncrona com fila sequencial (workers, background)
//   - db.debounced(file, data, ms?) -> debounce para gravações frequentes (economia, leveling)
//   - db.exists(file)                -> verificação assíncrona de existência
//   - db.existsSync(file)            -> verificação síncrona de existência
//   - db.flush()                     -> força flush de todos os debounces pendentes (shutdown)
//
//  RECOMENDAÇÕES DE USO:
//   - Comandos:        db.read() + db.writeSafe() ou db.writeSync()
//   - Workers/Jobs:    db.queue()
//   - Leveling/Economy: db.debounced()
//   - Boot/Init:       db.readAsync()
// ===================================================================

import { loadJsonFile, loadJsonFileSafe, saveJsonFileSafe, debouncedSaveJson, flushAllDebouncedSaves } from '../helpers/jsonIo.js';
import { writeJsonFile, writeJsonFileQueued } from './_core.js';
import { readJsonFileAsync, writeJsonFileAsync, fileExistsAsync } from '../asyncFs.js';
import { existsSync as fsExistsSync } from 'fs';

const db = {
  read: loadJsonFile,
  readSafe: loadJsonFileSafe,
  readAsync: readJsonFileAsync,
  writeSync: writeJsonFile,
  writeSafe: saveJsonFileSafe,
  writeAsync: writeJsonFileAsync,
  queue: writeJsonFileQueued,
  debounced: debouncedSaveJson,
  exists: fileExistsAsync,
  existsSync: fsExistsSync,
  flush: flushAllDebouncedSaves
};

export {
  loadJsonFile as read,
  loadJsonFileSafe as readSafe,
  readJsonFileAsync as readAsync,
  writeJsonFile as writeSync,
  saveJsonFileSafe as writeSafe,
  writeJsonFileAsync as writeAsync,
  writeJsonFileQueued as queue,
  debouncedSaveJson as debounced,
  fileExistsAsync as exists,
  fsExistsSync as existsSync,
  flushAllDebouncedSaves as flush
};

export default db;
