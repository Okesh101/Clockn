# app/api/teachers/routes.py

from flask import Blueprint, jsonify, request
from app import db, limiter
from app.models.Teacher import Teacher
from app.models.AttendanceLog import AttendanceLog
from app.utils.types import PunctualityStatus
from app.utils.decorators import roles_required
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, case
from datetime import timedelta, datetime, time
import zoneinfo
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


# api/v1/teacher/stats
@teachers_bp.route("/stats", methods=['GET'])
@limiter.limit("30 per minute")
@jwt_required()
@roles_required("Teacher")
def get_teacher_stats():
    current_teacher_id = get_jwt_identity()

    # 1. Fetch the teacher's profile to know when they joined the school
    teacher = db.session.execute(
        db.select(Teacher).filter_by(id=current_teacher_id)
    ).scalar_one_or_none()

    if not teacher:
        return jsonify({
            "status": "ERROR",
            "code": 404,
            "message": "Teacher account profile not found."
        }), 404

    # 2. Get local time zones to construct exact date limits
    lagos_tz = zoneinfo.ZoneInfo("Africa/Lagos")
    now_lagos = datetime.now(lagos_tz)
    today_lagos = now_lagos.date()

    # 2.5. Extract and parse URL Period Filters
    # options: week, month, all (default to month for immediate dashboard relevance)
    period = request.args.get('period', 'month')

    if period == 'week':
        current_weekday = today_lagos.weekday()
        if current_weekday > 4:  # Weekend fallback
            start_filter = today_lagos - timedelta(days=current_weekday)
            end_filter = start_filter + timedelta(days=4)
        else:
            start_filter = today_lagos - timedelta(days=current_weekday)
            end_filter = today_lagos
    elif period == 'month':
        start_filter = today_lagos.replace(day=1)
        end_filter = today_lagos
    else:  # 'all' lifetime fallback
        start_filter = teacher.created_at.astimezone(
            lagos_tz).date() if teacher.created_at else today_lagos
        end_filter = today_lagos

    # 💡 CRUCIAL CONSTRAINT: A teacher cannot have history before their enrollment date
    join_date = teacher.created_at.astimezone(
        lagos_tz).date() if teacher.created_at else today_lagos
    start_filter = max(start_filter, join_date)

    # 3. Calculate total official school workdays (Mon-Fri) that have passed since joining
    total_school_workdays = 0
    current_date = start_filter
    while current_date <= end_filter:
        if current_date.weekday() < 5:  # Monday to Friday
            total_school_workdays += 1
        current_date += timedelta(days=1)

    # 💡 STEP 3.5: Build explicit datetime boundaries from your computed dates
    start_datetime = datetime.combine(
        start_filter, time.min).replace(tzinfo=lagos_tz)
    end_datetime = datetime.combine(
        end_filter, time.max).replace(tzinfo=lagos_tz)

    # 4. Query active log totals from the database
    query = (
        db.select(
            func.count(AttendanceLog.id).label("actual_present_days"),
            func.sum(case((AttendanceLog.punctuality ==
                     PunctualityStatus.ON_TIME.value, 1), else_=0)).label("on_time_days"),
            func.sum(case((AttendanceLog.punctuality ==
                     PunctualityStatus.LATE.value, 1), else_=0)).label("late_days"),
        )
        .filter(
            AttendanceLog.teacher_id == current_teacher_id,
            AttendanceLog.time_in >= start_datetime,
            AttendanceLog.time_in <= end_datetime
        )
    )
    result = db.session.execute(query).one()

    present_days = int(result.actual_present_days or 0)
    on_time_days = int(result.on_time_days or 0)
    late_days = int(result.late_days or 0)

    # 💡 THE BIG FIX: True absences are calculated by subtracting present logs from total workdays
    absent_days = max(0, total_school_workdays - present_days)

    # 5. Handle fallback edge case if a brand new teacher logs in over the weekend before school starts
    if total_school_workdays == 0:
        return jsonify({
            "status": "SUCCESS",
            "code": 200,
            "data": {
                "total_days": 0,
                "present_days": 0,
                "absent_days": 0,
                "on_time_days": 0,
                "late_days": 0,
                "attendance_rates": {
                    "present_rate": 0,
                    "absent_rate": 0,
                    "on_time_rate": 0,
                    "late_rate": 0
                }
            }
        })

    # 6. Calculate accurate mathematical rates
    present_rate = (present_days / total_school_workdays) * 100
    absent_rate = (absent_days / total_school_workdays) * 100

    # Punctuality rates are calculated relative to the days they actually showed up
    on_time_rate = (on_time_days / present_days *
                    100) if present_days > 0 else 0
    late_rate = (late_days / present_days * 100) if present_days > 0 else 0

    stats = {
        "total_days": total_school_workdays,
        "present_days": present_days,
        "absent_days": absent_days,
        "on_time_days": on_time_days,
        "late_days": late_days,
        "attendance_rates": {
            "present_rate": round(present_rate, 1),
            "absent_rate": round(absent_rate, 1),
            "on_time_rate": round(on_time_rate, 1),
            "late_rate": round(late_rate, 1),
        }
    }

    return jsonify({
        "status": "SUCCESS",
        "code": 200,
        "message": "Fetched true historical teacher stats successfully.",
        "data": stats
    })
