from __future__ import annotations

import logging
import time

logger = logging.getLogger(__name__)


def clamp_interval(value: float, minimum: float, maximum: float) -> float:
    """Clamp polling intervals to keep SSE loops from spinning too quickly."""
    return max(minimum, min(value, maximum))


def should_close_stream(started_at: float, max_seconds: int, label: str) -> bool:
    """Return True when the stream exceeds its max lifetime."""
    if max_seconds <= 0:
        return False
    elapsed = time.monotonic() - started_at
    if elapsed >= max_seconds:
        logger.info(
            "Closing SSE stream %s after %.2f seconds (limit %s).",
            label,
            elapsed,
            max_seconds,
        )
        return True
    return False
