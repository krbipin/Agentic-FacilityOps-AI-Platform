"""Small in-process TTL cache for expensive agent computations.

Prevents redundant model fits when several endpoints (Overview, Reports,
Copilot, Intelligence) each run the full agent mesh within one poll window.
Agent outputs therefore stay internally consistent for the TTL and still
update every poll.
"""
from __future__ import annotations

import time
from typing import Callable, TypeVar

T = TypeVar("T")

_store: dict[str, tuple[float, T]] = {}


def cached(key: str, ttl: float, fn: Callable[[], T]) -> T:
    now = time.monotonic()
    hit = _store.get(key)
    if hit and now - hit[0] < ttl:
        return hit[1]
    value = fn()
    _store[key] = (now, value)
    return value
