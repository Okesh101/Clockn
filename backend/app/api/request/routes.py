# app/api/request/routes.py

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import limiter, db
from app.utils.decorators import permissions_required
from app.utils.extensions import is_within_school_premises
from app.models.AttendanceRequest import AttendanceRequest
from app.utils.types import RequestStatus, CutoffTime
from app.models.AttendanceLog import AttendanceLog
from sqlalchemy.orm import joinedload
import zoneinfo
from datetime import datetime, time

request_bp = Blueprint("request", __name__)


@request_bp.route("", methods=['POST'])
@limiter.limit("5 per minute")
@jwt_required()
@permissions_required("request_permission")
def request_clockout_endpoint():
    lagos_tz = zoneinfo.ZoneInfo("Africa/Lagos")
    now_lagos = datetime.now(lagos_tz)
    current_time_lagos = now_lagos.time()
    today_lagos = now_lagos.date()

    teacher_id = get_jwt_identity()

    data = request.get_json() or {}
    teacher_note = data.get("note")

    # 1. Verify the teacher is clocked in for today and hasn't clocked out yet
    today_start = datetime.combine(
        today_lagos, time.min).replace(tzinfo=lagos_tz)
    today_end = datetime.combine(
        today_lagos, time.max).replace(tzinfo=lagos_tz)

    attendance = db.session.execute(
        db.select(AttendanceLog).filter(
            AttendanceLog.teacher_id == teacher_id,
            AttendanceLog.time_in >= today_start,
            AttendanceLog.time_in <= today_end,
            AttendanceLog.time_out.is_(None)
        )
    ).scalar()

    if not attendance:
        return jsonify({
            "status": "ERROR",
            "code": 400,
            "message": "No active clock-in session found for today."
        }), 400

    # 2. Prevent duplicate pending requests
    existing_request = db.session.execute(
        db.select(AttendanceRequest).filter(
            AttendanceRequest.attendance_id == attendance.id,
            AttendanceRequest.status == RequestStatus.PENDING.value
        )
    ).scalar()

    if existing_request:
        return jsonify({
            "status": "ERROR",
            "code": 400,
            "message": "You already have a pending clock-out request."
        }), 400

    # 3. Apply the 4:00 PM geofencing boundary rules
    four_pm = time(CutoffTime.C_HR.value, CutoffTime.C_MIN.value)
    if current_time_lagos < four_pm:
        latitude = data.get("latitude")
        longitude = data.get("longitude")

        if not latitude or not longitude:
            return jsonify({
                "status": "ERROR",
                "code": 400,
                "message": "Location coordinates are required before 4:00 PM."
            }), 400

        if not is_within_school_premises(latitude, longitude):
            return jsonify({
                "status": "ERROR",
                "code": 403,
                "message": "You must be within the school premises to request an early clock-out."
            }), 403

    # 4. Save the Request
    new_request = AttendanceRequest(
        teacher_id=teacher_id,
        attendance_id=attendance.id,
        teacher_note=teacher_note,
        status=RequestStatus.PENDING.value
    )
    db.session.add(new_request)
    db.session.commit()

    return jsonify({
        "status": "SUCCESS",
        "code": 201,
        "message": "Clock-out request submitted successfully to admin."
    }), 201


@request_bp.route("/logs", methods=['GET'])
@limiter.limit("20 per minute")
@jwt_required()
@permissions_required("request_permission")
def view_my_requests_endpoint():
    teacher_id = get_jwt_identity()  # Securely read the teacher's ID from the JWT token
    status_filter = request.args.get('status')

    # 1. Gather clean pagination window parameters
    try:
        page = max(1, int(request.args.get('page', 1)))
        per_page = max(1, int(request.args.get('per_page', 10)))
    except ValueError:
        page = 1
        per_page = 10

    # 2. Query only records belonging to this specific teacher
    stmt = (
        db.select(AttendanceRequest)
        .filter(AttendanceRequest.teacher_id == teacher_id)
        .order_by(AttendanceRequest.created_at.desc())
    )

    # 3. Apply optional status filter matching your lowercase Enum configurations
    if status_filter:
        stmt = stmt.filter(AttendanceRequest.status == status_filter.lower())

    # 4. Process pagination through the database engine execution
    pagination = db.paginate(
        stmt, page=page, per_page=per_page, error_out=False
    )

    # 5. Transform object records array
    serialized_requests = [req.to_dict() for req in pagination.items]

    return jsonify({
        "status": "SUCCESS",
        "code": 200,
        "message": "Your attendance requests fetched successfully.",
        "meta": {
            "total_items": pagination.total,
            "total_pages": pagination.pages,
            "current_page": pagination.page,
            "per_page": pagination.per_page,
            "has_next": pagination.has_next,
            "has_prev": pagination.has_prev
        },
        "data": serialized_requests
    }), 200

