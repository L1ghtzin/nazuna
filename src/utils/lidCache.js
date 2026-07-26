import fs from 'fs';
import pathz from 'path';
import { JID_LID_CACHE_FILE } from './paths.js';

const DEBOUNCE_MS = 2000;

class LIDCache {
  constructor() {
    this.pnToLidMap = new Map();
    this.lidToPnMap = new Map();
    this.loaded = false;
    this.saveTimer = null;
    this.filePath = JID_LID_CACHE_FILE;
  }

  scheduleSave() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.flush().catch((err) => {
        console.error('❌ Erro ao salvar cache LID:', err.message);
      });
    }, DEBOUNCE_MS);
  }

  async flush() {
    const mappings = {};
    for (const [pn, lid] of this.pnToLidMap.entries()) {
      mappings[pn] = lid;
    }
    const data = {
      version: '1.0',
      lastUpdate: new Date().toISOString(),
      mappings
    };
    const targetFile = this.filePath || JID_LID_CACHE_FILE;
    const dir = pathz.dirname(targetFile);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
    await fs.promises.writeFile(targetFile, JSON.stringify(data, null, 2), 'utf8');
  }

  async load(customFilePath = null) {
    if (customFilePath) this.filePath = customFilePath;
    if (this.loaded) return;
    this.loaded = true;
    const targetFile = this.filePath || JID_LID_CACHE_FILE;
    try {
      if (fs.existsSync(targetFile)) {
        const raw = await fs.promises.readFile(targetFile, 'utf8');
        const data = JSON.parse(raw);
        const mappings = data.mappings || {};
        for (const [jid, lid] of Object.entries(mappings)) {
          this.pnToLidMap.set(jid, lid);
          this.lidToPnMap.set(lid, jid);
        }
      }
    } catch (e) {
      console.warn('⚠️ Erro ao carregar cache LID:', e.message);
    }
  }

  get(jid) {
    if (!jid) return null;
    const cleanKey = typeof jid === 'string' ? jid.replace(/:[0-9]+/, '') : jid;
    return this.pnToLidMap.get(cleanKey) || this.lidToPnMap.get(cleanKey) || null;
  }

  getJidFromLid(lid) {
    if (!lid) return null;
    const cleanKey = typeof lid === 'string' ? lid.replace(/:[0-9]+/, '') : lid;
    return this.lidToPnMap.get(cleanKey) || null;
  }

  set(jid, lid) {
    if (!jid || !lid) return;
    if (this.pnToLidMap.get(jid) === lid) return;
    this.pnToLidMap.set(jid, lid);
    this.lidToPnMap.set(lid, jid);
    this.scheduleSave();
  }

  entries() {
    return this.pnToLidMap.entries();
  }

  has(jid) {
    return this.pnToLidMap.has(jid) || this.lidToPnMap.has(jid);
  }
}

export const lidCache = new LIDCache();
export default lidCache;

