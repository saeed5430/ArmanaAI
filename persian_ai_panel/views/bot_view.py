from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
                               QLabel, QLineEdit, QTextEdit, QTimeEdit,
                               QFormLayout, QGroupBox, QScrollArea,
                               QMessageBox, QCheckBox, QListWidget,
                               QListWidgetItem, QSplitter)
from PySide6.QtCore import Qt, QTime
from PySide6.QtGui import QFont

from views.components.modern_button import ModernButton
from views.components.stat_card import StatCard
from viewmodels.bot_vm import BotViewModel


class BotView(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.vm = BotViewModel()
        self.setup_ui()
        self.load_data()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(30, 30, 30, 30)
        layout.setSpacing(20)

        title = QLabel("تنظیمات ربات")
        tf = QFont()
        tf.setPointSize(24)
        tf.setBold(True)
        title.setFont(tf)
        layout.addWidget(title)

        stats_layout = QHBoxLayout()
        self.status_card = StatCard("وضعیت ربات", "❓ نامشخص")
        self.webhook_card = StatCard("Webhook", "❌ تنظیم نشده")
        self.hours_card = StatCard("ساعت کاری", "08:00 - 22:00")
        stats_layout.addWidget(self.status_card)
        stats_layout.addWidget(self.webhook_card)
        stats_layout.addWidget(self.hours_card)
        stats_layout.addStretch()
        layout.addLayout(stats_layout)

        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        form_widget = QWidget()
        form = QFormLayout(form_widget)
        form.setSpacing(12)
        form.setContentsMargins(20, 20, 20, 20)

        self.token_input = QLineEdit()
        self.token_input.setEchoMode(QLineEdit.Password)
        self.token_input.setPlaceholderText("توکن ربات Eitaa")
        form.addRow("توکن ربات:", self.token_input)

        self.webhook_input = QLineEdit()
        self.webhook_input.setPlaceholderText("https://your-worker.workers.dev/webhook")
        form.addRow("آدرس Webhook:", self.webhook_input)

        self.owner_input = QLineEdit()
        self.owner_input.setPlaceholderText("آیدی ادمین اصلی")
        form.addRow("ادمین اصلی:", self.owner_input)

        self.admin_list = QListWidget()
        self.admin_list.setMaximumHeight(100)
        form.addRow("ادمین‌ها:", self.admin_list)

        admin_btn_layout = QHBoxLayout()
        self.add_admin_btn = QPushButton("➕ افزودن")
        self.add_admin_btn.clicked.connect(self.add_admin)
        self.remove_admin_btn = QPushButton("➖ حذف")
        self.remove_admin_btn.clicked.connect(self.remove_admin)
        admin_btn_layout.addWidget(self.add_admin_btn)
        admin_btn_layout.addWidget(self.remove_admin_btn)
        admin_btn_layout.addStretch()
        form.addRow("", admin_btn_layout)

        time_layout = QHBoxLayout()
        self.start_time = QTimeEdit(QTime(8, 0))
        self.end_time = QTimeEdit(QTime(22, 0))
        time_layout.addWidget(QLabel("از"))
        time_layout.addWidget(self.start_time)
        time_layout.addWidget(QLabel("تا"))
        time_layout.addWidget(self.end_time)
        time_layout.addStretch()
        form.addRow("ساعت کاری:", time_layout)

        self.maintenance_check = QCheckBox("حالت تعمیرات")
        form.addRow("", self.maintenance_check)

        self.greeting_input = QTextEdit()
        self.greeting_input.setMaximumHeight(80)
        self.greeting_input.setPlaceholderText("پیام خوش آمدگویی")
        form.addRow("پیام پیش‌فرض:", self.greeting_input)

        self.error_input = QLineEdit()
        self.error_input.setPlaceholderText("پیام خطا")
        form.addRow("پیام خطا:", self.error_input)

        btn_layout = QHBoxLayout()
        self.save_btn = ModernButton("💾 ذخیره تنظیمات")
        self.save_btn.clicked.connect(self.save_config)
        self.test_btn = ModernButton("🧪 تست اتصال", variant="secondary")
        self.test_btn.clicked.connect(self.test_connection)
        btn_layout.addWidget(self.save_btn)
        btn_layout.addWidget(self.test_btn)
        btn_layout.addStretch()
        form.addRow("", btn_layout)

        scroll.setWidget(form_widget)
        layout.addWidget(scroll)

    def load_data(self):
        config = self.vm.load_config()
        self.token_input.setText(config.bot_token)
        self.webhook_input.setText(config.webhook_url)
        self.owner_input.setText(config.owner_id)
        self.maintenance_check.setChecked(config.maintenance_mode)

        self.start_time.setTime(QTime.fromString(config.working_hours_start, "HH:mm"))
        self.end_time.setTime(QTime.fromString(config.working_hours_end, "HH:mm"))
        self.greeting_input.setText(config.default_greeting)
        self.error_input.setText(config.error_message)

        self.admin_list.clear()
        for aid in config.admin_ids:
            self.admin_list.addItem(QListWidgetItem(aid))

        self.update_status()

    def update_status(self):
        info = self.vm.get_status_info()
        self.status_card.update_value("🟢 فعال" if not info["maintenance"] else "🟡 تعمیرات")
        self.webhook_card.update_value("✅ تنظیم شده" if info["webhook_set"] else "❌ تنظیم نشده")
        self.hours_card.update_value(
            f"{'🟢' if info['working_hours'] else '🔴'} "
            f"{info['working_hours_range']}"
        )

    def save_config(self):
        self.vm.config.bot_token = self.token_input.text().strip()
        self.vm.config.webhook_url = self.webhook_input.text().strip()
        self.vm.config.owner_id = self.owner_input.text().strip()
        self.vm.config.maintenance_mode = self.maintenance_check.isChecked()
        self.vm.config.working_hours_start = self.start_time.time().toString("HH:mm")
        self.vm.config.working_hours_end = self.end_time.time().toString("HH:mm")
        self.vm.config.default_greeting = self.greeting_input.toPlainText().strip()
        self.vm.config.error_message = self.error_input.text().strip()

        if self.vm.save_config():
            QMessageBox.information(self, "موفقیت", "تنظیمات ربات ذخیره شد")
            self.update_status()
        else:
            QMessageBox.critical(self, "خطا", "خطا در ذخیره تنظیمات")

    def add_admin(self):
        admin_id = self.owner_input.text().strip()
        if admin_id and admin_id not in self.vm.config.admin_ids:
            self.vm.config.admin_ids.append(admin_id)
            self.admin_list.addItem(QListWidgetItem(admin_id))
            self.admin_list.scrollToBottom()

    def remove_admin(self):
        current = self.admin_list.currentItem()
        if current:
            aid = current.text()
            self.vm.config.admin_ids.remove(aid)
            self.admin_list.takeItem(self.admin_list.row(current))

    def test_connection(self):
        QMessageBox.information(
            self, "تست اتصال",
            "برای تست اتصال، ابتدا worker را مستقر کنید و webhook را تنظیم نمایید."
        )
