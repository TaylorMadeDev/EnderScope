"""Export helpers: ServerResult list → CSV or JSON file."""
from __future__ import annotations

import csv
import json
import logging
from pathlib import Path
from typing import Sequence

from backend.core.models import ServerResult

logger = logging.getLogger(__name__)


def export_csv(results: Sequence[ServerResult], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not results:
        logger.warning("export_csv called with empty results list")
        return
    fieldnames = list(results[0].to_dict().keys())
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        for r in results:
            writer.writerow(r.to_dict())
    logger.info("Exported %d rows to %s", len(results), path)


def export_json(results: Sequence[ServerResult], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    data = [r.to_dict() for r in results]
    with path.open("w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2)
    logger.info("Exported %d records to %s", len(results), path)
