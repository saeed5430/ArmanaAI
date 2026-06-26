from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
                               QLabel, QFileDialog, QMessageBox, QSpinBox,
                               QComboBox, QCheckBox, QGroupBox, QProgressBar)
from PySide6.QtCore import Qt, Signal
from PySide6.QtGui import QFont

from views.components.persian_table import PersianTable
from services.excel_service import ExcelService


class ExcelEditor(QWidget):
    data_imported = Signal(object)
    data_exported = Signal(str)

    def __init__(self, parent=None):
        super().__init__(parent)
        self.excel_service = ExcelService()
        self.current_file = None
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setSpacing(15)

        header = QLabel("مدیریت فایل اکسل")
        hfont = QFont()
        hfont.setPointSize(16)
        hfont.setBold(True)
        header.setFont(hfont)
        layout.addWidget(header)

        toolbar = QHBoxLayout()
        self.import_btn = QPushButton("📂 导入 فایل اکسل")
        self.import_btn.clicked.connect(self.import_file)
        self.export_btn = QPushButton("💾 导出 به اکسل")
        self.export_btn.clicked.connect(self.export_file)
        self.validate_btn = QPushButton("✅ 验证 ساختار")
        self.validate_btn.clicked.connect(self.validate_data)
        self.validate_btn.setEnabled(False)

        for btn in [self.import_btn, self.export_btn, self.validate_btn]:
            btn.setMinimumHeight(36)
            btn.setStyleSheet("""
                QPushButton { background-color: #4A90D9; color: white;
                              border: none; border-radius: 6px; padding: 8px 16px; }
                QPushButton:hover { background-color: #357ABD; }
                QPushButton:disabled { background-color: #BDC3C7; }
            """)
            toolbar.addWidget(btn)

        toolbar.addStretch()
        layout.addLayout(toolbar)

        self.table = PersianTable()
        layout.addWidget(self.table)

        info_layout = QHBoxLayout()
        self.info_label = QLabel("هیچ فایلی باز نشده است")
        self.info_label.setStyleSheet("color: #7F8C8D; padding: 5px;")
        info_layout.addWidget(self.info_label)
        info_layout.addStretch()
        layout.addLayout(info_layout)

    def import_file(self):
        filepath, _ = QFileDialog.getOpenFileName(
            self, "انتخاب فایل اکسل", "", "Excel (*.xlsx *.xls);;All (*.*)"
        )
        if not filepath:
            return

        try:
            df = self.excel_service.import_excel(filepath)
            self.current_file = filepath
            validation = self.excel_service.validate_structure(df)

            if not validation["is_valid"]:
                QMessageBox.warning(
                    self, "هشدار",
                    f"ستون‌های گمشده: {', '.join(validation['missing_columns'])}"
                )

            headers = list(df.columns)
            self.table.set_headers(headers)

            rows = []
            for _, row in df.head(100).iterrows():
                rows.append([str(row[h]) if pd.notna(row[h]) else ""
                            for h in headers])

            self.table.set_data(rows)
            self.validate_btn.setEnabled(True)

            info = self.excel_service.get_excel_info(filepath)
            self.info_label.setText(
                f"{validation['total_rows']} ردیف | "
                f"{validation['duplicate_count']} تکراری | "
                f"{info['filename']}"
            )

            self.data_imported.emit(df)

        except Exception as e:
            QMessageBox.critical(self, "خطا", f"خطا در خواندن فایل:\n{str(e)}")

    def export_file(self):
        filepath, _ = QFileDialog.getSaveFileName(
            self, "ذخیره فایل اکسل", "", "Excel (*.xlsx);;All (*.*)"
        )
        if not filepath:
            return

        try:
            rows = self.table.get_selected_row_data()
            if not rows:
                QMessageBox.information(self, "اطلاع", "لطفاً یک ردیف را انتخاب کنید")
                return
            self.data_exported.emit(filepath)
            QMessageBox.information(self, "موفقیت", "فایل با موفقیت ذخیره شد")
        except Exception as e:
            QMessageBox.critical(self, "خطا", f"خطا در ذخیره:\n{str(e)}")

    def validate_data(self):
        if self.excel_service.current_file:
            try:
                df = self.excel_service.import_excel(self.excel_service.current_file)
                v = self.excel_service.validate_structure(df)
                msg = (
                    f"✅ ساختار معتبر است\n"
                    f"تعداد ردیف‌ها: {v['total_rows']}\n"
                    f"تکراری‌ها: {v['duplicate_count']}"
                )
                QMessageBox.information(self, "نتیجه اعتبارسنجی", msg)
            except Exception as e:
                QMessageBox.critical(self, "خطا", str(e))


import pandas as pd
