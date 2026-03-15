"""Shodan-powered Minecraft server discovery."""
from __future__ import annotations

import logging
from typing import Callable, Iterator

from backend.core.models import ServerResult, ServerStatus

logger = logging.getLogger(__name__)


class ShodanSearcher:
    """Search Shodan for Minecraft servers matching a version and optional keywords."""

    def __init__(self, api_key: str) -> None:
        self._api_key = api_key
        self._shodan = None
        self._cancelled = False

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def _get_api(self):
        """Lazy-initialise the Shodan client."""
        if self._shodan is None:
            try:
                import shodan  # type: ignore[import]
                self._shodan = shodan.Shodan(self._api_key)
            except ImportError as exc:
                raise RuntimeError(
                    "The 'shodan' package is not installed. Run: pip install shodan"
                ) from exc
        return self._shodan

    def cancel(self) -> None:
        self._cancelled = True

    # ------------------------------------------------------------------
    # Core search
    # ------------------------------------------------------------------

    def search(
        self,
        mc_version: str,
        extra_query: str = "",
        max_results: int = 100,
        progress_cb: Callable[[int, int], None] | None = None,
    ) -> Iterator[ServerResult]:
        """Yield :class:`ServerResult` objects, calling *progress_cb(done, total)*."""
        self._cancelled = False

        if not self._api_key:
            raise ValueError("Shodan API key is not configured.")

        api = self._get_api()

        query_parts = [f'"minecraft" port:25565']
        if mc_version:
            query_parts.append(f'"{mc_version}"')
        if extra_query.strip():
            query_parts.append(extra_query.strip())
        query = " ".join(query_parts)

        logger.info("Shodan query: %s (max=%d)", query, max_results)

        try:
            total_seen = 0
            for match in api.search_cursor(query):
                if self._cancelled:
                    logger.info("Shodan search cancelled by user.")
                    return

                result = self._parse_match(match)
                total_seen += 1

                if progress_cb:
                    progress_cb(total_seen, max_results)

                yield result

                if total_seen >= max_results:
                    break

        except Exception as exc:  # noqa: BLE001
            logger.error("Shodan search error: %s", exc)
            raise

    @staticmethod
    def _parse_match(match: dict) -> ServerResult:
        ip = match.get("ip_str", "")
        port = match.get("port", 25565)
        data = match.get("data", "")

        mc_data = match.get("minecraft", {})
        version = ""
        motd = ""
        players_online = 0
        players_max = 0

        if mc_data:
            version = mc_data.get("version", {}).get("name", "")
            desc = mc_data.get("description", "")
            if isinstance(desc, dict):
                motd = desc.get("text", "")
            elif isinstance(desc, str):
                motd = desc
            players = mc_data.get("players", {})
            players_online = players.get("online", 0)
            players_max = players.get("max", 0)
        else:
            # Fallback: parse raw banner
            for line in data.split("\n"):
                if "Version" in line:
                    version = line.split(":", 1)[-1].strip()

        return ServerResult(
            ip=ip,
            port=port,
            version=version,
            motd=motd,
            players_online=players_online,
            players_max=players_max,
            status=ServerStatus.OPEN,
            source="shodan",
        )
