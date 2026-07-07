# app/api/roles/routes.py

from flask import Blueprint, jsonify, request
from app import db, limiter
from app.models.Teacher import Teacher
from app.models.Role import Role
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.decorators import roles_required

roles_bp = Blueprint("roles", __name__)

@roles_bp.route("/seed", methods=["POST"])
@limiter.limit('1 per minute')
def seed_roles_endpoint():
    data = request.get_json() or {}
    if not data.get("roles"):
        return jsonify({
            "status": "ERROR",
            "message": "No roles provided for seeding.",
            "code": 400
        }), 400
    roles_to_seed: list[str] = data["roles"]

    try:
        # Check if roles already exist
        existing_roles = db.session.execute(db.select(Role)).scalars().all()
        if existing_roles:
            return jsonify({
                "status": "ERROR",
                "message": "Roles have already been seeded.",
                "code": 400
            }), 400

        # Create Role objects and add them to the session
        for role_name in roles_to_seed:
            new_role = Role(name=role_name)
            db.session.add(new_role)

        # Commit the session to save the roles to the database
        db.session.commit()

        return jsonify({
            "status": "SUCCESS",
            "message": f"Roles {roles_to_seed} have been successfully seeded.",
            "code": 201
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "ERROR",
            "message": f"An error occurred while seeding roles: {str(e)}",
            "code": 500
        }), 500
    

@roles_bp.route("/upgrade", methods=["POST"])
@limiter.limit('5 per minute')
@jwt_required()
@roles_required("Admin")  # Only Admins can upgrade roles
def upgrade_roles_endpoint():
    # request = teacher_id: string, roles: list
    current_admin_id = get_jwt_identity()  # Get the identity of the current admin user

    admin = db.session.execute(db.select(Teacher).filter_by(id=current_admin_id)).scalar_one_or_none()
    if not admin:
        return jsonify({
            "status": "ERROR",
            "message": "Admin not found.",
            "code": 404
        }), 404

    data = request.get_json() or {}

    # Validation
    if not data.get("roles") or not isinstance(data["roles"], list):
        return jsonify({
            "status": "ERROR",
            "message": "Invalid roles data provided for upgrading.",
            "code": 400
        }), 400

    if not data.get("teacher_id"):
        return jsonify({
            "status": "ERROR",
            "message": "Teacher ID is required for role upgrade.",
            "code": 400
        }), 400
    
    teacher_to_upgrade = db.session.execute(db.select(Teacher).filter_by(id=data.get("teacher_id"))).scalar_one_or_none()
    if not teacher_to_upgrade:
        return jsonify({
            "status": "ERROR",
            "message": "Teacher not found for role upgrade.",
            "code": 404
        }), 404
    
    roles_to_seed: list[str] = data["roles"]

    try:
        # Fetch existing roles from the database
        existing_roles = db.session.execute(db.select(Role).filter(Role.name.in_(roles_to_seed))).scalars().all()
        existing_role_names = {role.name for role in existing_roles}

        # Check for any roles that do not exist in the database
        non_existing_roles = [role_name for role_name in roles_to_seed if role_name not in existing_role_names]
        if non_existing_roles:
            return jsonify({
                "status": "ERROR",
                "message": f"The following roles do not exist and cannot be assigned: {non_existing_roles}",
                "code": 400
            }), 400

        # Assign the existing roles to the teacher
        for role in existing_roles:
            if role not in teacher_to_upgrade.roles:
                teacher_to_upgrade.roles.append(role)

        db.session.commit()

        return jsonify({
            "status": "SUCCESS",
            "message": f"Roles {roles_to_seed} have been successfully assigned to teacher with ID {teacher_to_upgrade.id}.",
            "code": 200
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "ERROR",
            "message": f"An error occurred while upgrading roles: {str(e)}",
            "code": 500
        }), 500