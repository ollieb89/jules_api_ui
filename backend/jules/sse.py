from __future__ import annotations

import logging
import time

from rest_framework.exceptions import ValidationError

logger = logging.getLogger(__name__)


def validate_interval(
    value: str | float | int | None,
    default: float,
    minimum: float,
    maximum: float,
    param_name: str = "poll_interval",
) -> float:
    """
    Validate and clamp polling intervals.
    Raises ValidationError if the value is not a valid number.
    """
    if value is None:
        return default

    try:
        float_val = float(value)
    except (ValueError, TypeError):
        raise ValidationError({param_name: "Must be a valid number."})

    return max(minimum, min(float_val, maximum))


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