@request_bp.route("/<uuid:request_id>/review", methods=['PATCH', 'PUT'])
@limiter.limit("20 per minute")
@jwt_required()
@permissions_required("manage_teacher_requests")
def review_clockout_request(request_id):
    admin_user_id = get_jwt_identity()
    lagos_tz = zoneinfo.ZoneInfo("Africa/Lagos")
    now_lagos = datetime.now(lagos_tz)

    data = request.get_json() or {}
    action = data.get("action")
    if action:
        action = action.upper()
    admin_note = data.get("note")

    if action not in ["APPROVE", "REJECT"]:
        return jsonify({
            "status": "ERROR",
            "code": 400,
            "message": "Invalid action. Use 'APPROVE' or 'REJECT'."
        }), 400

    # 1. Fetch the target request record
    attendance_request = db.session.execute(
        db.select(AttendanceRequest).filter(AttendanceRequest.id == request_id)
    ).scalar()

    if not attendance_request:
        return jsonify({
            "status": "NOT_FOUND",
            "code": 404,
            "message": "Request record not found."
        }), 404

    if attendance_request.status != RequestStatus.PENDING.value:
        return jsonify({
            "status": "ERROR",
            "code": 400,
            "message": f"This request has already been {attendance_request.status}."
        }), 400

    # 2. Process Approval vs Rejection (Saves lowercase string values correctly to DB)
    if action == "APPROVE":
        attendance_request.status = RequestStatus.APPROVED.value

        attendance_log = attendance_request.attendance_log
        if attendance_log:
            attendance_log.time_out = now_lagos

    elif action == "REJECT":
        attendance_request.status = RequestStatus.REJECTED.value

    attendance_request.admin_note = admin_note
    attendance_request.resolved_by = admin_user_id

    db.session.commit()

    return jsonify({
        "status": "SUCCESS",
        "code": 200,
        "message": f"Request has been successfully {attendance_request.status}."
    }), 200


@request_bp.route("", methods=['GET'])
@limiter.limit("30 per minute")
@jwt_required()
@permissions_required("manage_teacher_requests")
def get_all_attendance_requests():
    # 1. Gather query parameters
    status_filter = request.args.get('status')

    try:
        page = max(1, int(request.args.get('page', 1)))
        per_page = max(1, int(request.args.get('per_page', 10)))
    except ValueError:
        page = 1
        per_page = 10

    # 2. Optimized base query with eager loading
    stmt = db.select(AttendanceRequest).options(
        joinedload(AttendanceRequest.teacher)
    ).order_by(AttendanceRequest.created_at.desc())

    # 3. Apply status filtering rules (FIXED: converted to lowercase to match your types.py configuration)
    if status_filter:
        stmt = stmt.filter(AttendanceRequest.status == status_filter.lower())

    # 4. Process page window partitioning via SQLAlchemy engine execution
    pagination = db.paginate(
        stmt, page=page, per_page=per_page, error_out=False
    )

    # 5. Transform object records array
    serialized_requests = [req.to_dict() for req in pagination.items]

    return jsonify({
        "status": "SUCCESS",
        "code": 200,
        "message": "Attendance requests fetched successfully.",
        "meta": {
            "total_items": pagination.total,
            "total_pages": pagination.pages,
            "current_page": pagination.page,
            "per_page": pagination.per_page,
            "has_next": pagination.has_next,
            "has_prev": pagination.has_prev
        },
        "data": serialized_requests
    }), 200
