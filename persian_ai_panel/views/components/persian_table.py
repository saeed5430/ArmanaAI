from PySide6.QtWidgets import QTableWidget, QTableWidgetItem, QHeaderView
from PySide6.QtCore import Qt, Signal
from PySide6.QtGui import QFont


class PersianTable(QTableWidget):
    row_selected = Signal(int)
    row_edited = Signal(int, dict)

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setup_ui()

    def setup_ui(self):
        self.setAlternatingRowColors(True)
        self.setSelectionBehavior(QTableWidget.SelectRows)
        self.setSelectionMode(QTableWidget.SingleSelection)
        self.setEditTriggers(QTableWidget.DoubleClicked)
        self.setSortingEnabled(True)

        header = self.horizontalHeader()
        header.setSectionResizeMode(QHeaderView.Stretch)
        header.setDefaultAlignment(Qt.AlignRight | Qt.AlignVCenter)

        header_font = QFont()
        header_font.setPointSize(11)
        header_font.setBold(True)
        header.setFont(header_font)

        self.setStyleSheet("""
            QTableWidget {
                border: 1px solid #E0E6ED;
                border-radius: 8px;
                background-color: white;
                gridline-color: #F0F0F0;
            }
            QTableWidget::item {
                padding: 8px;
                border-bottom: 1px solid #F0F0F0;
            }
            QTableWidget::item:selected {
                background-color: #4A90D9;
                color: white;
            }
            QHeaderView::section {
                background-color: #F8FAFD;
                padding: 10px;
                border: none;
                border-bottom: 2px solid #E0E6ED;
                font-weight: bold;
            }
        """)

        self.setLayoutDirection(Qt.RightToLeft)

    def set_headers(self, headers: list):
        self.setColumnCount(len(headers))
        self.setHorizontalHeaderLabels(headers)

    def add_row(self, data: list):
        row = self.rowCount()
        self.insertRow(row)
        for col, value in enumerate(data):
            item = QTableWidgetItem(str(value))
            item.setTextAlignment(Qt.AlignRight | Qt.AlignVCenter)
            self.setItem(row, col, item)

    def set_data(self, rows: list[list]):
        self.setRowCount(0)
        for row_data in rows:
            self.add_row(row_data)

    def get_selected_row_data(self) -> dict:
        current_row = self.currentRow()
        if current_row >= 0:
            data = {}
            for col in range(self.columnCount()):
                h = self.horizontalHeaderItem(col)
                item = self.item(current_row, col)
                data[h.text()] = item.text() if item else ""
            return data
        return {}

    def clear_data(self):
        self.setRowCount(0)
