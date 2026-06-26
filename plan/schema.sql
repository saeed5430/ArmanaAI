CREATE TABLE IF NOT EXISTS logs (
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
);

CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);

CREATE TABLE IF NOT EXISTS search_logs (
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
);

CREATE INDEX IF NOT EXISTS idx_search_logs_method ON search_logs(method);
CREATE INDEX IF NOT EXISTS idx_search_logs_timestamp ON search_logs(timestamp);

CREATE TABLE IF NOT EXISTS search_flow_logs (
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
);

CREATE INDEX IF NOT EXISTS idx_flow_request_id ON search_flow_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_flow_timestamp ON search_flow_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_flow_path ON search_flow_logs(flow_path);
