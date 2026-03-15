"""Input validation helpers."""
from __future__ import annotations

import re
import socket

_IP_RE = re.compile(
    r"^(25[0-5]|2[0-4]\d|[01]?\d\d?)\."
    r"(25[0-5]|2[0-4]\d|[01]?\d\d?)\."
    r"(25[0-5]|2[0-4]\d|[01]?\d\d?)\."
    r"(25[0-5]|2[0-4]\d|[01]?\d\d?)$"
)
_CIDR_RE = re.compile(r"^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/(\d{1,2})$")


def is_valid_ip(ip: str) -> bool:
    return bool(_IP_RE.match(ip.strip()))


def is_valid_port(port: int | str) -> bool:
    try:
        return 1 <= int(port) <= 65535
    except (ValueError, TypeError):
        return False


def is_valid_cidr(cidr: str) -> bool:
    m = _CIDR_RE.match(cidr.strip())
    if not m:
        return False
    prefix = int(m.group(2))
    return 0 <= prefix <= 32


def is_valid_webhook_url(url: str) -> bool:
    return url.startswith("https://discord.com/api/webhooks/")


def resolve_host(host: str) -> str | None:
    """Return IPv4 string for *host*, or None on failure."""
    try:
        return socket.gethostbyname(host)
    except socket.gaierror:
        return None
