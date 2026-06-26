import config from '../config.js';

const SQL_GENERATION_PROMPT = `
شما یک تبدیل‌کننده سوال فارسی به SQLite هستید.

ساختار جدول products:
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT,           -- نام محصول به فارسی
  description TEXT,    -- توضیحات محصول
  price REAL,          -- قیمت به تومان
  discount_price REAL, -- قیمت با تخفیف (می‌تواند NULL باشد)
  category TEXT,       -- دسته‌بندی: شال و روسری/مانتو/پیراهن/شلوار/کیف و اکسسوری/کت/دامن/هودی و بافت/ست
  stock INTEGER,       -- تعداد موجودی
  colors TEXT,         -- رنگ‌ها جدا شده با کاما: "آبی,قرمز,سفید"
  sizes TEXT,          -- سایزها جدا شده با کاما: "M,L,XL"
  material TEXT,       -- جنس: ابریشم/کتان/نخ/جین/چرم/حریر/پشم/پلی‌استر/ساتن
  shipping TEXT,       -- زمان ارسال: "۳ روز کاری"
  is_active INTEGER DEFAULT 1
);

قوانین:
- فقط خروجی SQL معتبر برگردان، بدون هیچ توضیح اضافه
- فقط از SELECT استفاده کن (هرگز INSERT/UPDATE/DELETE)
- برای جستجوی متن از LIKE استفاده کن
- اگر به مفهوم "ارزان" یا "قیمت مناسب" اشاره شد، ORDER BY price ASC
- اگر به مفهوم "گران" اشاره شد، ORDER BY price DESC
- حداکثر ۵ نتیجه برگردان (LIMIT 5)
- از LOWER برای جستجوی فارسی استفاده نکن (فارسی حساس به حروف کوچک/بزرگ نیست)
- برای جستجوی رنگ‌ها از colors LIKE '%رنگ%' استفاده کن
- اگر کاربر در مورد "موجودی" یا "تعداد" پرسید، stock >= مقدار درخواستی
- اگر کاربر "تخفیف" یا "حراج" گفت، discount_price IS NOT NULL
- حتماً WHERE is_active = 1 به شرط‌ها اضافه کن
`;

export async function generateSQL(userQuestion) {
  const response = await fetch(`${config.OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://chatbotscarf.workers.dev',
      'X-Title': 'ChatBotScarf'
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-chat-v2-free',
      messages: [
        { role: 'system', content: SQL_GENERATION_PROMPT },
        { role: 'user', content: `سوال کاربر: "${userQuestion}"\n\nفقط SQL: ` }
      ],
      max_tokens: 200,
      temperature: 0.1
    })
  });

  if (!response.ok) {
    throw new Error(`SQL generation failed: HTTP ${response.status}`);
  }

  const data = await response.json();
  const sql = (data.choices?.[0]?.message?.content || '').trim();

  const cleaned = sql
    .replace(/```sql/gi, '')
    .replace(/```/g, '')
    .trim();

  if (!cleaned.toUpperCase().startsWith('SELECT')) {
    throw new Error('Generated query is not a SELECT statement');
  }

  const dangerous = /DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|TRUNCATE|EXEC|PRAGMA/i;
  if (dangerous.test(cleaned)) {
    throw new Error('Generated query contains dangerous operations');
  }

  return cleaned;
}
