import config from '../config.js';
import { generateSystemPrompt, generateUserPrompt } from './prompt.js';
import { getCurrentModel, fallbackToNextModel, shouldRetry, isTimeoutError, isUnavailableError, resetModelIndex } from './models.js';
import { sleep } from '../utils/helpers.js';
import { estimateTokens } from '../utils/tokenizer.js';

export function createOpenRouterClient() {
  async function callModel(systemPrompt, userPrompt, model) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.MODEL_TIMEOUT);

    try {
      const response = await fetch(`${config.OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://chatbotscarf.workers.dev',
          'X-Title': 'ChatBotScarf'
        },
        body: JSON.stringify({
          model: model.id,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 100,
          temperature: 0.7,
          top_p: 0.9
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        return {
          success: false,
          status: response.status,
          error: errorBody || `HTTP ${response.status}`,
          model: model.id
        };
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        return {
          success: false,
          status: 500,
          error: 'Invalid response structure',
          model: model.id
        };
      }

      return {
        success: true,
        content: data.choices[0].message.content || '',
        model: data.model || model.id,
        usage: data.usage || {}
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        return {
          success: false,
          status: 408,
          error: 'Request timeout',
          model: model.id
        };
      }

      return {
        success: false,
        status: 0,
        error: error.message || 'Unknown error',
        model: model.id
      };
    }
  }

  return {
    async generateResponse(question, productContext) {
      const systemPrompt = generateSystemPrompt();
      const userPrompt = generateUserPrompt(question, productContext);
      const estimatedTokens = estimateTokens(systemPrompt) + estimateTokens(userPrompt);

      resetModelIndex();
      let lastError = null;

      for (let attempt = 0; attempt < config.RETRY_MAX; attempt++) {
        const model = getCurrentModel();
        if (!model) break;

        const result = await callModel(systemPrompt, userPrompt, model);

        if (result.success) {
          return {
            content: result.content,
            model: result.model,
            estimatedTokens,
            usage: result.usage
          };
        }

        lastError = result;

        if (isTimeoutError({ message: result.error }) || isUnavailableError({ message: result.error }) || shouldRetry(result.status)) {
          const nextModel = fallbackToNextModel();
          if (nextModel && attempt < config.RETRY_MAX - 1) {
            await sleep(config.RETRY_DELAY);
            continue;
          }
        }

        if (attempt < config.RETRY_MAX - 1) {
          await sleep(config.RETRY_DELAY * (attempt + 1));
        }
      }

      return {
        success: false,
        error: lastError?.error || 'All models failed',
        estimatedTokens
      };
    }
  };
}
