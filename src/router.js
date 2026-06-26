import { createEitaaClient } from './services/eitaa.js';
import { createOpenRouterClient } from './ai/openrouter.js';
import { createProductService } from './services/products.js';
import { createProductSearchService } from './services/productSearch.js';
import { createCacheService } from './services/cache.js';
import { createLogger } from './services/logger.js';
import { createFlowTracer } from './services/flowTracer.js';
import { createRateLimiter, createRequestLimiter } from './middleware/rateLimit.js';
import { createTokenLimiter } from './middleware/tokenLimit.js';
import { validateMessage, validateUpdate } from './middleware/validation.js';
import { createInjectionGuard, sanitizeInput } from './middleware/security.js';
import { compressMessage } from './ai/compressor.js';
import { cleanResponse } from './ai/responseCleaner.js';
import { ERROR_MESSAGES } from './utils/constants.js';
import { buildResponse, timestamp } from './utils/helpers.js';
import { estimateTokens } from './utils/tokenizer.js';

export function createRouter(env) {
  const eitaa = createEitaaClient();
  const openrouter = createOpenRouterClient();
  const products = createProductService();
  const productSearch = createProductSearchService(products);
  const cache = createCacheService(env.CHATBOT_CACHE);
  const kvStore = env.CHATBOT_KV;
  const d1Store = env.CHATBOT_DB;
  const logger = createLogger(d1Store);
  const rateLimiter = createRateLimiter(kvStore);
  const requestLimiter = createRequestLimiter(kvStore);
  const tokenLimiter = createTokenLimiter(kvStore);
  const injectionGuard = createInjectionGuard();

  async function handleWebhook(body) {
    const updateValidation = validateUpdate(body);
    if (!updateValidation.valid) {
      if (updateValidation.skip) {
        return { status: 200, body: { ok: true, skipped: true } };
      }
      return { status: 200, body: { ok: false, error: updateValidation.error } };
    }

    const update = eitaa.parseUpdate(body);
    if (!update) {
      return { status: 200, body: { ok: false, error: ERROR_MESSAGES.INVALID_REQUEST } };
    }

    const { chatId, userId, text } = update;
    const startTime = timestamp();

    const msgValidation = validateMessage(text);
    if (!msgValidation.valid) {
      await eitaa.sendMessage(chatId, msgValidation.error);
      return { status: 200, body: { ok: true } };
    }

    const cleanText = sanitizeInput(msgValidation.text);

    const injectionCheck = injectionGuard.check(cleanText);
    if (injectionCheck.blocked) {
      await eitaa.sendMessage(chatId, injectionCheck.message);
      return { status: 200, body: { ok: true, blocked: true } };
    }

    const rateCheck = await rateLimiter.check(userId);
    if (!rateCheck.allowed) {
      await eitaa.sendMessage(chatId, ERROR_MESSAGES.RATE_LIMIT);
      return { status: 200, body: { ok: true, limited: true } };
    }

    const requestCheck = await requestLimiter.check(userId);
    if (!requestCheck.allowed) {
      await eitaa.sendMessage(chatId, ERROR_MESSAGES.REQUEST_LIMIT);
      return { status: 200, body: { ok: true, limited: true } };
    }

    const tokenCheck = await tokenLimiter.check(userId, cleanText);
    if (!tokenCheck.allowed) {
      await eitaa.sendMessage(chatId, tokenCheck.error);
      return { status: 200, body: { ok: true, limited: true } };
    }

    await eitaa.sendTyping(chatId);

    const compressed = compressMessage(cleanText);
    const tracer = createFlowTracer(env);
    const requestId = await tracer.startTrace(userId, chatId, cleanText, compressed);
    const productVersion = products.getVersion();
    const cacheKey = cache.buildKey(compressed, productVersion);

    const cacheStart = Date.now();
    const cachedResponse = await cache.get(cacheKey);
    const cacheLatency = Date.now() - cacheStart;
    await tracer.logCacheCheck(requestId, !!cachedResponse, cacheLatency);

    if (cachedResponse) {
      await eitaa.sendMessage(chatId, cachedResponse);
      const latency = timestamp() - startTime;
      await tracer.completeTrace(requestId, 'cache', Date.now() - startTime);
      await logger.logRequest(userId, chatId, 'cache', estimateTokens(cleanText), latency, true);
      return { status: 200, body: { ok: true, cached: true } };
    }

    const searchResult = await productSearch.searchProducts(userId, compressed, env, tracer, requestId);
    const productContext = productSearch.buildProductContext(searchResult);

    const result = await openrouter.generateResponse(compressed, productContext);
    const aiTime = Date.now();

    if (!result.content) {
      await eitaa.sendMessage(chatId, ERROR_MESSAGES.AI_UNAVAILABLE);
      const latency = timestamp() - startTime;
      await tracer.completeTrace(requestId, 'failed', Date.now() - startTime, result.error || 'AI unavailable');
      await logger.logRequest(userId, chatId, result.model || 'none', result.estimatedTokens || 0, latency, false, result.error || 'AI unavailable');
      return { status: 200, body: { ok: false, error: result.error } };
    }

    const cleaned = cleanResponse(result.content);
    const finalResponse = cleaned || ERROR_MESSAGES.AI_UNAVAILABLE;

    await cache.set(cacheKey, finalResponse);

    await tokenLimiter.consume(userId, tokenCheck.tokens);

    await eitaa.sendMessage(chatId, finalResponse);

    const latency = timestamp() - startTime;
    await tracer.completeTrace(requestId, searchResult.method === 'text-to-sql' ? 'sql' : 'keyword_high', Date.now() - startTime);
    await logger.logRequest(userId, chatId, result.model, result.estimatedTokens, latency, false);

    return { status: 200, body: { ok: true } };
  }

  return { handleWebhook };
}
