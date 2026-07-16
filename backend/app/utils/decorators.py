# app/utils/decorators.py

from app import db
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


def permissions_required(*required_permissions: str, match_all: bool = False):
    """
    Accepts multiple permission arguments.
    Example: @permissions_required("view_history", "manage_users", match_all=False)
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            current_user_id = get_jwt_identity()
            user = db.session.execute(db.select(Teacher).filter_by(
                id=current_user_id)).scalar_one_or_none()

            if not user:
                return jsonify({
                    "status": "ERROR", 
                    "message": "User not found.", 
                    "code": 401
                }), 401

            # Compile all permission string tokens assigned to this user's roles
            user_permissions = {
                perm.name for role in user.roles for perm in role.permissions}

            # Global Super-Admin Override
            if any(role.name == "Admin" for role in user.roles):
                return fn(*args, **kwargs)

            # Perform evaluation checks based on matching strategy
            if match_all:
                # The user MUST possess EVERY single permission requested
                has_access = all(
                    perm in user_permissions for perm in required_permissions)
            else:
                # The user can pass if they have AT LEAST ONE of the permissions
                has_access = any(
                    perm in user_permissions for perm in required_permissions)

            if not has_access:
                return jsonify({
                    "status": "ERROR", 
                    "code": 403,
                    "message": f"Unauthorized. Missing required permissions: {required_permissions}"
                }), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator
