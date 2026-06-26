import config from '../config.js';

export function timestamp() {
  return Date.now();
}

export function formatDuration(ms) {
  return `${ms.toFixed(0)}ms`;
}

export function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>"'&]/g, '');
}

export function truncate(str, maxLen) {
  if (!str || str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '...';
}

export function validateJson(text) {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function isPersianText(text) {
  const persianRange = /[\u0600-\u06FF]/;
  const latinRange = /[a-zA-Z]/;
  const persianCount = (text.match(persianRange) || []).length;
  const latinCount = (text.match(latinRange) || []).length;
  return persianCount > latinCount;
}

export function normalizeDigits(text) {
  let result = text;
  for (let i = 0; i < 10; i++) {
    result = result.replace(
      new RegExp(config.PERSIAN_DIGITS[i], 'g'),
      config.LATIN_DIGITS[i]
    );
  }
  return result;
}

export function buildResponse(chatId, text) {
  return {
    method: 'sendMessage',
    chat_id: chatId,
    text,
    parse_mode: 'HTML'
  };
}

export async function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function generateKey(...parts) {
  return parts.filter(Boolean).join(':');
}
