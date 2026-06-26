export function createKVStore(kvNamespace) {
  function keyFor(prefix, userId) {
    return `${prefix}:${userId}`;
  }

  return {
    async get(key) {
      try {
        return await kvNamespace.get(key);
      } catch {
        return null;
      }
    },

    async put(key, value, options = {}) {
      try {
        await kvNamespace.put(key, value, options);
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

    async getJson(key) {
      try {
        const val = await kvNamespace.get(key);
        return val ? JSON.parse(val) : null;
      } catch {
        return null;
      }
    },

    async putJson(key, value, options = {}) {
      try {
        await kvNamespace.put(key, JSON.stringify(value), options);
        return true;
      } catch {
        return false;
      }
    },

    async incrementCounter(prefix, userId, max, ttlSeconds) {
      const k = keyFor(prefix, userId);
      const now = Math.floor(Date.now() / 1000);

      try {
        const existing = await kvNamespace.get(k);
        if (existing) {
          const data = JSON.parse(existing);
          if (now - data.resetAt >= 0) {
            const newData = { count: 1, resetAt: now + ttlSeconds };
            await kvNamespace.put(k, JSON.stringify(newData), { expirationTtl: ttlSeconds });
            return { allowed: true, remaining: max - 1, resetAt: newData.resetAt };
          }
          if (data.count >= max) {
            return { allowed: false, remaining: 0, resetAt: data.resetAt };
          }
          data.count += 1;
          await kvNamespace.put(k, JSON.stringify(data), { expirationTtl: ttlSeconds });
          return { allowed: true, remaining: max - data.count, resetAt: data.resetAt };
        }

        const newData = { count: 1, resetAt: now + ttlSeconds };
        await kvNamespace.put(k, JSON.stringify(newData), { expirationTtl: ttlSeconds });
        return { allowed: true, remaining: max - 1, resetAt: newData.resetAt };
      } catch {
        return { allowed: true, remaining: max };
      }
    },

    async checkRateLimit(prefix, userId, intervalSeconds) {
      const k = keyFor(prefix, userId);
      const now = Math.floor(Date.now() / 1000);

      try {
        const existing = await kvNamespace.get(k);
        if (existing) {
          const data = JSON.parse(existing);
          if (now - data.lastRequest < intervalSeconds) {
            const waitFor = intervalSeconds - (now - data.lastRequest);
            return { allowed: false, waitFor };
          }
        }

        await kvNamespace.put(k, JSON.stringify({ lastRequest: now }), { expirationTtl: intervalSeconds });
        return { allowed: true, waitFor: 0 };
      } catch {
        return { allowed: true, waitFor: 0 };
      }
    },

    async getTokenUsage(prefix, userId, maxTokens, ttlSeconds) {
      const k = keyFor(prefix, userId);
      const now = Math.floor(Date.now() / 1000);

      try {
        const existing = await kvNamespace.get(k);
        if (existing) {
          const data = JSON.parse(existing);
          if (now - data.resetAt >= 0) {
            const newData = { used: 0, resetAt: now + ttlSeconds };
            await kvNamespace.put(k, JSON.stringify(newData), { expirationTtl: ttlSeconds });
            return { used: 0, remaining: maxTokens, resetAt: newData.resetAt };
          }
          const remaining = maxTokens - data.used;
          return { used: data.used, remaining: Math.max(0, remaining), resetAt: data.resetAt };
        }

        const newData = { used: 0, resetAt: now + ttlSeconds };
        await kvNamespace.put(k, JSON.stringify(newData), { expirationTtl: ttlSeconds });
        return { used: 0, remaining: maxTokens, resetAt: newData.resetAt };
      } catch {
        return { used: 0, remaining: maxTokens };
      }
    },

    async addTokenUsage(prefix, userId, tokens, maxTokens, ttlSeconds) {
      const k = keyFor(prefix, userId);
      const now = Math.floor(Date.now() / 1000);

      try {
        const existing = await kvNamespace.get(k);
        if (existing) {
          const data = JSON.parse(existing);
          if (now - data.resetAt >= 0) {
            data.used = tokens;
            data.resetAt = now + ttlSeconds;
          } else {
            data.used += tokens;
          }
          const remaining = maxTokens - data.used;
          await kvNamespace.put(k, JSON.stringify(data), { expirationTtl: ttlSeconds });
          return { allowed: remaining >= 0, remaining: Math.max(0, remaining) };
        }

        const newData = { used: tokens, resetAt: now + ttlSeconds };
        await kvNamespace.put(k, JSON.stringify(newData), { expirationTtl: ttlSeconds });
        return { allowed: true, remaining: maxTokens - tokens };
      } catch {
        return { allowed: true, remaining: maxTokens };
      }
    }
  };
}
