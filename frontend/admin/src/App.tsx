import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { ProtectedRoute } from "./components/Auth/ProtectedRoute";
import { AuthPage } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import { NotFound } from "./pages/NotFound";
import { QrCodes } from "./pages/QrCodes";
import { Roles } from "./pages/Roles";
import { Teachers } from "./pages/Teachers";
import { AttendanceLogs } from "./pages/AttendanceLogs";

function App() {
  return (
    <>
      <Toaster
        position="top-center"
        containerStyle={{ top: 16, insetInline: 16 }}
        toastOptions={{
          duration: 4000,
          style: {
            background: "rgba(255, 255, 255, 0.97)",
            borderRadius: "16px",
            border: "1px solid rgba(15, 23, 42, 0.08)",
            boxShadow: "0 20px 40px -22px rgba(15, 23, 42, 0.35)",
            color: "#0f172a",
          },
        }}
      />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teachers"
          element={
            <ProtectedRoute>
              <Teachers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance-logs"
          element={
            <ProtectedRoute>
              <AttendanceLogs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/qrcodes"
          element={
            <ProtectedRoute>
              <QrCodes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/roles"
          element={
            <ProtectedRoute>
              <Roles />
            </ProtectedRoute>
          }
        />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </>
  );
}

export default App;
