export function createFlowTracer(env) {
  return {
    async startTrace(userId, chatId, originalQuery, compressedQuery) {
      const requestId = crypto.randomUUID();

      await env.CHATBOT_DB.prepare(`
        INSERT INTO search_flow_logs (
          request_id, user_id, chat_id, original_query, compressed_query, flow_path
        ) VALUES (?, ?, ?, ?, ?, 'pending')
      `).bind(requestId, userId, chatId, originalQuery, compressedQuery).run().catch(() => {});

      return requestId;
    },

    async logCacheCheck(requestId, hit, latencyMs) {
      await env.CHATBOT_DB.prepare(`
        UPDATE search_flow_logs
        SET cache_checked = 1, cache_hit = ?, cache_latency_ms = ?
        WHERE request_id = ?
      `).bind(hit ? 1 : 0, latencyMs, requestId).run().catch(() => {});
    },

    async logKeywordResult(requestId, score, resultsCount, latencyMs) {
      await env.CHATBOT_DB.prepare(`
        UPDATE search_flow_logs
        SET keyword_checked = 1, keyword_score = ?, keyword_results_count = ?, keyword_latency_ms = ?
        WHERE request_id = ?
      `).bind(score, resultsCount, latencyMs, requestId).run().catch(() => {});
    },

    async logSQLTrigger(requestId) {
      await env.CHATBOT_DB.prepare(`
        UPDATE search_flow_logs
        SET sql_triggered = 1
        WHERE request_id = ?
      `).bind(requestId).run().catch(() => {});
    },

    async logSQLResult(requestId, success, sqlQuery, resultsCount, latencyMs) {
      await env.CHATBOT_DB.prepare(`
        UPDATE search_flow_logs
        SET sql_success = ?, sql_query = ?, sql_results_count = ?, sql_latency_ms = ?
        WHERE request_id = ?
      `).bind(success ? 1 : 0, sqlQuery, resultsCount, latencyMs, requestId).run().catch(() => {});
    },

    async completeTrace(requestId, flowPath, totalLatencyMs, errorMessage = null) {
      await env.CHATBOT_DB.prepare(`
        UPDATE search_flow_logs
        SET flow_path = ?, total_latency_ms = ?, error_message = ?
        WHERE request_id = ?
      `).bind(flowPath, totalLatencyMs, errorMessage, requestId).run().catch(() => {});
    }
  };
}
