import config from '../config.js';
import { estimateTokens } from '../utils/tokenizer.js';
import { ERROR_MESSAGES } from '../utils/constants.js';

export function createTokenLimiter(kvStore) {
  return {
    async check(userId, text) {
      const tokens = estimateTokens(text);
      const usage = await kvStore.getTokenUsage('tokens', userId, config.MAX_INPUT_TOKENS, config.RESET_HOURS * 3600);

      if (usage.remaining < tokens) {
        return {
          allowed: false,
          remaining: 0,
          error: ERROR_MESSAGES.TOKEN_LIMIT
        };
      }

      return {
        allowed: true,
        remaining: usage.remaining,
        tokens
      };
    },

    async consume(userId, tokens) {
      return kvStore.addTokenUsage('tokens', userId, tokens, config.MAX_INPUT_TOKENS, config.RESET_HOURS * 3600);
    }
  };
}
