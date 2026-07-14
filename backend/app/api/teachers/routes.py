# app/api/teachers/routes.py

from flask import Blueprint, jsonify, request
from app import db, limiter
from app.models.Teacher import Teacher
from app.utils.decorators import roles_required
from flask_jwt_extended import jwt_required
from sqlalchemy import func
import uuid


teachers_bp = Blueprint("teachers", __name__)


# api/v1/teachers
@teachers_bp.route("", methods=['GET'])
@limiter.limit("30 per minute")
@jwt_required()
@roles_required("Admin")
def get_all_teachers_endpoint():
    # 1. Grab and validate page numbers from URL parameters (e.g., ?page=2)
    # Default to page 1, and ensure the input is an integer greater than 0
    try:
        page = max(1, int(request.args.get('page', 1)))
    except ValueError:
        page = 1

    PER_PAGE = 20
    offset_value = (page - 1) * PER_PAGE

    # 2. Get the Total Count of teachers in the DB for metadata math
    total_count_query = db.select(func.count(Teacher.id))
    total_items = db.session.execute(total_count_query).scalar() or 0

    if total_items == 0:
        return jsonify({
            "status": "NOT_FOUND",
            "code": 404,
            "message": "No teacher available in DB."
        }), 404

    # 3. Calculate dynamic metadata boundaries
    # Using integer division math trick to compute ceiling: (total + limit - 1) // limit
    total_pages = (total_items + PER_PAGE - 1) // PER_PAGE
    has_next = page < total_pages
    has_prev = page > 1

    # 4. Modify your original query to incorporate limit and offset bounds
    # Also added an explicit order_by so the list order doesn't shift randomly during pages
    query = (
        db.select(
            Teacher.id, Teacher.firstname, Teacher.lastname,
            Teacher.email, Teacher.phone, Teacher.created_at
        )
        .order_by(Teacher.lastname.asc())
        .limit(PER_PAGE)
        .offset(offset_value)
    )

    teachers = db.session.execute(query).all()

    # If the user asks for a page that exceeds maximum records (e.g., page 99)
    if not teachers and page > 1:
        return jsonify({
            "status": "ERROR",
            "code": 400,
            "message": f"Page {page} does not exist. Total pages: {total_pages}"
        }), 400

    teachers_data = [
        {
            "id": str(row.id),
            "name": f"{row.lastname} {row.firstname}",
            "email": row.email,
            "phone": row.phone,
            "created_at": row.created_at.isoformat() if getattr(row, 'created_at', None) else None
        }
        for row in teachers
    ]

    # 5. Return the clean list nested inside a structured metadata layout
    return jsonify({
        "status": "SUCCESS",
        "code": 200,
        "message": "Teachers data chunk fetched successfully.",
        "meta": {
            "total_items": total_items,
            "total_pages": total_pages,
            "current_page": page,
            "per_page": PER_PAGE,
            "has_next": has_next,
            "has_prev": has_prev
        },
        "data": teachers_data
    }), 200


# api/v1/teachers/<teacher_id>
@teachers_bp.route("/<teacher_id>", methods=['GET'])
@limiter.limit("30 per minute")
@jwt_required()
@roles_required("Admin")
def get_teacher_endpoint(teacher_id):
    # 1. Validate if incoming string is a valid UUID format before breaking the DB engine
    try:
        validated_uuid = uuid.UUID(teacher_id)
    except ValueError:
        return jsonify({
            "status": "ERROR",
            "code": 400,
            "message": "Invalid Teacher ID string format."
        }), 400

    # 2. Select the whole table object to fetch EVERYTHING about the teacher
    query = db.select(Teacher).filter_by(id=validated_uuid)
    teacher = db.session.execute(query).scalar_one_or_none()

    if not teacher:
        return jsonify({
            "status": "ERROR",
            "code": 404,
            "message": f"Teacher profile with ID {teacher_id} does not exist."
        }), 404

    return jsonify({
        "status": "SUCCESS",
        "code": 200,
        "message": "Retrieved teacher profile successfully.",
        "data": teacher.to_dict()
    }), 200
