import config from './config.js';
import { createRouter } from './router.js';
import { createD1Store } from './database/d1.js';
import { createProductService } from './services/products.js';
import { createProductSearchService } from './services/productSearch.js';
import { createOpenRouterClient } from './ai/openrouter.js';
import { compressMessage } from './ai/compressor.js';
import { cleanResponse } from './ai/responseCleaner.js';
import { sanitizeInput } from './middleware/security.js';
import { validateRequest } from './middleware/security.js';

export default {
  async fetch(request, env, ctx) {
    try {
      config.OPENROUTER_API_KEY = env.OPENROUTER_API_KEY || '';
      config.EITAA_BOT_TOKEN = env.EITAA_BOT_TOKEN || '';
      if (env.STORE_NAME) config.STORE_NAME = env.STORE_NAME;

      if (!config.OPENROUTER_API_KEY || !config.EITAA_BOT_TOKEN) {
        return new Response(JSON.stringify({
          error: 'Server configuration incomplete'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const url = new URL(request.url);

      if (url.pathname === '/webhook' || url.pathname === '/') {
        const reqValidation = await validateRequest(request);
        if (!reqValidation.valid) {
          return new Response(JSON.stringify({ error: reqValidation.error }), {
            status: reqValidation.status,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const router = createRouter(env);
        const result = await router.handleWebhook(reqValidation.body);

        return new Response(JSON.stringify(result.body), {
          status: result.status,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (url.pathname === '/api/chat' && request.method === 'POST') {
        try {
          const body = await request.json();
          const message = body.message?.trim();
          if (!message) {
            return new Response(JSON.stringify({ error: 'Message is required' }), {
              status: 400, headers: { 'Content-Type': 'application/json' }
            });
          }

          const startTime = Date.now();
          const cleanText = sanitizeInput(message);
          const compressed = compressMessage(cleanText);

          const products = createProductService();
          const productSearch = createProductSearchService(products);
          const searchResult = await productSearch.searchProducts('admin', compressed, env);
          const productContext = productSearch.buildProductContext(searchResult);

          const openrouter = createOpenRouterClient();
          const result = await openrouter.generateResponse(compressed, productContext);

          const response = result.content
            ? cleanResponse(result.content)
            : 'متأسفانه سرویس هوش مصنوعی در حال حاضر در دسترس نیست.';

          return new Response(JSON.stringify({
            response,
            model: result.model || 'unknown',
            latency_ms: Date.now() - startTime,
            search_method: searchResult.method || 'none',
            search_score: searchResult.score || 0,
            compressed,
            tokens: result.estimatedTokens || 0,
            error: result.error || null
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 400, headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      if (url.pathname === '/health') {
        return new Response(JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (url.pathname === '/flow-logs') {
        const d1 = createD1Store(env.CHATBOT_DB);
        const limit = parseInt(url.searchParams.get('limit')) || 20;
        const results = await d1.getFlowLogs(limit);
        return new Response(JSON.stringify(results), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (url.pathname === '/flow-stats') {
        const d1 = createD1Store(env.CHATBOT_DB);
        const stats = await d1.getFlowStats();
        return new Response(JSON.stringify(stats), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (url.pathname.startsWith('/flow/')) {
        const requestId = url.pathname.split('/')[2];
        if (!requestId) {
          return new Response(JSON.stringify({ error: 'Missing request ID' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        const d1 = createD1Store(env.CHATBOT_DB);
        const flow = await d1.getFlowById(requestId);
        if (!flow) {
          return new Response(JSON.stringify({ error: 'Not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return new Response(JSON.stringify(flow), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (url.pathname === '/set-webhook') {
        if (env.ALLOW_SET_WEBHOOK !== 'true') {
          return new Response(JSON.stringify({ error: 'Not allowed' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const webhookUrl = url.searchParams.get('url');
        if (!webhookUrl) {
          return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const { createEitaaClient } = await import('./services/eitaa.js');
        const eitaa = createEitaaClient();
        const result = await eitaa.setWebhook(webhookUrl);

        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Internal server error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
