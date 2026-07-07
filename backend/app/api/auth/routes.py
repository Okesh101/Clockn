# app/api/auth/routes.py

from flask import Blueprint, jsonify, request
from app import db, limiter
from app.models.Teacher import Teacher
from app.models.Role import Role
from app.models.TokenBlocklist import TokenBlocklist
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt, get_jwt_identity

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
@limiter.limit('15 per minute')
def register_endpoint():
    data = request.get_json() or {}

    # Strict dictionary presence validation (replaces old unsafe all() evaluation)
    required_fields = ['firstname', 'lastname', 'email', 'phone', 'password']
    if not all(data.get(field) for field in required_fields):
        return jsonify({
            "status": "ERROR",
            "message": "Missing required fields",
            "code": 400
        }), 400

    # Phone normalization verification
    phone = str(data.get('phone', '')).strip()
    if not phone.isdigit() or len(phone) != 11:
        return jsonify({
            "status": "ERROR",
            "message": "Phone number must be exactly 11 digits",
            "code": 400
        }), 400

    # Check email uniqueness before executing heavy operations
    if db.session.execute(db.select(Teacher).filter_by(email=data['email'])).scalar_one_or_none():
        return jsonify({
            "status": "ERROR",
            "message": "Email already registered",
            "code": 409
        }), 409

    # Setup roles safely
    is_first_user = db.session.execute(db.select(Teacher)).first() is None
    requested_role = "Admin" if is_first_user else "Teacher"

    role_obj = db.session.execute(db.select(Role).filter_by(
        name=requested_role)).scalar_one_or_none()
    if not role_obj:
        return jsonify({
            "status": "ERROR",
            "code": 400,
            "message": f"The role '{requested_role}' does not exist on this system."
        }), 400

    new_teacher = Teacher(
        firstname=data['firstname'],
        lastname=data['lastname'],
        email=data['email'],
        phone=phone
    )
    new_teacher.set_password(data['password'])
    new_teacher.roles.append(role_obj)

    try:
        db.session.add(new_teacher)
        db.session.commit()
        return jsonify({
            "status": "CREATED",
            "teacher": new_teacher.to_dict(),
            "message": "Teacher registered successfully!",
            "code": 201
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "ERROR",
            "message": f"A database error occurred during registration: {str(e)}",
            "code": 500
        }), 500


@auth_bp.route("/login", methods=["POST"])
@limiter.limit('10 per minute')
def login_endpoint():
    data = request.get_json() or {}

    if not data.get('email') or not data.get('password'):
        return jsonify({
            "status": "ERROR",
            "message": "Missing required fields",
            "code": 400
        }), 400

    # Modern SQLAlchemy 2.0 select query execution syntax
    teacher = db.session.execute(db.select(Teacher).filter_by(
        email=data['email'])).scalar_one_or_none()

    if not teacher or not teacher.check_password(data['password']):
        return jsonify({
            "status": "ERROR",
            "code": 401,
            "message": "Invalid email or password"
        }), 401

    access_token = create_access_token(identity=str(teacher.id))
    refresh_token = create_refresh_token(identity=str(teacher.id))

    return jsonify({
        "status": "SUCCESS",
        "message": "Login successful!",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "teacher": teacher.to_dict(),
        "code": 200
    }), 200


@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile_endpoint():
    current_teacher_id = get_jwt_identity()

    # Modern execution replacement for deprecated .query.get()
    teacher = db.session.get(Teacher, current_teacher_id)

    if not teacher:
        return jsonify({
            "status": "ERROR",
            "code": 404,
            "message": "Teacher not found"
        }), 404

    return jsonify({
        "status": "SUCCESS",
        "data": teacher.to_dict(),
        "code": 200,
        "message": "Profile data retrieved successfully"
    }), 200


@auth_bp.route("/logout", methods=['POST'])
@jwt_required()  # Protects via Access Token
def logout_endpoint():
    # 1. Revoke the active Access Token (from Header)
    access_claims = get_jwt()
    access_jti = access_claims['jti']
    db.session.add(TokenBlocklist(jti=access_jti))

    # 2. Grab Refresh Token from custom header
    refresh_token = request.headers.get("X-Refresh-Token")

    if refresh_token:
        from flask_jwt_extended import decode_token
        try:
            # Safely decode the token claims without verifying signatures again
            refresh_claims = decode_token(refresh_token)
            refresh_jti = refresh_claims.get('jti')

            # Double check that it actually is a refresh token type
            if refresh_claims.get('type') == 'refresh' and refresh_jti:
                db.session.add(TokenBlocklist(jti=refresh_jti))
        except Exception:
            # If token is completely malformed or corrupted, skip silently
            pass

    db.session.commit()

    return jsonify({
        "status": "SUCCESS",
        "code": 200,
        "message": "Logged out successfully. All session tokens have been permanently revoked."
    }), 200


@auth_bp.route("/refresh", methods=['POST'])
@jwt_required(refresh=True)
def refresh_endpoint():
    current_teacher_id = get_jwt_identity()
    new_access_token = create_access_token(identity=current_teacher_id)
    return jsonify({
        "status": "SUCCESS",
        "access_token": new_access_token
    }), 200
