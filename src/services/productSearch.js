import { generateSQL } from '../ai/textToSQL.js';
import config from '../config.js';

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9آ-ی\s]/g, '').trim();
}

function getConfidenceLevel(result) {
  if (!result.found) return 'none';
  if (result.score >= 0.7) return 'high';
  if (result.score >= 0.4) return 'medium';
  if (result.score > 0) return 'low';
  return 'none';
}

function buildContext(products) {
  if (!products || products.length === 0) return '';
  return products.map(p =>
    `کالا: ${p.name}\nقیمت: ${Number(p.price).toLocaleString('fa-IR')} تومان\nرنگ‌ها: ${p.colors || '—'}\nموجودی: ${p.stock || 0} عدد\nجنس: ${p.material || '—'}\nارسال: ${p.shipping || '—'}\nدسته: ${p.category || '—'}`
  ).join('\n---\n');
}

export function createProductSearchService(productService) {
  async function keywordSearch(query) {
    const all = productService.getAllProducts();
    const relevant = productService.findRelevantProducts(query);
    const candidates = relevant.length > 0 ? relevant : all.slice(0, 3);

    if (candidates.length === 0) {
      return { found: false, products: [], score: 0, method: 'keyword' };
    }

    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (queryWords.length === 0) {
      return { found: false, products: [], score: 0, method: 'keyword' };
    }

    const scored = candidates.map(p => {
      const searchText = `${p.name} ${p.category} ${p.description} ${p.material} ${Array.isArray(p.colors) ? p.colors.join(' ') : ''}`.toLowerCase();
      const matches = queryWords.filter(w => searchText.includes(w)).length;
      const exactMatch = searchText.includes(query.toLowerCase());
      return { product: p, score: exactMatch ? 1 : matches / queryWords.length };
    });

    scored.sort((a, b) => b.score - a.score);
    const bestScore = scored[0].score;

    if (bestScore <= 0) {
      return { found: false, products: [], score: 0, method: 'keyword' };
    }

    return {
      found: bestScore > 0,
      products: scored.filter(s => s.score > 0).map(s => s.product).slice(0, 5),
      score: bestScore,
      method: 'keyword'
    };
  }

  async function textToSQLSearch(query, env) {
    try {
      const sqlQuery = await generateSQL(query);
      const { results } = await env.CHATBOT_DB.prepare(sqlQuery).all();

      return {
        found: results.length > 0,
        products: results || [],
        score: results.length > 0 ? 0.9 : 0,
        method: 'text-to-sql',
        sql_query: sqlQuery
      };
    } catch (error) {
      return {
        found: false,
        products: [],
        score: 0,
        method: 'text-to-sql',
        sql_query: null,
        error: error.message
      };
    }
  }

  async function logSearch(userId, query, result, env) {
    try {
      await env.CHATBOT_DB.prepare(`
        INSERT INTO search_logs (user_id, query, method, sql_query, score, results_count, confidence_level, latency_ms, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        userId || null,
        query,
        result.method || 'keyword',
        result.sql_query || null,
        result.score || 0,
        (result.products && result.products.length) || 0,
        result.confidence_level || 'none',
        result.latency || 0
      ).run();
    } catch {
    }
  }

  return {
    async searchProducts(userId, query, env, tracer = null, requestId = null) {
      const cacheKey = `search:${normalize(query)}`;
      const start = Date.now();

      const cached = await env.CHATBOT_CACHE.get(cacheKey).catch(() => null);
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.cacheHit = true;
        parsed.latency = Date.now() - start;
        if (tracer && requestId) {
          await tracer.logCacheCheck(requestId, true, Date.now() - start);
          await tracer.completeTrace(requestId, 'cache', Date.now() - start);
        }
        return parsed;
      }

      const keywordResult = await keywordSearch(query);
      const kwTime = Date.now();
      keywordResult.latency = kwTime - start;
      keywordResult.confidence_level = getConfidenceLevel(keywordResult);

      if (tracer && requestId) {
        await tracer.logCacheCheck(requestId, false, kwTime - start);
        await tracer.logKeywordResult(requestId, keywordResult.score, keywordResult.products.length, kwTime - start);
      }

      if (keywordResult.found && keywordResult.score >= 0.7) {
        await env.CHATBOT_CACHE.put(cacheKey, JSON.stringify(keywordResult), { expirationTtl: config.CACHE_TTL }).catch(() => {});
        logSearch(userId, query, keywordResult, env);
        if (tracer && requestId) {
          await tracer.completeTrace(requestId, 'keyword_high', Date.now() - start);
        }
        return keywordResult;
      }

      if (keywordResult.found && keywordResult.score >= 0.4) {
        logSearch(userId, query, keywordResult, env);
        if (tracer && requestId) {
          await tracer.completeTrace(requestId, 'keyword_medium', Date.now() - start);
        }
        return keywordResult;
      }

      if (tracer && requestId) {
        await tracer.logSQLTrigger(requestId);
      }

      const sqlResult = await textToSQLSearch(query, env);
      const sqlTime = Date.now();
      sqlResult.latency = sqlTime - start;
      sqlResult.confidence_level = getConfidenceLevel(sqlResult);

      if (tracer && requestId) {
        await tracer.logSQLResult(requestId, sqlResult.found, sqlResult.sql_query, sqlResult.products.length, sqlTime - start);
      }

      if (sqlResult.found && sqlResult.score >= 0.7) {
        sqlResult.fallbackUsed = true;
        await env.CHATBOT_CACHE.put(cacheKey, JSON.stringify(sqlResult), { expirationTtl: config.CACHE_TTL }).catch(() => {});
        logSearch(userId, query, sqlResult, env);
        if (tracer && requestId) {
          await tracer.completeTrace(requestId, 'sql', Date.now() - start);
        }
        return sqlResult;
      }

      keywordResult.fallbackTried = true;
      keywordResult.fallbackError = sqlResult.error || null;
      logSearch(userId, query, keywordResult, env);
      if (tracer && requestId) {
        await tracer.completeTrace(requestId, 'failed', Date.now() - start, sqlResult.error || 'Not found');
      }
      return keywordResult;
    },

    buildProductContext(searchResult) {
      if (!searchResult || !searchResult.found) return '';
      return buildContext(searchResult.products);
    }
  };
}
