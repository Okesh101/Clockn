# Backend API Documentation

This folder contains the backend service for the Clock'n attendance platform. It is a Flask-based REST API that handles authentication, attendance tracking, role management, QR validation, and admin review operations.

---

## 1. Purpose

The backend is the system of record for the entire app. It manages:

- Teacher accounts and profile data
- JWT login and token lifecycle
- Permission and role authorization
- Clock-in and clock-out logs
- Attendance request review workflow
- QR code location mapping
- Reporting and chart data
- Scheduler-based service monitoring

---

## 2. Backend technology stack

- Python 3.12
- Flask
- Flask-SQLAlchemy
- Flask-Migrate
- Flask-JWT-Extended
- Flask-Limiter
- APScheduler
- PostgreSQL
- psycopg2-binary
- Gunicorn
- python-dotenv

---

## 3. Folder structure

```text
backend/
├── app/
│   ├── api/
│   │   ├── attendance/
│   │   ├── auth/
│   │   ├── charts/
│   │   ├── health/
│   │   ├── qrcode/
│   │   ├── request/
│   │   ├── roles/
│   │   └── teachers/
│   ├── config/
│   ├── models/
│   ├── services/
│   └── utils/
├── migrations/
├── __init__.py
├── docker-compose.yml
├── installpy
├── main.py
├── run
├── requirements.txt
└── env/  # local Python virtual environment
```

---

## 4. Application entry point

The application starts in `main.py`:

```python
from app import create_app
from dotenv import load_dotenv
import os

load_dotenv()

FLASK_ENV = os.getenv("FLASK_ENV", "development")
PORT = int(os.getenv("PORT", 5000))

app = create_app()

if __name__ == "__main__":
    is_debug = FLASK_ENV == "development"
    app.run(debug=is_debug, use_reloader=is_debug, port=PORT)
```

This creates the app factory and runs it in debug mode only during development.

---

## 5. Application factory and initialization

`app/__init__.py` does the central bootstrapping:

- Initializes Flask
- Chooses development vs production config
- Initializes SQLAlchemy, JWT, rate limiting, and migration support
- Registers all API blueprints
- Initializes a scheduler
- Adds global error handlers
- Seeds the permission and role system

Blueprints are registered under these prefixes:

```text
/api/v1/auth
/api/v1/attendance
/api/v1/charts
/api/v1/health
/api/v1/qrcode
/api/v1/requests
/api/v1/roles
/api/v1/teachers
```

---

## 6. Configuration

The configuration logic sits in `app/config/config.py`.

### Configuration responsibilities

- `SECRET_KEY` and `JWT_SECRET_KEY`
- Database URL selection for development or production
- JWT expiration values for access and refresh tokens
- Rate limit storage strategy
- SQLAlchemy engine tuning for production

### Development default database

The project expects a Postgres instance. Local setup is defined in `docker-compose.yml` which runs a Postgres container on port `5432` with:

- username: `dev_user_clockn`
- password: `dev_password_clockn`
- database: `clockn_db`

---

## 7. Model layer

The backend relies on PostgreSQL and SQLAlchemy models. Key tables include:

### `Teacher`

Stores teacher identity and authentication info.

Fields include:

- `id` (UUID)
- `firstname`
- `lastname`
- `email`
- `phone`
- `password_hash`
- `created_at`
- `updated_at`
- relationships to roles

Behavior:

- Password hashing via `set_password()`
- Password verification via `check_password()`
- Role lookup via `has_role()`
- Serialization via `to_dict()`

### `Role`

Defines access groups like `Admin` and `Teacher`.

### `Permission`

Stores permission strings such as:

- `manage_roles`
- `view_all_attendance`
- `view_my_attendance`
- `clock_in_out`
- `manage_teachers`
- `view_my_profile`
- `manage_qr`
- `view_all_stats`
- `manage_teacher_requests`
- `request_permission`

### `AttendanceLog`

Stores individual attendance records.

Contains:

- `teacher_id`
- `time_in`
- `time_out`
- `time_in_lat`, `time_in_lng`
- `time_out_lat`, `time_out_lng`
- `status`
- `punctuality`
- `time_in_method`
- `time_out_method`
- `clock_in_qr`

### `QrLocation`

Stores QR validation locations used when a teacher scans a QR code for attendance.

### `AttendanceRequest`

Tracks requests for clock-out exceptions.

Fields include:

- `teacher_id`
- `attendance_id`
- `teacher_note`
- `admin_note`
- `status`
- `resolved_by`
- timestamps

### `TokenBlocklist`

Stores invalidated JWT IDs after logout so a logged-out session cannot continue.

---

## 8. Authorization and permissions model

The app enforces authorization through custom decorators in `app/utils/decorators.py`.

