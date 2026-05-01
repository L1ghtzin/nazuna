/**
 * Índice de Captcha para busca rápida
 * 
 * Este módulo mantém um índice em memória de captchas pendentes
 * mapeando userId -> groupId, evitando varredura de todos os arquivos
 * de grupo a cada mensagem privada.
 * 
 * @author Hiudy
 * @version 1.0.0
 */
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GRUPOS_DIR = path.join(__dirname, '..', '..', 'database', 'grupos');
const INDEX_FILE = path.join(__dirname, '..', '..', 'database', 'captchaIndex.json');


export async function loadCaptchaJson() {
   try {
      const data = await fs.readFile(INDEX_FILE, 'utf-8');
      return JSON.parse(data);
   } catch (err) {
      return {};
   }
}

export async function saveCaptchaJson(data) {
   await fs.writeFile(
      INDEX_FILE,
      JSON.stringify(data, null, 2),
      'utf-8'
   );
}
/**
 * Índice de captchas: Map<userId, { groupId, answer, expiresAt }>
 */
let captchaIndex = new Map(), isInitialized = false, saveTimeout = null;
/**
 * Inicializa o índice de captcha
 * Carrega do arquivo ou reconstrói a partir dos grupos
 */
async function initCaptchaIndex(cb) {
   if (isInitialized) return;
   try {
      // Tenta carregar do arquivo de índice
      if (existsSync(INDEX_FILE)) {
         const data = await fs.readFile(INDEX_FILE, 'utf-8');
         const parsed = JSON.parse(data);
         // Filtra captchas expirados durante o carregamento
         for (const [userId, captchaData] of Object.entries(parsed)) {
            captchaIndex.set(userId, captchaData);
         }

         // console.log(`[CaptchaIndex] Carregado ${captchaIndex.size} captchas pendentes do índice`);
      } else {
         // Reconstrói o índice a partir dos arquivos de grupo
         await rebuildIndex();
      }
   } catch (error) {
      console.error('[CaptchaIndex] Erro ao inicializar:', error.message);
      captchaIndex = new Map();
   } finally {
      // Inicia limpeza periódica de captchas expirados (a cada 5 minutos)
      isInitialized = true;
      setInterval(() => cleanupExpired(cb), 5 * 60 * 1000);
   }
}
/**
 * Reconstrói o índice a partir dos arquivos de grupo
 * Usado na primeira inicialização ou para recuperação
 */
async function rebuildIndex() {
   console.log('[CaptchaIndex] Reconstruindo índice a partir dos grupos...');
   captchaIndex.clear();
   try {
      if (!existsSync(GRUPOS_DIR)) {
         console.log('[CaptchaIndex] Diretório de grupos não existe ainda');
      } else {
         const files = await fs.readdir(GRUPOS_DIR);
         for (const file of files) {
            if (!file.endsWith('.json')) continue;
            try {
               const groupPath = path.join(GRUPOS_DIR, file);
               const content = await fs.readFile(groupPath, 'utf-8');
               const groupData = JSON.parse(content);
               if (groupData.pendingCaptchas && typeof groupData.pendingCaptchas === 'object') {
                  for (const [userId, captchaData] of Object.entries(groupData.pendingCaptchas)) {
                     captchaIndex.set(userId, captchaData);
                  }
               }
            } catch (err) { }
         }
      }
      if (existsSync(INDEX_FILE)) {
         const contentIndex = await fs.readFile(INDEX_FILE, 'utf-8');
         const dataCap = JSON.parse(contentIndex);
         for (const [userId, captchaData] of Object.entries(dataCap)) {
            captchaIndex.set(userId, captchaData);
         }
      }
      console.log(`[CaptchaIndex] Índice reconstruído com ${captchaIndex.size} captchas pendentes`);
   } catch (err) {
      // Ignora arquivos corrompidos
      console.error('[CaptchaIndex] Erro ao reconstruir índice:', err.message);
   }
}
/**
 * Salva o índice em disco (com debounce)
 * @param del - Forçar o salvamento de objetos deletadas
 */
function saveIndex(del = false) {
   // Debounce: aguarda 5 segundos após a última modificação
   if (saveTimeout) {
      clearTimeout(saveTimeout);
   }

   saveTimeout = setTimeout(async () => {
      try {
         const data = Object.fromEntries(captchaIndex);
         let readCap = existsSync(INDEX_FILE) ? await fs.readFile(INDEX_FILE, "utf-8") : {};
         readCap = del ? data : Object.assign(JSON.parse(readCap), data);
         await fs.writeFile(INDEX_FILE, JSON.stringify(readCap, null, '\t'), 'utf-8');
      } catch (error) {
         console.error('[CaptchaIndex] Erro ao salvar índice:', error.message);
      }
   }, 5 * 1000); // 5 * 1000 = 5000
}
/**
 * Adiciona um captcha ao índice
 * @param {Object} obj - Objeto contendo os dados do usuário
 * @param {string} obj.id - ID do usuário (JID)
 * @param {string} obj.lid - LID do usuário (JID)
 * @param {string} obj.participant - ID/LID do usuário (JID)
 * @param {string} groupId - ID do grupo
 * @param {number} answer - Resposta correta do captcha
 * @param {number} expiresAt - Timestamp de expiração
 * @param {string} groupFile - Nome do arquivo do grupo
 * @returns {Map} - Retorna o mapa de captchas atualizados
 */

