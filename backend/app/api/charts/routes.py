# app/api/charts/routes.py

from flask import Blueprint, jsonify
from sqlalchemy import cast, Date, func, case
from app import db, limiter
from flask_jwt_extended import jwt_required
from app.models.Teacher import Teacher
from app.models.AttendanceLog import AttendanceLog
from app.utils.decorators import permissions_required
from app.utils.types import PunctualityStatus
from datetime import datetime, time, timedelta
import zoneinfo


charts_bp = Blueprint("charts", __name__)


# api/v1/charts/weekly
@charts_bp.route("/weekly", methods=['GET'])
@limiter.limit("30 per minute")
@jwt_required()
@permissions_required("view_all_stats")
def get_weekly_charts_endpoint():
    lagos_tz = zoneinfo.ZoneInfo("Africa/Lagos")
    now_lagos = datetime.now(lagos_tz)
    today_lagos = now_lagos.date()

    # 1. Dynamically locate the current week's Monday and Friday
    # today_lagos.weekday() returns 0 for Monday, 1 for Tuesday, etc.
    current_monday = today_lagos - timedelta(days=today_lagos.weekday())
    current_friday = current_monday + timedelta(days=4)

    # Convert to fully aware datetime limits for absolute query precision
    start_week_datetime = datetime.combine(
        current_monday, time.min).replace(tzinfo=lagos_tz)
    end_week_datetime = datetime.combine(
        current_friday, time.max).replace(tzinfo=lagos_tz)

    # 2. Get highest scale limit metric (Total teachers in system)
    total_teachers = db.session.execute(
        db.select(func.count(Teacher.id))).scalar() or 0

    # 3. Pull metrics grouped by each date directly from the DB
    # We count unique teachers per day to get clean presentation values
    chart_query = (
        db.select(
            cast(AttendanceLog.time_in, Date).label("log_date"),
            func.count(func.distinct(AttendanceLog.teacher_id)
                       ).label("present_count"),
            func.sum(case((AttendanceLog.punctuality ==
                     PunctualityStatus.ON_TIME.value, 1), else_=0)).label("on_time_count"),
            func.sum(case((AttendanceLog.punctuality ==
                     PunctualityStatus.LATE.value, 1), else_=0)).label("late_count"),
        )
        .filter(
            AttendanceLog.time_in >= start_week_datetime,
            AttendanceLog.time_in <= end_week_datetime
        )
        .group_by(
            cast(AttendanceLog.time_in, Date)
        )
    )

    db_records = db.session.execute(chart_query).all()

    # Map databse row outputs to a clean Python dictionary using the date strings as keys
    db_data_map = {
        row.log_date.isoformat(): {
            "present": int(row.present_count or 0),
            "on_time": int(row.on_time_count or 0),
            "late": int(row.late_count or 0),
        } for row in db_records
    }

    # 4. Build the structured 5-Day Array sequence layout for the frontend components
    days_of_week_labels = ["Mon", "Tue", "Wed", "Thu", "Fri"]
    formatted_chart_data = []

    # Map across the loop to construct exactly 5 sequential elements
    for idx, day_label in enumerate(days_of_week_labels):
        target_date = current_monday + timedelta(days=idx)
        target_date_str = target_date.isoformat()

        # Extract values if data exists in map; otherwise default gracefully to 0
        day_metrics = db_data_map.get(
            target_date_str, {"present": 0, "on_time": 0, "late": 0})

        formatted_chart_data.append({
            "day": day_label,
            "date": target_date_str,
            "present": day_metrics["present"],
            "on_time": day_metrics["on_time"],
            "late": day_metrics["late"]
        })

    return jsonify({
        "status": "SUCCESS",
        "code": 200,
        "message": "Weekly tracking chart metrics computed successfully.",
        "meta": {
            "week_bounds": {
                "monday": current_monday.isoformat(),
                "friday": current_friday.isoformat()
            },
            # 💡 Vertically scales the chart ceiling on the frontend
            "total_teachers_limit": total_teachers
        },
        "data": formatted_chart_data
    }), 200
