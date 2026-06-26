from PySide6.QtWidgets import QFrame, QVBoxLayout, QLabel
from PySide6.QtCore import Qt, QPropertyAnimation, QEasingCurve
from PySide6.QtGui import QFont


class StatCard(QFrame):
    def __init__(self, title: str, value: str, icon: str = "", parent=None):
        super().__init__(parent)
        self.title = title
        self.value = value
        self.icon = icon
        self.setup_ui()

    def setup_ui(self):
        self.setObjectName("statCard")
        self.setMinimumSize(200, 120)
        self.setMaximumSize(300, 150)

        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 15, 20, 15)
        layout.setSpacing(10)

        self.title_label = QLabel(self.title)
        self.title_label.setAlignment(Qt.AlignRight)
        title_font = QFont()
        title_font.setPointSize(11)
        self.title_label.setFont(title_font)
        self.title_label.setStyleSheet("color: #7F8C8D;")

        self.value_label = QLabel(str(self.value))
        self.value_label.setAlignment(Qt.AlignRight)
        value_font = QFont()
        value_font.setPointSize(24)
        value_font.setBold(True)
        self.value_label.setFont(value_font)
        self.value_label.setStyleSheet("color: #2C3E50;")

        layout.addWidget(self.title_label)
        layout.addWidget(self.value_label)
        layout.addStretch()

        self.setStyleSheet("""
            QFrame#statCard {
                background-color: white;
                border-radius: 12px;
                border: 1px solid #E0E6ED;
                padding: 10px;
            }
            QFrame#statCard:hover {
                border-color: #4A90D9;
                background-color: #F8FAFD;
            }
        """)

    def update_value(self, new_value: str):
        self.value_label.setText(str(new_value))
        anim = QPropertyAnimation(self.value_label, b"styleSheet")
        anim.setDuration(300)
        anim.setStartValue("color: #4A90D9;")
        anim.setEndValue("color: #2C3E50;")
        anim.setEasingCurve(QEasingCurve.OutCubic)
        anim.start()
