# app/utils/types.py

from enum import Enum


class AttendanceStatus(Enum):
    ABSENT = "absent"
    PRESENT = "present"


class PunctualityStatus(Enum):
    ON_TIME = "on_time"
    LATE = "late"
    # EXCUSED = "excused"


class RequestStatus(Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class AttendanceMethod(Enum):
    QR = "qr"
    BUTTON = "button"


STATUS_CHOICES = ", ".join(
    f"'{status.value}'" for status in AttendanceStatus)

PUNCTUALITY_CHOICES = ", ".join(
    f"'{punctual.value}'" for punctual in PunctualityStatus)

REQUEST_CHOICES = ", ".join(
    f"'{request.value}'" for request in RequestStatus)

METHOD_CHOICES = ", ".join(
    f"'{method.value}'" for method in AttendanceMethod)


class SCHOOL_COORDS(Enum):
    LAT = 6.533134
    LNG = 3.387837


class DIST_THRESHOLD(Enum):
    QR = 30.0
    BTN = 105.0


class CutoffTime(Enum):  # Real school cut-off time for arrival is 7:30AM
    # 8:05 AM
    A_HR = 8
    A_MIN = 5
    # 4:00 PM
    C_HR = 16
    C_MIN = 00
