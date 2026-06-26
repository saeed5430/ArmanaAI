from typing import Optional
from services.config_service import ConfigService
from services.logger_service import LoggerService
from models.ai_model import ModelConfig, AIModel


class AIViewModel:
    def __init__(self):
        self.config_service = ConfigService()
        self.logger = LoggerService()
        self.model_config = ModelConfig()

    def load_config(self) -> ModelConfig:
        try:
            data = self.config_service.get_config("models", {})
            self.model_config = ModelConfig.from_dict(data)
        except Exception as e:
            self.logger.error(f"Error loading model config: {e}")
        return self.model_config

    def save_config(self) -> bool:
        try:
            return self.config_service.save_config("models", self.model_config.to_dict())
        except Exception as e:
            self.logger.error(f"Error saving model config: {e}")
            return False

    def set_default_model(self, model_id: str) -> bool:
        model = self.model_config.get_model_by_id(model_id)
        if model:
            self.model_config.default_model = model_id
            return self.save_config()
        return False

    def toggle_model(self, model_id: str) -> bool:
        model = self.model_config.get_model_by_id(model_id)
        if model:
            model.is_active = not model.is_active
            return self.save_config()
        return False

    def update_system_prompt(self, prompt: str) -> bool:
        self.model_config.system_prompt = prompt
        return self.save_config()

    def update_parameters(self, temperature: float, max_tokens: int,
                          top_p: float, max_words: int) -> bool:
        self.model_config.temperature = temperature
        self.model_config.max_tokens = max_tokens
        self.model_config.top_p = top_p
        self.model_config.response_max_words = max_words
        return self.save_config()

    def test_model(self, model_id: str, prompt: str = "سلام") -> dict:
        return {
            "success": False,
            "error": "Testing requires the worker to be deployed and reachable."
        }

    def get_model_info(self) -> dict:
        active = self.model_config.get_active_models()
        return {
            "total_models": len(self.model_config.models),
            "active_models": len(active),
            "default": self.model_config.default_model,
            "default_obj": self.model_config.get_model_by_id(self.model_config.default_model),
            "temperature": self.model_config.temperature,
            "max_tokens": self.model_config.max_tokens,
            "compression": self.model_config.compression_enabled
        }
