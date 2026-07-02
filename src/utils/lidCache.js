import fs from 'fs';
import pathz from 'path';
import { JID_LID_CACHE_FILE } from './paths.js';

const DEBOUNCE_MS = 2000;

class LIDCache {
  constructor() {
    this.store = new Map();
    this.loaded = false;
    this.saveTimer = null;
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
    const mappings = Object.fromEntries(this.store);
    const data = {
      version: '1.0',
      lastUpdate: new Date().toISOString(),
      mappings
    };
    const dir = pathz.dirname(JID_LID_CACHE_FILE);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
    await fs.promises.writeFile(JID_LID_CACHE_FILE, JSON.stringify(data, null, 2), 'utf8');
  }

  async load() {
    if (this.loaded) return;
    this.loaded = true;
    try {
      if (fs.existsSync(JID_LID_CACHE_FILE)) {
        const raw = await fs.promises.readFile(JID_LID_CACHE_FILE, 'utf8');
        const data = JSON.parse(raw);
        const mappings = data.mappings || {};
        for (const [jid, lid] of Object.entries(mappings)) {
          this.store.set(jid, lid);
        }
      }
    } catch (e) {
      console.warn('⚠️ Erro ao carregar cache LID:', e.message);
    }
  }

  get(jid) {
    return this.store.get(jid) || null;
  }

  set(jid, lid) {
    if (this.store.get(jid) === lid) return;
    this.store.set(jid, lid);
    this.scheduleSave();
  }

  entries() {
    return this.store.entries();
  }

  has(jid) {
    return this.store.has(jid);
  }
}

export const lidCache = new LIDCache();
export default lidCache;
