"""Facility management: list, create (empty), and switch the active facility."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Facility
from . import set_active_facility

router = APIRouter(prefix="/api/facilities", tags=["facilities"])


def _serialize(f: Facility) -> dict:
    return {"id": f.id, "name": f.name, "facility_type": f.facility_type, "location": f.location, "is_active": f.is_active}


@router.get("")
def list_facilities(session: Session = Depends(get_db)):
    return {"items": [_serialize(f) for f in session.query(Facility).order_by(Facility.id).all()]}


class FacilityCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    facility_type: str = Field(min_length=1, max_length=80)
    location: str = Field(min_length=1, max_length=120)


@router.post("", status_code=201)
def create_facility(body: FacilityCreate, session: Session = Depends(get_db)):
    """Create an empty facility (no synthetic data). Dashboards show only what
    the user enters via the asset/energy endpoints."""
    facility = Facility(name=body.name.strip(), facility_type=body.facility_type.strip(), location=body.location.strip(), is_active=True)
    session.add(facility)
    session.flush()
    set_active_facility(session, facility.id)
    session.commit()
    return _serialize(facility)


@router.post("/{facility_id}/activate")
def activate_facility(facility_id: int, session: Session = Depends(get_db)):
    facility = session.get(Facility, facility_id)
    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")
    set_active_facility(session, facility_id)
    session.commit()
    return _serialize(facility)
