// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";
import { Dashboard } from "./pages/Dashboard";
import { History } from "./pages/History";
import { Profile } from "./pages/Profile";
import { NotFound } from "./pages/NotFound";
import { AuthPage } from "./pages/Auth";
import { MyRequests } from "./pages/MyRequests";

function App() {
  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        containerStyle={{ top: 16, insetInline: 16 }}
        toastOptions={{
          duration: 4000,
          style: {
            background: "rgba(255, 255, 255, 0.97)",
            backdropFilter: "blur(14px)",
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
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/my-requests"
          element={<MyRequests />}
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
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
