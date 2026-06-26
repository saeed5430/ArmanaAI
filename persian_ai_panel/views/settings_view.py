import sys
from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
                               QLabel, QLineEdit, QComboBox, QSpinBox,
                               QFormLayout, QGroupBox, QScrollArea,
                               QMessageBox, QCheckBox, QFileDialog,
                               QListWidget, QListWidgetItem)
from PySide6.QtCore import Qt
from PySide6.QtGui import QFont

from views.components.modern_button import ModernButton
from viewmodels.settings_vm import SettingsViewModel
from utils.theme_manager import ThemeManager


class SettingsView(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.vm = SettingsViewModel()
        self.theme_manager = ThemeManager()
        self.setup_ui()
        self.load_data()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(30, 30, 30, 30)
        layout.setSpacing(20)

        title = QLabel("تنظیمات")
        tf = QFont()
        tf.setPointSize(24)
        tf.setBold(True)
        title.setFont(tf)
        layout.addWidget(title)

        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        form_widget = QWidget()
        form = QFormLayout(form_widget)
        form.setSpacing(12)
        form.setContentsMargins(20, 20, 20, 20)

        general_group = QGroupBox("تنظیمات عمومی")
        general_layout = QFormLayout(general_group)

        self.app_name_input = QLineEdit()
        general_layout.addRow("نام برنامه:", self.app_name_input)

        self.language_input = QComboBox()
        self.language_input.addItems(["فارسی", "English"])
        general_layout.addRow("زبان:", self.language_input)

        self.theme_input = QComboBox()
        self.theme_input.addItems(["روشن", "تاریک"])
        self.theme_input.currentTextChanged.connect(self.on_theme_change)
        general_layout.addRow("تم:", self.theme_input)

        self.font_size_input = QSpinBox()
        self.font_size_input.setRange(8, 24)
        general_layout.addRow("سایز فونت:", self.font_size_input)

        self.auto_save_input = QSpinBox()
        self.auto_save_input.setRange(0, 3600)
        self.auto_save_input.setSuffix(" ثانیه")
        self.auto_save_input.setSpecialValueText("غیرفعال")
        general_layout.addRow("ذخیره خودکار:", self.auto_save_input)

        self.notification_check = QCheckBox("فعالسازی اعلان‌ها")
        general_layout.addRow("", self.notification_check)

        self.debug_check = QCheckBox("حالت اشکال‌زدایی")
        general_layout.addRow("", self.debug_check)

        form.addRow(general_group)

        backup_group = QGroupBox("پشتیبان‌گیری")
        backup_layout = QVBoxLayout(backup_group)

        backup_btn_layout = QHBoxLayout()
        self.backup_btn = ModernButton("📦 ایجاد نسخه پشتیبان")
        self.backup_btn.clicked.connect(self.create_backup)
        self.restore_btn = ModernButton("📂 بازیابی از پشتیبان", variant="secondary")
        self.restore_btn.clicked.connect(self.restore_backup)
        backup_btn_layout.addWidget(self.backup_btn)
        backup_btn_layout.addWidget(self.restore_btn)
        backup_btn_layout.addStretch()
        backup_layout.addLayout(backup_btn_layout)

        self.backup_list = QListWidget()
        self.backup_list.setMaximumHeight(120)
        backup_layout.addWidget(self.backup_list)

        form.addRow(backup_group)

        info_group = QGroupBox("اطلاعات سیستم")
        info_layout = QFormLayout(info_group)

        self.version_label = QLabel()
        info_layout.addRow("نسخه:", self.version_label)

        self.python_label = QLabel()
        info_layout.addRow("Python:", self.python_label)

        self.theme_label = QLabel()
        info_layout.addRow("تم فعلی:", self.theme_label)

        form.addRow(info_group)

        btn_layout = QHBoxLayout()
        self.save_btn = ModernButton("💾 ذخیره تنظیمات")
        self.save_btn.clicked.connect(self.save_settings)
        btn_layout.addWidget(self.save_btn)
        btn_layout.addStretch()
        form.addRow("", btn_layout)

        scroll.setWidget(form_widget)
        layout.addWidget(scroll)

    def load_data(self):
        settings = self.vm.load_settings()
        self.app_name_input.setText(settings.get("app_name", ""))
        self.language_input.setCurrentText(
            "English" if settings.get("language") == "en" else "فارسی"
        )
        self.theme_input.setCurrentText(
            "تاریک" if settings.get("theme") == "dark" else "روشن"
        )
        self.font_size_input.setValue(settings.get("font_size", 12))
        self.auto_save_input.setValue(settings.get("auto_save_interval", 300))
        self.notification_check.setChecked(settings.get("enable_notifications", True))
        self.debug_check.setChecked(settings.get("debug_mode", False))

        info = self.vm.get_system_info()
        self.version_label.setText(info.get("app_version", "1.0.0"))
        self.python_label.setText(info.get("python_version", "").split()[0])
        self.theme_label.setText("روشن" if info.get("theme") == "light" else "تاریک")

        self.load_backup_list()

    def load_backup_list(self):
        self.backup_list.clear()
        backups = self.vm.list_backups()
        for b in backups[:10]:
            item = QListWidgetItem(
                f"{b['name']} - {b['created'].strftime('%Y-%m-%d %H:%M')}"
            )
            item.setData(Qt.UserRole, b['path'])
            self.backup_list.addItem(item)

    def on_theme_change(self, theme_text):
        theme = "dark" if theme_text == "تاریک" else "light"
        self.theme_manager.apply_theme(theme, self.window())

    def save_settings(self):
        settings = {
            "app_name": self.app_name_input.text().strip(),
            "language": "en" if self.language_input.currentText() == "English" else "fa",
            "theme": "dark" if self.theme_input.currentText() == "تاریک" else "light",
            "font_size": self.font_size_input.value(),
            "auto_save_interval": self.auto_save_input.value(),
            "enable_notifications": self.notification_check.isChecked(),
            "debug_mode": self.debug_check.isChecked()
        }

        if self.vm.save_settings(settings):
            QMessageBox.information(self, "موفقیت", "تنظیمات ذخیره شد")
        else:
            QMessageBox.critical(self, "خطا", "خطا در ذخیره تنظیمات")

    def create_backup(self):
        path = self.vm.create_backup()
        if path:
            QMessageBox.information(self, "موفقیت", f"پشتیبان در:\n{path}")
            self.load_backup_list()
        else:
            QMessageBox.warning(self, "خطا", "خطا در ایجاد پشتیبان")

    def restore_backup(self):
        current = self.backup_list.currentItem()
        if not current:
            QMessageBox.warning(self, "خطا", "یک پشتیبان را انتخاب کنید")
            return

        reply = QMessageBox.question(
            self, "تأیید", "آیا از بازیابی این نسخه اطمینان دارید؟"
        )
        if reply == QMessageBox.Yes:
            backup_path = current.data(Qt.UserRole)
            self.vm.backup_service.restore_backup(backup_path, "persian_ai_panel/config")
            QMessageBox.information(self, "موفقیت", "تنظیمات بازیابی شد")
            self.load_data()
