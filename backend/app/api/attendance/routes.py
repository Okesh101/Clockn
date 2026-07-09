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
from app.utils.types import AttendanceStatus, AttendanceMethod, DIST_THRESHOLD, CutoffTime
from app.utils.extensions import calculate_teacher_distance

attendance_bp = Blueprint("attendance", __name__)


@attendance_bp.route("/in", methods=['POST'])
@limiter.limit('20 per minute')
@jwt_required()
def button_clock_in_endpoint():
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
    teacher_distance_m = calculate_teacher_distance(teacher_lat, teacher_lng)

    if teacher_distance_m > DIST_THRESHOLD.BTN.value:
        return jsonify({
            "status": "ERROR",
            "code": 400,
            "message": f"Can't clock in. You are {int(teacher_distance_m - DIST_THRESHOLD.BTN.value)}m away from school environment."
        }), 400

    # Fixed Time Check Comparison Logic
    cutoff_time = time(CutoffTime.A_HR.value, CutoffTime.A_MIN.value)
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
                "distance": int(DIST_THRESHOLD.BTN.value - teacher_distance_m),
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
def qr_clock_in_endpoint():
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

    if teacher_distance_m > DIST_THRESHOLD.QR.value:
        return jsonify({
            "status": "ERROR",
            "code": 400,
            "message": f"Can't clock in. You are {int(teacher_distance_m - DIST_THRESHOLD.QR.value)}m away from this qr code."
        }), 200

    # Fixed Time Check Comparison Logic
    cutoff_time = time(CutoffTime.A_HR.value, CutoffTime.A_MIN.value)
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
            time_in_method=AttendanceMethod.QR.value,  # resolves to "qr"
            clock_in_qr=qr_string
        )
        db.session.add(new_log)
        db.session.commit()

        return jsonify({
            "status": "SUCCESS",
            "code": 201,
            "message": f"Clock-in successful. Status: {current_status}.",
            "data": {
                "attendance_log_id": str(new_log.id),
                "distance": int(DIST_THRESHOLD.QR.value - teacher_distance_m),
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


@attendance_bp.route("/out", methods=['POST'])
@limiter.limit('20 per minute')
@jwt_required()
def button_clock_out_endpoint():
    current_teacher_id = get_jwt_identity()
    lagos_tz = zoneinfo.ZoneInfo("Africa/Lagos")
    now_lagos = datetime.now(lagos_tz)
    today_date = now_lagos.date()

    # Prevent duplicate clock-outs for today
    active_log = db.session.execute(
        db.select(AttendanceLog).filter(
            AttendanceLog.teacher_id == current_teacher_id,
            cast(AttendanceLog.time_in, Date) == today_date,
            AttendanceLog.time_out == None
        )
    ).scalar_one_or_none()

    # If no morning log exists, they can't clock out because they never clocked in!
    if not active_log:
        # Check if they already successfully clocked out earlier today
        already_clocked_out = db.session.execute(
            db.select(AttendanceLog).filter(
                AttendanceLog.teacher_id == current_teacher_id,
                cast(AttendanceLog.time_in, Date) == today_date,
                AttendanceLog.time_out != None
            )
        ).scalar_one_or_none()

        if already_clocked_out:
            return jsonify({
                "status": "ERROR",
                "code": 400,
                "message": "You have already clocked out for today!"
            }), 400

        return jsonify({
            "status": "ERROR",
            "code": 400,
            "message": "No active clock-in log found for today. You must clock in first."
        }), 400

    data = request.get_json() or {}
    teacher_lat = data.get("timeOutLat")
    teacher_lng = data.get("timeOutLng")

    required_fields = ["timeOutLat", "timeOutLng"]

    if not all([teacher_lat, teacher_lng]):
        return jsonify({
            "status": "ERROR",
            "code": 400,
            "message": f"Missing required fields: {', '.join([f for f in required_fields if not data.get(f)])}"
        }), 400

    # Calculate teacher distance from the mid-point of school and reject far distances
    teacher_distance_m = calculate_teacher_distance(teacher_lat, teacher_lng)

    if teacher_distance_m > DIST_THRESHOLD.BTN.value:
        return jsonify({
            "status": "ERROR",
            "code": 400,
            "message": f"Can't clock out. You are {int(teacher_distance_m - DIST_THRESHOLD.BTN.value)}m away from school premises."
        }), 400

    # Fixed Time Check Comparison Logic
    cutoff_time = time(CutoffTime.C_HR.value, CutoffTime.C_MIN.value)
    current_time_only = now_lagos.time()

    if current_time_only < cutoff_time:
        return jsonify({
            "status": "ERROR",
            "code": 400,
            "message": "Can't clock out. School is not yet over. Closing time is 4:00 PM."
        }), 400

    try:
        # 4. UPDATE THE EXISTING MORNING ROW INSTEAD OF INSERTING A NEW ONE
        active_log.time_out_lat = teacher_lat
        active_log.time_out_lng = teacher_lng
        active_log.time_out_method = AttendanceMethod.BUTTON.value

        # Explicitly set time_out timestamp since server_default only handles creation actions
        active_log.time_out = now_lagos

        db.session.commit()

        return jsonify({
            "status": "SUCCESS",
            "code": 200,
            "message": f"Clock-out successful. Have a safe trip home!",
            "data": {
                "attendance_log_id": str(active_log.id),
                "distance": int(DIST_THRESHOLD.BTN.value - teacher_distance_m),
                "time_out": active_log.time_out.isoformat()
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "ERROR",
            "code": 500,
            "message": f"Server error occurred while clocking out: {str(e)}"
        }), 500


@attendance_bp.route("/qr/out", methods=['POST'])
@limiter.limit('20 per minute')
@jwt_required()
def qr_clock_out_endpoint():
    current_teacher_id = get_jwt_identity()
    lagos_tz = zoneinfo.ZoneInfo("Africa/Lagos")
    now_lagos = datetime.now(lagos_tz)
    today_date = now_lagos.date()

    # Prevent duplicate clock-outs for today
    active_log = db.session.execute(
        db.select(AttendanceLog).filter(
            AttendanceLog.teacher_id == current_teacher_id,
            cast(AttendanceLog.time_in, Date) == today_date,
            AttendanceLog.time_out == None,
            AttendanceLog.clock_out_qr == None
        )
    ).scalar_one_or_none()

    # If no morning log exists, they can't clock out because they never clocked in!
    if not active_log:
        # Check if they already successfully clocked out earlier today
        already_clocked_out = db.session.execute(
            db.select(AttendanceLog).filter(
                AttendanceLog.teacher_id == current_teacher_id,
                cast(AttendanceLog.time_in, Date) == today_date,
                AttendanceLog.time_out != None,
                AttendanceLog.clock_out_qr != None
            )
        ).scalar_one_or_none()

        if already_clocked_out:
            return jsonify({
                "status": "ERROR",
                "code": 400,
                "message": "You have already clocked out for today!"
            }), 400

        return jsonify({
            "status": "ERROR",
            "code": 400,
            "message": "No active clock-in log found for today. You must clock in first."
        }), 400

    data = request.get_json() or {}
    qr_string = data.get("qrString")
    teacher_lat = data.get("timeOutLat")
    teacher_lng = data.get("timeOutLng")

    required_fields = ["qrString", "timeOutLat", "timeOutLng"]

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

    # Calculate teacher distance from the mid-point of school and reject far distances
    qr_obj = qr_location.to_dict()
    teacher_distance_m = calculate_teacher_distance(
        teacher_lat, teacher_lng, qr_obj, "qr")

    if teacher_distance_m > DIST_THRESHOLD.QR.value:
        return jsonify({
            "status": "ERROR",
            "code": 400,
            "message": f"Can't clock out. You are {int(teacher_distance_m - DIST_THRESHOLD.QR.value)}m away from school premises."
        }), 400

    # Fixed Time Check Comparison Logic
    cutoff_time = time(CutoffTime.C_HR.value, CutoffTime.C_MIN.value)
    current_time_only = now_lagos.time()

    if current_time_only < cutoff_time:
        return jsonify({
            "status": "ERROR",
            "code": 400,
            "message": "Can't clock out. School is not yet over. Closing time is 4:00 PM."
        }), 400

    try:
        # UPDATE THE EXISTING MORNING ROW INSTEAD OF INSERTING A NEW ONE
        active_log.time_out_lat = teacher_lat
        active_log.time_out_lng = teacher_lng
        active_log.time_out_method = AttendanceMethod.QR.value
        active_log.clock_out_qr = qr_string

        # Explicitly set time_out timestamp since server_default only handles creation actions
        active_log.time_out = now_lagos

        db.session.commit()

        return jsonify({
            "status": "SUCCESS",
            "code": 200,
            "message": f"Clock-out successful. Have a safe trip home!",
            "data": {
                "attendance_log_id": str(active_log.id),
                "distance": int(DIST_THRESHOLD.QR.value - teacher_distance_m),
                "time_out": active_log.time_out.isoformat()
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "ERROR",
            "code": 500,
            "message": f"Server error occurred while clocking out: {str(e)}"
        }), 500
