from PySide6.QtWidgets import QPushButton
from PySide6.QtCore import Qt, QPropertyAnimation, QEasingCurve, QSize
from PySide6.QtGui import QFont, QIcon


class ModernButton(QPushButton):
    def __init__(self, text: str = "", icon: str = None,
                 variant: str = "primary", parent=None):
        super().__init__(text, parent)
        self.variant = variant
        if icon:
            self.setIcon(QIcon(icon))
        self.setup_ui()

    def setup_ui(self):
        self.setCursor(Qt.PointingHandCursor)
        self.setMinimumHeight(40)
        self.setMinimumWidth(100)

        font = QFont()
        font.setPointSize(11)
        font.setBold(True)
        self.setFont(font)

        colors = {
            "primary": {"bg": "#4A90D9", "hover": "#357ABD", "text": "white"},
            "secondary": {"bg": "#95A5A6", "hover": "#7F8C8D", "text": "white"},
            "success": {"bg": "#27AE60", "hover": "#219A52", "text": "white"},
            "danger": {"bg": "#E74C3C", "hover": "#C0392B", "text": "white"},
            "warning": {"bg": "#F39C12", "hover": "#D68910", "text": "white"},
            "outline": {"bg": "transparent", "hover": "#F0F4FF", "text": "#4A90D9"},
        }

        c = colors.get(self.variant, colors["primary"])
        border = f"2px solid {c['bg']}" if self.variant == "outline" else "none"

        self.setStyleSheet(f"""
            QPushButton {{
                background-color: {c['bg']};
                color: {c['text']};
                border: {border};
                border-radius: 8px;
                padding: 10px 24px;
                font-weight: bold;
            }}
            QPushButton:hover {{
                background-color: {c['hover']};
            }}
            QPushButton:pressed {{
                background-color: {c['hover']};
                padding-top: 12px;
            }}
            QPushButton:disabled {{
                background-color: #BDC3C7;
                color: #95A5A6;
            }}
        """)

    def set_loading(self, loading: bool):
        self.setEnabled(not loading)
        self.setText("⏳ ..." if loading else self.text())
