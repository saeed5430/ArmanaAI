export function createLogger(d1Store) {
  return {
    async log(event) {
      if (d1Store) {
        await d1Store.logEvent(event).catch(() => {});
      }
    },

    async logRequest(userId, chatId, model, estimatedTokens, latency, cacheHit, error) {
      const event = {
        userId,
        chatId,
        model: model || 'none',
        estimatedTokens: estimatedTokens || 0,
        latency: latency || 0,
        cacheHit: cacheHit || false,
        error: error || null,
        requestId: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
      };

      if (d1Store) {
        await d1Store.logEvent(event).catch(() => {});
      }

      return event;
    }
  };
}
