from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class AIModel:
    id: str
    name: str
    provider: str
    is_active: bool = True
    max_tokens: int = 4096

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "provider": self.provider,
            "is_active": self.is_active,
            "max_tokens": self.max_tokens
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'AIModel':
        return cls(
            id=data.get("id", ""),
            name=data.get("name", ""),
            provider=data.get("provider", ""),
            is_active=data.get("is_active", True),
            max_tokens=data.get("max_tokens", 4096)
        )


@dataclass
class ModelConfig:
    default_model: str = "deepseek/deepseek-chat"
    models: List[AIModel] = field(default_factory=list)
    temperature: float = 0.7
    max_tokens: int = 500
    top_p: float = 0.9
    system_prompt: str = ""
    compression_enabled: bool = True
    response_max_words: int = 40

    def get_active_models(self) -> List[AIModel]:
        return [m for m in self.models if m.is_active]

    def get_model_by_id(self, model_id: str) -> Optional[AIModel]:
        for m in self.models:
            if m.id == model_id:
                return m
        return None

    def to_dict(self) -> dict:
        return {
            "default_model": self.default_model,
            "models": [m.to_dict() for m in self.models],
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "top_p": self.top_p,
            "system_prompt": self.system_prompt,
            "compression_enabled": self.compression_enabled,
            "response_max_words": self.response_max_words
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'ModelConfig':
        models_data = data.get("models", [])
        return cls(
            default_model=data.get("default_model", ""),
            models=[AIModel.from_dict(m) for m in models_data],
            temperature=float(data.get("temperature", 0.7)),
            max_tokens=int(data.get("max_tokens", 500)),
            top_p=float(data.get("top_p", 0.9)),
            system_prompt=data.get("system_prompt", ""),
            compression_enabled=data.get("compression_enabled", True),
            response_max_words=int(data.get("response_max_words", 40))
        )
