# app/api/roles/routes.py

from flask import Blueprint, jsonify, request
from app import db, limiter
from app.models.Teacher import Teacher
from app.models.Role import Role
from app.models.Permission import Permission
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from app.utils.decorators import permissions_required

roles_bp = Blueprint("roles", __name__)


# api/v1/roles/seed
@roles_bp.route("/seed", methods=["POST"])
@limiter.limit('5 per minute')
@jwt_required()
@permissions_required("manage_roles")
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


# api/v1/roles
@roles_bp.route("", methods=['POST'])
@limiter.limit("10 per minute")
@jwt_required()
@permissions_required("manage_roles")
def create_custom_role_endpoint():
    """
    Accepts EITHER a single role object or an array of roles.
    Example 1 (Single): {"roles": ["Vice-Principal"]}
    Example 2 (Bulk):   {"roles": ["Bursar", "Dean", "HOD"]}
    """
    data = request.get_json() or {}
    roles_to_process = []

    # 1. Normalize input parameters dynamically
    if "roles" in data and isinstance(data["roles"], list):
        # Extract bulk list strings safely
        roles_to_process = [str(r).strip()
                            for r in data["roles"] if str(r).strip()]
    else:
        return jsonify({
            "status": "ERROR",
            "message": "Invalid payload format. Provide 'roles' (array).",
            "code": 400
        }), 400

    if not roles_to_process:
        return jsonify({
            "status": "ERROR",
            "message": "No valid role names provided for creation.",
            "code": 400
        }), 400

    try:
        # Fetch all currently existing roles in one database query to keep verification fast
        existing_roles_query = db.session.execute(
            db.select(Role)).scalars().all()
        existing_role_names = {r.name.lower() for r in existing_roles_query}

        created_roles_summary = []
        skipped_roles_summary = []

        # 2. Iterate recursively through the entries to process them idempotently
        for role_name in roles_to_process:
            # Case-insensitive duplication security check
            if role_name.lower() in existing_role_names:
                skipped_roles_summary.append(role_name)
                continue

            # Instantiate the database object row container
            new_role = Role(name=role_name)
            db.session.add(new_role)

            # Flush immediately to let the database generate IDs for our return payload summary
            db.session.flush()

            created_roles_summary.append({
                "id": new_role.id,
                "name": new_role.name
            })
            # Add to set so subsequent entries in the same payload list don't cause duplicates
            existing_role_names.add(role_name.lower())

        # Commit all staged entries together in a single transaction block
        db.session.commit()

        # 3. Formulate descriptive return codes based on processing outcomes
        if not created_roles_summary:
            return jsonify({
                "status": "ERROR",
                "code": 409,
                "message": "All provided roles already exist in the system database.",
                "skipped": skipped_roles_summary
            }), 409

        return jsonify({
            "status": "CREATED",
            "code": 201,
            "message": f"Successfully processed {len(created_roles_summary)} new role entries.",
            "data": {
                "created": created_roles_summary,
                "skipped": skipped_roles_summary
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "ERROR",
            "message": f"A transactional database error occurred during execution: {str(e)}",
            "code": 500
        }), 500


# api/v1/roles
@roles_bp.route("", methods=["GET"])
@limiter.limit('30 per minute')
@jwt_required()
@permissions_required("manage_roles")
def get_all_roles_and_permissions_endpoint():
    """
    Returns a unified listing of all active roles and their mapped permissions
    alongside a master list of all available system permissions for checkbox grids.
    """
    try:
        # 1. Fetch all roles from the database using a subquery to avoid N+1 traps
        roles_query = db.select(Role).order_by(Role.name.asc())
        all_roles = db.session.execute(roles_query).scalars().all()

        # 2. Fetch the absolute master list of all valid system permissions
        permissions_query = db.select(
            Permission).order_by(Permission.name.asc())
        all_permissions = db.session.execute(permissions_query).scalars().all()

        # 3. Format the active matrix map
        roles_matrix = []
        for role in all_roles:
            roles_matrix.append({
                "id": role.id,
                "name": role.name,
                # Compile a clean array of string tokens currently attached to this blueprint
                "permissions": [perm.name for perm in role.permissions]
            })

        # 4. Return everything nested inside a highly structural management payload
        return jsonify({
            "status": "SUCCESS",
            "code": 200,
            "message": "System security role permissions matrix compiled successfully.",
            "data": {
                "roles": roles_matrix,
                # Master list lets the frontend know exactly what checkboxes to draw in the UI table!
                "master_permissions": [perm.name for perm in all_permissions]
            }
        }), 200

    except Exception as e:
        return jsonify({
            "status": "ERROR",
            "message": f"An error occurred while compiling the system security grid: {str(e)}",
            "code": 500
        }), 500


# api/v1/roles/assign
@roles_bp.route("/assign", methods=["POST"])
@limiter.limit('15 per minute')
@jwt_required()
@permissions_required("manage_roles")
def upgrade_roles_endpoint():
    # request = teacher_id: string, roles: list
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

    teacher_to_upgrade = db.session.execute(db.select(Teacher).filter_by(
        id=data.get("teacher_id"))).scalar_one_or_none()
    if not teacher_to_upgrade:
        return jsonify({
            "status": "ERROR",
            "message": "Teacher not found for role upgrade.",
            "code": 404
        }), 404

    roles_to_seed: list[str] = data["roles"]

    try:
        # Fetch existing roles from the database
        existing_roles = db.session.execute(db.select(Role).filter(
            Role.name.in_(roles_to_seed))).scalars().all()
        existing_role_names = {role.name for role in existing_roles}

        # Check for any roles that do not exist in the database
        non_existing_roles = [
            role_name for role_name in roles_to_seed if role_name not in existing_role_names]
        if non_existing_roles:
            return jsonify({
                "status": "ERROR",
                "message": f"The following roles do not exist and cannot be assigned: {non_existing_roles}",
                "code": 400
            }), 400
        
        # Safety Check: Prevent locking the system by stripping the last Admin's powers
        if any(role.name == "Admin" for role in teacher_to_upgrade.roles) and "Admin" not in existing_role_names:
            # Check how many admins are left in the database
            total_admins = db.session.execute(
                db.select(func.count(Teacher.id)).join(
                    Teacher.roles).filter(Role.name == "Admin")
            ).scalar() or 0

            if total_admins <= 1:
                return jsonify({
                    "status": "ERROR",
                    "code": 400,
                    "message": "Security Protection: Cannot downgrade this user. The system requires at least one active Admin."
                }), 400

        # Assign the existing roles to the teacher
        teacher_to_upgrade.roles = existing_roles

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


# api/v1/roles/assign-permissions
@roles_bp.route("/assign-permissions", methods=["POST"])
@limiter.limit('15 per minute')
@jwt_required()
@permissions_required("manage_roles")
def assign_permissions_to_role_endpoint():
    """
    Expects JSON:
    {
        "role_name": "Vice-Principal",
        "permissions": ["view_all_attendance", "manage_teachers"]
    }
    """
    data = request.get_json() or {}
    role_name = data.get("role_name")
    permissions_list = data.get("permissions")

    if not role_name or not isinstance(permissions_list, list):
        return jsonify({
            "status": "ERROR",
            "message": "Missing role_name or invalid permissions list layout.",
            "code": 400
        }), 400

    target_role = db.session.execute(
        db.select(Role).filter_by(name=role_name)
    ).scalar_one_or_none()

    if not target_role:
        return jsonify({
            "status": "ERROR",
            "message": f"The role '{role_name}' does not exist on this system.",
            "code": 404
        }), 404

    try:
        # Fetch the system's valid permission string entries
        db_permissions = db.session.execute(
            db.select(Permission).filter(Permission.name.in_(permissions_list))
        ).scalars().all()
        db_perm_names = {p.name for p in db_permissions}

        # Catch malicious or typoed parameters immediately
        invalid_perms = [p for p in permissions_list if p not in db_perm_names]
        if invalid_perms:
            return jsonify({
                "status": "ERROR",
                "message": f"The following permissions are invalid or missing from system seeding tracks: {invalid_perms}",
                "code": 400
            }), 400

        # Replace permissions on the target role with the newly selected collection
        target_role.permissions = db_permissions
        db.session.commit()

        return jsonify({
            "status": "SUCCESS",
            "code": 200,
            "message": f"Permissions mapping for role '{role_name}' successfully synchronized.",
            "data": {
                "role": role_name,
                "active_permissions": [p.name for p in target_role.permissions]
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "ERROR",
            "message": f"An error occurred while mapping permissions: {str(e)}",
            "code": 500
        }), 500
