# app/models/AttendanceLog.py

from app import db
from sqlalchemy.dialects.postgresql import UUID
from app.utils.types import METHOD_CHOICES, STATUS_CHOICES, PUNCTUALITY_CHOICES
import uuid
from datetime import datetime
import zoneinfo


class AttendanceLog(db.Model):
    __tablename__ = 'attendance_logs'

    id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        unique=True,
        nullable=False,
        default=uuid.uuid4
    )
    teacher_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey('teachers.id', ondelete='CASCADE'),
        nullable=False
    )
    time_in = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        # server_default=db.text("NOW()"),
        default=lambda: datetime.now(zoneinfo.ZoneInfo("Africa/Lagos")),
        index=True  # 💡 Makes searching by clock-in date blazing fast!
    )
    time_out = db.Column(db.DateTime(timezone=True), nullable=True)
    time_in_lat = db.Column(db.Numeric(10, 8), nullable=False)
    time_in_lng = db.Column(db.Numeric(11, 8), nullable=False)
    time_out_lat = db.Column(db.Numeric(10, 8), nullable=True)
    time_out_lng = db.Column(db.Numeric(11, 8), nullable=True)
    status = db.Column(
        db.String(20),
        db.CheckConstraint(
            f"status IN ({STATUS_CHOICES})", name="valid_attendance_status"),
        nullable=False,
    )
    # Clean Timing Status (Calculated automatically at clock-in)
    punctuality = db.Column(
        db.String(20),
        db.CheckConstraint(
            f"punctuality IN ({PUNCTUALITY_CHOICES})", name="valid_punctuality_status"),
        nullable=False
    )
    time_in_method = db.Column(
        db.String(20),
        db.CheckConstraint(
            f"method IN ({METHOD_CHOICES})", name="valid_attendance_method"),
        nullable=False
    )
    time_out_method = db.Column(
        db.String(20),
        db.CheckConstraint(
            f"method IN ({METHOD_CHOICES})", name="valid_attendance_method"),
        nullable=True
    )
    clock_in_qr = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey('qr_locations.qr_string', ondelete='CASCADE'),
        nullable=True
    )
    clock_out_qr = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey('qr_locations.qr_string', ondelete='CASCADE'),
        nullable=True
    )
