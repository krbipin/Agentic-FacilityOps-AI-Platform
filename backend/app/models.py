from datetime import date, datetime

from sqlalchemy import JSON, Boolean, Date, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class Facility(Base):
    __tablename__ = "facilities"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    facility_type: Mapped[str] = mapped_column(String(80))
    location: Mapped[str] = mapped_column(String(120))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    assets: Mapped[list["Asset"]] = relationship(back_populates="facility")


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[str] = mapped_column(String(16), primary_key=True)  # AST-1042
    facility_id: Mapped[int] = mapped_column(ForeignKey("facilities.id"))
    name: Mapped[str] = mapped_column(String(80))  # AHU-4
    asset_type: Mapped[str] = mapped_column(String(40))  # HVAC / Lighting / Pumps / Generators / Elevators / Access
    location: Mapped[str] = mapped_column(String(80))
    status: Mapped[str] = mapped_column(String(20))  # Excellent / Good / Warning / Critical
    health_score: Mapped[int] = mapped_column(Integer)
    install_date: Mapped[date] = mapped_column(Date)
    manufacturer: Mapped[str] = mapped_column(String(60))
    useful_life_pct: Mapped[float] = mapped_column(Float, default=100.0)
    last_maintenance: Mapped[date] = mapped_column(Date)
    next_due: Mapped[date | None] = mapped_column(Date, nullable=True)

    facility: Mapped[Facility] = relationship(back_populates="assets")
    maintenance: Mapped[list["MaintenanceRecord"]] = relationship(back_populates="asset")


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    asset_id: Mapped[str] = mapped_column(ForeignKey("assets.id"))
    issue_type: Mapped[str] = mapped_column(String(80))
    maintenance_date: Mapped[date] = mapped_column(Date)
    cost: Mapped[float] = mapped_column(Float)
    technician: Mapped[str] = mapped_column(String(40))
    status: Mapped[str] = mapped_column(String(20))

    asset: Mapped[Asset] = relationship(back_populates="maintenance")


class EnergyUsage(Base):
    __tablename__ = "energy_usage"

    id: Mapped[int] = mapped_column(primary_key=True)
    facility_id: Mapped[int] = mapped_column(ForeignKey("facilities.id"))
    timestamp: Mapped[datetime] = mapped_column(DateTime, index=True)
    electricity_kwh: Mapped[float] = mapped_column(Float)
    water_l: Mapped[float] = mapped_column(Float)
    hvac_kwh: Mapped[float] = mapped_column(Float)
    lighting_kwh: Mapped[float] = mapped_column(Float)
    equipment_kwh: Mapped[float] = mapped_column(Float)
    is_forecast: Mapped[bool] = mapped_column(Boolean, default=False)


class OccupancyRecord(Base):
    __tablename__ = "occupancy_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    facility_id: Mapped[int] = mapped_column(ForeignKey("facilities.id"))
    zone: Mapped[str] = mapped_column(String(40))  # Office Floors / Meeting Rooms / Common Areas / Parking
    occupancy_count: Mapped[int] = mapped_column(Integer)
    capacity: Mapped[int] = mapped_column(Integer)
    timestamp: Mapped[datetime] = mapped_column(DateTime, index=True)


class SecurityEvent(Base):
    __tablename__ = "security_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    facility_id: Mapped[int] = mapped_column(ForeignKey("facilities.id"))
    event_type: Mapped[str] = mapped_column(String(40))  # Unauthorized access / Badge clone / After-hours
    severity: Mapped[str] = mapped_column(String(10))  # Red / Amber / Blue
    title: Mapped[str] = mapped_column(String(120))
    location: Mapped[str] = mapped_column(String(80))
    timestamp: Mapped[datetime] = mapped_column(DateTime, index=True)
    status: Mapped[str] = mapped_column(String(20))  # Open / Investigating / Closed


