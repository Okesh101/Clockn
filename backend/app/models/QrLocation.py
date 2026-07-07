# app/models/QrLocation.py

from app import db
from sqlalchemy.dialects.postgresql import UUID
import uuid


class QrLocation(db.Model):
    __tablename__ = 'qr_locations'

    id = db.Column(UUID(as_uuid=True), nullable=False,
                   primary_key=True, default=uuid.uuid4)
    qr_string = db.Column(db.String(255), nullable=False, unique=True)
    location = db.Column(db.Text, nullable=False)
    latitude = db.Column(db.Numeric(10, 8), nullable=False)
    longitude = db.Column(db.Numeric(11, 8), nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True),
        server_default=db.text("TIMEZONE('Africa/Lagos', NOW())")
    )
    updated_at = db.Column(
        db.DateTime(timezone=True), 
        server_default=db.text("TIMEZONE('Africa/Lagos', NOW())"), 
        onupdate=db.text("TIMEZONE('Africa/Lagos', NOW())")
    )

    def __repr__(self):
        return f"<QrcodeLocation {self.id} - ({self.latitude}, {self.longitude})>"
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "qr_string": self.qr_string,
            "location": self.location,
            "latitude": float(self.latitude) if self.latitude else None,
            "longitude": float(self.longitude) if self.longitude else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
