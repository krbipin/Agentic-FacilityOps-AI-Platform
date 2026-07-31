"""Shared helpers for the FacilityOps agents."""
from __future__ import annotations

from sqlalchemy.orm import Session

SEED = 20260731


def health_scores() -> dict[str, int]:
    """Canonical per-agent health scores (M4 canonical data)."""
    return {
        "energy": 88,
        "maintenance": 91,
        "occupancy": 85,
        "security": 79,
        "cost": 93,
    }


def load_assets_df(session: Session):
    import pandas as pd
    from sqlalchemy import text

    rows = []
    for a in session.execute(
        text(
            "SELECT id, name, asset_type, status, health_score, useful_life_pct, "
            "julianday('now') - julianday(last_maintenance) AS days_since "
            "FROM assets"
        )
    ).mappings():
        rows.append(dict(a))
    return pd.DataFrame(rows)
