# app/utils/extensions.py

from app.utils.types import SCHOOL_COORDS

def haversine_distance(lat1, lng1, lat2, lng2):
    import math
    # Convert degrees to radians
    theta1 = math.radians(lat1)
    theta2 = math.radians(lat2)
    lambda1 = math.radians(lng1)
    lambda2 = math.radians(lng2)

    # Differences
    delta_theta = theta2 - theta1
    delta_lambda = lambda2 - lambda1

    # The Harversine "a" term (the square of half the chord length)
    a = math.sin(delta_theta / 2) ** 2 + math.cos(theta1) * \
        math.cos(theta2) * math.sin(delta_lambda / 2) ** 2

    # The c term (the angular distance in radians)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    EARTH_RADIUS_METERS = 6371000.0
    return EARTH_RADIUS_METERS * c


def calculate_teacher_distance(teacher_lat, teacher_lng, coords={}, method=""):
    if method.lower() == 'qr':
        lat = float(coords.get("latitude"))
        lng = float(coords.get("longitude"))
    else:
        lat = float(SCHOOL_COORDS.LAT.value)
        lng = float(SCHOOL_COORDS.LNG.value)

    return haversine_distance(teacher_lat, teacher_lng, lat, lng)
