"""Plugin finder stub — placeholder for future-proofing.

When implemented this module will query servers for their installed plugins
via the MC RCON protocol or by parsing the server's status response.
"""
from __future__ import annotations

import logging
from typing import Callable

from backend.core.models import ServerResult

logger = logging.getLogger(__name__)


class PluginFinder:
    """[STUB] Attempt to enumerate plugins installed on a Minecraft server."""

    def find(
        self,
        server: ServerResult,
        result_cb: Callable[[str, list[str]], None] | None = None,
    ) -> list[str]:
        """Return a list of detected plugin names (currently always empty)."""
        logger.info(
            "PluginFinder: stub called for %s — not yet implemented.", server.address
        )
        plugins: list[str] = []
        if result_cb:
            result_cb(server.address, plugins)
        return plugins
