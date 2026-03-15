"""Discord webhook notifier."""
from __future__ import annotations

import logging
from typing import Sequence

import requests

from backend.core.models import ServerResult

logger = logging.getLogger(__name__)

_MAX_EMBED_FIELDS = 25


class DiscordNotifier:
    """Send server find notifications via a Discord webhook."""

    def __init__(self, webhook_url: str, timeout: float = 10.0) -> None:
        self._url = webhook_url
        self._timeout = timeout

    def is_configured(self) -> bool:
        return bool(self._url and self._url.startswith("https://discord.com/api/webhooks/"))

    def notify_single(self, server: ServerResult) -> bool:
        """Send a single server result embed."""
        if not self.is_configured():
            logger.warning("Discord webhook not configured — skipping notification.")
            return False

        whitelist_str = (
            "\u2705 Open" if server.whitelist is False
            else ("\u274c Whitelisted" if server.whitelist else "\u2753 Unknown")
        )

        embed = {
            "title": f"\U0001f30d New Server Found: {server.address}",
            "color": 0x00FF88 if not server.whitelist else 0xFF4444,
            "fields": [
                {"name": "IP:Port", "value": server.address, "inline": True},
                {"name": "Version", "value": server.version or "unknown", "inline": True},
                {"name": "MOTD", "value": server.motd[:256] or "—", "inline": False},
                {"name": "Players", "value": f"{server.players_online}/{server.players_max}", "inline": True},
                {"name": "Whitelist", "value": whitelist_str, "inline": True},
                {"name": "Source", "value": server.source, "inline": True},
            ],
        }
        return self._post({"embeds": [embed]})

    def notify_batch(self, servers: Sequence[ServerResult]) -> bool:
        """Send a summary embed for multiple servers."""
        if not self.is_configured():
            return False

        fields = [
            {
                "name": s.address,
                "value": "`{}` \u2014 {}".format(s.version, "\u2705" if not s.whitelist else "\u274c"),
                "inline": True,
            }
            for s in servers[:_MAX_EMBED_FIELDS]
        ]
        embed = {
            "title": f"\U0001f4e1 ServerBuster found {len(servers)} server(s)",
            "color": 0x5865F2,
            "fields": fields,
        }
        return self._post({"embeds": [embed]})

    def _post(self, payload: dict) -> bool:
        try:
            response = requests.post(
                self._url, json=payload, timeout=self._timeout
            )
            response.raise_for_status()
            return True
        except requests.RequestException as exc:
            logger.error("Discord notification failed: %s", exc)
            return False
