"""Persistent JSON configuration manager."""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

DEFAULTS: dict[str, Any] = {
    "shodan_api_key": "",
    "discord_webhook_url": "",
    "mc_version": "1.20",
    "shodan_extra_query": "smp",
    "shodan_max_results": 100,
    "scan_timeout": 5,
    "proxy_list": [],
    "bot_accounts": [],
    "output_dir": "backend/data/output",
    "theme": "dark",
    "auto_notify_discord": False,
    "max_bruteforce_threads": 50,
    "whitelist_check_threads": 10,
}


class ConfigManager:
    """Load, save, and access configuration stored as a JSON file."""

    def __init__(self, config_path: Path) -> None:
        self._path = Path(config_path)
        self._data: dict[str, Any] = dict(DEFAULTS)
        self._load()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _load(self) -> None:
        if self._path.exists():
            try:
                loaded = json.loads(self._path.read_text(encoding="utf-8"))
                if isinstance(loaded, dict):
                    self._data.update(loaded)
                    logger.debug("Config loaded from %s", self._path)
            except (json.JSONDecodeError, OSError) as exc:
                logger.warning("Could not load config: %s – using defaults.", exc)
        else:
            self.save()  # write defaults on first run

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def save(self) -> None:
        try:
            self._path.parent.mkdir(parents=True, exist_ok=True)
            self._path.write_text(
                json.dumps(self._data, indent=2), encoding="utf-8"
            )
            logger.debug("Config saved to %s", self._path)
        except OSError as exc:
            logger.error("Failed to save config: %s", exc)

    def get(self, key: str, default: Any = None) -> Any:
        return self._data.get(key, default)

    def set(self, key: str, value: Any) -> None:
        self._data[key] = value

    def update(self, data: dict[str, Any]) -> None:
        self._data.update(data)

    def as_dict(self) -> dict[str, Any]:
        return dict(self._data)

    # ------------------------------------------------------------------
    # Convenience typed properties
    # ------------------------------------------------------------------

    @property
    def shodan_api_key(self) -> str:
        return self._data.get("shodan_api_key", "")

    @property
    def discord_webhook_url(self) -> str:
        return self._data.get("discord_webhook_url", "")

    @property
    def mc_version(self) -> str:
        return self._data.get("mc_version", "1.20")

    @property
    def output_dir(self) -> Path:
        return Path(self._data.get("output_dir", "backend/data/output"))

    @property
    def proxy_list(self) -> list[str]:
        return self._data.get("proxy_list", [])

    @property
    def bot_accounts(self) -> list[dict[str, str]]:
        return self._data.get("bot_accounts", [])
