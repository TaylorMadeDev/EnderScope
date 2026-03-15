"""Shared data-transfer objects (dataclasses) used across the application."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class ServerStatus(str, Enum):
    UNKNOWN = "unknown"
    OPEN = "open"
    CLOSED = "closed"
    WHITELISTED = "whitelisted"
    NOT_WHITELISTED = "not_whitelisted"
    ERROR = "error"


@dataclass
class ServerResult:
    ip: str
    port: int = 25565
    version: str = ""
    motd: str = ""
    players_online: int = 0
    players_max: int = 0
    status: ServerStatus = ServerStatus.UNKNOWN
    whitelist: bool | None = None
    latency_ms: float = 0.0
    discovered_at: datetime = field(default_factory=datetime.utcnow)
    source: str = "shodan"  # 'shodan' | 'bruteforce'
    notes: str = ""

    @property
    def address(self) -> str:
        return f"{self.ip}:{self.port}"

    def to_dict(self) -> dict:
        return {
            "ip": self.ip,
            "port": self.port,
            "version": self.version,
            "motd": self.motd,
            "players_online": self.players_online,
            "players_max": self.players_max,
            "status": self.status.value,
            "whitelist": self.whitelist,
            "latency_ms": self.latency_ms,
            "discovered_at": self.discovered_at.isoformat(),
            "source": self.source,
            "notes": self.notes,
        }


@dataclass
class BotAccount:
    username: str
    password: str = ""  # empty = offline/cracked account
    premium: bool = False

    def __str__(self) -> str:
        mode = "premium" if self.premium else "offline"
        return f"{self.username} ({mode})"


@dataclass
class ProxyEntry:
    host: str
    port: int
    proxy_type: str = "http"  # 'http' | 'socks4' | 'socks5'
    username: str = ""
    password: str = ""

    def __str__(self) -> str:
        return f"{self.proxy_type}://{self.host}:{self.port}"
