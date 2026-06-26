from dataclasses import dataclass, field
from typing import List, Optional
from datetime import datetime


@dataclass
class BotConfig:
    bot_token: str = ""
    webhook_url: str = ""
    owner_id: str = ""
    admin_ids: List[str] = field(default_factory=list)
    working_hours_start: str = "08:00"
    working_hours_end: str = "22:00"
    maintenance_mode: bool = False
    default_greeting: str = "سلام! چطور می‌تونم کمکتون کنم؟"
    error_message: str = "متأسفانه مشکلی پیش آمده. لطفاً دوباره تلاش کنید."

    def is_within_working_hours(self) -> bool:
        now = datetime.now().strftime("%H:%M")
        return self.working_hours_start <= now <= self.working_hours_end

    def to_dict(self) -> dict:
        return {
            "bot_token": self.bot_token,
            "webhook_url": self.webhook_url,
            "owner_id": self.owner_id,
            "admin_ids": self.admin_ids,
            "working_hours_start": self.working_hours_start,
            "working_hours_end": self.working_hours_end,
            "maintenance_mode": self.maintenance_mode,
            "default_greeting": self.default_greeting,
            "error_message": self.error_message
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'BotConfig':
        return cls(
            bot_token=data.get("bot_token", ""),
            webhook_url=data.get("webhook_url", ""),
            owner_id=data.get("owner_id", ""),
            admin_ids=data.get("admin_ids", []),
            working_hours_start=data.get("working_hours_start", "08:00"),
            working_hours_end=data.get("working_hours_end", "22:00"),
            maintenance_mode=data.get("maintenance_mode", False),
            default_greeting=data.get("default_greeting", "سلام! چطور می‌تونم کمکتون کنم؟"),
            error_message=data.get("error_message", "متأسفانه مشکلی پیش آمده. لطفاً دوباره تلاش کنید.")
        )
