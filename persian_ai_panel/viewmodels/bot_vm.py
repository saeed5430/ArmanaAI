from services.config_service import ConfigService
from services.logger_service import LoggerService
from models.bot_model import BotConfig


class BotViewModel:
    def __init__(self):
        self.config_service = ConfigService()
        self.logger = LoggerService()
        self.config = BotConfig()

    def load_config(self) -> BotConfig:
        try:
            data = self.config_service.get_config("bot", {})
            self.config = BotConfig.from_dict(data)
        except Exception as e:
            self.logger.error(f"Error loading bot config: {e}")
        return self.config

    def save_config(self) -> bool:
        try:
            return self.config_service.save_config("bot", self.config.to_dict())
        except Exception as e:
            self.logger.error(f"Error saving bot config: {e}")
            return False

    def update_token(self, token: str) -> bool:
        self.config.bot_token = token
        return self.save_config()

    def update_webhook(self, url: str) -> bool:
        self.config.webhook_url = url
        return self.save_config()

    def toggle_maintenance(self) -> bool:
        self.config.maintenance_mode = not self.config.maintenance_mode
        return self.save_config()

    def add_admin(self, admin_id: str) -> bool:
        if admin_id and admin_id not in self.config.admin_ids:
            self.config.admin_ids.append(admin_id)
            return self.save_config()
        return False

    def remove_admin(self, admin_id: str) -> bool:
        if admin_id in self.config.admin_ids:
            self.config.admin_ids.remove(admin_id)
            return self.save_config()
        return False

    def get_status_info(self) -> dict:
        return {
            "configured": bool(self.config.bot_token),
            "webhook_set": bool(self.config.webhook_url),
            "maintenance": self.config.maintenance_mode,
            "working_hours": self.config.is_within_working_hours(),
            "admin_count": len(self.config.admin_ids),
            "working_hours_range": f"{self.config.working_hours_start} - {self.config.working_hours_end}"
        }
