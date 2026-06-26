import json
import os
from pathlib import Path
from typing import Any, Dict


class ConfigService:
    def __init__(self):
        self.base_dir = self._find_base_dir()
        self.configs: Dict[str, Any] = {}

    def _find_base_dir(self) -> Path:
        for p in [Path("persian_ai_panel/config"), Path("config")]:
            if p.exists():
                return p
        Path("persian_ai_panel/config").mkdir(parents=True, exist_ok=True)
        return Path("persian_ai_panel/config")

    def _path_for(self, filename: str) -> Path:
        return self.base_dir / filename

    def load_all_configs(self):
        for name in ["app_config", "bot", "models", "limits", "theme"]:
            self.load_config(name, f"{name}.json")

    def load_config(self, name: str, filename: str) -> Dict[str, Any]:
        filepath = self._path_for(filename)
        try:
            if filepath.exists():
                with open(filepath, 'r', encoding='utf-8') as f:
                    self.configs[name] = json.load(f)
                    return self.configs[name]
        except Exception as e:
            print(f"Error loading {filename}: {e}")
        self.configs[name] = {}
        return {}

    def save_config(self, name: str, data: Dict[str, Any]) -> bool:
        filepath = self._path_for(f"{name}.json")
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            self.configs[name] = data
            return True
        except Exception as e:
            print(f"Error saving {name}.json: {e}")
            return False

    def get_config(self, name: str, default: Any = None) -> Any:
        return self.configs.get(name, default if default is not None else {})

    def get_theme(self) -> str:
        return self.get_config("app_config", {}).get("theme", "light")

    def set_theme(self, theme: str):
        app_config = self.get_config("app_config", {})
        app_config["theme"] = theme
        self.save_config("app_config", app_config)

    def get(self, *keys: str, default: Any = None) -> Any:
        if len(keys) < 2:
            return default
        config_name = keys[0]
        data = self.get_config(config_name, {})
        for key in keys[1:]:
            if isinstance(data, dict):
                data = data.get(key)
            else:
                return default
        return data if data is not None else default
