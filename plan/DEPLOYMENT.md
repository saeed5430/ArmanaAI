# Deployment Guide

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- Cloudflare account with Workers enabled
- OpenRouter API key ([openrouter.ai](https://openrouter.ai))
- Eitaa bot token (create via [Eitaa BotFather](https://eitaa.com/BotFather))

## Step 1: Clone & Install

```bash
git clone <repo-url>
cd chatbot-scarf
npm install
```

## Step 2: Configure Secrets

```bash
# Set OpenRouter API key
wrangler secret put OPENROUTER_API_KEY

# Set Eitaa Bot Token
wrangler secret put EITAA_BOT_TOKEN

# Optional: Custom store name
wrangler secret put STORE_NAME
```

## Step 3: Configure KV & D1

```bash
# Create KV namespaces
wrangler kv:namespace create CHATBOT_KV
wrangler kv:namespace create CHATBOT_CACHE

# Create D1 database
wrangler d1 create chatbot-scarf-db
```

Update `wrangler.toml` with the IDs from the output of these commands.

## Step 4: Initialize D1 Database

```bash
wrangler d1 execute chatbot-scarf-db --command="CREATE TABLE IF NOT EXISTS logs (
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
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);"
```

## Step 5: Deploy

```bash
# Preview deployment
wrangler preview

# Production deployment
wrangler deploy
```

## Step 6: Set Webhook

```bash
# After deployment, set the webhook URL
curl -X POST "https://your-worker.workers.dev/set-webhook?url=https://your-worker.workers.dev/webhook"
```

Or set it temporarily with:
```bash
wrangler secret put ALLOW_SET_WEBHOOK true
# Then visit https://your-worker.workers.dev/set-webhook?url=https://your-worker.workers.dev/webhook
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key |
| `EITAA_BOT_TOKEN` | Yes | Eitaa bot token |
| `STORE_NAME` | No | Custom store name (default: "فروشگاه من") |
| `ALLOW_SET_WEBHOOK` | No | Enable webhook endpoint (default: false) |

## Updating Product Data

Edit `src/services/products.js` and modify the `PRODUCTS_DATASET` array, then redeploy:

```bash
wrangler deploy
```

## Monitoring

- **Logs:** `wrangler tail`
- **Metrics:** Cloudflare Dashboard → Workers → chatbot-scarf
- **D1 Queries:** Cloudflare Dashboard → D1 → chatbot-scarf-db → Console
