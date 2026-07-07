# app/api/health/routes.py

import time
from flask import Blueprint, jsonify

app_start_time = time.time()

health_bp = Blueprint("health", __name__)


@health_bp.route("", methods=["GET"])
def health_check():
    request_start_time = time.time()

    uptime_seconds = int(time.time() - app_start_time)

    response_data = {
        "status": "SUCCESS",
        "code": 200,
        "message": "Clock'n API is healthy and running.",
        "meta": {
            "uptime": f"{uptime_seconds} secs" if uptime_seconds > 1 else f"{uptime_seconds} sec",
        }
    }

    execution_time_ms = round((time.time() - request_start_time) * 1000, 2)

    response_data["meta"]["response_time"] = f"{execution_time_ms} ms"

    return jsonify(response_data)


@health_bp.route("/me", methods=['GET'])
def pinging_endpoint():
    return jsonify({
        "status": "OK",
        "code": 200,
        "message": "Service is running."
    })


@health_bp.route("/qr", methods=['POST'])
def post_health_check():
    from flask import request
    data = request.get_json() or {}
    resp = {
        "status": "OK",
        "code": 200,
        "data": data,
        "message": "Health check submitted."
    }
    print(f"Received QR Code: {data}")
    return jsonify(resp)