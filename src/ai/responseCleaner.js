import config from '../config.js';

const GREETINGS_IN_RESPONSE = [
  'سلام', 'درود', 'عرض ادب', 'وقت بخیر', 'وقتتون بخیر',
  'سلام علیکم', 'خوبی', 'چطوری', 'چطورین', 'خوش اومدید'
];

const REPEATED_PATTERNS = [
  /(بله\s*){2,}/gi,
  /(خیلی\s*){2,}/gi,
  /(حتما\s*){2,}/gi,
  /(عالی\s*){2,}/gi,
  /(Very\s*){2,}/gi,
  /(Good\s*){2,}/gi,
];

export function cleanResponse(text) {
  if (!text || typeof text !== 'string') return '';

  let result = text;

  result = removeMarkdown(result);
  result = removeCodeBlocks(result);
  result = removeRepeatedSentences(result);
  result = removeExtraNewlines(result);
  result = removeResponseGreetings(result);
  result = trimToMaxWords(result);
  result = ensurePersianEnding(result);

  return result.trim();
}

function removeMarkdown(text) {
  return text
    .replace(/(\*{1,3}|_{1,3}|~{1,2}|`{1,3})/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/>\s*/g, '')
    .replace(/#{1,6}\s*/g, '')
    .replace(/[-*+]\s+/g, '')
    .replace(/\d+\.\s+/g, '');
}

function removeCodeBlocks(text) {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '');
}

function removeRepeatedSentences(text) {
  const sentences = text.split(/[.!?\n]+/).filter(s => s.trim());
  const seen = new Set();
  const unique = [];

  for (const sentence of sentences) {
    const normalized = sentence.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(sentence.trim());
    }
  }

  let result = unique.join('. ');
  for (const pattern of REPEATED_PATTERNS) {
    result = result.replace(pattern, '');
  }

  return result;
}

function removeExtraNewlines(text) {
  return text.replace(/\n{3,}/g, '\n\n').replace(/\n{2,}/g, '\n');
}

function removeResponseGreetings(text) {
  let result = text;
  for (const greeting of GREETINGS_IN_RESPONSE) {
    const regex = new RegExp(`^${greeting}[\\s,،]+`, 'gi');
    result = result.replace(regex, '');
    const midRegex = new RegExp(`[\\.,!?،؛]\\s*${greeting}[\\s,،]+`, 'gi');
    result = result.replace(midRegex, '. ');
  }
  return result.trim();
}

function trimToMaxWords(text) {
  const words = text.split(/\s+/);
  if (words.length <= config.MAX_RESPONSE_WORDS) return text;
  return words.slice(0, config.MAX_RESPONSE_WORDS).join(' ') + '.';
}

function ensurePersianEnding(text) {
  const endsWithTerminal = /[\.\?!\.\.\.]$/.test(text);
  if (endsWithTerminal) return text;
  return text + '.';
}
