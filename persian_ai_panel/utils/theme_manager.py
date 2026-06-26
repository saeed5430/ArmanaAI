import json
import os
from PySide6.QtWidgets import QWidget
from PySide6.QtCore import QFile, QTextStream


class ThemeManager:
    def __init__(self):
        self.current_theme = "light"
        self.theme_data = {}
        self.load_theme_config()

    def _config_path(self, filename: str) -> str:
        paths = [
            os.path.join("persian_ai_panel", "config", filename),
            os.path.join("config", filename),
        ]
        for p in paths:
            if os.path.exists(p):
                return p
        return paths[0]

    def _assets_path(self, filename: str) -> str:
        paths = [
            os.path.join("persian_ai_panel", "assets", "styles", filename),
            os.path.join("assets", "styles", filename),
        ]
        for p in paths:
            if os.path.exists(p):
                return p
        return paths[0]

    def load_theme_config(self):
        config_path = self._config_path("theme.json")
        if os.path.exists(config_path):
            with open(config_path, 'r', encoding='utf-8') as f:
                self.theme_data = json.load(f)

    def apply_theme(self, theme_name: str, widget: QWidget = None):
        self.current_theme = theme_name
        qss_path = self._assets_path(f"{theme_name}_theme.qss")
        if os.path.exists(qss_path):
            file = QFile(qss_path)
            if file.open(QFile.ReadOnly | QFile.Text):
                stream = QTextStream(file)
                qss = stream.readAll()
                file.close()
                if widget:
                    widget.setStyleSheet(qss)
        return self.theme_data.get(theme_name, {})

    def get_current_colors(self) -> dict:
        return self.theme_data.get(
            self.current_theme,
            self.theme_data.get("light", {})
        )

    def toggle_theme(self, widget: QWidget = None) -> str:
        new_theme = "dark" if self.current_theme == "light" else "light"
        self.apply_theme(new_theme, widget)
        return new_theme
