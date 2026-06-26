const PERSIAN_TO_LATIN = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
};

function toLatinDigits(str) {
  return String(str).replace(/[۰-۹]/g, d => PERSIAN_TO_LATIN[d] || d);
}

const PRODUCTS_DATASET = [
  {
    id: '1',
    name: 'شال ابریشم آبی',
    price: 158000,
    colors: ['آبی', 'سفید', 'مشکی'],
    stock: 12,
    material: 'ابریشم',
    shipping: '3 روز کاری',
    category: 'شال و روسری',
    description: 'شال ابریشم درجه یک با کیفیت عالی'
  },
  {
    id: '2',
    name: 'مانتو کتان مشکی',
    price: 450000,
    colors: ['مشکی', 'سرمه‌ای', 'طوسی'],
    stock: 8,
    material: 'کتان',
    shipping: '5 روز کاری',
    category: 'مانتو',
    description: 'مانتو کتان تابستانه با دوخت حرفه‌ای'
  },
  {
    id: '3',
    name: 'پیراهن نخی سفید',
    price: 220000,
    colors: ['سفید', 'کرم', 'آبی روشن'],
    stock: 15,
    material: 'نخ',
    shipping: '3 روز کاری',
    category: 'پیراهن',
    description: 'پیراهن نخی با طرح ساده و شیک'
  },
  {
    id: '4',
    name: 'شلوار جین زنانه',
    price: 380000,
    colors: ['مشکی', 'آبی', 'خاکستری'],
    stock: 10,
    material: 'جین',
    shipping: '4 روز کاری',
    category: 'شلوار',
    description: 'شلوار جین زنانه با مدل راسته'
  },
  {
    id: '5',
    name: 'کیف چرم دستی',
    price: 520000,
    colors: ['مشکی', 'قهوه‌ای', 'کرم'],
    stock: 5,
    material: 'چرم طبیعی',
    shipping: '5 روز کاری',
    category: 'کیف و اکسسوری',
    description: 'کیف چرم طبیعی با دوخت ظریف'
  },
  {
    id: '6',
    name: 'روسری حریر طرح دار',
    price: 98000,
    colors: ['صورتی', 'بنفش', 'یاسی'],
    stock: 20,
    material: 'حریر',
    shipping: '2 روز کاری',
    category: 'شال و روسری',
    description: 'روسری حریر با طرح‌های زیبا و مدرن'
  },
  {
    id: '7',
    name: 'کت زنانه پاییزی',
    price: 620000,
    colors: ['طوسی', 'مشکی', 'زرشکی'],
    stock: 6,
    material: 'پشم',
    shipping: '6 روز کاری',
    category: 'کت',
    description: 'کت پاییزی با آستر گرم و طراحی شیک'
  },
  {
    id: '8',
    name: 'دامن پلیسه مشکی',
    price: 290000,
    colors: ['مشکی', 'سرمه‌ای'],
    stock: 14,
    material: 'پلی‌استر',
    shipping: '3 روز کاری',
    category: 'دامن',
    description: 'دامن پلیسه شیک مناسب مهمانی'
  },
  {
    id: '9',
    name: 'هودی نخی طرح دار',
    price: 340000,
    colors: ['خاکستری', 'مشکی', 'زرشکی'],
    stock: 11,
    material: 'نخ',
    shipping: '4 روز کاری',
    category: 'هودی و بافت',
    description: 'هودی نخی با طرح چاپی جذاب'
  },
  {
    id: '10',
    name: 'ست شال و کیف مجلسی',
    price: 480000,
    colors: ['طلایی', 'نقره‌ای', 'مشکی'],
    stock: 4,
    material: 'ساتن',
    shipping: '4 روز کاری',
    category: 'ست',
    description: 'ست مجلسی شال و کیف هماهنگ'
  }
];

export function createProductService() {
  let productVersion = '1';

  function setProducts(products) {
    PRODUCTS_DATASET.length = 0;
    PRODUCTS_DATASET.push(...products);
    productVersion = String(Date.now());
  }

  function findRelevantProducts(query) {
    const queryLower = query.toLowerCase();
    const results = PRODUCTS_DATASET.filter(p => {
      const searchText = `${p.name} ${p.category} ${p.description} ${p.material} ${p.colors.join(' ')}`.toLowerCase();
      return searchText.includes(queryLower) ||
             queryLower.split(/\s+/).some(word =>
               word.length > 2 && searchText.includes(word)
             );
    });
    return results.slice(0, 3);
  }

  function getProductById(id) {
    return PRODUCTS_DATASET.find(p => p.id === id) || null;
  }

  function buildProductContext(query) {
    const relevantProducts = findRelevantProducts(query);
    if (relevantProducts.length === 0) return '';

    return relevantProducts.map(p =>
      `کالا: ${p.name}\nقیمت: ${p.price.toLocaleString('fa-IR')} تومان\nرنگ‌ها: ${p.colors.join('، ')}\nموجودی: ${p.stock} عدد\nجنس: ${p.material}\nارسال: ${p.shipping}\nدسته: ${p.category}`
    ).join('\n---\n');
  }

  function getAllProducts() {
    return [...PRODUCTS_DATASET];
  }

  function getVersion() {
    return productVersion;
  }

  return { setProducts, findRelevantProducts, getProductById, buildProductContext, getAllProducts, getVersion };
}
