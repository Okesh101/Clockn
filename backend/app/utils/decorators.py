# app/utils/decorators.py

from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from app.models.Teacher import Teacher


def roles_required(*role_names):
    """
    Custom decorator to protect endpoints by verifying teacher roles.
    Must be placed BELOW @jwt_required() so the identity is loaded first.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Safe import inside function scope to prevent initialization loop cycles
            from app import db

            current_teacher_id = get_jwt_identity()

            # Modern SQLAlchemy 2.0 session call [1]
            teacher = db.session.get(Teacher, current_teacher_id)

            if not teacher:
                return jsonify({
                    "status": "ERROR",
                    "code": 404,
                    "message": "Teacher not found."
                }), 404

            # Check if the teacher possesses at least one of the required roles
            if not any(teacher.has_role(r) for r in role_names):
                return jsonify({
                    "status": "ERROR",
                    "code": 403,
                    "message": "Forbidden! You do not have permission to access this resource."
                }), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator
