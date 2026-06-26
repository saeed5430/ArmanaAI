import config from '../config.js';
import { ERROR_MESSAGES } from '../utils/constants.js';

export function validateMessage(text) {
  if (!text || typeof text !== 'string') {
    return { valid: false, error: ERROR_MESSAGES.EMPTY_MESSAGE };
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: ERROR_MESSAGES.EMPTY_MESSAGE };
  }

  if (trimmed.length > config.MAX_MESSAGE_LENGTH) {
    return { valid: false, error: ERROR_MESSAGES.TOO_LONG };
  }

  return { valid: true, text: trimmed };
}

export function validateUpdate(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: ERROR_MESSAGES.INVALID_REQUEST };
  }

  if (body.callback_query) {
    return { valid: false, skip: true };
  }

  if (body.inline_query) {
    return { valid: false, skip: true };
  }

  if (!body.message) {
    return { valid: false, skip: true };
  }

  const msg = body.message;

  if (!msg.text && !msg.caption) {
    if (msg.photo || msg.video || msg.document || msg.audio || msg.voice || msg.sticker) {
      return { valid: false, error: ERROR_MESSAGES.UNSUPPORTED_MEDIA };
    }
    return { valid: false, skip: true };
  }

  return { valid: true };
}
