# app/models/Teacher.py

from app import db
from app.models.Role import user_roles
from sqlalchemy.dialects.postgresql import UUID
import uuid


class Teacher(db.Model):
    __tablename__ = 'teachers'

    # Configure ID as a true UUID string type
    id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,  # Generates a fresh UUID4 if none is provided
        unique=True,
        nullable=False
    )
    firstname = db.Column(db.String(100), nullable=False)
    lastname = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(11), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
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
    roles = db.relationship(
        'Role',
        secondary=user_roles,
        backref=db.backref('teachers', lazy='dynamic'),
        lazy='subquery'
    )

    # Helper method to set hashed password
    def set_password(self, password):
        from werkzeug.security import generate_password_hash
        self.password_hash = generate_password_hash(password)

    # Helper method to verify password during login
    def check_password(self, password):
        from werkzeug.security import check_password_hash
        return check_password_hash(self.password_hash, password)

    def has_role(self, role_name):
        """Helper method to quickly verify if a teacher has a specific permission role"""
        return any(role.name == role_name for role in self.roles)

    def to_dict(self):
        return {
            "id": str(self.id),
            "firstname": self.firstname,
            "lastname": self.lastname,
            "email": self.email,
            "phone": self.phone,
            "roles": [r.name for r in self.roles]
        }
