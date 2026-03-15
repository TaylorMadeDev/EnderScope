"""Pure-Python whitelist verifier using the Minecraft handshake protocol.

Attempts a login-handshake against the server and inspects the kick payload.
If the server responds with a disconnect containing whitelist-related text,
the server is marked as WHITELISTED; any other kick or successful continuation
is treated as NOT_WHITELISTED.
"""
from __future__ import annotations

import logging
import socket
import struct
import threading
from typing import Callable

from backend.core.models import BotAccount, ServerResult, ServerStatus

logger = logging.getLogger(__name__)

_WHITELIST_KEYWORDS = (
    "whitelist",
    "not whitelisted",
    "not on the whitelist",
    "you are not whitelisted",
    "whitelist only",
)


class WhitelistVerifier:
    """Verify servers against whitelist by attempting a cracked-mode login."""

    def __init__(self, threads: int = 10, timeout: float = 5.0) -> None:
        self._threads = threads
        self._timeout = timeout
        self._cancelled = False

    def cancel(self) -> None:
        self._cancelled = True

    # ------------------------------------------------------------------
    # Public entry point
    # ------------------------------------------------------------------

    def verify_list(
        self,
        servers: list[ServerResult],
        accounts: list[BotAccount],
        result_cb: Callable[[ServerResult], None],
        progress_cb: Callable[[int, int], None] | None = None,
    ) -> None:
        """Check each server, updating its whitelist status in-place."""
        self._cancelled = False
        total = len(servers)
        done = 0
        lock = threading.Lock()

        account = accounts[0] if accounts else BotAccount(username="Steve")

        import queue
        q: queue.Queue[ServerResult] = queue.Queue()
        for s in servers:
            q.put(s)

        def worker() -> None:
            nonlocal done
            while not self._cancelled:
                try:
                    server = q.get_nowait()
                except Exception:  # noqa: BLE001
                    break
                updated = self._check(server, account)
                result_cb(updated)
                with lock:
                    done += 1
                    if progress_cb:
                        progress_cb(done, total)
                q.task_done()

        threads = [
            threading.Thread(target=worker, daemon=True)
            for _ in range(min(self._threads, total or 1))
        ]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

    # ------------------------------------------------------------------
    # Per-server check
    # ------------------------------------------------------------------

    def _check(self, server: ServerResult, account: BotAccount) -> ServerResult:
        try:
            kick_msg = self._send_login(server.ip, server.port, account.username)
            if kick_msg is None:
                server.whitelist = False
                server.status = ServerStatus.NOT_WHITELISTED
            elif any(kw in kick_msg.lower() for kw in _WHITELIST_KEYWORDS):
                server.whitelist = True
                server.status = ServerStatus.WHITELISTED
            else:
                server.whitelist = False
                server.status = ServerStatus.NOT_WHITELISTED
                server.notes = kick_msg[:120]
        except Exception as exc:  # noqa: BLE001
            server.status = ServerStatus.ERROR
            server.notes = str(exc)[:120]
        return server

    def _send_login(self, ip: str, port: int, username: str) -> str | None:
        """Send a Minecraft 1.20 handshake + login-start packet and return kick text."""
        with socket.create_connection((ip, port), timeout=self._timeout) as sock:
            # -- Handshake (state=2 for Login) --
            proto_version = 763  # MC 1.20
            hostname_bytes = ip.encode("utf-8")
            handshake = (
                _varint(0x00)  # packet id
                + _varint(proto_version)
                + _varint(len(hostname_bytes))
                + hostname_bytes
                + struct.pack(">H", port)
                + _varint(2)  # next state = Login
            )
            sock.sendall(_frame(handshake))

            # -- LoginStart --
            name_bytes = username.encode("utf-8")
            login_start = _varint(0x00) + _varint(len(name_bytes)) + name_bytes
            sock.sendall(_frame(login_start))

            # -- Read response --
            raw = _read_packet(sock)
            if not raw:
                return None
            packet_id = raw[0]
            # 0x00 = Disconnect (Login), 0x02 = Login Success
            if packet_id == 0x00:
                # String: varint len + UTF-8 bytes
                try:
                    json_str, _ = _read_string(raw, 1)
                    import json
                    obj = json.loads(json_str)
                    if isinstance(obj, dict):
                        return obj.get("text", json_str)
                    return str(obj)
                except Exception:  # noqa: BLE001
                    return raw[1:].decode("utf-8", errors="replace")
            # Login success or other — not whitelisted
            return None


# ---------------------------------------------------------------------------
# Protocol helpers
# ---------------------------------------------------------------------------

def _varint(value: int) -> bytes:
    """Encode an integer as a Minecraft VarInt."""
    out = bytearray()
    while True:
        byte = value & 0x7F
        value >>= 7
        if value:
            byte |= 0x80
        out.append(byte)
        if not value:
            break
    return bytes(out)


def _frame(data: bytes) -> bytes:
    """Prepend a VarInt length prefix."""
    return _varint(len(data)) + data


def _read_varint(sock: socket.socket) -> int:
    value = 0
    shift = 0
    while True:
        b = sock.recv(1)
        if not b:
            raise ConnectionError("Connection closed reading VarInt")
        byte = b[0]
        value |= (byte & 0x7F) << shift
        shift += 7
        if not (byte & 0x80):
            break
    return value


def _read_packet(sock: socket.socket) -> bytes | None:
    try:
        length = _read_varint(sock)
        data = bytearray()
        while len(data) < length:
            chunk = sock.recv(length - len(data))
            if not chunk:
                break
            data.extend(chunk)
        if not data:
            return None
        return bytes(data)
    except OSError:
        return None


def _read_string(data: bytes, offset: int) -> tuple[str, int]:
    strlen, consumed = _decode_varint(data, offset)
    end = offset + consumed + strlen
    return data[offset + consumed:end].decode("utf-8", errors="replace"), end


def _decode_varint(data: bytes, offset: int) -> tuple[int, int]:
    value = 0
    shift = 0
    i = offset
    while True:
        byte = data[i]
        i += 1
        value |= (byte & 0x7F) << shift
        shift += 7
        if not (byte & 0x80):
            break
    return value, i - offset
