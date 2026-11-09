# Clock'n - Teacher Attendance Management System

Clock'n is a full-stack attendance and school operations platform built for modern institutions that need to track teacher presence, enforce attendance discipline, and automate approval workflows. The solution combines a Flask backend API, PostgreSQL storage, and two separate React portals: an administrator portal and a teacher portal.

The system is designed to support:

- Teacher registration and role-based access
- Daily clock-in and clock-out tracking
- QR code verification and geofenced attendance checks
- Early clock-out requests with admin approval or rejection
- Attendance reports and weekly summaries
- Secure JWT authentication and permission enforcement

---

## 1. Product overview

This project is effectively a school attendance management product with three core layers:

1. Backend API layer: manages authentication, permissions, attendance logic, role assignment, QR-location data, request workflow, and reporting.
2. Admin frontend: gives administrators a command center for monitoring teachers, reviewing attendance logs, handling requests, assigning roles, and creating QR validation locations.
3. Teacher frontend: gives teachers a streamlined daily workflow to log in, clock in/out, scan QR codes, submit early clock-out requests, and review their history.

The app is structured as a monorepo with isolated front-end apps for different user groups but a shared backend and database.

---

## 2. Why this project exists

The system addresses a common problem in schools and institutions: attendance is often tracked manually, inconsistently, or without verification. This project introduces a digital replacement where:

- Attendance is time-stamped and tied to a teacher identity
- Location checks reduce proxy attendance or fake check-ins
- QR validation makes the process more secure and less manual
- Request flows create auditability for exceptions
- Permissions and roles make access predictable and controlled

---

## 3. High-level architecture

```text
+---------------------+        +---------------------------+
| Teacher Frontend    | ----> | Flask API / backend      |
| React + Vite        |        | SQLAlchemy + JWT         |
+---------------------+        | PostgreSQL               |
      |                        +---------------------------+
      |                                 |
      |                                 v
+---------------------+        +---------------------------+
| Admin Frontend      | ----> | Role/Permission System   |
| React + Vite        |        | Attendance Logic         |
+---------------------+        | Charts / Requests         |
                              +---------------------------+
```

### Key components

- Backend: Flask app with SQLAlchemy models and API blueprints
- Database: PostgreSQL via Docker or a cloud-hosted database
- Admin app: admin portal for operations and oversight
- Teacher app: teacher portal for daily attendance actions
- Security: JWT access tokens, refresh tokens, and permission enforcement

---

## 4. Features implemented

### Teacher features

- Register and sign in
- View personal profile
- Check in using a button or QR scan
- Check out using a button or QR scan
- Clock in and out only when within acceptable distance from school or QR check-in zone
- Receive on-time or late status based on cut-off time
- Request an early or special clock-out with note support
- View request history and statuses
- Review attendance history

### Admin features

- Sign in to admin dashboard
- View all teachers
- Inspect teacher profiles and contact details
- Browse attendance logs and attendance summaries
- Review attendance statistics across time windows
- Manage teacher roles and permissions
- Create and view QR locations for validation
- Approve or reject clock-out requests
- Review weekly chart analytics

---

## 5. Repository structure

```text
Clockn/
├── README.md
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── config/
│   │   ├── models/
│   │   ├── services/
│   │   └── utils/
│   ├── migrations/
│   ├── docker-compose.yml
│   ├── main.py
│   ├── requirements.txt
│   ├── run
│   └── installpy
├── frontend/
│   ├── admin/
│   └── teacher/
└── CHECKLIST.txt
```

---

## 6. Technical stack

### Backend

- Python 3.12
- Flask
- Flask-SQLAlchemy
- Flask-JWT-Extended
- Flask-Migrate
- Flask-Limiter
- APScheduler
- PostgreSQL
- Gunicorn

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Axios
- Tailwind CSS
- Framer Motion
- Recharts (admin analytics)
- HTML5 QR scanner / QR code support in teacher app

---

## 7. Requirements

Before running the project, ensure you have:

- Node.js 18+ or 20+
- npm
- Python 3.12+
- PostgreSQL database or Docker support
- A terminal with internet access to install dependencies

Optional but useful:

- Docker Desktop / Docker Engine
- VS Code with Python and TypeScript extensions

---

## 8. Environment variables

The backend reads configuration from environment variables. At a minimum, define:

```bash
export FLASK_ENV=development
export SQLALCHEMY_DATABASE_URI=postgresql://dev_user_clockn:dev_password_clockn@localhost:5432/clockn_db
export FLASK_SECRET_KEY=your-strong-secret
export JWT_SECRET_KEY=your-jwt-secret
export JWT_ACCESS_TOKEN_EXPIRES=900
export JWT_REFRESH_TOKEN_EXPIRES=2592000
```

