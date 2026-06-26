import json
import shutil
import os
from pathlib import Path
from datetime import datetime
from typing import Optional


class BackupService:
    def __init__(self):
        self.backup_root = self._ensure_dir()
        self.max_backups = 30

    def _ensure_dir(self) -> Path:
        for p in [Path("persian_ai_panel/backups"), Path("backups")]:
            p.mkdir(parents=True, exist_ok=True)
            return p
        Path("backups").mkdir(parents=True, exist_ok=True)
        return Path("backups")

    def _backup_path(self, name: str) -> Path:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        return self.backup_root / f"{name}_{ts}"

    def backup_configs(self, config_dir: str = None) -> Optional[str]:
        src = Path(config_dir or "persian_ai_panel/config")
        if not src.exists():
            src = Path("config")
        if not src.exists():
            return None

        dest = self._backup_path("config")
        dest.mkdir(parents=True, exist_ok=True)

        for f in src.glob("*.json"):
            shutil.copy2(f, dest / f.name)

        self._cleanup_old()
        return str(dest)

    def backup_file(self, filepath: str) -> Optional[str]:
        if not os.path.exists(filepath):
            return None
        name = Path(filepath).stem
        dest = self._backup_path(name)
        dest.mkdir(parents=True, exist_ok=True)
        shutil.copy2(filepath, dest / Path(filepath).name)
        self._cleanup_old()
        return str(dest)

    def _cleanup_old(self):
        backups = sorted(self.backup_root.glob("*"), key=os.path.getmtime)
        while len(backups) > self.max_backups:
            shutil.rmtree(backups[0])
            backups = sorted(self.backup_root.glob("*"), key=os.path.getmtime)

    def list_backups(self) -> list:
        backups = []
        for d in sorted(self.backup_root.glob("*"), key=os.path.getmtime, reverse=True):
            if d.is_dir():
                backups.append({
                    "name": d.name,
                    "path": str(d),
                    "created": datetime.fromtimestamp(os.path.getmtime(d)),
                    "size": sum(f.stat().st_size for f in d.glob("**/*") if f.is_file())
                })
        return backups

    def restore_backup(self, backup_path: str, target_dir: str) -> bool:
        src = Path(backup_path)
        dst = Path(target_dir)
        if not src.exists():
            return False
        dst.mkdir(parents=True, exist_ok=True)
        for f in src.glob("*"):
            shutil.copy2(f, dst / f.name)
        return True
