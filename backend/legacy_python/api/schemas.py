"""Pydantic request/response schemas for the API."""
from __future__ import annotations

from pydantic import BaseModel


class ShodanSearchRequest(BaseModel):
    version: str = "1.20"
    extra_query: str = "smp"
    max_results: int = 100
    api_key: str = ""


class BruteforceRequest(BaseModel):
    targets: str  # newline-separated IPs / CIDRs
    threads: int = 50


class WhitelistCheckRequest(BaseModel):
    servers: list[str]  # ["ip:port", ...]
    accounts: list[dict] | None = None


class SettingsUpdate(BaseModel):
    shodan_api_key: str | None = None
    discord_webhook_url: str | None = None
    mc_version: str | None = None
    shodan_extra_query: str | None = None
    shodan_max_results: int | None = None
    max_bruteforce_threads: int | None = None
    whitelist_check_threads: int | None = None
    scan_timeout: int | None = None
    proxy_list: list[str] | None = None
    bot_accounts: list[dict] | None = None


class TaskResponse(BaseModel):
    id: str
    type: str
    status: str
    progress: int
    results: list[dict]
    error: str
