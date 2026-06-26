import config from '../config.js';

export function createCacheService(kvNamespace) {
  return {
    async get(key) {
      try {
        return await kvNamespace.get(key);
      } catch {
        return null;
      }
    },

    async set(key, value) {
      try {
        await kvNamespace.put(key, value, {
          expirationTtl: config.CACHE_TTL
        });
        return true;
      } catch {
        return false;
      }
    },

    async delete(key) {
      try {
        await kvNamespace.delete(key);
        return true;
      } catch {
        return false;
      }
    },

    buildKey(question, productVersion) {
      const normalized = question.trim().toLowerCase().replace(/\s+/g, ' ');
      return `cache:${normalized}:${productVersion}`;
    }
  };
}
