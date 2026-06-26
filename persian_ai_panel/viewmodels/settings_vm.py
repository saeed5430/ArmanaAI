from services.config_service import ConfigService
from services.logger_service import LoggerService
from services.backup_service import BackupService


class SettingsViewModel:
    def __init__(self):
        self.config_service = ConfigService()
        self.logger = LoggerService()
        self.backup_service = BackupService()

    def load_settings(self) -> dict:
        return self.config_service.get_config("app_config", {})

    def save_settings(self, settings: dict) -> bool:
        try:
            return self.config_service.save_config("app_config", settings)
        except Exception as e:
            self.logger.error(f"Error saving settings: {e}")
            return False

    def update_theme(self, theme: str) -> bool:
        self.config_service.set_theme(theme)
        return True

    def update_font_size(self, size: int) -> bool:
        config = self.load_settings()
        config["font_size"] = size
        return self.save_settings(config)

    def toggle_debug(self) -> bool:
        config = self.load_settings()
        config["debug_mode"] = not config.get("debug_mode", False)
        return self.save_settings(config)

    def create_backup(self) -> str:
        path = self.backup_service.backup_configs()
        if path:
            self.logger.info(f"Backup created: {path}")
        return path or ""

    def list_backups(self) -> list:
        return self.backup_service.list_backups()

    def get_system_info(self) -> dict:
        config = self.load_settings()
        import sys
        return {
            "app_version": config.get("version", "1.0.0"),
            "python_version": sys.version,
            "theme": config.get("theme", "light"),
            "language": config.get("language", "fa"),
            "auto_save": config.get("auto_save_interval", 300),
            "notifications": config.get("enable_notifications", True),
            "debug": config.get("debug_mode", False),
        }
