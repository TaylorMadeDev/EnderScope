"""Generic QThread worker scaffolding used by all long-running tasks."""
from __future__ import annotations

import logging
from typing import Any, Callable

from PySide6.QtCore import QObject, QRunnable, QThread, Signal, Slot

logger = logging.getLogger(__name__)


class WorkerSignals(QObject):
    """Signals emitted by a :class:`Worker` runnable."""

    started = Signal()
    finished = Signal()
    error = Signal(str)
    progress = Signal(int)       # 0-100
    result = Signal(object)      # any single result item
    log = Signal(str)            # human-readable status string


class Worker(QRunnable):
    """Run *fn* in a thread-pool thread, forwarding results via signals."""

    def __init__(self, fn: Callable[..., Any], *args: Any, **kwargs: Any) -> None:
        super().__init__()
        self.fn = fn
        self.args = args
        self.kwargs = kwargs
        self.signals = WorkerSignals()
        self._cancelled = False

    def cancel(self) -> None:
        self._cancelled = True

    @Slot()
    def run(self) -> None:
        self.signals.started.emit()
        try:
            result = self.fn(*self.args, **self.kwargs)
            self.signals.result.emit(result)
        except Exception as exc:  # noqa: BLE001
            logger.exception("Worker error: %s", exc)
            self.signals.error.emit(str(exc))
        finally:
            self.signals.finished.emit()


class TaskThread(QThread):
    """Dedicated QThread wrapping a callable – suitable for persistent tasks."""

    progress = Signal(int)
    result = Signal(object)
    error = Signal(str)
    log_message = Signal(str)
    finished_ok = Signal()

    def __init__(
        self,
        fn: Callable[..., Any],
        *args: Any,
        **kwargs: Any,
    ) -> None:
        super().__init__()
        self._fn = fn
        self._args = args
        self._kwargs = kwargs
        self._cancelled = False

    def cancel(self) -> None:
        self._cancelled = True

    def run(self) -> None:
        try:
            self._fn(*self._args, **self._kwargs)
            self.finished_ok.emit()
        except Exception as exc:  # noqa: BLE001
            logger.exception("TaskThread error: %s", exc)
            self.error.emit(str(exc))
