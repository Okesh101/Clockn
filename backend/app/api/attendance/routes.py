# app/api/attendance/routes.py

from flask import Blueprint, request, jsonify
from sqlalchemy import cast, Date, func, and_, case
from sqlalchemy.orm import aliased
from app import db, limiter
from flask_jwt_extended import get_jwt_identity, jwt_required
from app.models.Teacher import Teacher
from app.models.AttendanceLog import AttendanceLog
from app.models.QrLocation import QrLocation
from app.utils.decorators import roles_required
from app.utils.types import AttendanceStatus, PunctualityStatus, AttendanceMethod, DIST_THRESHOLD, CutoffTime
from app.utils.extensions import calculate_teacher_distance
from datetime import datetime, time, timedelta
import zoneinfo

attendance_bp = Blueprint("attendance", __name__)


@attendance_bp.route("/in", methods=['POST'])
@limiter.limit('20 per minute')
@jwt_required()
@roles_required("Teacher")
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

    # Determine punctuality state
    if current_time_only > cutoff_time:
        current_punctuality = PunctualityStatus.LATE.value
    else:
        current_punctuality = PunctualityStatus.ON_TIME.value

    try:
        new_log = AttendanceLog(
            teacher_id=current_teacher_id,
            time_in_lat=teacher_lat,
            time_in_lng=teacher_lng,
            status=AttendanceStatus.PRESENT.value,       # Always present upon scanning!
            punctuality=current_punctuality,
            time_in_method=AttendanceMethod.BUTTON.value  # resolves to "button"
        )
        db.session.add(new_log)
        db.session.commit()

        return jsonify({
            "status": "SUCCESS",
            "code": 201,
            "message": f"Clock-in successful. Punctual status: {current_punctuality}.",
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
@roles_required("Teacher")
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

    # Determine punctuality state
    if current_time_only > cutoff_time:
        current_punctuality = PunctualityStatus.LATE.value
    else:
        current_punctuality = PunctualityStatus.ON_TIME.value

    try:
        new_log = AttendanceLog(
            teacher_id=current_teacher_id,
            time_in_lat=teacher_lat,
            time_in_lng=teacher_lng,
            status=AttendanceStatus.PRESENT.value,       # Always present upon scanning!
            punctuality=current_punctuality,
            time_in_method=AttendanceMethod.QR.value,  # resolves to "qr"
            clock_in_qr=qr_string
        )
        db.session.add(new_log)
        db.session.commit()

        return jsonify({
            "status": "SUCCESS",
            "code": 201,
            "message": f"Clock-in successful. Punctual status: {current_punctuality}.",
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
@roles_required("Teacher")
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
@roles_required("Teacher")
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


@attendance_bp.route("/me", methods=['GET'])
@limiter.limit('30 per minute')
@jwt_required()
@roles_required("Teacher")
def get_teacher_history_endpoint():
    current_teacher_id = get_jwt_identity()

    # 1. Coordinate localized Lagos timeline targets
    lagos_tz = zoneinfo.ZoneInfo("Africa/Lagos")
    now_lagos = datetime.now(lagos_tz)
    today_lagos = now_lagos.date()

    # 2. Extract and parse URL Date Range Filters
    range_type = request.args.get('range_type', 'all')

    if range_type == 'week':
        current_weekday = today_lagos.weekday()
        if current_weekday > 4:  # It's Saturday or Sunday
            start_filter = today_lagos - timedelta(days=current_weekday)
            end_filter = start_filter + timedelta(days=4)
        else:
            start_filter = today_lagos - timedelta(days=current_weekday)
            end_filter = today_lagos
    elif range_type == 'month':
        start_filter = today_lagos.replace(day=1)
        end_filter = today_lagos
    elif range_type == 'custom':
        try:
            start_filter = datetime.strptime(
                request.args.get('start_date'), '%Y-%m-%d').date()
            end_filter = datetime.strptime(
                request.args.get('end_date'), '%Y-%m-%d').date()
        except (ValueError, TypeError):
            return jsonify({
                "status": "ERROR",
                "code": 400,
                "message": "Invalid custom date format. Use YYYY-MM-DD"
            }), 400
    else:  # Default fallback option is always 'all'
        start_filter = today_lagos - timedelta(days=90)
        end_filter = today_lagos

    # 3. Generate a sequence of workdays (Monday through Friday) inside the target window
    target_dates = []
    current_date = start_filter
    while current_date <= end_filter:
        if current_date.weekday() < 5:  # 0 to 4 represent Monday to Friday
            target_dates.append(current_date)
        current_date += timedelta(days=1)

    # Sort target dates descending to show newest dates first
    target_dates.reverse()

    total_items = len(target_dates)

    if total_items == 0:
        return jsonify({
            "status": "NOT_FOUND",
            "code": 404,
            "message": "No workdays found inside this range structure."
        }), 404

    # 4. Core Query: Fetch ALL logs within the full date range window to compute true KPIs
    InLocation = aliased(QrLocation, name="in_location")
    OutLocation = aliased(QrLocation, name="out_location")

    query = (
        db.select(
            AttendanceLog.id.label("log_id"),
            AttendanceLog.time_in,
            AttendanceLog.time_out,
            AttendanceLog.status,
            AttendanceLog.punctuality,
            AttendanceLog.time_in_method,
            AttendanceLog.time_out_method,
            InLocation.location.label("clock_in_location_name"),
            OutLocation.location.label("clock_out_location_name")
        )
        .outerjoin(InLocation, AttendanceLog.clock_in_qr == InLocation.qr_string)
        .outerjoin(OutLocation, AttendanceLog.clock_out_qr == OutLocation.qr_string)
        .filter(
            AttendanceLog.teacher_id == current_teacher_id,
            cast(AttendanceLog.time_in, Date) >= start_filter,
            cast(AttendanceLog.time_in, Date) <= end_filter
        )
    )

    all_raw_records = db.session.execute(query).all()

    # Map the database records by their calendar date key for O(1) matching performance
    logs_by_date = {}
    for row in all_raw_records:
        if row.time_in:
            date_key = row.time_in.astimezone(lagos_tz).date().isoformat()
            logs_by_date[date_key] = row

    # 5. Global Summary Statistics Engine (Runs across all dates in the selection)
    summary_stats = {
        "total": 0,
        "present": 0,
        "absent": 0,
        "late": 0,
        "onTime": 0
    }

    for day in target_dates:
        day_str = day.isoformat()
        row = logs_by_date.get(day_str)

        summary_stats["total"] += 1
        if row:
            summary_stats["present"] += 1
            # Adjust strings to match your data layer capitalization expectations
            p_status = str(row.punctuality).lower() if row.punctuality else ""
            if p_status in ["late"]:
                summary_stats["late"] += 1
            elif p_status in ["on_time", "on-time", "ontime"]:
                summary_stats["onTime"] += 1
        else:
            summary_stats["absent"] += 1

    # 6. Pagination Slicing
    try:
        page = max(1, int(request.args.get('page', 1)))
    except ValueError:
        page = 1

    PER_PAGE = 15
    total_pages = (total_items + PER_PAGE - 1) // PER_PAGE
    has_next = page < total_pages
    has_prev = page > 1

    start_offset = (page - 1) * PER_PAGE
    end_offset = start_offset + PER_PAGE
    paginated_dates = target_dates[start_offset:end_offset]

    if not paginated_dates and page > 1:
        return jsonify({
            "status": "ERROR",
            "code": 400,
            "message": f"Page {page} out of bounds."
        }), 400

    # 7. Build out only the paginated data rows for the JSON return payload
    teacher_attendance_data = []

    for day in paginated_dates:
        day_str = day.isoformat()
        row = logs_by_date.get(day_str)

        if row:
            duration_minutes = None
            if row.time_in and row.time_out:
                in_time_localized = row.time_in.astimezone(lagos_tz)
                out_time_localized = row.time_out.astimezone(lagos_tz)
                time_delta = out_time_localized - in_time_localized
                duration_minutes = int(time_delta.total_seconds() // 60)

            in_loc = row.clock_in_location_name or (
                "School (Button)" if row.time_in_method == "button" else None)
            out_loc = row.clock_out_location_name or (
                "School (Button)" if row.time_out_method == "button" else None)

            teacher_attendance_data.append({
                "date": day_str,
                "log_id": str(row.log_id),
                "status": row.status,
                "punctuality": row.punctuality,
                "time_in": row.time_in.isoformat(),
                "time_out": row.time_out.isoformat() if row.time_out else None,
                "time_in_method": row.time_in_method,
                "time_out_method": row.time_out_method,
                "clock_in_location": in_loc,
                "clock_out_location": out_loc,
                "duration_minutes": duration_minutes if duration_minutes is not None else None
            })
        else:
            teacher_attendance_data.append({
                "date": day_str,
                "log_id": None,
                "status": AttendanceStatus.ABSENT.value,  # or "absent"
                "punctuality": None,
                "time_in": None,
                "time_out": None,
                "time_in_method": None,
                "time_out_method": None,
                "clock_in_location": None,
                "clock_out_location": None,
                "duration_minutes": None
            })

    return jsonify({
        "status": "SUCCESS",
        "code": 200,
        "message": f"Personal history for range '{range_type}' fetched successfully.",
        "meta": {
            "total_items": total_items,
            "total_pages": total_pages,
            "current_page": page,
            "per_page": PER_PAGE,
            "has_next": has_next,
            "has_prev": has_prev,
            "filtered_range": {
                "start": start_filter.isoformat(),
                "end": end_filter.isoformat()
            },
            "summary": summary_stats  # 💡 Global KPIs added here
        },
        "data": teacher_attendance_data
    }), 200


@attendance_bp.route("", methods=['GET'])
@limiter.limit('30 per minute')
@jwt_required()
@roles_required("Admin")
def get_all_teachers_attendance_endpoint():
    # 1. Coordinate localized Lagos timeline targets
    lagos_tz = zoneinfo.ZoneInfo("Africa/Lagos")
    now_lagos = datetime.now(lagos_tz)
    today_lagos = now_lagos.date()

    # 2. Extract and parse URL Date Range Filters
    # options: today, yesterday, week, month, custom
    range_type = request.args.get('range_type', 'today')

    if range_type == 'yesterday':
        start_filter = today_lagos - timedelta(days=1)
        end_filter = today_lagos - timedelta(days=1)
    elif range_type == 'week':
        # Safely capture Monday even if accessed on Saturday(5) or Sunday(6)
        current_weekday = today_lagos.weekday()
        if current_weekday > 4:  # It's Saturday or Sunday
            start_filter = today_lagos - timedelta(days=current_weekday)
            end_filter = start_filter + timedelta(days=4)
        else:
            start_filter = today_lagos - timedelta(days=current_weekday)
            # Cap the end filter at 'today' so pagination counts don't look into the future (Tue-Fri)
            end_filter = today_lagos
    elif range_type == 'month':
        start_filter = today_lagos.replace(day=1)
        end_filter = today_lagos
    elif range_type == 'custom':
        try:
            start_filter = datetime.strptime(
                request.args.get('start_date'), '%Y-%m-%d').date()
            end_filter = datetime.strptime(
                request.args.get('end_date'), '%Y-%m-%d').date()
        except (ValueError, TypeError):
            return jsonify({
                "status": "ERROR",
                "code": 400,
                "message": "Invalid custom date format. Use YYYY-MM-DD"
            }), 400
    else:  # Default fallback option is always 'today'
        start_filter = today_lagos
        end_filter = today_lagos

    # 3. Grab and validate page numbers from URL parameters (e.g., ?page=2)
    # Default to page 1, and ensure the input is an integer greater than 0
    try:
        page = max(1, int(request.args.get('page', 1)))
    except ValueError:
        page = 1

    PER_PAGE = 50
    offset_value = (page - 1) * PER_PAGE

    # 💡 FIX: Total count must scale dynamically based on your filters to protect pagination
    # If looking at "today", total items equals total teachers. If looking at a range, count total log items.
    # if start_filter == end_filter:
    if range_type in ['today', 'yesterday']:
        total_count_query = db.select(func.count(Teacher.id))
    else:
        total_count_query = db.select(func.count(AttendanceLog.id)).filter(
            cast(AttendanceLog.time_in, Date) >= start_filter,
            cast(AttendanceLog.time_in, Date) <= end_filter
        )

    total_count_query = db.select(func.count(Teacher.id))
    total_items = db.session.execute(total_count_query).scalar() or 0

    if total_items == 0:
        return jsonify({
            "status": "NOT_FOUND",
            "code": 404,
            "message": "No records found for this range."
        }), 404

    total_pages = (total_items + PER_PAGE - 1) // PER_PAGE
    has_next = page < total_pages
    has_prev = page > 1

    # 💡 FIX: Create SQL Aliases so we can fetch two completely different rows from QrLocation at once
    InLocation = aliased(QrLocation, name="in_location")
    OutLocation = aliased(QrLocation, name="out_location")

    # 5. Core Composite Join Selection Query
    # Left Outer Join matches all teachers and binds their logs ONLY within the target date range window
    query = (
        db.select(
            Teacher.id.label("teacher_id"),
            Teacher.firstname,
            Teacher.lastname,
            Teacher.email,
            Teacher.phone,
            AttendanceLog.id.label("log_id"),
            AttendanceLog.time_in,
            AttendanceLog.time_out,
            AttendanceLog.status,
            AttendanceLog.punctuality,
            AttendanceLog.time_in_method,
            AttendanceLog.time_out_method,
            InLocation.location.label(
                "clock_in_location_name"),   # Sweeps clock-in spot
            OutLocation.location.label(
                "clock_out_location_name")  # Sweeps clock-out spot
        )
        .outerjoin(
            AttendanceLog,
            and_(
                AttendanceLog.teacher_id == Teacher.id,
                cast(AttendanceLog.time_in, Date) >= start_filter,
                cast(AttendanceLog.time_in, Date) <= end_filter
            )
        )
        # 💡 FIX: Clean secondary outerjoins to safely extract textual names if QR fields are populated
        .outerjoin(InLocation, AttendanceLog.clock_in_qr == InLocation.qr_string)
        .outerjoin(OutLocation, AttendanceLog.clock_out_qr == OutLocation.qr_string)
        .order_by(Teacher.lastname.asc(), AttendanceLog.time_in.desc())
        .limit(PER_PAGE)
        .offset(offset_value)
    )

    records = db.session.execute(query).all()

    if not records and page > 1:
        return jsonify({
            "status": "ERROR",
            "code": 400,
            "message": f"Page {page} out of bounds."
        }), 400

    teachers_attendance_data = []

    for row in records:
        # Calculate time spent on campus if both clock-in and clock-out frames exist
        duration_minutes = None
        if row.time_in and row.time_out:
            # 💡 .astimezone() is built right into row.time_in and row.time_out!
            in_time_localized = row.time_in.astimezone(lagos_tz)
            out_time_localized = row.time_out.astimezone(lagos_tz)

            # Now the subtraction math will be 100% accurate
            time_delta = out_time_localized - in_time_localized
            duration_minutes = int(time_delta.total_seconds() // 60)

        # 💡 FIX: Safely fallback to "Campus Button-Click" if they didn't use a QR code
        in_loc = row.clock_in_location_name or (
            "School (Button)" if row.time_in_method == "button" else None)
        out_loc = row.clock_out_location_name or (
            "School (Button)" if row.time_out_method == "button" else None)

        # Build clean JSON serializable dictionary objects
        teachers_attendance_data.append({
            "teacher_id": str(row.teacher_id),
            "teacher_name": f"{row.lastname} {row.firstname}",
            "email": row.email,
            "phone": row.phone,
            "attendance_record": {
                "log_id": str(row.log_id) if row.log_id else None,

                # 1. Clean Presence tracking mapping (present / absent)
                "presence_status": row.status if row.log_id else AttendanceStatus.ABSENT.value,

                # 2. Clean Punctuality mapping (on_time / late / None if absent)
                "punctuality_status": row.punctuality if row.log_id else None,

                "time_in": row.time_in.isoformat() if row.time_in else None,
                "time_out": row.time_out.isoformat() if row.time_out else None,
                "time_in_method": row.time_in_method if row.time_in else None,
                "time_out_method": row.time_out_method if row.time_out else None,
                "clock_in_location": in_loc,
                "clock_out_location": out_loc,
                "duration_spent": f"{duration_minutes // 60}h {duration_minutes % 60}m" if duration_minutes is not None else None
            }
        })

    return jsonify({
        "status": "SUCCESS",
        "code": 200,
        "message": f"Attendance logs for range type '{range_type}' fetched successfully.",
        "meta": {
            "total_items": total_items,
            "total_pages": total_pages,
            "current_page": page,
            "per_page": PER_PAGE,
            "has_next": has_next,
            "has_prev": has_prev,
            "filtered_range": {
                "start": start_filter.isoformat(),
                "end": end_filter.isoformat()
            }
        },
        "data": teachers_attendance_data
    }), 200


# api/v1/attendance/stats
@attendance_bp.route("/stats", methods=['GET'])
@limiter.limit('30 per minute')
@jwt_required()
@roles_required("Admin")
def get_attendance_stats():
    lagos_tz = zoneinfo.ZoneInfo("Africa/Lagos")
    now_lagos = datetime.now(lagos_tz)
    today_lagos = now_lagos.date()

    range_type = request.args.get('range_type', 'today')

    if range_type == 'yesterday':
        start_filter = today_lagos - timedelta(days=1)
        end_filter = today_lagos - timedelta(days=1)
    elif range_type == 'month':
        start_filter = today_lagos.replace(day=1)
        end_filter = today_lagos
    elif range_type == 'custom':
        try:
            start_filter = datetime.strptime(
                request.args.get('start_date'), '%Y-%m-%d').date()
            end_filter = datetime.strptime(
                request.args.get('end_date'), '%Y-%m-%d').date()
        except (ValueError, TypeError):
            return jsonify({
                "status": "ERROR",
                "code": 400,
                "message": "Invalid custom date format. Use YYYY-MM-DD"
            }), 400
    else:  # Default to 'today'
        start_filter = today_lagos
        end_filter = today_lagos

    # Build datetime boundaries for the SQL filter
    start_datetime = datetime.combine(
        start_filter, time.min).replace(tzinfo=lagos_tz)
    end_datetime = datetime.combine(
        end_filter, time.max).replace(tzinfo=lagos_tz)

    # 1. Get total unique active teachers registered in system
    total_teachers = db.session.execute(
        db.select(func.count(Teacher.id))).scalar() or 0
    if total_teachers == 0:
        return jsonify({
            "status": "NOT_FOUND",
            "code": 404,
            "message": "No teachers found."
        }), 404

    # 2. Count total workdays (Mon-Fri) in this selection range
    workday_count = 0
    current_date = start_filter
    while current_date <= end_filter:
        if current_date.weekday() < 5:  # Skip Saturday and Sunday
            workday_count += 1
        current_date += timedelta(days=1)

    # 3. Calculate total possible attendance slots across the organization
    total_possible_slots = total_teachers * workday_count

    # 4. Fetch the aggregate totals from the database
    # 💡 FIX: Count unique teacher ids who clocked in during the range window to ground the analytics
    stats_query = db.select(
        func.count(func.distinct(AttendanceLog.teacher_id)
                   ).label("total_present_teachers"),
        func.sum(case((AttendanceLog.punctuality ==
                 PunctualityStatus.LATE.value, 1), else_=0)).label("total_late"),
        func.sum(case((AttendanceLog.punctuality ==
                 PunctualityStatus.ON_TIME.value, 1), else_=0)).label("total_on_time")
    ).filter(
        AttendanceLog.time_in >= start_datetime,
        AttendanceLog.time_in <= end_datetime
    )
    stats_result = db.session.execute(stats_query).one()

    # Read unique active user count
    present_count = int(stats_result.total_present_teachers or 0)
    late_count = int(stats_result.total_late or 0)
    on_time_count = int(stats_result.total_on_time or 0)

    # 💡 FIX: Absent count represents teachers who never clocked in at all during this time frame
    absent_count = max(0, total_teachers - present_count)

    # 5. Calculate a real-time snapshot of who is physically missing TODAY
    today_start = datetime.combine(
        today_lagos, time.min).replace(tzinfo=lagos_tz)
    today_end = datetime.combine(
        today_lagos, time.max).replace(tzinfo=lagos_tz)

    teachers_present_today = db.session.execute(
        db.select(func.count(func.distinct(AttendanceLog.teacher_id)))
        .filter(AttendanceLog.time_in >= today_start, AttendanceLog.time_in <= today_end)
    ).scalar() or 0

    current_absent_today = max(0, total_teachers - teachers_present_today)

    # 6. Deliver the corrected, human-focused analytics payload
    stats_payload = {
        "total_teachers": total_teachers,
        "total_workdays_in_range": workday_count,
        "total_possible_slots": total_possible_slots,
        "total_present": present_count,
        "total_on_time": on_time_count,
        "total_late": late_count,
        "total_absent": absent_count,

        # Frontend-friendly targets for real-time status card elements
        "snapshot_today": {
            "present": teachers_present_today,
            "absent": current_absent_today
        }
    }

    return jsonify({
        "status": "SUCCESS",
        "code": 200,
        "message": f"Stats for '{range_type}' computed successfully.",
        "meta": {
            "filtered_range": {
                "start": start_filter.isoformat(),
                "end": end_filter.isoformat()
            }
        },
        "data": stats_payload
    }), 200