function normalizeUserId(id) {
   if (!id) return null;
   return id.replace(/@.*/, '');
}



function addCaptcha(obj, groupId, answer, expiresAt, userlid, groupFile = null) {



   const sender = obj.participant || obj.id;

   if (!sender) {

      return captchaIndex;
   }

   const key = sender.replace(/@.*/, '');

   const captchaData = {
      id: obj.id || sender,
      lid: userlid || sender,
      idOrigin: obj.participant || sender,

      groupId,
      answer,
      expiresAt,

      groupFile: groupFile
         ? path.dirname(groupFile)
         : `${groupId.replace('@g.us', '')}.json`
   };

   captchaIndex.set(key, captchaData);

   saveIndex();

   console.log("✅ Captcha salvo:", key);
   console.log("================================\n");

   return captchaIndex;
}


/**
 * Remove um captcha do índice
 * @param {string} userId - ID do usuário
 * @returns {boolean}
 */
function removeCaptcha(userId) {
   if (getCaptcha(userId)) {
      captchaIndex.delete(userId);
      saveIndex(true);
      return true;
   }
   return false;
}
/**
 * Busca captcha pendente para um usuário
 * @param {string} userId - ID do usuário
 * @returns {object|null} - Dados do captcha ou null
 */

function getCaptcha(userId) {
   return captchaIndex.get(userId) || null;
}


function getlidcaptcha(id) {
   if (!id) return null;

   // ✅ proteção principal
   if (!this || !this.data) {
      console.log('❌ getlid: this.data está undefined');
      return null;
   }

   // busca direta
   if (this.data[id]) {
      return this.data[id];
   }

   // busca por LID
   for (const key in this.data) {
      const entry = this.data[key];
      if (!entry) continue;

      const lid = entry.lid?.replace(/@.*/, '');

      if (lid === id) {
         return entry;
      }
   }

   return null;
}
/**
 * Verifica se usuário tem captcha pendente
 * @param {string} userId - ID do usuário
 * @returns {boolean}
 */
function hasPendingCaptcha(userId) {
   return getCaptcha(userId) !== null;
}
/**
 * Limpa captchas expirados
 * @returns {Map}
 */
function cleanupExpired(cb) {
   const now = Date.now();
   let cleaned = 0;
   for (const [userId, captcha] of captchaIndex) {
      if (now >= captcha.expiresAt) {
         cb(captcha);
         captchaIndex.delete(userId);
         cleaned++;
      }
   }
   if (cleaned) {
      console.log(`[CaptchaIndex] Limpeza: ${cleaned} captchas expirados removidos`);
      saveIndex(true);
   }
   return captchaIndex;
}
/**
 * Retorna estatísticas do índice
 */
function getStats() {
   const now = Date.now();
   let expired = 0, active = 0;
   const ids = {};
   for (const captcha of captchaIndex.values()) {
      if (now >= captcha.expiresAt) {
         expired++;
      } else {
         active++;
      }
      ids[captcha.idOrigin] = captcha;
   }
   return {
      total: captchaIndex.size,
      active,
      expired,
      isInitialized,
      ids
   };
}
/**
 * Lista todos os captchas pendentes para um grupo
 * @param {string} groupId - ID do grupo
 * @returns {Array} Lista de userIds com captcha pendente
 */
function getCaptchasForGroup(groupId) {
   const result = [];
   const now = Date.now();
   for (const [userId, captcha] of captchaIndex) {
      if (captcha.groupId === groupId && now <= captcha.expiresAt) {
         result.push(captcha);
      }
   }

   return result;
}
export {
   initCaptchaIndex,
   rebuildIndex,
   addCaptcha,
   removeCaptcha,
   getCaptcha,
   hasPendingCaptcha,
   cleanupExpired,
   getStats,
   getCaptchasForGroup
};

export default {
   init: initCaptchaIndex,
   add: addCaptcha,
   remove: removeCaptcha,
   get: getCaptcha,
   has: hasPendingCaptcha,
   stats: getStats,
   forGroup: getCaptchasForGroup,
   cleanUp: cleanupExpired,
   getlid: getlidcaptcha
};