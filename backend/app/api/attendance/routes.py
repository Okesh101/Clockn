# app/api/attendance/routes.py

from flask import Blueprint, request, jsonify
from sqlalchemy import cast, Date
from app import db, limiter
from flask_jwt_extended import get_jwt_identity, jwt_required
from app.models.Teacher import Teacher
from app.models.AttendanceLog import AttendanceLog
from app.models.QrLocation import QrLocation
from datetime import datetime, time
import zoneinfo
from app.utils.types import AttendanceStatus, AttendanceMethod, SCHOOL_COORDINATES
from app.utils.extensions import calculate_teacher_distance

attendance_bp = Blueprint("attendance", __name__)


@attendance_bp.route("/in", methods=['POST'])
@limiter.limit('20 per minute')
@jwt_required()
def clock_in_endpoint():
    current_teacher_id = get_jwt_identity()
    lagos_tz = zoneinfo.ZoneInfo("Africa/Lagos")
    now_lagos = datetime.now(lagos_tz)

    # Prevent duplicate clock-ins for today
    today_date = now_lagos.date()
    existing_log = db.session.execute(
        db.select(AttendanceLog).filter(
            AttendanceLog.teacher_id == current_teacher_id,
            cast(AttendanceLog.time_in, Date) == today_date
        )
    ).scalar_one_or_none()

    if existing_log:
        return jsonify({
            "status": "ERROR",
            "code": 400,
            "message": "You have already clocked in for today!"
        }), 400

    teacher = db.session.execute(db.select(Teacher).filter_by(
        id=current_teacher_id)).scalar_one_or_none()
    if not teacher:
        return jsonify({
            "status": "ERROR",
            "message": "Teacher not found.",
            "code": 404
        }), 404

    data = request.get_json() or {}
    teacher_lat = data.get("timeInLat")
    teacher_lng = data.get("timeInLng")

    required_fields = ["timeInLat", "timeInLng"]

    if not all([teacher_lat, teacher_lng]):
        return jsonify({
            "status": "ERROR",
            "code": 400,
            "message": f"Missing required fields: {', '.join([f for f in required_fields if not data.get(f)])}"
        }), 400

    # Calculate teacher distance from the mid-point of school and reject far distances
    teacher_distance_m = calculate_teacher_distance(
        teacher_lat, teacher_lng, SCHOOL_COORDINATES, "button")

    TEACHER_DISTANCE_THRESHOLD_M = 120
    if teacher_distance_m > TEACHER_DISTANCE_THRESHOLD_M:
        return jsonify({
            "status": "ERROR",
            "code": 400,
            "message": f"Can't clock in. You are {int(teacher_distance_m)}m away from this qr code."
        })

    # Fixed Time Check Comparison Logic
    cutoff_time = time(8, 30)  # 8:30 AM
    current_time_only = now_lagos.time()

    if current_time_only > cutoff_time:
        current_status = AttendanceStatus.LATE.value
    else:
        current_status = AttendanceStatus.PRESENT.value

    try:
        new_log = AttendanceLog(
            teacher_id=current_teacher_id,
            time_in_lat=teacher_lat,
            time_in_lng=teacher_lng,
            status=current_status,  # Passed explicitly
            time_in_method=AttendanceMethod.BUTTON.value  # resolves to "button"
        )
        db.session.add(new_log)
        db.session.commit()

        return jsonify({
            "status": "SUCCESS",
            "code": 201,
            "message": f"Clock-in successful. Status: {current_status}.",
            "data": {
                "attendance_log_id": str(new_log.id),
                "status": new_log.status
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "ERROR",
            "code": 500,
            "message": f"Server error occurred while clocking in: {str(e)}"
        }), 500


@attendance_bp.route("/qr/in", methods=['POST'])
@limiter.limit('20 per minute')
@jwt_required()
def clock_in_endpoint():
    current_teacher_id = get_jwt_identity()
    lagos_tz = zoneinfo.ZoneInfo("Africa/Lagos")
    now_lagos = datetime.now(lagos_tz)

    # Prevent duplicate clock-ins for today
    today_date = now_lagos.date()
    existing_log = db.session.execute(
        db.select(AttendanceLog).filter(
            AttendanceLog.teacher_id == current_teacher_id,
            cast(AttendanceLog.time_in, Date) == today_date
        )
    ).scalar_one_or_none()

    if existing_log:
        return jsonify({
            "status": "ERROR",
            "code": 400,
            "message": "You have already clocked in for today!"
        }), 400

    teacher = db.session.execute(db.select(Teacher).filter_by(
        id=current_teacher_id)).scalar_one_or_none()
    if not teacher:
        return jsonify({
            "status": "ERROR",
            "message": "Teacher not found.",
            "code": 404
        }), 404

    data = request.get_json() or {}
    qr_string = data.get("qrString")
    teacher_lat = data.get("timeInLat")
    teacher_lng = data.get("timeInLng")

    required_fields = ["qrString", "timeInLat", "timeInLng"]

    if not all([qr_string, teacher_lat, teacher_lng]):
        return jsonify({
            "status": "ERROR",
            "code": 400,
            "message": f"Missing required fields: {', '.join([f for f in required_fields if not data.get(f)])}"
        }), 400

    # Fetch and validate location
    qr_location = db.session.execute(db.select(QrLocation).filter_by(
        qr_string=qr_string)).scalar_one_or_none()
    if not qr_location:
        return jsonify({
            "status": "ERROR",
            "code": 404,
            "message": "Invalid QR code token mapping."
        }), 404

    # Calculate teacher distance from the qr and reject far distances
    qr_obj = qr_location.to_dict()
    teacher_distance_m = calculate_teacher_distance(
        teacher_lat, teacher_lng, qr_obj, "qr")

    TEACHER_DISTANCE_THRESHOLD_M = 30
    if teacher_distance_m > TEACHER_DISTANCE_THRESHOLD_M:
        return jsonify({
            "status": "ERROR",
            "code": 400,
            "message": f"Can't clock in. You are {int(teacher_distance_m)}m away from this qr code."
        })

    # Fixed Time Check Comparison Logic
    cutoff_time = time(8, 30)  # 8:30 AM
    current_time_only = now_lagos.time()

    if current_time_only > cutoff_time:
        current_status = AttendanceStatus.LATE.value
    else:
        current_status = AttendanceStatus.PRESENT.value

    try:
        new_log = AttendanceLog(
            teacher_id=current_teacher_id,
            time_in_lat=teacher_lat,
            time_in_lng=teacher_lng,
            status=current_status,  # Passed explicitly
            time_in_method=AttendanceMethod.QR.value  # resolves to "qr"
        )
        db.session.add(new_log)
        db.session.commit()

        return jsonify({
            "status": "SUCCESS",
            "code": 201,
            "message": f"Clock-in successful. Status: {current_status}.",
            "data": {
                "attendance_log_id": str(new_log.id),
                "status": new_log.status
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "ERROR",
            "code": 500,
            "message": f"Server error occurred while clocking in: {str(e)}"
        }), 500
