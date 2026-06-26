export function estimateTokens(text) {
  if (!text || typeof text !== 'string') return 0;

  let tokens = 0;
  const segments = text.match(/[a-zA-Z]+|[0-9]+|[\u0600-\u06FF]+|[^\w\s]/g) || [];

  for (const segment of segments) {
    if (/^[\u0600-\u06FF]+$/.test(segment)) {
      tokens += Math.ceil(segment.length / 1.5);
    } else if (/^[a-zA-Z]+$/.test(segment)) {
      tokens += Math.ceil(segment.length / 4);
    } else if (/^\d+$/.test(segment)) {
      tokens += 1;
    } else {
      tokens += 1;
    }
  }

  tokens += (text.split(/\s+/).length - 1) * 0.3;

  return Math.max(1, Math.round(tokens));
}

export function estimateCompletionTokens(words) {
  return Math.ceil(words * 1.5);
}

export function truncateToTokenLimit(text, maxTokens) {
  const estimated = estimateTokens(text);
  if (estimated <= maxTokens) return text;

  const ratio = maxTokens / estimated;
  const charLimit = Math.floor(text.length * ratio);
  return text.slice(0, charLimit);
}
