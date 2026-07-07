# app/models/Role.py

from app import db
from sqlalchemy.dialects.postgresql import UUID
import uuid

user_roles = db.Table(
    'user_roles',
    db.Column('teacher_id', UUID(as_uuid=True), db.ForeignKey(
        'teachers.id', ondelete='CASCADE'), primary_key=True, nullable=False),
    db.Column('role_id', db.Integer, db.ForeignKey(
        'roles.id', ondelete='CASCADE'), primary_key=True, nullable=False)
)


class Role(db.Model):
    __tablename__ = 'roles'

    id = db.Column(db.Integer, primary_key=True, unique=True,
                   nullable=False, autoincrement=True)
    # eg. 'Admin', 'Teacher'
    name = db.Column(db.Text, unique=True, nullable=False)

    def __repr__(self):
        return f"<Role: {self.name}>"