In production, the app also supports:

```bash
export DATABASE_URL=postgresql://user:password@host:5432/dbname
```

For deployment or local-run convenience, environment variables can be placed in a `.env` file or exported in the shell before starting the API.

---

## 9. Setup and run steps

### 9.1 Start the PostgreSQL database

From the backend directory:

```bash
cd backend
docker compose up -d
```

This starts a local PostgreSQL container using the configuration in `backend/docker-compose.yml`.

### 9.2 Install backend dependencies

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 9.3 Run the backend

```bash
cd backend
./run
```

This starts the Flask app on port 5000 by default.

### 9.4 Install admin frontend dependencies

```bash
cd frontend/admin
npm install
npm run dev
```

### 9.5 Install teacher frontend dependencies

```bash
cd frontend/teacher
npm install
npm run dev
```

Once both frontends run, access the apps through the local Vite development URLs (usually `http://localhost:5173` and another port if multiple Vite apps are running).

---

## 10. How the app works in practice

### Registration flow

- A teacher submits registration information
- The backend validates phone number format, email uniqueness, and required fields
- The first teacher to sign up is assigned admin and teacher roles
- Subsequent users are assigned the teacher role by default

### Authentication flow

- Teacher logs in with email and password
- The server creates an access token and a refresh token
- Each protected API call validates the JWT
- A token blocklist ensures logged-out sessions become invalid immediately

### Attendance flow

- Teacher clocks in with either a manual button or QR code
- System checks whether the teacher is already clocked in for the day
- Distance is measured from a geofenced school point or QR validation point
- A punctuality value is assigned based on cut-off time
- The attendance record is stored in the database

### Clock-out workflow

- Teacher may clock out normally or request early clock-out before the approval window
- A request includes optional notes and optional coordinates
- Admin can approve or reject the request
- Approval updates the attendance log with time-out data

### Admin oversight

- Admin sees teacher lists, attendance logs, and weekly analytics charts
- Admin can assign or update roles and permissions
- Admin can manage QR locations used in attendance verification
- Admin can resolve gatekeeping requests from teachers

---

## 11. Key backend modules

The backend is organized around the following major areas:

- `app/__init__.py`: creates the Flask app, init config, register blueprints, and initialize scheduler
- `app/api/auth/routes.py`: registration, login, profile, logout, refresh
- `app/api/attendance/routes.py`: clock-in and clock-out logic
- `app/api/qrcode/routes.py`: QR location creation and lookup
- `app/api/request/routes.py`: teacher submissions and admin reviews
- `app/api/teachers/routes.py`: teacher listing, detail retrieval, stats and summaries
- `app/api/charts/routes.py`: weekly attendance chart data
- `app/api/roles/routes.py`: role and permission management
- `app/api/health/routes.py`: app health and uptime endpoint
- `app/models/`: database models
- `app/services/scheduler/apscheduler.py`: a background ping service for uptime health checks

---

## 12. Security model

This project uses a role- and permission-based authorization system.

- Users are mapped to `Teacher` records
- Teachers get roles such as `Admin` or `Teacher`
- Each role is bound to one or more named permissions
- Permission decorators protect endpoints and enforce access rules
- JWT tokens are blocked when a user logs out
- Rate limiting is enabled on sensitive endpoints to reduce abuse

---

## 13. Production notes

- Use a real PostgreSQL service in production, not just the local dockerized database
- Store secrets in environment variables or a secure secret management system
- Ensure CORS and network settings allow frontend and backend communication
- Consider deploying backend and frontend separately behind Nginx or a reverse proxy
- Add CI/CD pipeline, tests, and production-grade logging before commercial use

---

## 14. Recommended next steps before selling or commercializing

To make this easier to sell or hand over to a company, consider doing the following next:

- Add automated tests for backend routes and business logic
- Add transaction tests for attendance edge cases
- Add a proper admin onboarding flow with user invitations
- Add audit logs and export features for attendance records
- Add notification/email integration for request approvals
- Add a deployment configuration for production environments
- Create API documentation with Swagger or OpenAPI
- Add a CI pipeline and linting standards across frontend and backend

---

## 15. Summary

Clock'n is a practical, real-world attendance management system designed for educational institutions or companies that need to track people reliably. It combines authentication, geofencing, scanning, workflow approval, and analytics in a way that is realistic for operational use.

This project is a strong foundation, and with proper hardening, testing, and production deployment work, it would be a credible product for a business or institutional customer.
 
