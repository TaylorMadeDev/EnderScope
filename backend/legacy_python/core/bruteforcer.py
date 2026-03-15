"""TCP port-scanner / brute-forcer for Minecraft servers."""
from __future__ import annotations

import ipaddress
import logging
import queue
import socket
import threading
from typing import Callable, Iterator

from backend.core.models import ServerResult, ServerStatus

logger = logging.getLogger(__name__)

_DEFAULT_PORT = 25565
_PING_TIMEOUT = 3.0


class Bruteforcer:
    """Scan a list of IPs/CIDR ranges for open Minecraft servers."""

    def __init__(self, max_threads: int = 50) -> None:
        self._max_threads = max_threads
        self._cancelled = False

    def cancel(self) -> None:
        self._cancelled = True

    # ------------------------------------------------------------------
    # Target generation
    # ------------------------------------------------------------------

    @staticmethod
    def parse_targets(raw: str) -> list[tuple[str, int]]:
        """Parse newline/comma-separated IPs, CIDR ranges, and ip:port entries."""
        targets: list[tuple[str, int]] = []
        for item in raw.replace(",", "\n").splitlines():
            item = item.strip()
            if not item or item.startswith("#"):
                continue
            if "/" in item:
                try:
                    for ip in ipaddress.ip_network(item, strict=False):
                        targets.append((str(ip), _DEFAULT_PORT))
                except ValueError:
                    logger.warning("Invalid CIDR: %s", item)
            elif ":" in item:
                host, port_str = item.rsplit(":", 1)
                try:
                    targets.append((host, int(port_str)))
                except ValueError:
                    logger.warning("Invalid port in: %s", item)
            else:
                targets.append((item, _DEFAULT_PORT))
        return targets

    # ------------------------------------------------------------------
    # Scan
    # ------------------------------------------------------------------

    def scan(
        self,
        targets: list[tuple[str, int]],
        result_cb: Callable[[ServerResult], None],
        progress_cb: Callable[[int, int], None] | None = None,
    ) -> None:
        """Scan *targets* concurrently, calling *result_cb* for every responsive host."""
        self._cancelled = False
        total = len(targets)
        done_count = 0
        lock = threading.Lock()
        q: queue.Queue[tuple[str, int]] = queue.Queue()

        for t in targets:
            q.put(t)

        def worker() -> None:
            nonlocal done_count
            while not self._cancelled:
                try:
                    ip, port = q.get_nowait()
                except queue.Empty:
                    break
                result = self._probe(ip, port)
                if result:
                    result_cb(result)
                with lock:
                    done_count += 1
                    if progress_cb:
                        progress_cb(done_count, total)
                q.task_done()

        threads = [
            threading.Thread(target=worker, daemon=True)
            for _ in range(min(self._max_threads, total or 1))
        ]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

    @staticmethod
    def _probe(ip: str, port: int) -> ServerResult | None:
        """Attempt TCP connect; return ServerResult on success, None on failure."""
        try:
            with socket.create_connection((ip, port), timeout=_PING_TIMEOUT):
                pass
            return ServerResult(ip=ip, port=port, status=ServerStatus.OPEN, source="bruteforce")
        except OSError:
            return None
