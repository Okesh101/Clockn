# app/utils/types.py

from enum import Enum

class AttendanceStatus(Enum):
    ABSENT = "absent"
    PRESENT = "present"
    LATE = "late"
    # EXCUSED = "excused"


STATUS_CHOICES = ", ".join(
    f"'{status.value}'" for status in AttendanceStatus)


class AttendanceMethod(Enum):
    QR = "qr"
    BUTTON = "button"


METHOD_CHOICES = ", ".join(
    f"'{method.value}'" for method in AttendanceMethod)


SCHOOL_COORDINATES = {
    "latitude": 6.534583,
    "longitude": 3.388638,
}

TEACHER_DISTANCE_THRESHOLD_M = 300.0
TEACHER_QR_DISTANCE_THRESHOLD_M = 30.0