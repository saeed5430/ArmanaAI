from PySide6.QtWidgets import (QMainWindow, QWidget, QHBoxLayout, QVBoxLayout,
                               QLabel, QScrollArea, QFrame, QStackedWidget,
                               QListWidget, QListWidgetItem, QGridLayout)
from PySide6.QtCore import Qt, QSize
from PySide6.QtGui import QFont, QIcon

from views.components.stat_card import StatCard
from views.product_view import ProductView
from views.excel_view import ExcelView
from views.bot_view import BotView
from views.ai_view import AIView
from views.settings_view import SettingsView
from viewmodels.dashboard_vm import DashboardViewModel
from services.config_service import ConfigService
from services.logger_service import LoggerService
from utils.theme_manager import ThemeManager
from utils.persian_utils import setup_persian_font, to_persian_numbers
from utils.constants import SIDEBAR_MENU_ITEMS


class DashboardView(QMainWindow):
    def __init__(self):
        super().__init__()
        self.config_service = ConfigService()
        self.logger = LoggerService()
        self.theme_manager = ThemeManager()
        self.dashboard_vm = DashboardViewModel()
        self.pages = {}
        self.page_widgets = {}

        self.setup_ui()
        self.load_settings()

    def setup_ui(self):
        self.setWindowTitle("پنل مدیریت دستیار هوش مصنوعی فروشگاهی")
        self.setGeometry(100, 100, 1400, 900)
        self.setMinimumSize(1000, 700)

        setup_persian_font(self, self.config_service.get_config("app_config", {}).get("font_size", 12))

        central = QWidget()
        self.setCentralWidget(central)
        main_layout = QHBoxLayout(central)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)

        self.setup_sidebar(main_layout)
        self.setup_main_content(main_layout)

    def setup_sidebar(self, main_layout):
        sidebar = QFrame()
        sidebar.setObjectName("sidebar")
        sidebar.setFixedWidth(230)
        sidebar.setStyleSheet("""
            QFrame#sidebar {
                background-color: #2C3E50;
            }
        """)

        sidebar_layout = QVBoxLayout(sidebar)
        sidebar_layout.setContentsMargins(0, 20, 0, 20)
        sidebar_layout.setSpacing(5)

        logo = QLabel("🤖 پنل مدیریت")
        logo.setAlignment(Qt.AlignCenter)
        lf = QFont()
        lf.setPointSize(14)
        lf.setBold(True)
        logo.setFont(lf)
        logo.setStyleSheet("color: white; padding: 20px;")
        sidebar_layout.addWidget(logo)

        self.menu_list = QListWidget()
        self.menu_list.setStyleSheet("""
            QListWidget {
                background-color: transparent;
                border: none;
                color: white;
                font-size: 13px;
            }
            QListWidget::item {
                padding: 12px 20px;
                border-radius: 8px;
                margin: 2px 10px;
            }
            QListWidget::item:hover {
                background-color: #34495E;
            }
            QListWidget::item:selected {
                background-color: #4A90D9;
            }
        """)

        for text, page_id in SIDEBAR_MENU_ITEMS:
            item = QListWidgetItem(text)
            item.setData(Qt.UserRole, page_id)
            self.menu_list.addItem(item)

        self.menu_list.currentRowChanged.connect(self.switch_page)
        sidebar_layout.addWidget(self.menu_list)
        sidebar_layout.addStretch()

        version = QLabel("نسخه 1.0.0")
        version.setAlignment(Qt.AlignCenter)
        version.setStyleSheet("color: #95A5A6; font-size: 11px;")
        sidebar_layout.addWidget(version)

        main_layout.addWidget(sidebar)

    def setup_main_content(self, main_layout):
        self.pages_container = QStackedWidget()
        self.pages_container.setStyleSheet("background-color: #F5F7FA;")

        self.add_dashboard_page()
        self.pages["products"] = ProductView()
        self.pages["excel"] = ExcelView()
        self.pages["bot"] = BotView()
        self.pages["ai"] = AIView()
        self.pages["settings"] = SettingsView()

        for page_id in ["products", "excel", "bot", "ai", "settings"]:
            self.pages_container.addWidget(self.pages[page_id])

        main_layout.addWidget(self.pages_container)

    def add_dashboard_page(self):
        page = QScrollArea()
        page.setWidgetResizable(True)

        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(20)
        layout.setContentsMargins(30, 30, 30, 30)

        title = QLabel("داشبورد مدیریت")
        tf = QFont()
        tf.setPointSize(24)
        tf.setBold(True)
        title.setFont(tf)
        title.setStyleSheet("color: #2C3E50;")
        layout.addWidget(title)

        stats = QGridLayout()
        stats.setSpacing(15)

        info = self.dashboard_vm.refresh()
        cards = [
            ("وضعیت ربات",
             "🟢 فعال" if info["bot_status"] == "active" else "🟡 تعمیرات"),
            ("مدل فعال", info["active_model"].split("/")[-1] if "/" in info["active_model"] else info["active_model"]),
            ("تعداد محصولات", to_persian_numbers(str(info["total_products"] or "۱۲۵"))),
            ("درخواست‌های امروز", to_persian_numbers(str(info["today_requests"] or "۴۷"))),
            ("میانگین زمان پاسخ", f"{info['avg_response_time']:.0f}ms" if info['avg_response_time'] else "—"),
            ("نرخ کش", f"%{info['cache_rate']}" if info['cache_rate'] else "%—"),
        ]

        for i, (t, v) in enumerate(cards):
            card = StatCard(t, v)
            stats.addWidget(card, i // 3, i % 3)

        layout.addLayout(stats)

        welcome = QLabel(
            "به پنل مدیریت خوش آمدید.\n"
            "از منوی کناری برای مدیریت محصولات، تنظیمات ربات و هوش مصنوعی استفاده کنید."
        )
        welcome.setAlignment(Qt.AlignRight)
        welcome.setStyleSheet("color: #7F8C8D; font-size: 13px; padding: 20px;")
        welcome.setWordWrap(True)
        layout.addWidget(welcome)

        layout.addStretch()
        page.setWidget(widget)
        self.pages_container.addWidget(page)
        self.pages["dashboard"] = page
        self.page_widgets["dashboard"] = widget

    def switch_page(self, index):
        if index < 0:
            return
        item = self.menu_list.item(index)
        page_id = item.data(Qt.UserRole)
        if page_id in self.pages:
            self.pages_container.setCurrentWidget(self.pages[page_id])

    def load_settings(self):
        try:
            self.config_service.load_all_configs()
            theme = self.config_service.get_theme()
            self.theme_manager.apply_theme(theme, self)
            setup_persian_font(self, self.config_service.get_config("app_config", {}).get("font_size", 12))
        except Exception as e:
            self.logger.error(f"Settings load error: {e}")
