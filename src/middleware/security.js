import config from '../config.js';
import { ERROR_MESSAGES } from '../utils/constants.js';
import { sanitizeString } from '../utils/helpers.js';

export function detectPromptInjection(text) {
  const patterns = config.PROMPT_INJECTION_PATTERNS;
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      return { detected: true, pattern };
    }
  }
  return { detected: false };
}

export function sanitizeInput(text) {
  return sanitizeString(text);
}

export async function validateRequest(request) {
  if (request.method !== 'POST') {
    return { valid: false, status: 405, error: 'Method not allowed' };
  }

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return { valid: false, status: 400, error: 'Content-Type must be application/json' };
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return { valid: false, status: 400, error: 'Invalid JSON body' };
  }

  if (!body || typeof body !== 'object') {
    return { valid: false, status: 400, error: 'Invalid request body' };
  }

  return { valid: true, body };
}

export function createInjectionGuard() {
  return {
    check(text) {
      const result = detectPromptInjection(text);
      if (result.detected) {
        return {
          blocked: true,
          message: ERROR_MESSAGES.INJECTION_DETECTED
        };
      }
      return { blocked: false };
    }
  };
}
