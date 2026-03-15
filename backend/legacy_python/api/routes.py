"""All REST API routes for ServerBuster."""
from __future__ import annotations

import logging
import threading
import uuid
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException

from backend.api.schemas import (
    BruteforceRequest,
    SettingsUpdate,
    ShodanSearchRequest,
    TaskResponse,
    WhitelistCheckRequest,
)
from backend.core.bruteforcer import Bruteforcer
from backend.core.config_manager import ConfigManager
from backend.core.discord_notifier import DiscordNotifier
from backend.core.models import BotAccount, ServerResult
from backend.core.shodan_searcher import ShodanSearcher
from backend.core.whitelist_verifier import WhitelistVerifier

logger = logging.getLogger(__name__)
router = APIRouter()

# ---------------------------------------------------------------------------
# Shared state
# ---------------------------------------------------------------------------
_tasks: dict[str, dict[str, Any]] = {}
_config = ConfigManager(
    config_path=Path(__file__).resolve().parents[1] / "data" / "config" / "config.json"
)
_log_buffer: list[str] = []
_LOG_MAX = 500


class _BufferHandler(logging.Handler):
    def emit(self, record: logging.LogRecord) -> None:
        msg = self.format(record)
        _log_buffer.append(msg)
        if len(_log_buffer) > _LOG_MAX:
            del _log_buffer[: len(_log_buffer) - _LOG_MAX]


_bh = _BufferHandler()
_bh.setFormatter(logging.Formatter("%(asctime)s  %(levelname)-8s  %(name)s — %(message)s", datefmt="%H:%M:%S"))
logging.getLogger().addHandler(_bh)


def _new_task(task_type: str) -> str:
    tid = uuid.uuid4().hex[:8]
    _tasks[tid] = {
        "id": tid,
        "type": task_type,
        "status": "running",
        "progress": 0,
        "results": [],
        "error": "",
    }
    return tid


