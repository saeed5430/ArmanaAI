import config from '../config.js';
import { ERROR_MESSAGES } from '../utils/constants.js';

export function createRateLimiter(kvStore) {
  return {
    async check(userId) {
      return kvStore.checkRateLimit('ratelimit', userId, config.RATE_LIMIT_SECONDS);
    }
  };
}

export function createRequestLimiter(kvStore) {
  return {
    async check(userId) {
      return kvStore.incrementCounter('reqlimit', userId, config.MAX_REQUESTS, config.RESET_HOURS * 3600);
    }
  };
}
