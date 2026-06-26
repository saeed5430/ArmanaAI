from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
                               QLabel, QLineEdit, QTextEdit, QComboBox,
                               QFormLayout, QGroupBox, QScrollArea,
                               QMessageBox, QSpinBox, QDoubleSpinBox,
                               QListWidget, QSplitter, QCheckBox)
from PySide6.QtCore import Qt, Signal
from PySide6.QtGui import QFont

from views.components.persian_table import PersianTable
from views.components.modern_button import ModernButton
from viewmodels.product_vm import ProductViewModel
from models.product_model import Product, ProductCategory
from utils.persian_utils import to_persian_numbers, format_price


class ProductView(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.vm = ProductViewModel()
        self.setup_ui()
        self.load_data()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(30, 30, 30, 30)
        layout.setSpacing(20)

        title = QLabel("مدیریت محصولات")
        tf = QFont()
        tf.setPointSize(24)
        tf.setBold(True)
        title.setFont(tf)
        layout.addWidget(title)

        splitter = QSplitter(Qt.Horizontal)

        left_panel = QWidget()
        left_layout = QVBoxLayout(left_panel)

        search_bar = QHBoxLayout()
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("جستجوی محصول...")
        self.search_input.textChanged.connect(self.search_products)
        search_btn = QPushButton("🔍")
        search_btn.setFixedWidth(40)
        search_bar.addWidget(self.search_input)
        search_bar.addWidget(search_btn)
        left_layout.addLayout(search_bar)

        self.table = PersianTable()
        self.table.set_headers([
            "شناسه", "نام محصول", "قیمت", "موجودی", "دسته‌بندی", "وضعیت"
        ])
        self.table.row_selected.connect(self.on_product_selected)
        left_layout.addWidget(self.table)

        btn_bar = QHBoxLayout()
        self.add_btn = ModernButton("➕ افزودن محصول", variant="success")
        self.add_btn.clicked.connect(self.add_product)
        self.delete_btn = ModernButton("🗑️ حذف", variant="danger")
        self.delete_btn.clicked.connect(self.delete_product)
        self.delete_btn.setEnabled(False)
        btn_bar.addWidget(self.add_btn)
        btn_bar.addWidget(self.delete_btn)
        btn_bar.addStretch()
        left_layout.addLayout(btn_bar)

        splitter.addWidget(left_panel)

        right_panel = QScrollArea()
        right_panel.setWidgetResizable(True)
        right_panel.setMinimumWidth(350)

        form_widget = QWidget()
        self.form_layout = QFormLayout(form_widget)
        self.form_layout.setSpacing(10)
        self.form_layout.setContentsMargins(20, 20, 20, 20)

        self.name_input = QLineEdit()
        self.name_input.setPlaceholderText("نام محصول")
        self.form_layout.addRow("نام محصول:", self.name_input)

        self.price_input = QDoubleSpinBox()
        self.price_input.setRange(0, 999999999)
        self.price_input.setPrefix("تومان ")
        self.form_layout.addRow("قیمت:", self.price_input)

        self.discount_input = QDoubleSpinBox()
        self.discount_input.setRange(0, 999999999)
        self.discount_input.setPrefix("تومان ")
        self.discount_input.setSpecialValueText("ندارد")
        self.form_layout.addRow("قیمت تخفیف:", self.discount_input)

        self.category_input = QComboBox()
        for cat in ProductCategory:
            self.category_input.addItem(cat.value, cat)
        self.form_layout.addRow("دسته‌بندی:", self.category_input)

        self.stock_input = QSpinBox()
        self.stock_input.setRange(0, 999999)
        self.form_layout.addRow("موجودی:", self.stock_input)

        self.material_input = QLineEdit()
        self.material_input.setPlaceholderText("جنس محصول")
        self.form_layout.addRow("جنس:", self.material_input)

        self.colors_input = QLineEdit()
        self.colors_input.setPlaceholderText("رنگ‌ها (با ویرگول جدا)")
        self.form_layout.addRow("رنگ‌ها:", self.colors_input)

        self.sizes_input = QLineEdit()
        self.sizes_input.setPlaceholderText("سایزها (با ویرگول جدا)")
        self.form_layout.addRow("سایزها:", self.sizes_input)

        self.shipping_input = QLineEdit()
        self.shipping_input.setPlaceholderText("اطلاعات ارسال")
        self.form_layout.addRow("ارسال:", self.shipping_input)

        self.desc_input = QTextEdit()
        self.desc_input.setMaximumHeight(80)
        self.form_layout.addRow("توضیحات:", self.desc_input)

        self.active_check = QCheckBox("محصول فعال است")
        self.active_check.setChecked(True)
        self.form_layout.addRow("", self.active_check)

        self.save_btn = ModernButton("💾 ذخیره تغییرات")
        self.save_btn.clicked.connect(self.save_product)
        self.save_btn.setEnabled(False)
        self.form_layout.addRow("", self.save_btn)

        right_panel.setWidget(form_widget)
        splitter.addWidget(right_panel)

        splitter.setSizes([600, 350])
        layout.addWidget(splitter)

        self.selected_product_id = None

    def load_data(self):
        products = self.vm.load_products()
        self.refresh_table(products)

    def refresh_table(self, products=None):
        if products is None:
            products = self.vm.products
        self.table.set_data([
            [
                p.id,
                p.name,
                format_price(p.price),
                to_persian_numbers(str(p.stock)),
                p.category.value,
                "✅ فعال" if p.is_active else "❌ غیرفعال"
            ]
            for p in products
        ])

    def search_products(self):
        query = self.search_input.text()
        results = self.vm.search_products(query)
        self.refresh_table(results)

    def on_product_selected(self, row):
        data = self.table.get_selected_row_data()
        product_id = data.get("شناسه")
        if not product_id:
            return

        product = self.vm.get_product_by_id(product_id)
        if not product:
            return

        self.selected_product_id = product.id
        self.name_input.setText(product.name)
        self.price_input.setValue(product.price)
        self.discount_input.setValue(product.discount_price or 0)
        self.stock_input.setValue(product.stock)
        self.material_input.setText(product.material)
        self.colors_input.setText("، ".join(product.colors))
        self.sizes_input.setText("، ".join(product.sizes))
        self.shipping_input.setText(product.shipping_info)
        self.desc_input.setText(product.description)
        self.active_check.setChecked(product.is_active)

        idx = self.category_input.findText(product.category.value)
        if idx >= 0:
            self.category_input.setCurrentIndex(idx)

        self.save_btn.setEnabled(True)
        self.delete_btn.setEnabled(True)

    def add_product(self):
        self.clear_form()
        self.selected_product_id = None
        self.save_btn.setEnabled(True)
        self.delete_btn.setEnabled(False)

    def save_product(self):
        name = self.name_input.text().strip()
        if not name:
            QMessageBox.warning(self, "خطا", "نام محصول را وارد کنید")
            return

        product = Product(
            id=self.selected_product_id or "0",
            name=name,
            price=self.price_input.value(),
            discount_price=self.discount_input.value() or None,
            category=self.category_input.currentData(),
            stock=self.stock_input.value(),
            material=self.material_input.text().strip(),
            colors=[c.strip() for c in self.colors_input.text().split("،") if c.strip()],
            sizes=[s.strip() for s in self.sizes_input.text().split("،") if s.strip()],
            shipping_info=self.shipping_input.text().strip(),
            description=self.desc_input.toPlainText().strip(),
            is_active=self.active_check.isChecked()
        )

        success = (self.vm.update_product(product)
                   if self.selected_product_id
                   else self.vm.add_product(product))

        if success:
            QMessageBox.information(self, "موفقیت", "محصول ذخیره شد")
            self.load_data()
            self.clear_form()
        else:
            QMessageBox.critical(self, "خطا", "خطا در ذخیره محصول")

    def delete_product(self):
        if not self.selected_product_id:
            return
        reply = QMessageBox.question(
            self, "تأیید حذف", "آیا از حذف این محصول اطمینان دارید؟"
        )
        if reply == QMessageBox.Yes:
            if self.vm.delete_product(self.selected_product_id):
                self.load_data()
                self.clear_form()

    def clear_form(self):
        self.name_input.clear()
        self.price_input.setValue(0)
        self.discount_input.setValue(0)
        self.stock_input.setValue(0)
        self.material_input.clear()
        self.colors_input.clear()
        self.sizes_input.clear()
        self.shipping_input.clear()
        self.desc_input.clear()
        self.active_check.setChecked(True)
        self.category_input.setCurrentIndex(0)
        self.save_btn.setEnabled(False)
        self.delete_btn.setEnabled(False)
        self.selected_product_id = None
