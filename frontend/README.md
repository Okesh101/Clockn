# Frontend Workspace Documentation

This folder contains the web client layer for the Clock'n attendance application. The project uses two different React apps that share the same backend but serve different user groups.

---

## 1. Purpose

The frontend layer is responsible for user experience, route flows, and API interaction. It converts backend attendance logic into a clean interface for:

- Teachers performing attendance operations
- Admins managing school operations and reports

The workspace contains two independent apps:

- `admin/` for the manager or administrator portal
- `teacher/` for the end-user teacher portal

---

## 2. Shared frontend architecture

Both apps are built with:

- React 19
- Vite
- TypeScript
- React Router
- Axios
- Tailwind CSS
- Framer Motion

### Shared API pattern

Both apps call the same base path:

```text
/api/v1
```

The Axios configuration attaches the JWT access token to every request and refreshes it automatically if a request receives a 401 response.

### Authentication pattern

- User logs in through a route-protected app shell
- JWT is stored in local storage (`access_token` and `refresh_token`)
- The app redirects to auth page if no valid session is available

---

## 3. Workspace structure

```text
frontend/
├── admin/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── eslint.config.js
├── teacher/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── eslint.config.js
└── README.md
```

---

## 4. App responsibilities

### Admin app

Used by staff or administrators with higher-level permissions. It focuses on:

- Dashboard overview
- Teacher management
- Attendance logs
- Request review
- QR code management
- Role and permission setup
- Charts and analytics

### Teacher app

Used by teachers with attendance and profile responsibilities. It focuses on:

- Login and registration
- Attendance clock-in / clock-out
- QR scan attendance
- Request early clock-out
- View attendance history
- Manage personal profile

---

## 5. Setup and run procedure

### Install dependencies for both apps

From each app folder:

```bash
cd frontend/admin
npm install
```

```bash
cd frontend/teacher
npm install
```

### Run the admin app

```bash
cd frontend/admin
npm run dev
```

### Run the teacher app

```bash
cd frontend/teacher
npm run dev
```

You may run them at the same time in separate terminals.

---

## 6. Role of the frontend in the system

The frontend is not just a visual add-on. It is the main interaction layer for business flows such as:

- user sign-in
- attendance check-in and check-out
- QR scanning
- request approval actions
- admin dashboards and data review

If the API is healthy, the frontend becomes the operating surface for every workflow in the platform.

---

## 7. Design and user experience notes

The interface has a polished modern dashboard look with:

- glassmorphism-style cards
- colored progress states
- route-based navigation
- toasts for success and error feedback
- responsive layouts for both desktop and mobile usage

The design suggests a product aimed at institutional staff and school operations, not just technical users.

---

## 8. Recommended productization tasks

Before handing this off commercially, the frontend should be improved by:

- adding unit and component tests
- establishing a shared design system
- building clearer error handling states
- performing accessibility audits
- adding end-to-end tests for login and attendance flows
- standardizing route guards and app-wide state management

---

## 9. Summary

The frontend workspace is where the business logic turns into daily workflows. The admin and teacher interfaces are intentionally split to match their distinct responsibilities, while the shared backend remains the core processor for security, attendance, and reporting.

This separation makes the platform easier to scale and makes the project look far more like a real business product than a single-application demo.
