---
name: testing-teacher-auth
description: Test the Clockn teacher frontend auth flow (combined /auth sign-in/sign-up, dashboard, attendance) end-to-end against the local Flask backend. Use when verifying frontend/teacher UI or auth/attendance API wiring.
---

# Testing the Clockn teacher frontend

The teacher SPA (`frontend/teacher`, Vite + React + Tailwind v4) talks to the Flask backend
(`backend/`) under `/api/v1`, which Vite proxies to `http://127.0.0.1:5000`. Full auth testing
needs the backend + Postgres running; pure UI checks (toggle/validation/password) work without it.

## Prerequisites / gotchas
- **Node >= 22.12 required.** Vite 8 uses a rolldown native binding that is skipped under Node 20,
  so `npm run dev`/`npm run build` fail. Use `nvm use 22.12.0` (or whatever 22.x is installed).
- Backend needs Postgres. A `backend/docker-compose.yml` provides one
  (user `dev_user_clockn` / pass `dev_password_clockn` / db `clockn_db`, port 5432).
- **Roles must be seeded** before register works — migrations create tables but no Role rows.
- The **first** registered user becomes `Admin`; everyone after is `Teacher`.

## Full local setup (verified)
```bash
# 1. Postgres
cd backend && docker compose up -d db

# 2. backend/.env (local dev creds only — not real secrets)
cat > backend/.env <<'EOF'
FLASK_ENV=development
FLASK_SECRET_KEY=dev-flask-secret-key-for-testing
JWT_SECRET_KEY=dev-jwt-secret-key-for-testing
JWT_ACCESS_TOKEN_EXPIRES=900
JWT_REFRESH_TOKEN_EXPIRES=2592000
SQLALCHEMY_DATABASE_URI=postgresql://dev_user_clockn:dev_password_clockn@127.0.0.1:5432/clockn_db
SQLALCHEMY_TRACK_MODIFICATIONS=False
PORT=5000
EOF

# 3. deps + migrations + run backend
cd backend && pip3 install -r requirements.txt
export FLASK_APP=main.py PYTHONPATH=. && flask db upgrade
python3 main.py            # serves on 127.0.0.1:5000

# 4. seed roles (idempotent-ish: errors if already seeded)
curl -s -X POST http://127.0.0.1:5000/api/v1/roles/seed \
  -H "Content-Type: application/json" -d '{"roles":["Admin","Teacher"]}'

# 5. frontend (Node 22)
cd frontend/teacher && nvm use 22.12.0 && npm install && npm run dev   # http://localhost:5173
```

## Reset to a clean DB (so first sign-up = Admin)
```bash
docker exec local_clockn_db psql -U dev_user_clockn -d clockn_db -c "TRUNCATE teachers CASCADE;"
```
Also clear browser state before UI tests: in the console `localStorage.clear()`.

## What to test (UI, at http://localhost:5173)
- `/` while logged out redirects to `/auth` (ProtectedRoute).
- Sign In ⇄ Sign Up tab toggle animates and reveals firstname/lastname/phone.
- Validation: firstname required, phone must be exactly 11 digits, password >= 6 chars.
  NOTE: the email input is `type="email"`, so a malformed email triggers the browser's
  **native** tooltip first; use a valid-format email to see the app's own validators.
- Password show/hide toggle flips input `type` password↔text.
- Sign-up first user → dashboard shows name/email/initials; verify DB role = Admin.
- Logout → Sign In round-trip.

## Not testable from the VM
Attendance clock-in/out (`/attendance/in|out|qr/in|qr/out`) requires real GPS inside the school
geofence; expect a proximity error otherwise. The shared-axios/token wiring is still proven by
profile/login/logout going through the same instance.

## Frontend commands
- Lint: `(cd frontend/teacher && npm run lint)`
- Build: `(cd frontend/teacher && npm run build)`

## Devin Secrets Needed
None. Local dev uses the throwaway creds above (Postgres creds in docker-compose, dummy Flask/JWT
secrets). No production secrets are required for local testing.
