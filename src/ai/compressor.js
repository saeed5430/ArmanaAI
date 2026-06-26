import config from '../config.js';

export function compressMessage(text) {
  if (!text || typeof text !== 'string') return '';

  let result = text;

  result = removeEmojis(result);
  result = normalizePersian(result);
  result = normalizeDigits(result);
  result = removePunctuation(result);
  result = removeFillerWords(result);
  result = removeGreetings(result);
  result = removeThanks(result);
  result = removeRepeatedWords(result);
  result = collapseWhitespace(result);
  result = result.trim();

  const productInfo = preserveProductInfo(text);
  if (productInfo && result.length < productInfo.length) {
    result = productInfo;
  }

  return result;
}

function removeEmojis(text) {
  return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, '');
}

function normalizePersian(text) {
  let result = text;
  for (const [from, to] of Object.entries(config.PERSIAN_NORMALIZE)) {
    result = result.replace(new RegExp(from, 'g'), to);
  }
  return result;
}

function normalizeDigits(text) {
  let result = text;
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(config.PERSIAN_DIGITS[i], 'g'), config.LATIN_DIGITS[i]);
  }
  return result;
}

function removePunctuation(text) {
  return text.replace(/[،\.\!\?\:\;\(\)\[\]\{\}\"\'\،\؛\؟\!\-_#@$%^&*+=<>~\`]/g, ' ');
}

function removeFillerWords(text) {
  let result = text;
  for (const word of config.FILLER_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    result = result.replace(regex, '');
  }
  return result;
}

function removeGreetings(text) {
  const greetingPatterns = [
    /\b(سلام|درود|عرض ادب|ارادتمند|احوال\s*شما)\s*(علیکم|خوبی|چطوری|چطورین|چطورید|دارین|دارید)?\b/gi,
    /(وقت\s*شما\s*به\s*خیر|صبح\s*شما\s*به\s*خیر|عصر\s*شما\s*به\s*خیر|شب\s*شما\s*به\s*خیر)/gi,
    /(سلام\s*علیکم|سلام\s*خوبین|سلام\s*چطوری)/gi
  ];
  let result = text;
  for (const pattern of greetingPatterns) {
    result = result.replace(pattern, '');
  }
  return result;
}

function removeThanks(text) {
  const thanksPatterns = [
    /\b(ممنون|مرسی|تشکر|سپاس|متشکرم|تشکر\s*فراوان|ممنونم|سپاسگزارم|خواهش\s*می کنم)\b/gi,
    /(ممنون\s*از\s*شما|سپاس\s*از\s*لطفتون)/gi
  ];
  let result = text;
  for (const pattern of thanksPatterns) {
    result = result.replace(pattern, '');
  }
  return result;
}

function removeRepeatedWords(text) {
  const words = text.split(/\s+/);
  const seen = new Set();
  const unique = [];

  for (const word of words) {
    const lower = word.toLowerCase();
    if (!seen.has(lower) || word.length <= 1) {
      seen.add(lower);
      unique.push(word);
    }
  }

  return unique.join(' ');
}

function collapseWhitespace(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function preserveProductInfo(text) {
  const patterns = [
    /(شال|مانتو|پیراهن|شلوار|کیف|کفش|روسری|مقنعه|چادر|کت|دامن|تیشرت|هودی|بافت|پالتو|کاپشن|لباس|بلوز|سارافون|شومیز|پلیور|شلوارک|ست|اکسسوری|دستبند|گردنبند|گوشواره|ساعت|عینک|کمربند|شال گردن|دستکش)/gi,
    /(آبی|قرمز|سبز|زرد|مشکی|سفید|قهوه‌ای|خاکستری|صورتی|بنفش|نارنجی|طوسی|کرم|بژ|نقره‌ای|طلایی|سرمه‌ای|زرشکی|یاسی|فیروزه‌ای|شیری|عسلی|خردلی|نیلی|عنابی)/gi,
    /(سایز|اندازه|عدد|تومان|قیمت|موجودی|ارسال|تحویل|سفارش|خرید|قیمتش|چنده|چقدر)/gi,
    /موجود(ه|ی)?/gi
  ];

  const matches = [];
  for (const pattern of patterns) {
    const found = text.match(pattern);
    if (found) {
      matches.push(...found);
    }
  }

  if (matches.length === 0) return '';

  return [...new Set(matches.map(m => m.trim()))].join(' ');
}
