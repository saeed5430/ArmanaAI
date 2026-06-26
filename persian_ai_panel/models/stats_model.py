from dataclasses import dataclass, field
from typing import Dict, List, Optional
from datetime import datetime


@dataclass
class StatsData:
    total_requests: int = 0
    today_requests: int = 0
    active_users: int = 0
    total_products: int = 0
    cache_hits: int = 0
    cache_misses: int = 0
    avg_response_time: float = 0.0
    total_tokens_used: int = 0
    errors_count: int = 0
    model_usage: Dict[str, int] = field(default_factory=dict)
    hourly_requests: List[int] = field(default_factory=lambda: [0] * 24)
    last_updated: datetime = field(default_factory=datetime.now)

    def get_cache_hit_rate(self) -> float:
        total = self.cache_hits + self.cache_misses
        if total == 0:
            return 0.0
        return round(self.cache_hits / total * 100, 1)

    def get_most_used_model(self) -> Optional[str]:
        if not self.model_usage:
            return None
        return max(self.model_usage, key=self.model_usage.get)

    def get_peak_hour(self) -> int:
        max_req = max(self.hourly_requests)
        if max_req == 0:
            return 0
        return self.hourly_requests.index(max_req)

    def to_dict(self) -> dict:
        return {
            "total_requests": self.total_requests,
            "today_requests": self.today_requests,
            "active_users": self.active_users,
            "total_products": self.total_products,
            "cache_hits": self.cache_hits,
            "cache_misses": self.cache_misses,
            "avg_response_time": self.avg_response_time,
            "total_tokens_used": self.total_tokens_used,
            "errors_count": self.errors_count,
            "model_usage": self.model_usage,
            "hourly_requests": self.hourly_requests,
            "last_updated": self.last_updated.isoformat()
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'StatsData':
        return cls(
            total_requests=data.get("total_requests", 0),
            today_requests=data.get("today_requests", 0),
            active_users=data.get("active_users", 0),
            total_products=data.get("total_products", 0),
            cache_hits=data.get("cache_hits", 0),
            cache_misses=data.get("cache_misses", 0),
            avg_response_time=float(data.get("avg_response_time", 0.0)),
            total_tokens_used=data.get("total_tokens_used", 0),
            errors_count=data.get("errors_count", 0),
            model_usage=data.get("model_usage", {}),
            hourly_requests=data.get("hourly_requests", [0] * 24)
        )
