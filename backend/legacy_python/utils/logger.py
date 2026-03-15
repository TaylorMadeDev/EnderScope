"""Logging configuration: dual output to rotating file and in-memory GUI handler."""
from __future__ import annotations

import logging
import logging.handlers
from pathlib import Path
from typing import Callable

_GUI_HANDLER: "_SignalHandler | None" = None


class _SignalHandler(logging.Handler):
    """Logging handler that forwards records to a callable (e.g. a Qt signal)."""

    def __init__(self, callback: Callable[[str], None]) -> None:
        super().__init__()
        self._callback = callback

    def emit(self, record: logging.LogRecord) -> None:
        try:
            self._callback(self.format(record))
        except Exception:  # noqa: BLE001
            self.handleError(record)


def setup_logging(
    log_path: Path,
    level: int = logging.DEBUG,
    max_bytes: int = 5 * 1024 * 1024,
    backup_count: int = 3,
) -> None:
    """Configure root logger with a rotating file handler."""
    log_path.parent.mkdir(parents=True, exist_ok=True)
    fmt = logging.Formatter(
        "%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    file_handler = logging.handlers.RotatingFileHandler(
        log_path, maxBytes=max_bytes, backupCount=backup_count, encoding="utf-8"
    )
    file_handler.setFormatter(fmt)

    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(fmt)
    stream_handler.setLevel(logging.WARNING)

    root = logging.getLogger()
    root.setLevel(level)
    root.addHandler(file_handler)
    root.addHandler(stream_handler)


def attach_gui_handler(callback: Callable[[str], None]) -> None:
    """Attach a GUI sink so log records are forwarded to the Logs tab."""
    global _GUI_HANDLER  # noqa: PLW0603
    fmt = logging.Formatter(
        "%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
        datefmt="%H:%M:%S",
    )
    handler = _SignalHandler(callback)
    handler.setFormatter(fmt)
    _GUI_HANDLER = handler
    logging.getLogger().addHandler(handler)


def detach_gui_handler() -> None:
    global _GUI_HANDLER  # noqa: PLW0603
    if _GUI_HANDLER is not None:
        logging.getLogger().removeHandler(_GUI_HANDLER)
        _GUI_HANDLER = None
