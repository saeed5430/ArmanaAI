import sys
import os
from pathlib import Path
from PySide6.QtWidgets import QApplication, QMessageBox
from PySide6.QtCore import Qt
from PySide6.QtGui import QFont, QFontDatabase

from views.dashboard_view import DashboardView
from utils.theme_manager import ThemeManager
from utils.persian_utils import setup_persian_font
from services.config_service import ConfigService
from services.logger_service import LoggerService


class MainWindow(DashboardView):
    def __init__(self):
        super().__init__()
        self.config_service = ConfigService()
        self.logger = LoggerService()
        self.theme_manager = ThemeManager()

        self.setup_window()
        self.load_settings()

    def setup_window(self):
        self.setWindowTitle("پنل مدیریت دستیار هوش مصنوعی فروشگاهی")
        self.setGeometry(100, 100, 1400, 900)

        setup_persian_font(self)
        theme = self.config_service.get_theme()
        self.theme_manager.apply_theme(theme, self)

        self.show()

    def load_settings(self):
        try:
            self.config_service.load_all_configs()
        except Exception as e:
            self.logger.error(f"Error loading settings: {str(e)}")
            QMessageBox.warning(self, "خطا", "خطا در بارگذاری تنظیمات اولیه")


if __name__ == "__main__":
    app = QApplication(sys.argv)
    app.setLayoutDirection(Qt.RightToLeft)

    if hasattr(Qt, 'HighDpiScaleFactorRoundingPolicy'):
        QApplication.setHighDpiScaleFactorRoundingPolicy(
            Qt.HighDpiScaleFactorRoundingPolicy.PassThrough
        )

    window = MainWindow()
    sys.exit(app.exec())