# ---------------------------------------------------------------------------
# Task polling
# ---------------------------------------------------------------------------
@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str):
    task = _tasks.get(task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    return task


@router.post("/tasks/{task_id}/cancel")
async def cancel_task(task_id: str):
    task = _tasks.get(task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    task["status"] = "cancelled"
    return {"ok": True}


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------
@router.get("/dashboard/stats")
async def dashboard_stats():
    all_results = []
    for t in _tasks.values():
        all_results.extend(t.get("results", []))

    open_count = sum(
        1 for r in all_results if r.get("status") in ("open", "not_whitelisted")
    )
    wl_count = sum(1 for r in all_results if r.get("status") == "whitelisted")

    return {
        "servers_discovered": len(all_results),
        "open_servers": open_count,
        "whitelisted": wl_count,
        "scans_completed": sum(
            1 for t in _tasks.values() if t["status"] == "completed"
        ),
        "tasks": [
            {"id": t["id"], "type": t["type"], "status": t["status"], "progress": t["progress"]}
            for t in list(_tasks.values())[-20:]
        ],
    }


# ---------------------------------------------------------------------------
# Shodan search
# ---------------------------------------------------------------------------
@router.post("/shodan/search")
async def shodan_search(req: ShodanSearchRequest):
    api_key = req.api_key or _config.shodan_api_key
    if not api_key:
        raise HTTPException(400, "Shodan API key is not configured. Set it in Settings first.")

    tid = _new_task("shodan")

    def _run() -> None:
        try:
            searcher = ShodanSearcher(api_key=api_key)
            results: list[dict] = []
            for sr in searcher.search(
                mc_version=req.version,
                extra_query=req.extra_query,
                max_results=req.max_results,
            ):
                if _tasks[tid]["status"] == "cancelled":
                    break
                results.append(sr.to_dict())
                _tasks[tid]["results"] = list(results)
                _tasks[tid]["progress"] = min(len(results) * 100 // max(req.max_results, 1), 100)
            _tasks[tid]["status"] = "completed"
            _tasks[tid]["progress"] = 100
        except Exception as exc:
            logger.exception("Shodan search error")
            _tasks[tid]["status"] = "failed"
            _tasks[tid]["error"] = str(exc)

    threading.Thread(target=_run, daemon=True).start()
    return {"task_id": tid}


# ---------------------------------------------------------------------------
# Bruteforce
# ---------------------------------------------------------------------------
@router.post("/bruteforce/scan")
async def bruteforce_scan(req: BruteforceRequest):
    targets = Bruteforcer.parse_targets(req.targets)
    if not targets:
        raise HTTPException(400, "No valid targets provided.")

    tid = _new_task("bruteforce")

    def _run() -> None:
        try:
            bf = Bruteforcer(max_threads=req.threads)
            results: list[dict] = []

            def _on_result(sr: ServerResult) -> None:
                results.append(sr.to_dict())
                _tasks[tid]["results"] = list(results)

            def _on_progress(done: int, total: int) -> None:
                _tasks[tid]["progress"] = int(done / max(total, 1) * 100)
                if _tasks[tid]["status"] == "cancelled":
                    bf.cancel()

            bf.scan(targets=targets, result_cb=_on_result, progress_cb=_on_progress)
            _tasks[tid]["status"] = "completed"
            _tasks[tid]["progress"] = 100
        except Exception as exc:
            logger.exception("Bruteforce error")
            _tasks[tid]["status"] = "failed"
            _tasks[tid]["error"] = str(exc)

    threading.Thread(target=_run, daemon=True).start()
    return {"task_id": tid}


# ---------------------------------------------------------------------------
# Whitelist check
# ---------------------------------------------------------------------------
@router.post("/whitelist/check")
async def whitelist_check(req: WhitelistCheckRequest):
    if not req.servers:
        raise HTTPException(400, "No servers provided.")

    tid = _new_task("whitelist")
    webhook = _config.discord_webhook_url

    def _run() -> None:
        try:
            servers: list[ServerResult] = []
            for entry in req.servers:
                parts = entry.rsplit(":", 1)
                ip = parts[0]
                port = int(parts[1]) if len(parts) > 1 else 25565
                servers.append(ServerResult(ip=ip, port=port))

            accounts: list[BotAccount] = []
            if req.accounts:
                for a in req.accounts:
                    accounts.append(
                        BotAccount(
                            username=a.get("username", "Steve"),
                            password=a.get("password", ""),
                            premium=a.get("premium", False),
                        )
                    )
            if not accounts:
                accounts = [BotAccount(username="Steve")]

            verifier = WhitelistVerifier(threads=_config.get("whitelist_check_threads", 10))
            results: list[dict] = []

            def _on_result(sr: ServerResult) -> None:
                results.append(sr.to_dict())
                _tasks[tid]["results"] = list(results)
                if not sr.whitelist and webhook:
                    try:
                        DiscordNotifier(webhook).notify_single(sr)
                    except Exception:
                        pass

            def _on_progress(done: int, total: int) -> None:
                _tasks[tid]["progress"] = int(done / max(total, 1) * 100)
                if _tasks[tid]["status"] == "cancelled":
                    verifier.cancel()

            verifier.verify_list(
                servers=servers,
                accounts=accounts,
                result_cb=_on_result,
                progress_cb=_on_progress,
            )
            _tasks[tid]["status"] = "completed"
            _tasks[tid]["progress"] = 100
        except Exception as exc:
            logger.exception("Whitelist check error")
            _tasks[tid]["status"] = "failed"
            _tasks[tid]["error"] = str(exc)

    threading.Thread(target=_run, daemon=True).start()
    return {"task_id": tid}


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------
@router.get("/settings")
async def get_settings():
    return _config.as_dict()


@router.put("/settings")
async def update_settings(req: SettingsUpdate):
    updates = {k: v for k, v in req.model_dump().items() if v is not None}
    _config.update(updates)
    _config.save()
    return {"ok": True, "settings": _config.as_dict()}


# ---------------------------------------------------------------------------
# Logs
# ---------------------------------------------------------------------------
@router.get("/logs")
async def get_logs():
    return {"logs": list(_log_buffer)}
