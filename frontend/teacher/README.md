# Teacher Frontend Documentation

This portal is the teacher-facing side of the Clock'n system. It is designed around the daily routine of a teacher who needs to clock in, verify attendance, request exceptions, and review personal history.

---

## 1. Purpose

The teacher app is built for everyday usage by classroom staff. It focuses on quick actions and low-friction attendance operations.

Main goals:

- register or sign in
- clock in and out for the day
- use button-based or QR-based attendance verification
- confirm location-based validation
- request early clock-out when needed
- review personal attendance history and requests
- manage profile information

---

## 2. Stack and tools

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Axios
- Framer Motion
- react-hot-toast
- QR and scanner support

---

## 3. Main route structure

The app route definitions are set in `src/App.tsx`.

### Protected routes

- `/` → Dashboard
- `/history` → Attendance history
- `/my-requests` → Personal attendance request log
- `/profile` → User profile screen

### Auth route

- `/auth` → login/register screen

### Fallback

- `/404` → not found page

---

## 4. Core user flows

### Authentication flow

Teachers can:

- log in to an existing account
- register a new account
- switch between login and register mode from the same screen

The app uses a protected route guard so only authenticated teachers can access the dashboard and personal features.

### Dashboard flow

The teacher dashboard is the main operational screen. It displays:

- greeting
- clock-in/clock-out state
- attendance action cards
- optional early clock-out request option
- navigation to request history

Teachers can choose between:

- button-based attendance
- QR-based attendance

### Clock-in logic

The teacher can clock in using either:

- a manual button tap
- a QR scan that validates a QR location and proximity

The backend validates:

- whether the teacher is already clocked in
- the current location against location thresholds
- the correct attendance window and punctuality timing

### Clock-out logic

The teacher can clock out normally or submit an early request during valid hours. The app supports a request-based exception workflow and special note capture.

### Request workflow

Teachers can submit requests such as:

- early clock-out before the standard window
- exception requests with optional notes

The backend checks whether the teacher is currently active and may require location data for the request depending on the time of day.

### History and profile

Teachers can review their:

- attendance history
- request statuses
- profile information

This gives them visibility into their own attendance record and their own request decisions.

---

## 5. Key files and responsibilities

### `src/App.tsx`

Defines the app routes and protected access logic.

### `src/pages/Dashboard.tsx`

Controls the main teacher dashboard experience with clock-in/out and QR options.

### `src/pages/MyRequests.tsx`

Displays the teacher's own request logs and statuses.

### `src/pages/Profile.tsx`

Shows personal account information and teacher profile context.

### `src/services/requestApi.ts`

Handles attendance request submission and retrieval.

### `src/utils/axiosConfig.ts`

Sets the base API URL, attaches JWT tokens, and refreshes expired tokens automatically.

---

## 6. Attendance and location logic

A major part of the teacher app is the real-world attendance validation process. The backend checks:

- if the teacher is already clocked in for the day
- if the teacher is near the approved school location
- whether the QR used is valid
- whether the action occurred within the expected attendance time range

This is what makes the app more like a real-world attendance product rather than a basic form app.

---

## 7. Setup

### Install dependencies

```bash
cd frontend/teacher
npm install
```

### Run locally

```bash
cd frontend/teacher
npm run dev
```

### Build production version

```bash
cd frontend/teacher
npm run build
```

---

## 8. Why this app matters

This teacher portal is where the daily workflow meets the real world. If this app works well, the institution gets better discipline, stronger accountability, and fewer manual mistakes in attendance oversight.

It is also one of the most important user experiences in the entire product because it directly affects how teachers interact with the school system every day.

---

## 9. Recommended improvements before productization

The teacher app should be improved with:

- stronger offline/online status messaging
- notifications for approved or rejected requests
- easier access to attendance summaries
- improved QR scan feedback and camera permission guidance
- accessibility testing across mobile and tablet sizes
- better mobile-first UX for daily attendance tasks

---

## 10. Summary

The teacher frontend is built for speed, clarity, and trust. It allows teachers to complete time-sensitive tasks quickly while preserving strong validation rules on the backend. In a commercial setting, this is the app that users feel every day, so usability and reliability are essential.

