from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
                               QLabel, QFileDialog, QMessageBox, QGroupBox,
                               QScrollArea, QTextEdit, QSplitter)
from PySide6.QtCore import Qt
from PySide6.QtGui import QFont

from views.components.persian_table import PersianTable
from views.components.modern_button import ModernButton
from views.components.excel_editor import ExcelEditor
from viewmodels.excel_vm import ExcelViewModel
from viewmodels.product_vm import ProductViewModel
from utils.persian_utils import to_persian_numbers


class ExcelView(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.excel_vm = ExcelViewModel()
        self.product_vm = ProductViewModel()
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(30, 30, 30, 30)
        layout.setSpacing(20)

        title = QLabel("مدیریت اکسل")
        tf = QFont()
        tf.setPointSize(24)
        tf.setBold(True)
        title.setFont(tf)
        layout.addWidget(title)

        self.editor = ExcelEditor()
        self.editor.data_imported.connect(self.on_data_imported)
        layout.addWidget(self.editor)

        import_export_layout = QHBoxLayout()

        self.import_to_products_btn = ModernButton("📦 تبدیل به محصولات", variant="primary")
        self.import_to_products_btn.clicked.connect(self.convert_to_products)
        self.import_to_products_btn.setEnabled(False)

        self.export_products_btn = ModernButton("📤 خروجی محصولات به اکسل", variant="secondary")
        self.export_products_btn.clicked.connect(self.export_products)

        import_export_layout.addWidget(self.import_to_products_btn)
        import_export_layout.addWidget(self.export_products_btn)
        import_export_layout.addStretch()
        layout.addLayout(import_export_layout)

        self.status_label = QLabel("برای شروع یک فایل اکسل را باز کنید")
        self.status_label.setStyleSheet("color: #7F8C8D; padding: 8px;")
        layout.addWidget(self.status_label)

    def on_data_imported(self, df):
        rows = len(df)
        cols = len(df.columns)
        self.current_df = df
        self.import_to_products_btn.setEnabled(True)
        self.status_label.setText(
            f"✅ فایل بارگذاری شد: {to_persian_numbers(str(rows))} ردیف، "
            f"{to_persian_numbers(str(cols))} ستون"
        )

    def convert_to_products(self):
        if not hasattr(self, 'current_df') or self.current_df is None:
            QMessageBox.warning(self, "خطا", "لطفاً ابتدا یک فایل اکسل را باز کنید")
            return

        try:
            products = self.excel_vm.convert_to_products(self.current_df)
            if not products:
                QMessageBox.warning(self, "خطا", "هیچ محصولی برای تبدیل یافت نشد")
                return

            self.product_vm.products.extend(products)
            self.product_vm.save_products()

            QMessageBox.information(
                self, "موفقیت",
                f"تعداد {to_persian_numbers(str(len(products)))} محصول با موفقیت اضافه شد"
            )
            self.status_label.setText(
                f"✅ {to_persian_numbers(str(len(products)))} محصول به دیتابیس اضافه شد"
            )
        except Exception as e:
            QMessageBox.critical(self, "خطا", f"خطا در تبدیل:\n{str(e)}")

    def export_products(self):
        products = self.product_vm.load_products()
        if not products:
            QMessageBox.information(self, "اطلاع", "هیچ محصولی برای خروجی وجود ندارد")
            return

        filepath, _ = QFileDialog.getSaveFileName(
            self, "ذخیره محصولات", "products.xlsx", "Excel (*.xlsx)"
        )
        if not filepath:
            return

        success = self.excel_vm.export_products(products, filepath)
        if success:
            QMessageBox.information(
                self, "موفقیت",
                f"{to_persian_numbers(str(len(products)))} محصول در فایل ذخیره شد"
            )
            self.status_label.setText(f"✅ خروجی گرفته شد: {len(products)} محصول")
        else:
            QMessageBox.critical(self, "خطا", "خطا در ذخیره فایل")