### `roles_required()`

Checks whether a teacher has one of the required roles.

### `permissions_required()`

Checks whether a teacher has one or more of the required permissions.

This is used heavily on endpoints like:

- admin-only routes
- teacher-only routes
- role assignment routes
- attendance action routes
- request review endpoints

The application also gives admin users a global override by checking for the `Admin` role.

---

## 9. API modules

### Auth API

Location: `app/api/auth/routes.py`

Routes:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/profile`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh`

Responsibilities:

- Teacher registration
- Credential validation
- JWT generation
- Token revocation
- Profile retrieval

### Attendance API

Location: `app/api/attendance/routes.py`

Routes include:

- `POST /api/v1/attendance/in`
- `POST /api/v1/attendance/qr/in`
- `POST /api/v1/attendance/out`
- `GET /api/v1/attendance` (depending on implementation)
- `GET /api/v1/attendance/stats` and related reporting routes

Responsibilities:

- Clock-in logic
- Clock-out logic
- Duplicate prevention
- Distance validation against geofence or QR location
- Punctuality status assignment
- Status tracking during the day

### QR API

Location: `app/api/qrcode/routes.py`

Routes:

- `POST /api/v1/qrcode`
- `GET /api/v1/qrcode`

Responsibilities:

- Create QR validation location entries
- Return all QR locations
- Support QR-based attendance scanning

### Request API

Location: `app/api/request/routes.py`

Routes:

- `POST /api/v1/requests`
- `GET /api/v1/requests/logs`
- `GET /api/v1/requests`
- `PATCH /api/v1/requests/<id>/review`

Responsibilities:

- Teacher submits attendance request
- Admin retrieves pending or filtered requests
- Admin approves or rejects request
- Updates attendance time-out record when approved

### Teachers API

Location: `app/api/teachers/routes.py`

Routes:

- `GET /api/v1/teachers`
- `GET /api/v1/teachers/<teacher_id>`
- `GET /api/v1/teachers/stats`

Responsibilities:

- Fetch paginated teacher list
- Fetch detailed teacher profile
- Compute period-based teacher stats
- Calculate workday attendance metrics

### Charts API

Location: `app/api/charts/routes.py`

Routes:

- `GET /api/v1/charts/weekly`

Responsibilities:

- Calculates weekly attendance metrics
- Returns `present`, `on_time`, and `late` counts per weekday
- Provides chart-ready payloads for admin UI analytics

### Roles API

Location: `app/api/roles/routes.py`

Routes:

- `POST /api/v1/roles/seed`
- `POST /api/v1/roles`
- `GET /api/v1/roles`
- `POST /api/v1/roles/assign`

Responsibilities:

- Create roles
- Seed base roles and permissions
- Return permission matrix
- Assign roles to teachers

### Health API

Location: `app/api/health/routes.py`

Routes:

- `GET /api/v1/health`
- `GET /api/v1/health/me`

Responsibilities:

- Return service uptime and response time
- Provide lightweight status endpoint for uptime monitoring

---

## 10. Scheduler and operational support

`app/services/scheduler/apscheduler.py` contains a background service that periodically pings the health endpoint in production.

This keeps the app alive on hosting platforms that scale down idle services.

The scheduler is initialized inside `app/__init__.py` when the app boots.

---

## 11. Security and rate limiting

The API uses:

- JWT access and refresh tokens
- role-based access checks
- permission checks for business-specific endpoints
- token blocklist on logout
- Flask-Limiter for endpoint protection

Examples of request limiting in code include:

- `15 per minute` for registration
- `10 per minute` for login
- `20 per minute` for attendance actions
- `30 per minute` for reporting endpoints

---

## 12. Database seeding

The app exposes a CLI helper command:

```bash
flask seed-permissions
```

This ensures all default permissions and roles exist in the database before login or role assignment workflows begin.

---

## 13. Local development workflow

### Create virtual environment

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Start PostgreSQL

```bash
cd backend
docker compose up -d
```

### Start the API

```bash
cd backend
./run
```

The app will typically run on:

```text
http://localhost:5000
```

---

## 14. Expected production hardening before company handoff

Before selling or deploying this system more seriously, the backend should include:

- Unit and integration tests
- API docs with Swagger/OpenAPI
- CI checks for linting and testing
- Better secrets management
- Stronger DB migration discipline
- Audit history for admin actions
- Notifications for attendance exceptions

---

## 15. Summary

The backend is the engine of the Clock'n platform. It provides the complete attendance logic, security layer, data model, and operational features needed to support both teacher and admin workflows.

If you are preparing to hand this project to a company or client, this backend is the core business logic engine and should be treated as the most important technical asset in the repository.