class CostReport(Base):
    __tablename__ = "cost_reports"

    id: Mapped[int] = mapped_column(primary_key=True)
    facility_id: Mapped[int] = mapped_column(ForeignKey("facilities.id"))
    category: Mapped[str] = mapped_column(String(40))  # Energy / Maintenance / Security Ops / Administrative
    amount: Mapped[float] = mapped_column(Float)
    budget: Mapped[float] = mapped_column(Float)
    report_date: Mapped[date] = mapped_column(Date, index=True)


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(primary_key=True)
    facility_id: Mapped[int] = mapped_column(ForeignKey("facilities.id"))
    alert_type: Mapped[str] = mapped_column(String(40))  # Energy / Maintenance / Security / Occupancy / Cost
    severity: Mapped[str] = mapped_column(String(10))  # Critical / Warning / Info
    title: Mapped[str] = mapped_column(String(120))
    message: Mapped[str] = mapped_column(String(255))
    agent: Mapped[str] = mapped_column(String(40))
    status: Mapped[str] = mapped_column(String(20))  # Open / Acknowledged / Resolved
    channels: Mapped[list] = mapped_column(JSON, default=list)  # ["Email", "SMS", "Teams", "Slack"]
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class WorkOrder(Base):
    __tablename__ = "work_orders"

    id: Mapped[str] = mapped_column(String(16), primary_key=True)  # WO-1042
    asset_id: Mapped[str] = mapped_column(ForeignKey("assets.id"))
    title: Mapped[str] = mapped_column(String(120))
    issue_type: Mapped[str] = mapped_column(String(80))
    priority: Mapped[str] = mapped_column(String(10))  # P1 / P2 / P3
    source: Mapped[str] = mapped_column(String(20))  # AI-predicted / Manual
    status: Mapped[str] = mapped_column(String(20))  # Open / In Progress / Scheduled / Completed
    assignee: Mapped[str | None] = mapped_column(String(4), nullable=True)  # initials
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    estimated_hours: Mapped[float] = mapped_column(Float, default=1.0)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completion_note: Mapped[str | None] = mapped_column(String(255), nullable=True)


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[int] = mapped_column(primary_key=True)
    agent: Mapped[str] = mapped_column(String(40))
    title: Mapped[str] = mapped_column(String(200))
    impact: Mapped[str] = mapped_column(String(60))
    status: Mapped[str] = mapped_column(String(20))  # Proposed / Applied / Dismissed
    date: Mapped[date] = mapped_column(Date)


class MeetingRoom(Base):
    __tablename__ = "meeting_rooms"

    id: Mapped[int] = mapped_column(primary_key=True)
    facility_id: Mapped[int] = mapped_column(ForeignKey("facilities.id"))
    name: Mapped[str] = mapped_column(String(40))
    capacity: Mapped[int] = mapped_column(Integer)
    utilization_pct: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20))  # Available / Booked
    booked_at: Mapped[str | None] = mapped_column(String(20), nullable=True)  # "14:00"


class Visitor(Base):
    __tablename__ = "visitors"

    id: Mapped[int] = mapped_column(primary_key=True)
    facility_id: Mapped[int] = mapped_column(ForeignKey("facilities.id"))
    name: Mapped[str] = mapped_column(String(60))
    company: Mapped[str] = mapped_column(String(60))
    purpose: Mapped[str] = mapped_column(String(60))
    status: Mapped[str] = mapped_column(String(20))  # Checked in / On site / Checked out


class Vendor(Base):
    __tablename__ = "vendors"

    id: Mapped[int] = mapped_column(primary_key=True)
    facility_id: Mapped[int] = mapped_column(ForeignKey("facilities.id"))
    name: Mapped[str] = mapped_column(String(60))
    category: Mapped[str] = mapped_column(String(40))
    spend: Mapped[float] = mapped_column(Float)
    trend_pct: Mapped[float] = mapped_column(Float, default=0.0)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    email: Mapped[str] = mapped_column(String(120), unique=True)
    role: Mapped[str] = mapped_column(String(40))
    password_hash: Mapped[str] = mapped_column(String(128))


class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(80))
    details: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class SystemConfig(Base):
    """Key/value system configuration (tariffs, targets, thresholds, defaults).

    These are editable infrastructure parameters — never fabricated KPIs.
    All dashboard numbers are computed from data, using these as constants
    (exchange rates / tariffs / targets are configuration, not demo data).
    """

    __tablename__ = "system_config"

    key: Mapped[str] = mapped_column(String(60), primary_key=True)
    value_float: Mapped[float | None] = mapped_column(Float, nullable=True)
    value_str: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str] = mapped_column(String(255), default="")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
