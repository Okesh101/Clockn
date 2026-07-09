// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";
import { Auth } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import { NotFound } from "./pages/NotFound";

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            borderRadius: "12px",
            border: "1px solid rgba(0,0,0,0.05)",
          },
        }}
      />
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
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
