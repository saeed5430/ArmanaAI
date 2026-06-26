export const ERROR_MESSAGES = {
  EMPTY_MESSAGE: 'لطفاً یک پیام ارسال کنید.',
  TOO_LONG: 'پیام شما بسیار طولانی است. لطفاً کوتاه‌تر بنویسید.',
  RATE_LIMIT: 'لطفاً کمی صبر کنید و سپس دوباره تلاش کنید.',
  REQUEST_LIMIT: 'شما به حداکثر تعداد درخواست‌های روزانه خود رسیده‌اید. فردا دوباره تلاش کنید.',
  TOKEN_LIMIT: 'محدودیت توکن روزانه شما به پایان رسیده است.',
  INJECTION_DETECTED: 'متأسفانه نمی‌توانم به این درخواست پاسخ دهم. لطفاً سؤال خود را مرتبط با محصولات فروشگاه بپرسید.',
  UNSUPPORTED_MEDIA: 'متأسفانه فقط می‌توانم پیام‌های متنی را پردازش کنم.',
  AI_UNAVAILABLE: 'متأسفانه سرویس هوش مصنوعی در حال حاضر در دسترس نیست. لطفاً بعداً تلاش کنید.',
  TIMEOUT: 'مدت زمان پاسخ‌دهی به پایان رسید. لطفاً دوباره تلاش کنید.',
  INTERNAL_ERROR: 'خطایی رخ داده است. لطفاً بعداً تلاش کنید.',
  INVALID_REQUEST: 'درخواست نامعتبر است.',
  PRODUCT_NOT_FOUND: 'اطلاعاتی درباره این محصول یافت نشد.'
};

export const UPDATE_TYPES = {
  MESSAGE: 'message',
  CALLBACK_QUERY: 'callback_query',
  INLINE_QUERY: 'inline_query'
};

export const HEADERS = {
  CONTENT_TYPE: 'application/json',
  USER_AGENT: 'ChatBotScarf/1.0'
};

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500
};

export const PERSIAN_PATTERNS = {
  EMOJI: /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
  PUNCTUATION: /[،\.\!\?\:\;\(\)\[\]\{\}\"\'\،\؛\؟\!\-]/g,
  MULTI_SPACE: /\s+/g,
  PERSIAN_TEXT: /^[\u{0600}-\u{06FF}\s]+$/u,
  PRODUCT_WORDS: /(شال|مانتو|پیراهن|شلوار|کیف|کفش|روسری|مقنعه|چادر|کت|دامن|تیشرت|هودی|بافت|پالتو|کاپشن|لباس|بلوز|سارافون|شومیز|پلیور|شلوارک|ست|اکسسوری|دستبند|گردنبند|گوشواره|ساعت|عینک|کمربند|شال گردن|دستکش)/gi,
  COLORS: /(آبی|قرمز|سبز|زرد|مشکی|سفید|قهوه‌ای|خاکستری|صورتی|بنفش|نارنجی|طوسی|کرم|بژ|نقره‌ای|طلایی|سرمه‌ای|زرشکی|یاسی|فیروزه‌ای|شیری|عسلی|خردلی|نیلی|عنابی)/gi,
  SIZES: /\b(\d{1,3}\s*(سانت|سانتی|متر|میلی|عدد|تعداد|کیلو|گرم|لیتر|تایی|زوج|جفت|سایز|سایز\s*[A-Za-z0-9]|M|L|XL|XXL|XXXL|S|F|یک|دو|سه|چهار|پنج|۶|۷|۸|۹|۱۰|۱|۲|۳|۴|۵))|\b(S|M|L|XL|XXL|XXXL|F)\b/gi,
  PERSIAN_NUMBERS: /[۰-۹]/g
};
