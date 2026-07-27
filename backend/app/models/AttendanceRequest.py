# app/models/AttendanceRequest.py

from app import db
from sqlalchemy.dialects.postgresql import UUID
from app.utils.types import REQUEST_CHOICES, RequestStatus
import uuid


class AttendanceRequest(db.Model):
    __tablename__ = "attendance_requests"

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
    attendance_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey('attendance_logs.id', ondelete='CASCADE'),
        nullable=False
    )

    teacher_note = db.Column(db.Text, nullable=True)
    admin_note = db.Column(db.Text, nullable=True)

    status = db.Column(
        db.String(20),
        db.CheckConstraint(
            f"status IN ({REQUEST_CHOICES})", name="valid_request_status"),
        nullable=False,
        default=RequestStatus.PENDING.value
    )

    # Audit trail for who approved/rejected it
    resolved_by = db.Column(UUID(as_uuid=True), db.ForeignKey(
        'teachers.id', ondelete='SET NULL'), nullable=True)

    created_at = db.Column(
        db.DateTime(timezone=True),
        server_default=db.text("TIMEZONE('Africa/Lagos', NOW())")
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        server_default=db.text("TIMEZONE('Africa/Lagos', NOW())"),
        onupdate=db.text("TIMEZONE('Africa/Lagos', NOW())")
    )

    # Relationships
    teacher = db.relationship(
        'Teacher',
        foreign_keys=[teacher_id],
        backref=db.backref('submitted_attendance_requests', lazy='dynamic')
    )
    attendance_log = db.relationship(
        'AttendanceLog',
        backref=db.backref('linked_attendance_requests', lazy='dynamic')
    )

    # Optional: Relationship to easily fetch who resolved it, if needed later
    resolver = db.relationship(
        'Teacher',
        foreign_keys=[resolved_by],
        backref=db.backref('resolved_attendance_requests', lazy='dynamic')
    )

    def to_dict(self):
        # Read profile parameters directly from your Teacher model fields
        # Adjust 'first_name' and 'last_name' to match your Teacher model columns
        teacher_name = "Unknown Teacher"
        if self.teacher:
            f_name = getattr(self.teacher, 'first_name', '')
            l_name = getattr(self.teacher, 'last_name', '')
            teacher_name = f"{l_name} {f_name}".strip() or "Teacher Profile"

        return {
            "id": str(self.id),
            "teacher_id": str(self.teacher_id),
            "teacher_name": teacher_name,
            "attendance_id": str(self.attendance_id),
            "teacher_note": self.teacher_note,
            "admin_note": self.admin_note,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "resolved_at": self.updated_at.isoformat()
        }
