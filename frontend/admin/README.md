# Admin Frontend Documentation

This portal is the administrative control layer for the Clock'n system. It is built for staff or management users who need to supervise attendance, monitor teacher activity, review exceptions, create QR location records, and manage access permissions.

---

## 1. Purpose

The admin app is responsible for operational oversight. It gives administrators the ability to:

- access the dashboard
- view teacher records
- inspect attendance logs
- analyze weekly attendance trends
- manage roles and permission assignments
- create and manage QR validation locations
- review and resolve teacher clock-out requests

---

## 2. Stack and tools

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Axios
- Recharts
- Framer Motion
- React Hot Toast

---

## 3. Main route structure

The app routes are defined in `src/App.tsx`.

### Protected routes

- `/` → Dashboard
- `/teachers` → Teacher directory
- `/attendance-logs` → Attendance activity log view
- `/requests` → Attendance request review area
- `/qrcodes` → QR location management
- `/roles` → Role and permissions matrix

### Auth route

- `/auth` → login screen

### Fallback route

- `/404` → not found page

Routes are wrapped in a protected route component so only valid authenticated users can access them.

---

## 4. Core screens and their responsibilities

### Dashboard

The dashboard is the primary administration overview. It surfaces quick figures on:

- number of teachers
- present teachers
- late arrivals
- absent entries
- on-time attendance

This page typically receives stats and range-based filters from the backend to display time-aware attendance summaries.

### Teachers screen

This screen lists the available teachers and allows admins to inspect their profiles and management metadata.

It uses backend endpoints like:

- `GET /api/v1/teachers`
- `GET /api/v1/teachers/<teacher_id>`

### Attendance logs screen

This is the operational ledger of who clocked in or out, when they did so, and what their status was. It is essential for audits, troubleshooting, and compliance tracking.

### Requests screen

This screen reviews teacher-submitted clock-out requests. Admins can approve or reject them and optionally add notes.

This is a core workflow because it creates accountability around exceptions and manual overrides.

### QR codes screen

This allows an admin to define a QR location or geography that teachers must be near when scanning attendance. It is a core part of the geofenced attendance workflow.

### Roles screen

This screen is the permission management center. It lets administrators inspect role-to-permission mapping and assign permission-bearing roles to users.

---

## 5. Admin API integration layer

The admin app communicates with the backend through service files in `src/services/`.

### Examples

- `teachersApi.ts` → teacher list and teacher detail fetching
- `attendanceApi.ts` → attendance stats and logs
- `requestsApi.ts` → admin request list and review actions
- `qrcodeApi.ts` → QR location management
- `rolesApi.ts` → role matrix and permission management
- `chartsApi.ts` → analytics/chart data fetches

These services use a central Axios instance configured at `src/utils/axiosConfig.ts`.

---

## 6. Authentication flow

The admin app follows the standard app pattern:

- access token stored in localStorage
- refresh token stored in localStorage
- automatic refresh on 401 responses
- redirect to `/auth` if the session expires

This ensures the admin portal stays secure without forcing constant re-login.

---

## 7. Setup

### Install dependencies

```bash
cd frontend/admin
npm install
```

### Run locally

```bash
cd frontend/admin
npm run dev
```

### Build production version

```bash
cd frontend/admin
npm run build
```

---

## 8. Business value

This admin app is where real decisions are made for operations. It transforms raw attendance data into actionable control.

The most valuable business strengths are:

- fast operational visibility
- staff accountability
- process integrity for exceptions and approvals
- permission-based system control
- attendance analytics for oversight

---

## 9. Recommended improvements before sale or handoff

To make this portal more company-ready, consider:

- stronger table filtering and search
- CSV or PDF export features
- admin action audit logs
- multi-branch institutional support
- stronger analytics storytelling
- full audit trail for role changes and request decisions

---

## 10. Summary

The admin portal is the command center of the Clock'n system. It is where attendance discipline, role governance, exception review, and analytics converge. This is the side that demonstrates operational value to a school or institution.

