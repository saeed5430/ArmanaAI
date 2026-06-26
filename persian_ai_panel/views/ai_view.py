from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
                               QLabel, QLineEdit, QTextEdit, QComboBox,
                               QFormLayout, QGroupBox, QScrollArea,
                               QMessageBox, QSpinBox, QDoubleSpinBox,
                               QListWidget, QListWidgetItem, QCheckBox,
                               QSplitter, QSlider)
from PySide6.QtCore import Qt
from PySide6.QtGui import QFont

from views.components.modern_button import ModernButton
from views.components.stat_card import StatCard
from viewmodels.ai_vm import AIViewModel
from utils.persian_utils import to_persian_numbers


class AIView(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.vm = AIViewModel()
        self.setup_ui()
        self.load_data()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(30, 30, 30, 30)
        layout.setSpacing(20)

        title = QLabel("تنظیمات هوش مصنوعی")
        tf = QFont()
        tf.setPointSize(24)
        tf.setBold(True)
        title.setFont(tf)
        layout.addWidget(title)

        stats_layout = QHBoxLayout()
        self.model_count_card = StatCard("مدل‌های فعال", "۰")
        self.default_card = StatCard("مدل پیش‌فرض", "تنظیم نشده")
        self.temp_card = StatCard("دمای مدل", "۰.۷")
        stats_layout.addWidget(self.model_count_card)
        stats_layout.addWidget(self.default_card)
        stats_layout.addWidget(self.temp_card)
        stats_layout.addStretch()
        layout.addLayout(stats_layout)

        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        form_widget = QWidget()
        form = QFormLayout(form_widget)
        form.setSpacing(12)
        form.setContentsMargins(20, 20, 20, 20)

        model_group = QGroupBox("مدل‌های هوش مصنوعی")
        model_group_layout = QVBoxLayout(model_group)

        self.model_list = QListWidget()
        self.model_list.currentRowChanged.connect(self.on_model_selected)
        model_group_layout.addWidget(self.model_list)

        model_btn_layout = QHBoxLayout()
        self.toggle_model_btn = ModernButton("🔄 فعال/غیرفعال", variant="warning")
        self.toggle_model_btn.clicked.connect(self.toggle_model)
        self.set_default_btn = ModernButton("⭐ تنظیم به عنوان پیش‌فرض")
        self.set_default_btn.clicked.connect(self.set_default)
        model_btn_layout.addWidget(self.toggle_model_btn)
        model_btn_layout.addWidget(self.set_default_btn)
        model_btn_layout.addStretch()
        model_group_layout.addLayout(model_btn_layout)

        form.addRow(model_group)

        self.default_model_input = QComboBox()
        form.addRow("مدل پیش‌فرض:", self.default_model_input)

        self.temperature_input = QDoubleSpinBox()
        self.temperature_input.setRange(0.0, 2.0)
        self.temperature_input.setSingleStep(0.1)
        form.addRow("دما (Temperature):", self.temperature_input)

        self.top_p_input = QDoubleSpinBox()
        self.top_p_input.setRange(0.0, 1.0)
        self.top_p_input.setSingleStep(0.05)
        self.top_p_input.setValue(0.9)
        form.addRow("Top P:", self.top_p_input)

        self.max_tokens_input = QSpinBox()
        self.max_tokens_input.setRange(50, 8192)
        self.max_tokens_input.setSingleStep(50)
        form.addRow("حداکثر توکن:", self.max_tokens_input)

        self.max_words_input = QSpinBox()
        self.max_words_input.setRange(10, 200)
        self.max_words_input.setValue(40)
        form.addRow("حداکثر کلمات پاسخ:", self.max_words_input)

        self.compression_check = QCheckBox("فعالسازی فشرده‌سازی پیام")
        self.compression_check.setChecked(True)
        form.addRow("", self.compression_check)

        sys_prompt_group = QGroupBox("سیستم پرامپت")
        sys_prompt_layout = QVBoxLayout(sys_prompt_group)

        self.system_prompt_input = QTextEdit()
        self.system_prompt_input.setMinimumHeight(120)
        sys_prompt_layout.addWidget(self.system_prompt_input)

        self.reset_prompt_btn = QPushButton("🔄 بازنشانی به پیش‌فرض")
        self.reset_prompt_btn.clicked.connect(self.reset_prompt)
        sys_prompt_layout.addWidget(self.reset_prompt_btn)

        form.addRow(sys_prompt_group)

        btn_layout = QHBoxLayout()
        self.save_btn = ModernButton("💾 ذخیره تنظیمات")
        self.save_btn.clicked.connect(self.save_config)
        btn_layout.addWidget(self.save_btn)
        btn_layout.addStretch()
        form.addRow("", btn_layout)

        scroll.setWidget(form_widget)
        layout.addWidget(scroll)

    def load_data(self):
        config = self.vm.load_config()

        self.model_list.clear()
        self.default_model_input.clear()
        for m in config.models:
            item = QListWidgetItem(f"{'🟢' if m.is_active else '🔴'} {m.name} ({m.provider})")
            item.setData(Qt.UserRole, m.id)
            self.model_list.addItem(item)
            self.default_model_input.addItem(m.name, m.id)

        self.temperature_input.setValue(config.temperature)
        self.top_p_input.setValue(config.top_p)
        self.max_tokens_input.setValue(config.max_tokens)
        self.max_words_input.setValue(config.response_max_words)
        self.compression_check.setChecked(config.compression_enabled)
        self.system_prompt_input.setText(config.system_prompt)

        idx = self.default_model_input.findData(config.default_model)
        if idx >= 0:
            self.default_model_input.setCurrentIndex(idx)

        self.update_stats()

    def update_stats(self):
        info = self.vm.get_model_info()
        self.model_count_card.update_value(to_persian_numbers(str(info["active_models"])))
        default = info.get("default_obj")
        self.default_card.update_value(default.name if default else "تنظیم نشده")
        self.temp_card.update_value(str(info["temperature"]))

    def on_model_selected(self, row):
        pass

    def toggle_model(self):
        current = self.model_list.currentItem()
        if not current:
            return
        model_id = current.data(Qt.UserRole)
        if self.vm.toggle_model(model_id):
            self.load_data()

    def set_default(self):
        current = self.model_list.currentItem()
        if not current:
            return
        model_id = current.data(Qt.UserRole)
        if self.vm.set_default_model(model_id):
            self.load_data()

    def save_config(self):
        self.vm.model_config.temperature = self.temperature_input.value()
        self.vm.model_config.top_p = self.top_p_input.value()
        self.vm.model_config.max_tokens = self.max_tokens_input.value()
        self.vm.model_config.response_max_words = self.max_words_input.value()
        self.vm.model_config.compression_enabled = self.compression_check.isChecked()
        self.vm.model_config.system_prompt = self.system_prompt_input.toPlainText().strip()

        default_id = self.default_model_input.currentData()
        if default_id:
            self.vm.model_config.default_model = default_id

        if self.vm.save_config():
            QMessageBox.information(self, "موفقیت", "تنظیمات هوش مصنوعی ذخیره شد")
            self.update_stats()
        else:
            QMessageBox.critical(self, "خطا", "خطا در ذخیره تنظیمات")

    def reset_prompt(self):
        default = "شما یک دستیار فروشگاهی حرفه‌ای و مودب هستید. لطفاً به سوالات مشتریان به فارسی پاسخ دهید. پاسخ‌ها باید کوتاه، مفید و دوستانه باشند."
        self.system_prompt_input.setText(default)
