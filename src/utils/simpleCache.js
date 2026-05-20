class SimpleCache {
  constructor(defaultTtlMs = 10 * 60 * 1000) {
    this.cache = new Map();
    this.defaultTtlMs = defaultTtlMs;
    
    // Iniciar limpeza periódica (a cada 10 minutos)
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 10 * 60 * 1000);
    
    // Evitar que o timer segure o processo node
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    this.cache.set(key, {
      value,
      expireAt: Date.now() + ttlMs
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return undefined;
    
    if (Date.now() > item.expireAt) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value;
  }

  has(key) {
    return this.get(key) !== undefined; // get already handles expiration
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expireAt) {
        this.cache.delete(key);
      }
    }
  }
}

export default SimpleCache;
