import os
from PySide6.QtWidgets import QWidget
from PySide6.QtGui import QFont, QFontDatabase


def setup_persian_font(widget: QWidget, font_size: int = 12):
    font_path = os.path.join("persian_ai_panel", "assets", "fonts", "Vazirmatn-RD-FD-Regular.ttf")
    if not os.path.exists(font_path):
        font_path = os.path.join("assets", "fonts", "Vazirmatn-RD-FD-Regular.ttf")
    if not os.path.exists(font_path):
        return

    font_id = QFontDatabase.addApplicationFont(font_path)
    if font_id != -1:
        font_family = QFontDatabase.applicationFontFamilies(font_id)[0]
        font = QFont(font_family, font_size)
        widget.setFont(font)


def to_persian_numbers(text: str) -> str:
    persian_digits = {
        '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴',
        '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹'
    }
    result = str(text)
    for eng, per in persian_digits.items():
        result = result.replace(eng, per)
    return result


def to_english_numbers(text: str) -> str:
    persian_digits = {
        '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
        '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
    }
    result = str(text)
    for per, eng in persian_digits.items():
        result = result.replace(per, eng)
    return result


def normalize_persian_text(text: str) -> str:
    if not text:
        return ""
    text = text.replace('ي', 'ی').replace('ك', 'ک')
    text = text.replace('ة', 'ه').replace('ؤ', 'و')
    text = text.replace('إ', 'ا').replace('أ', 'ا')
    text = text.replace('‌', ' ')
    return text.strip()


def format_price(price: float) -> str:
    return to_persian_numbers(f"{int(price):,}")
