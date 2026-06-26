APP_NAME = "پنل مدیریت دستیار هوش مصنوعی فروشگاهی"
APP_VERSION = "1.0.0"
APP_ORG = "ChatBotScarf"

PERSIAN_MONTHS = [
    "فروردین", "اردیبهشت", "خرداد",
    "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر",
    "دی", "بهمن", "اسفند"
]

PERSIAN_DAYS = [
    "شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه",
    "چهارشنبه", "پنجشنبه", "جمعه"
]

PERSIAN_DIGITS_MAP = {
    '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴',
    '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹'
}

PRODUCT_CATEGORIES = [
    "پوشاک", "الکترونیک", "خانه و آشپزخانه",
    "ورزشی", "کتاب و لوازم تحریر", "کیف و کفش",
    "اکسسوری", "سایر"
]

SIDEBAR_MENU_ITEMS = [
    ("داشبورد", "dashboard"),
    ("محصولات", "products"),
    ("مدیریت اکسل", "excel"),
    ("تنظیمات ربات", "bot"),
    ("هوش مصنوعی", "ai"),
    ("تنظیمات", "settings")
]

STATUS_STYLES = {
    "active": {"bg": "#27AE60", "text": "فعال"},
    "inactive": {"bg": "#E74C3C", "text": "غیرفعال"},
    "warning": {"bg": "#F39C12", "text": "هشدار"},
    "maintenance": {"bg": "#95A5A6", "text": "تعمیرات"}
}

FILE_FILTERS = {
    "excel": "فایل اکسل (*.xlsx *.xls)",
    "json": "فایل JSON (*.json)",
    "all": "همه فایل‌ها (*.*)"
}

MAX_LOG_ENTRIES = 1000
DEFAULT_WINDOW_SIZE = (1400, 900)
DEFAULT_WINDOW_POSITION = (100, 100)
