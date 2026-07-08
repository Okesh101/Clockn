# app/api/qrcode/routes.py

from flask import Blueprint, jsonify, request
from app import db, limiter
from app.models.QrLocation import QrLocation
from flask_jwt_extended import jwt_required
from app.utils.decorators import roles_required


qrcode_bp = Blueprint("qrcode", __name__)


# api/v1/qrcode/test
@qrcode_bp.route("/test", methods=['POST'])
def test_qrcode_endpoint():
    data = request.get_json() or {}
    resp = {
        "status": "OK",
        "code": 200,
        "data": data,
        "message": "Health check submitted."
    }
    print(f"Received QR Code: {data}")
    return jsonify(resp)


# api/v1/qrcode (Create QR Location)
@qrcode_bp.route("", methods=["POST"])
@limiter.limit("5 per minute")
@jwt_required()
@roles_required("Admin")
def create_qrcode_location_endpoint():
    data = request.get_json()

    if not data:
        return jsonify({
            "status": "ERROR",
            "code": 400,
            "message": "No input data provided"
        }), 400

    location = data.get("location")
    latitude = data.get("latitude")
    longitude = data.get("longitude")

    if not all([location, latitude, longitude]):
        return jsonify({
            "status": "ERROR",
            "code": 400,
            "message": f"Missing required fields: {', '.join([f for f in ['location', 'latitude', 'longitude'] if not data.get(f)])}"
        }), 400
    
    new_location = QrLocation(
        location=location,
        latitude=latitude,
        longitude=longitude
    )

    try:
        db.session.add(new_location)
        db.session.commit()
        return jsonify({
            "status": "SUCCESS",
            "code": 201,
            "data": new_location.to_dict(),
            "message": "QR Code location created successfully"
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "ERROR",
            "code": 500,
            "message": f"An error occurred uploading qr_code location: {str(e)}"
        }), 500


# api/v1/qrcode (Fetch all QR Locations)
@qrcode_bp.route("", methods=["GET"])
@limiter.limit("25 per minute")
@jwt_required()
@roles_required("Admin")
def get_qrcode_locations_endpoint():
    locations = db.session.execute(db.select(QrLocation)).scalars().all()
    return jsonify({
        "status": "SUCCESS",
        "code": 200,
        "data": [location.to_dict() for location in locations],
        "message": "QR Code locations retrieved successfully"
    }), 200
