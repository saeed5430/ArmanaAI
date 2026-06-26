# Architecture Overview

## System Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Eitaa     │────▶│  Cloudflare      │────▶│  OpenRouter  │
│   User      │◀────│  Worker          │◀────│  AI Models   │
└─────────────┘     └──────────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │              │
               ┌────▼───┐   ┌─────▼────┐
               │   KV   │   │    D1    │
               │ Storage│   │ Database │
               └────────┘   └──────────┘
```

## Request Lifecycle

```
1. Eitaa sends webhook POST → Cloudflare Worker
2. Worker validates request (method, content-type, JSON)
3. Security middleware checks prompt injection
4. Rate limiter checks 3-second interval
5. Request limiter checks 5 requests/day
6. Token limiter checks 1000 tokens/day
7. Message compressor normalizes Persian text
8. Cache lookup (key: compressed question + product version)
9. If cache miss:
   a. Hybrid Search: Keyword Search (5ms) → Score < 0.4 → Text-to-SQL via LLM (1500ms)
   b. Build product context from search results
10. Call OpenRouter with system prompt + user question + product context
11. Response cleaner removes markdown/repetitions
12. Cache the response (1 hour TTL)
13. Send response back to Eitaa
14. Log request + search analytics to D1 database
```

## Module Responsibilities

### Hybrid Search
| Module | Responsibility |
|--------|---------------|
| `textToSQL.js` | Converts Persian questions to SQLite queries via OpenRouter (temp=0.1) |
| `productSearch.js` | Orchestrates keyword → SQL fallback with confidence scoring |
| `search_logs` (D1) | Tracks fallback rate, avg confidence, latency per method |

### Core
| Module | Responsibility |
|--------|---------------|
| `index.js` | Entry point, route handling, env setup |
| `router.js` | Business logic orchestration |
| `config.js` | All configurable constants |

### AI Layer
| Module | Responsibility |
|--------|---------------|
| `openrouter.js` | API calls, timeout, retry, fallback |
| `models.js` | Model priority list, fallback logic |
| `prompt.js` | System/user prompt generation |
| `compressor.js` | Persian text normalization |
| `responseCleaner.js` | Post-processing AI output |

### Middleware
| Module | Responsibility |
|--------|---------------|
| `rateLimit.js` | 3-second interval per user |
| `tokenLimit.js` | 1000 input tokens/day per user |
| `validation.js` | Message and update validation |
| `security.js` | Injection detection, input sanitization |

### Services
| Module | Responsibility |
|--------|---------------|
| `eitaa.js` | Eitaa Bot API client |
| `products.js` | Product dataset & context builder |
| `cache.js` | KV-backed response cache |
| `logger.js` | Structured logging to D1 |

### Database
| Module | Responsibility |
|--------|---------------|
| `kv.js` | KV store abstraction (counters, rate limits, tokens) |
| `d1.js` | D1 database abstraction (logging, stats) |

### Utils
| Module | Responsibility |
|--------|---------------|
| `tokenizer.js` | Token estimation for Persian text |
| `helpers.js` | Shared utility functions |
| `constants.js` | Error messages, patterns, HTTP status codes |

## Data Flow Diagram

```
User Message
    │
    ▼
Validation ──❌──▶ Error Response
    │✅
    ▼
Injection Guard ──❌──▶ Persian Refusal
    │✅
    ▼
Rate Limiter ──❌──▶ "لطفاً کمی صبر کنید"
    │✅
    ▼
Request Limiter ──❌──▶ "محدودیت روزانه"
    │✅
    ▼
Token Limiter ──❌──▶ "محدودیت توکن"
    │✅
    ▼
Compressor ──▶ Normalized Persian Text
    │
    ▼
Cache Lookup ──✅──▶ Cached Response
    │❌
    ▼
Product Context Builder ──▶ Relevant Products
    │
    ▼
OpenRouter Call ──❌──▶ Fallback Model → Error
    │✅
    ▼
Response Cleaner ──▶ Clean Persian Text
    │
    ▼
Cache Store ◀──▶ KV Cache (1h TTL)
    │
    ▼
Send to Eitaa ◀──▶ User
    │
    ▼
Log to D1
```

## KV Namespaces

| Binding | Purpose |
|---------|---------|
| `CHATBOT_KV` | Rate limits, request counters, token usage |
| `CHATBOT_CACHE` | Response cache (1h TTL) |

## D1 Database

Table: `logs`
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `user_id` (TEXT)
- `chat_id` (TEXT)
- `model` (TEXT)
- `estimated_tokens` (INTEGER)
- `latency_ms` (INTEGER)
- `cache_hit` (INTEGER)
- `error` (TEXT)
- `request_id` (TEXT)
- `created_at` (TEXT)

Indexes: `user_id`, `created_at`

## Performance Targets

| Metric | Target |
|--------|--------|
| Average response time | <3 seconds |
| Worker memory | Minimal |
| Cold start | <100ms |
| Average prompt size | <120 tokens |
| Average completion | <60 tokens |
