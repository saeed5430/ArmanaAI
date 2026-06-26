export function createD1Store(d1Database) {
  return {
    async logEvent(event) {
      try {
        const {
          userId, chatId, model, estimatedTokens, latency,
          cacheHit, error, requestId
        } = event;

        await d1Database.prepare(
          `INSERT INTO logs (user_id, chat_id, model, estimated_tokens, latency_ms, cache_hit, error, request_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          userId || null,
          chatId || null,
          model || null,
          estimatedTokens || 0,
          latency || 0,
          cacheHit ? 1 : 0,
          error || null,
          requestId || null,
          new Date().toISOString()
        ).run();
      } catch {
      }
    },

    async getStats(userId) {
      try {
        const result = await d1Database.prepare(
          `SELECT COUNT(*) as total, AVG(latency_ms) as avg_latency
           FROM logs WHERE user_id = ?`
        ).bind(userId).first();
        return result || { total: 0, avg_latency: 0 };
      } catch {
        return { total: 0, avg_latency: 0 };
      }
    },

    async getRecentErrors(limit = 10) {
      try {
        const result = await d1Database.prepare(
          `SELECT * FROM logs WHERE error IS NOT NULL ORDER BY created_at DESC LIMIT ?`
        ).bind(limit).all();
        return result.results || [];
      } catch {
        return [];
      }
    },

    async init() {
      try {
        await d1Database.prepare(
          `CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            chat_id TEXT,
            model TEXT,
            estimated_tokens INTEGER DEFAULT 0,
            latency_ms INTEGER DEFAULT 0,
            cache_hit INTEGER DEFAULT 0,
            error TEXT,
            request_id TEXT,
            created_at TEXT DEFAULT (datetime('now'))
          )`
        ).run();

        await d1Database.prepare(
          `CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id)`
        ).run();

        await d1Database.prepare(
          `CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at)`
        ).run();

        await d1Database.prepare(
          `CREATE TABLE IF NOT EXISTS search_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            query TEXT NOT NULL,
            method TEXT NOT NULL DEFAULT 'keyword',
            sql_query TEXT,
            score REAL DEFAULT 0,
            results_count INTEGER DEFAULT 0,
            confidence_level TEXT DEFAULT 'none',
            latency_ms INTEGER DEFAULT 0,
            timestamp TEXT DEFAULT (datetime('now'))
          )`
        ).run();

        await d1Database.prepare(
          `CREATE INDEX IF NOT EXISTS idx_search_logs_method ON search_logs(method)`
        ).run();

        await d1Database.prepare(
          `CREATE INDEX IF NOT EXISTS idx_search_logs_timestamp ON search_logs(timestamp)`
        ).run();

        await d1Database.prepare(
          `CREATE TABLE IF NOT EXISTS search_flow_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            request_id TEXT NOT NULL,
            user_id TEXT,
            chat_id TEXT,
            original_query TEXT NOT NULL,
            compressed_query TEXT,
            timestamp TEXT DEFAULT (datetime('now')),
            cache_checked INTEGER DEFAULT 0,
            cache_hit INTEGER DEFAULT 0,
            cache_latency_ms INTEGER DEFAULT 0,
            keyword_checked INTEGER DEFAULT 0,
            keyword_score REAL DEFAULT 0,
            keyword_results_count INTEGER DEFAULT 0,
            keyword_latency_ms INTEGER DEFAULT 0,
            sql_triggered INTEGER DEFAULT 0,
            sql_query TEXT,
            sql_success INTEGER DEFAULT 0,
            sql_results_count INTEGER DEFAULT 0,
            sql_latency_ms INTEGER DEFAULT 0,
            flow_path TEXT NOT NULL,
            total_latency_ms INTEGER DEFAULT 0,
            error_message TEXT
          )`
        ).run();

        await d1Database.prepare(
          `CREATE INDEX IF NOT EXISTS idx_flow_request_id ON search_flow_logs(request_id)`
        ).run();

        await d1Database.prepare(
          `CREATE INDEX IF NOT EXISTS idx_flow_timestamp ON search_flow_logs(timestamp)`
        ).run();

        await d1Database.prepare(
          `CREATE INDEX IF NOT EXISTS idx_flow_path ON search_flow_logs(flow_path)`
        ).run();
      } catch {
      }
    },

    async initFlowLogsTable() {
      try {
        await d1Database.prepare(
          `CREATE TABLE IF NOT EXISTS search_flow_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            request_id TEXT NOT NULL,
            user_id TEXT,
            chat_id TEXT,
            original_query TEXT NOT NULL,
            compressed_query TEXT,
            timestamp TEXT DEFAULT (datetime('now')),
            cache_checked INTEGER DEFAULT 0,
            cache_hit INTEGER DEFAULT 0,
            cache_latency_ms INTEGER DEFAULT 0,
            keyword_checked INTEGER DEFAULT 0,
            keyword_score REAL DEFAULT 0,
            keyword_results_count INTEGER DEFAULT 0,
            keyword_latency_ms INTEGER DEFAULT 0,
            sql_triggered INTEGER DEFAULT 0,
            sql_query TEXT,
            sql_success INTEGER DEFAULT 0,
            sql_results_count INTEGER DEFAULT 0,
            sql_latency_ms INTEGER DEFAULT 0,
            flow_path TEXT NOT NULL,
            total_latency_ms INTEGER DEFAULT 0,
            error_message TEXT
          )`
        ).run();

        await d1Database.prepare(
          `CREATE INDEX IF NOT EXISTS idx_flow_request_id ON search_flow_logs(request_id)`
        ).run();

        await d1Database.prepare(
          `CREATE INDEX IF NOT EXISTS idx_flow_timestamp ON search_flow_logs(timestamp)`
        ).run();

        await d1Database.prepare(
          `CREATE INDEX IF NOT EXISTS idx_flow_path ON search_flow_logs(flow_path)`
        ).run();
      } catch {
      }
    },

    async getFlowLogs(limit = 20) {
      try {
        const result = await d1Database.prepare(
          `SELECT * FROM search_flow_logs ORDER BY timestamp DESC LIMIT ?`
        ).bind(limit).all();
        return result.results || [];
      } catch {
        return [];
      }
    },

    async getFlowStats() {
      try {
        const byPath = await d1Database.prepare(
          `SELECT
            flow_path,
            COUNT(*) as count,
            ROUND(AVG(total_latency_ms)) as avg_latency,
            ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
          FROM search_flow_logs
          WHERE date(timestamp) = date('now')
          GROUP BY flow_path`
        ).all();

        return { byPath: byPath?.results || [] };
      } catch {
        return { byPath: [] };
      }
    },

    async getFlowById(requestId) {
      try {
        return await d1Database.prepare(
          `SELECT * FROM search_flow_logs WHERE request_id = ?`
        ).bind(requestId).first();
      } catch {
        return null;
      }
    },

    async getSearchStats() {
      try {
        const total = await d1Database.prepare(
          `SELECT COUNT(*) as count FROM search_logs`
        ).first();

        const byMethod = await d1Database.prepare(
          `SELECT method, COUNT(*) as count, ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM search_logs), 1) as percentage
           FROM search_logs GROUP BY method`
        ).all();

        const avgConfidence = await d1Database.prepare(
          `SELECT method, ROUND(AVG(score), 2) as avg_score, ROUND(AVG(latency_ms), 0) as avg_latency
           FROM search_logs GROUP BY method`
        ).all();

        return {
          total: total?.count || 0,
          byMethod: byMethod?.results || [],
          avgConfidence: avgConfidence?.results || []
        };
      } catch {
        return { total: 0, byMethod: [], avgConfidence: [] };
      }
    }
  };
}
