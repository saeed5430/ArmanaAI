import json
import os
from pathlib import Path
from datetime import datetime
from loguru import logger


class LoggerService:
    def __init__(self, log_dir: str = None):
        self.log_dir = Path(log_dir or self._default_log_dir())
        self.log_dir.mkdir(parents=True, exist_ok=True)

        logger.add(
            self.log_dir / "app_{time:YYYY-MM-DD}.log",
            rotation="1 day",
            retention="30 days",
            encoding="utf-8",
            format="{time:YYYY-MM-DD HH:mm:ss} | {level:<8} | {message}"
        )

        self.structured_logs = []

    def _default_log_dir(self) -> str:
        for p in ["persian_ai_panel/logs", "logs"]:
            if os.path.exists(p) or os.access(os.path.dirname(p) or ".", os.W_OK):
                return p
        return "logs"

    def _add_structured(self, level: str, message: str, **kwargs):
        self.structured_logs.append({
            "timestamp": datetime.now().isoformat(),
            "level": level,
            "message": message,
            "metadata": kwargs
        })
        if len(self.structured_logs) > 1000:
            self.structured_logs = self.structured_logs[-100:]

    def info(self, message: str, **kwargs):
        logger.info(message)
        self._add_structured("INFO", message, **kwargs)

    def error(self, message: str, **kwargs):
        logger.error(message)
        self._add_structured("ERROR", message, **kwargs)

    def warning(self, message: str, **kwargs):
        logger.warning(message)
        self._add_structured("WARNING", message, **kwargs)

    def debug(self, message: str, **kwargs):
        logger.debug(message)
        self._add_structured("DEBUG", message, **kwargs)

    def get_logs(self, level: str = None, limit: int = 100) -> list:
        logs = self.structured_logs
        if level:
            logs = [log for log in logs if log["level"] == level.upper()]
        return logs[-limit:]

    def export_logs(self, filepath: str):
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.structured_logs, f, ensure_ascii=False, indent=2)

    def clear_logs(self):
        self.structured_logs.clear()
