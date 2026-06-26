from datetime import datetime
from services.config_service import ConfigService
from services.logger_service import LoggerService
from models.stats_model import StatsData


class DashboardViewModel:
    def __init__(self):
        self.config_service = ConfigService()
        self.logger = LoggerService()
        self.stats = StatsData()

    def load_stats(self) -> StatsData:
        try:
            config = self.config_service.get_config("stats", {})
            self.stats = StatsData.from_dict(config)
        except Exception as e:
            self.logger.error(f"Error loading stats: {e}")
        return self.stats

    def get_quick_stats(self) -> dict:
        config = self.config_service.get_config("app_config", {})
        models_config = self.config_service.get_config("models", {})
        bot_config = self.config_service.get_config("bot", {})

        return {
            "bot_status": "active" if not bot_config.get("maintenance_mode") else "maintenance",
            "active_model": models_config.get("default_model", "N/A"),
            "theme": config.get("theme", "light"),
            "total_products": self.stats.total_products,
            "today_requests": self.stats.today_requests,
            "avg_response_time": self.stats.avg_response_time,
            "cache_rate": self.stats.get_cache_hit_rate(),
            "app_version": config.get("version", "1.0.0")
        }

    def refresh(self):
        self.load_stats()
        return self.get_quick_stats()
